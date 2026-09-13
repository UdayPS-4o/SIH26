"""
Feature extraction utilities for network flow analysis.

Provides functions to compute statistical features from network flows
that are used by the threat detection models.
"""

from __future__ import annotations

import math
from collections import Counter
from dataclasses import dataclass, field
from typing import List

import numpy as np


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class FlowFeatures:
    """Extracted feature vector for a single network flow."""

    # Basic flow properties
    bytes_sent: float = 0.0
    bytes_recv: float = 0.0
    byte_ratio: float = 0.0          # bytes_sent / (bytes_recv + 1)
    duration: float = 0.0
    packets: int = 0
    avg_packet_size: float = 0.0

    # Rate features
    bytes_per_sec: float = 0.0
    packets_per_sec: float = 0.0

    # Port features
    src_port: int = 0
    dst_port: int = 0
    is_well_known_dst_port: int = 0   # 1 if dst_port < 1024
    is_ephemeral_src_port: int = 0     # 1 if src_port >= 32768

    # Protocol
    protocol: str = "tcp"

    # DNS features
    dns_query_len: int = 0
    dns_entropy: float = 0.0

    # TLS features
    has_tls: int = 0
    tls_ja3_hash: str = ""

    # Statistical features
    entropy_bytes_sent: float = 0.0
    entropy_bytes_recv: float = 0.0


@dataclass
class WindowStats:
    """Aggregate statistics over a sliding window of flows."""

    window_size: int = 0
    flow_count: int = 0

    # Volume stats
    total_bytes: float = 0.0
    total_packets: int = 0
    avg_bytes_per_flow: float = 0.0
    avg_packets_per_flow: float = 0.0

    # Rate stats
    total_bytes_per_sec: float = 0.0
    total_packets_per_sec: float = 0.0

    # Connection stats
    unique_src_ips: int = 0
    unique_dst_ips: int = 0
    unique_dst_ports: int = 0
    dst_port_concentration: float = 0.0  # Herfindahl index on dst ports

    # Temporal stats
    avg_interval: float = 0.0
    std_interval: float = 0.0
    min_interval: float = 0.0
    max_interval: float = 0.0

    # Attack indicators
    attack_flow_ratio: float = 0.0
    syn_ratio: float = 0.0
    udp_ratio: float = 0.0
    dns_ratio: float = 0.0


# ---------------------------------------------------------------------------
# Entropy computation
# ---------------------------------------------------------------------------

def compute_entropy(data: bytes | str) -> float:
    """Compute Shannon entropy of a byte string or text.

    Entropy is a measure of randomness/unpredictability. Low entropy
    suggests structured/repetitive data (e.g., DGA domains). High entropy
    suggests encrypted or random data.

    Args:
        data: Raw bytes or string to analyze.

    Returns:
        Shannon entropy value between 0.0 and 8.0 (for byte data).
    """
    if isinstance(data, str):
        data = data.encode("utf-8")

    if not data:
        return 0.0

    length = len(data)
    if length == 0:
        return 0.0

    # Count byte frequencies
    counts: Counter = Counter(data)
    entropy = 0.0

    for count in counts.values():
        probability = count / length
        if probability > 0:
            entropy -= probability * math.log2(probability)

    return round(entropy, 4)


# ---------------------------------------------------------------------------
# N-gram scoring
# ---------------------------------------------------------------------------

def compute_ngram_score(text: str, n: int = 2, top_k: int = 10) -> float:
    """Score how unusual an n-gram distribution is.

    This is useful for detecting DGA domains that have unusual character
    n-gram patterns compared to legitimate domain names.

    Args:
        text: Input string (typically a domain name).
        n: N-gram size (default 2 for bigrams).
        top_k: Number of top n-grams to consider.

    Returns:
        A score where higher values indicate more unusual n-gram patterns.
    """
    if len(text) < n:
        return 0.0

    # Generate n-grams
    ngrams = [text[i : i + n] for i in range(len(text) - n + 1)]
    counts: Counter = Counter(ngrams)

    if not counts:
        return 0.0

    total = len(ngrams)
    # Use normalized entropy of n-gram distribution as proxy for "unusualness"
    entropy = 0.0
    for count in counts.values():
        p = count / total
        entropy -= p * math.log2(p)

    # Normalize by max possible entropy for this n-gram alphabet
    max_entropy = n * math.log2(26) if text.isalpha() else n * math.log2(36)
    if max_entropy == 0:
        return 0.0

    return round(entropy / max_entropy, 4)


# ---------------------------------------------------------------------------
# Feature extraction
# ---------------------------------------------------------------------------

def extract_flow_features(flow: dict) -> FlowFeatures:
    """Extract a feature vector from a network flow dictionary.

    Args:
        flow: Dictionary containing flow data with keys like:
            - bytes_sent, bytes_recv, duration, packets
            - src_port, dst_port, protocol
            - dns_query, tls_fingerprint

    Returns:
        FlowFeatures dataclass with computed features.
    """
    features = FlowFeatures()

    # Basic counts
    features.bytes_sent = float(flow.get("bytes_sent", 0))
    features.bytes_recv = float(flow.get("bytes_recv", 0))
    features.duration = max(float(flow.get("duration", 0)), 0.001)  # avoid division by zero
    features.packets = int(flow.get("packets", 0))
    features.src_port = int(flow.get("src_port", 0))
    features.dst_port = int(flow.get("dst_port", 0))
    features.protocol = str(flow.get("protocol", "tcp"))

    # Derived ratios
    features.byte_ratio = features.bytes_sent / (features.bytes_recv + 1.0)
    features.avg_packet_size = (features.bytes_sent + features.bytes_recv) / max(features.packets, 1)

    # Rate features
    features.bytes_per_sec = (features.bytes_sent + features.bytes_recv) / features.duration
    features.packets_per_sec = features.packets / features.duration

    # Port features
    features.is_well_known_dst_port = 1 if features.dst_port < 1024 else 0
    features.is_ephemeral_src_port = 1 if features.src_port >= 32768 else 0

    # DNS features
    dns_query = flow.get("dns_query", "")
    features.dns_query_len = len(dns_query) if dns_query else 0
    features.dns_entropy = compute_entropy(dns_query) if dns_query else 0.0

    # TLS features
    features.has_tls = 1 if flow.get("tls_fingerprint") else 0
    features.tls_ja3_hash = str(flow.get("tls_fingerprint", ""))

    # Byte distribution entropy
    features.entropy_bytes_sent = _estimate_entropy_from_size(features.bytes_sent)
    features.entropy_bytes_recv = _estimate_entropy_from_size(features.bytes_recv)

    return features


def _estimate_entropy_from_size(byte_count: float) -> float:
    """Estimate entropy heuristically from payload size.

    Real entropy requires the actual bytes, but we can approximate
    based on size heuristics for common protocols.
    """
    if byte_count == 0:
        return 0.0
    if byte_count < 64:
        return 3.0  # small payloads tend to be structured (low entropy)
    if byte_count < 512:
        return 4.5
    if byte_count < 4096:
        return 5.5
    return 6.5  # large payloads likely contain varied data


def features_to_vector(features: FlowFeatures) -> np.ndarray:
    """Convert FlowFeatures to a numpy array for model input.

    The feature order must match the model's training feature order.
    """
    return np.array(
        [
            features.bytes_sent,
            features.bytes_recv,
            features.byte_ratio,
            features.duration,
            features.packets,
            features.avg_packet_size,
            features.bytes_per_sec,
            features.packets_per_sec,
            features.src_port / 65535.0,
            features.dst_port / 65535.0,
            float(features.is_well_known_dst_port),
            float(features.is_ephemeral_src_port),
            features.dns_query_len / 255.0,
            features.dns_entropy / 8.0,
            float(features.has_tls),
        ],
        dtype=np.float32,
    )


# ---------------------------------------------------------------------------
# Sliding window statistics
# ---------------------------------------------------------------------------

def sliding_window_stats(flows: List[dict], window_secs: float = 60.0) -> WindowStats:
    """Compute aggregate statistics over a time-based sliding window.

    Args:
        flows: List of flow dictionaries, sorted by timestamp (newest last).
        window_secs: Time window in seconds.

    Returns:
        WindowStats with aggregate metrics.
    """
    if not flows:
        return WindowStats()

    now = flows[-1].get("timestamp", 0)
    cutoff = now - window_secs

    # Filter flows within window
    window_flows = [f for f in flows if f.get("timestamp", 0) >= cutoff]

    stats = WindowStats(window_size=window_secs, flow_count=len(window_flows))

    if stats.flow_count == 0:
        return stats

    # Accumulate volume
    total_bytes = 0.0
    total_packets = 0
    attack_count = 0
    syn_count = 0
    udp_count = 0
    dns_count = 0
    src_ips: set = set()
    dst_ips: set = set()
    dst_ports: list = []
    timestamps: list = []
    port_counts: Counter = Counter()

    for f in window_flows:
        bs = f.get("bytes_sent", 0)
        br = f.get("bytes_recv", 0)
        proto = f.get("protocol", "tcp")
        ts = f.get("timestamp", 0)

        total_bytes += bs + br
        total_packets += f.get("packets", 0)
        timestamps.append(ts)
        src_ips.add(f.get("src_ip", ""))
        dst_ips.add(f.get("dst_ip", ""))
        dst_ports.append(f.get("dst_port", 0))
        port_counts[f.get("dst_port", 0)] += 1

        if f.get("is_attack", False):
            attack_count += 1
        if proto == "tcp":
            syn_count += 1
        if proto == "udp":
            udp_count += 1
        if f.get("dns_query"):
            dns_count += 1

    stats.total_bytes = total_bytes
    stats.total_packets = total_packets
    stats.avg_bytes_per_flow = total_bytes / stats.flow_count
    stats.avg_packets_per_flow = total_packets / stats.flow_count
    stats.unique_src_ips = len(src_ips)
    stats.unique_dst_ips = len(dst_ips)
    stats.unique_dst_ports = len(set(dst_ports))
    stats.attack_flow_ratio = attack_count / stats.flow_count
    stats.syn_ratio = syn_count / stats.flow_count
    stats.udp_ratio = udp_count / stats.flow_count
    stats.dns_ratio = dns_count / stats.flow_count

    # Temporal stats
    if len(timestamps) > 1:
        intervals = [timestamps[i + 1] - timestamps[i] for i in range(len(timestamps) - 1)]
        stats.avg_interval = float(np.mean(intervals))
        stats.std_interval = float(np.std(intervals)) if len(intervals) > 1 else 0.0
        stats.min_interval = float(np.min(intervals))
        stats.max_interval = float(np.max(intervals))

    # Herfindahl concentration index on destination ports
    if port_counts:
        total_ports = sum(port_counts.values())
        shares = [(c / total_ports) ** 2 for c in port_counts.values()]
        stats.dst_port_concentration = float(np.sum(shares))

    return stats
