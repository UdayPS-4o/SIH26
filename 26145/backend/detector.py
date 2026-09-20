"""
Threat detection engine for network flow analysis.

Implements multiple detection strategies including DDoS, beaconing, DGA,
DNS tunneling, TLS anomalies, port scanning, and data exfiltration.
Uses sliding windows to analyze flow patterns over time.
"""

import logging
import math
import time
import uuid
from dataclasses import dataclass, field
from typing import Any

import numpy as np

from features import (
    compute_entropy,
    compute_ngram_score,
    extract_flow_features,
    sliding_window_stats,
)

try:
    from diode_sim import DiodeMode, global_diode
    _HAS_DIODE = True
except (ImportError, OSError):
    _HAS_DIODE = False

logger = logging.getLogger(__name__)

# JA3 fingerprint lists (previously imported from TrafficSimulator — inlined
# here so the detector is self-contained)
_KNOWN_JA3 = [
    "771,5-29-23-30-256-0-10-11-9-100-98-63-51-43-45-41",
    "772,5-29-23-30-256-0-10-11-9-100-98-63-51-43-45-41",
    "771,47-53-5-10-131-72-63-51-43-45-41",
    "772,47-53-5-10-131-72-63-51-43-45-41",
]
_SUSPICIOUS_JA3 = [
    "771,4-5-2-8-10-9-7-6-3-1",
    "772,4-5-2-8-10-9-7-6-3-1",
    "769,4-5-2-8-10-9-7-6-3-1",
]

# Confidence to severity mapping
SEVERITY_THRESHOLDS = {
    "critical": 0.85,
    "high": 0.70,
    "medium": 0.50,
    "low": 0.0,
}


def _severity_from_confidence(confidence: float) -> str:
    """Map confidence score to severity level.

    Args:
        confidence: Detection confidence (0.0 to 1.0).

    Returns:
        Severity string: critical, high, medium, or low.
    """
    if confidence > 0.85:
        return "critical"
    if confidence > 0.70:
        return "high"
    if confidence > 0.50:
        return "medium"
    return "low"


def _current_diode_mode() -> str:
    """Return the current diode mode, defaulting to full-duplex."""
    if _HAS_DIODE:
        try:
            return global_diode.mode
        except Exception:
            pass
    return DiodeMode.FULL_DUPLEX if _HAS_DIODE else "full-duplex"


def _validity_for(diode_mode: str, uses_reverse_path: bool) -> str:
    """Determine feature validity based on diode mode.

    Args:
        diode_mode: Current diode mode string.
        uses_reverse_path: True if the detection relies on reverse-path data
            (e.g., packets_recv, bytes_recv).

    Returns:
        "MEASURED", "ESTIMATED", or "MISSING".
    """
    if not uses_reverse_path:
        return "MEASURED"
    if diode_mode == DiodeMode.DIODE_ONLY:
        return "MISSING"
    if diode_mode == DiodeMode.ACK_SHADOW:
        return "ESTIMATED"
    return "MEASURED"


# Threat type → threat_class mapping
_THREAT_CLASS_MAP = {
    "ddos": "syn_flood",
    "beaconing": "c2_beaconing",
    "dga": "dga_domain",
    "dns_tunnel": "dns_tunneling",
    "tls_anomaly": "tls_anomaly",
    "port_scan": "port_scan",
    "exfiltration": "data_exfiltration",
}


@dataclass
class Alert:
    """Represents a detected threat alert.

    Attributes:
        id: Unique alert identifier.
        timestamp: Unix timestamp of detection.
        threat_class: Category of threat (aligned with attack_type spec).
        threat_type: Internal threat type string.
        confidence: Detection confidence (0.0 to 1.0).
        severity: Severity level (critical, high, medium, low).
        src_ip: Source IP address.
        dst_ip: Destination IP address.
        evidence: Structured evidence with named features and validity tags.
        validity: Overall evidence validity (MEASURED, ESTIMATED, MISSING).
        flow_id: Source flow identifier.
        flow_count: Number of flows that contributed to this alert.
    """
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    timestamp: float = field(default_factory=time.time)
    threat_class: str = "unknown"
    threat_type: str = "unknown"
    confidence: float = 0.0
    severity: str = "low"
    src_ip: str = ""
    dst_ip: str = ""
    evidence: dict = field(default_factory=dict)
    validity: str = "MEASURED"
    flow_id: str = ""
    flow_count: int = 1

    def to_dict(self) -> dict:
        """Convert alert to dictionary for JSON serialization.

        Returns:
            Dictionary representation of the alert.
        """
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "flow_id": self.flow_id,
            "threat_class": self.threat_class,
            "threat_type": self.threat_type,
            "severity": self.severity,
            "confidence": self.confidence,
            "src_ip": self.src_ip,
            "dst_ip": self.dst_ip,
            "evidence": self.evidence,
            "validity": self.validity,
            "flow_count": self.flow_count,
        }


class ThreatDetector:
    """Network threat detection engine.

    Analyzes network flows using sliding windows and multiple detection
    strategies to identify potential threats.
    """

    def __init__(self, window_sec: int = 60, max_window_size: int = 1000) -> None:
        """Initialize the threat detector.

        Args:
            window_sec: Sliding window size in seconds.
            max_window_size: Maximum number of flows per window.
        """
        self.window_sec = window_sec
        self.max_window_size = max_window_size

        # Sliding windows per source IP
        self._windows: dict[str, list[dict]] = {}
        self._window_timestamps: dict[str, list[float]] = {}

        # Global flow history for context
        self._all_flows: list[dict] = []
        self._alerts: list[Alert] = []

        # Detection thresholds — all threat classes have explicit rules
        self._thresholds = {
            # SYN flood: pkt_rate > threshold AND source entropy > threshold
            "syn_flood_pkt_rate": 100,
            "syn_flood_entropy": 3.0,
            "syn_flood_min_flows": 10,
            # UDP flood: udp_pkt_rate > threshold AND dst_entropy > threshold
            "udp_flood_pkt_rate": 50,
            "udp_dst_entropy": 2.5,
            # C2 beaconing
            "beaconing_min_flows": 2,
            "beaconing_interval_std": 2.0,
            # DGA
            "dga_entropy_threshold": 3.0,
            # DNS tunneling
            "dns_tunnel_query_length": 50,
            "dns_tunnel_entropy": 4.0,
            # Port scanning
            "port_scan_unique_ports": 5,
            "port_scan_fan_ratio": 0.3,
            # Data exfiltration
            "exfil_min_bytes": 100_000,
            "exfil_ratio": 2.0,
        }

        # Statistics
        self._stats = {
            "total_flows": 0,
            "total_alerts": 0,
            "flows_per_sec": 0.0,
            "alerts_per_type": {},
            "start_time": time.time(),
        }

        # Current diode mode for validity tracking
        self._diode_mode = _current_diode_mode()

    def set_diode_mode(self, mode: str) -> None:
        """Update the current diode mode for validity tracking.

        Args:
            mode: One of DiodeMode.FULL_DUPLEX, DiodeMode.DIODE_ONLY,
                or DiodeMode.ACK_SHADOW.
        """
        self._diode_mode = mode

    def process_flow(self, flow: dict) -> list[Alert]:
        """Process a single flow and run all detection strategies.

        Args:
            flow: Flow dictionary with all required fields.

        Returns:
            List of Alert objects generated from this flow.
        """
        self._stats["total_flows"] += 1
        self._all_flows.append(flow)

        # Prune old flows
        self._prune_old_flows(flow.get("timestamp", time.time()))

        # Add to source-specific window
        src_ip = flow.get("src_ip", "unknown")
        if src_ip not in self._windows:
            self._windows[src_ip] = []
            self._window_timestamps[src_ip] = []

        self._windows[src_ip].append(flow)
        self._window_timestamps[src_ip].append(flow.get("timestamp", time.time()))

        # Trim window
        if len(self._windows[src_ip]) > self.max_window_size:
            self._windows[src_ip] = self._windows[src_ip][-self.max_window_size:]
            self._window_timestamps[src_ip] = self._window_timestamps[src_ip][-self.max_window_size:]

        # Build global window
        now = flow.get("timestamp", time.time())
        global_window = [
            f for f in self._all_flows
            if now - f.get("timestamp", now) <= self.window_sec
        ]
        src_window = self._windows.get(src_ip, [])

        alerts: list[Alert] = []

        # Run all detectors
        alerts.extend(self._detect_syn_flood(global_window, src_window))
        alerts.extend(self._detect_udp_flood(global_window, src_window))
        alerts.extend(self._detect_beaconing(src_window))
        alerts.extend(self._detect_dga(global_window))
        alerts.extend(self._detect_dns_tunnel(global_window))
        alerts.extend(self._detect_tls_anomaly(global_window))
        alerts.extend(self._detect_port_scan(src_window, global_window))
        alerts.extend(self._detect_exfiltration(global_window))

        # Deduplicate alerts (same type + src within last 10 seconds)
        alerts = self._deduplicate(alerts)

        # Store and update stats
        self._alerts.extend(alerts)
        self._stats["total_alerts"] += len(alerts)
        for alert in alerts:
            atype = alert.threat_type
            self._stats["alerts_per_type"][atype] = (
                self._stats["alerts_per_type"].get(atype, 0) + 1
            )

        return alerts

    def _prune_old_flows(self, now: float) -> None:
        """Remove flows older than the window size.

        Args:
            now: Current timestamp.
        """
        cutoff = now - self.window_sec * 2  # Keep a bit more for analysis
        self._all_flows = [
            f for f in self._all_flows
            if f.get("timestamp", 0.0) > cutoff
        ]

        # Also prune source windows
        for src_ip in list(self._windows.keys()):
            ts_list = self._window_timestamps.get(src_ip, [])
            if not ts_list:
                continue
            keep_indices = [
                i for i, ts in enumerate(ts_list) if ts > cutoff
            ]
            if keep_indices:
                self._windows[src_ip] = [self._windows[src_ip][i] for i in keep_indices]
                self._window_timestamps[src_ip] = [ts_list[i] for i in keep_indices]
            else:
                del self._windows[src_ip]
                del self._window_timestamps[src_ip]

    def _detect_syn_flood(self, global_window: list[dict], src_window: list[dict]) -> list[Alert]:
        """Detect SYN flood: pkt_rate > threshold AND new_src_entropy > threshold.

        Args:
            global_window: All flows in the time window.
            src_window: Flows from the current source IP.

        Returns:
            List of SYN flood alerts.
        """
        alerts = []
        if len(global_window) < 10:
            return alerts

        # Single-source flood: many packets from one src
        if len(src_window) > self._thresholds["syn_flood_min_flows"]:
            time_span = self._window_time_span(src_window)
            pkt_rate = sum(f.get("packets_sent", 0) for f in src_window) / max(time_span, 0.001)

            # Compute entropy of source IPs — high entropy means many distinct sources
            src_ips_in_window = [f.get("src_ip", "") for f in global_window]
            unique_ips = len(set(src_ips_in_window))
            total_ips = len(src_ips_in_window)
            # Normalized entropy of source distribution
            if total_ips > 1:
                counter: dict = {}
                for ip in src_ips_in_window:
                    counter[ip] = counter.get(ip, 0) + 1
                src_entropy = 0.0
                for count in counter.values():
                    p = count / total_ips
                    if p > 0:
                        src_entropy -= p * math.log2(p)
            else:
                src_entropy = 0.0

            pkt_thresh = self._thresholds["syn_flood_pkt_rate"]
            ent_thresh = self._thresholds["syn_flood_entropy"]

            if pkt_rate > pkt_thresh and src_entropy > ent_thresh:
                confidence = min(pkt_rate / 10000.0, 0.95)
                confidence = min(confidence + src_entropy / 8.0, 0.95)

                if confidence > 0.5:
                    alerts.append(Alert(
                        timestamp=time.time(),
                        threat_class="syn_flood",
                        threat_type="ddos",
                        confidence=min(confidence, 0.95),
                        severity=_severity_from_confidence(min(confidence, 0.95)),
                        src_ip=src_window[0].get("src_ip", ""),
                        dst_ip=src_window[0].get("dst_ip", ""),
                        evidence={
                            "features": [
                                {"name": "pkt_rate", "value": round(pkt_rate, 2), "unit": "pkt/s", "validity": "MEASURED"},
                                {"name": "src_entropy", "value": round(src_entropy, 3), "unit": "bits", "validity": "MEASURED"},
                                {"name": "unique_sources", "value": unique_ips, "unit": "ips", "validity": "MEASURED"},
                                {"name": "src_flows", "value": len(src_window), "unit": "flows", "validity": "MEASURED"},
                            ]
                        },
                        validity=_validity_for(self._diode_mode, uses_reverse_path=False),
                        flow_id=src_window[0].get("id", ""),
                        flow_count=len(src_window),
                    ))
        return alerts

    def _detect_udp_flood(self, global_window: list[dict], src_window: list[dict]) -> list[Alert]:
        """Detect UDP flood: udp_pkt_rate > threshold AND dst_entropy > threshold.

        Args:
            global_window: All flows in the time window.
            src_window: Flows from the current source IP.

        Returns:
            List of UDP flood alerts.
        """
        alerts = []
        if len(global_window) < 5:
            return alerts

        udp_flows = [f for f in src_window if f.get("protocol", "").upper() == "UDP"]
        if len(udp_flows) < 3:
            return alerts

        time_span = self._window_time_span(udp_flows)
        if time_span <= 0:
            time_span = 1.0

        # UDP packet rate from this source
        udp_pkt_rate = sum(f.get("packets_sent", 0) for f in udp_flows) / time_span

        # Destination entropy: Shannon entropy over dst ports
        dst_ports = [f.get("dst_port", 0) for f in udp_flows]
        counter: dict = {}
        for p in dst_ports:
            counter[p] = counter.get(p, 0) + 1
        total = len(dst_ports)
        dst_entropy = 0.0
        for count in counter.values():
            p = count / total
            if p > 0:
                dst_entropy -= p * math.log2(p)

        pkt_thresh = self._thresholds["udp_flood_pkt_rate"]
        ent_thresh = self._thresholds["udp_dst_entropy"]

        if udp_pkt_rate > pkt_thresh and dst_entropy > ent_thresh:
            confidence = min(udp_pkt_rate / 5000.0, 0.95)
            confidence = min(confidence + dst_entropy / 8.0, 0.95)

            if confidence > 0.5:
                now_ts = time.time()
                alerts.append(Alert(
                    timestamp=now_ts,
                    threat_class="udp_flood",
                    threat_type="udp_flood",
                    confidence=min(confidence, 0.95),
                    severity=_severity_from_confidence(min(confidence, 0.95)),
                    src_ip=udp_flows[0].get("src_ip", ""),
                    dst_ip=udp_flows[0].get("dst_ip", ""),
                    evidence={
                        "features": [
                            {"name": "udp_pkt_rate", "value": round(udp_pkt_rate, 2), "unit": "pkt/s", "validity": "MEASURED"},
                            {"name": "dst_entropy", "value": round(dst_entropy, 3), "unit": "bits", "validity": "MEASURED"},
                            {"name": "udp_flows", "value": len(udp_flows), "unit": "flows", "validity": "MEASURED"},
                        ]
                    },
                    validity=_validity_for(self._diode_mode, uses_reverse_path=False),
                    flow_id=udp_flows[0].get("id", ""),
                    flow_count=len(udp_flows),
                ))

        return alerts

    def _detect_beaconing(self, src_window: list[dict]) -> list[Alert]:
        """Detect C2 beaconing by analyzing inter-arrival time variance.

        Regular periodic communication with low variance indicates beaconing.

        Args:
            src_window: Flows from the current source IP.

        Returns:
            List of beaconing alerts.
        """
        alerts = []
        if len(src_window) < self._thresholds["beaconing_min_flows"]:
            return alerts

        # Analyze inter-arrival times
        iats = []
        for f in src_window:
            f_iat = f.get("inter_arrival_times", [])
            if f_iat:
                iats.extend(f_iat)
            else:
                iats.append(f.get("duration", 1.0))

        if len(iats) < 3:
            return alerts

        mean_iat = sum(iats) / len(iats)
        std_iat = (sum((x - mean_iat) ** 2 for x in iats) / len(iats)) ** 0.5 if len(iats) > 1 else 0.0

        # Low coefficient of variation indicates beaconing
        if mean_iat > 0:
            cv = std_iat / mean_iat
        else:
            cv = 0.0

        # Must have a regular interval (5-300 seconds) and low variance
        if 5.0 < mean_iat < 300.0 and cv < self._thresholds["beaconing_interval_std"]:
            confidence = min(1.0 - cv, 0.95)
            confidence = max(confidence, 0.5)
            confidence = min(confidence, len(src_window) / 20.0)

            if confidence > 0.5:
                dst_ips = list(set(f.get("dst_ip", "") for f in src_window))
                validity = _validity_for(self._diode_mode, uses_reverse_path=False)
                alerts.append(Alert(
                    timestamp=time.time(),
                    threat_class="c2_beaconing",
                    threat_type="beaconing",
                    confidence=confidence,
                    severity=_severity_from_confidence(confidence),
                    src_ip=src_window[0].get("src_ip", ""),
                    dst_ip=dst_ips[0] if dst_ips else "",
                    evidence={
                        "features": [
                            {"name": "mean_iat", "value": round(mean_iat, 3), "unit": "s", "validity": "MEASURED"},
                            {"name": "std_iat", "value": round(std_iat, 3), "unit": "s", "validity": "MEASURED"},
                            {"name": "coefficient_of_variation", "value": round(cv, 3), "unit": "", "validity": "MEASURED"},
                            {"name": "unique_destinations", "value": len(dst_ips), "unit": "ips", "validity": "MEASURED"},
                        ]
                    },
                    validity=validity,
                    flow_id=src_window[0].get("id", ""),
                    flow_count=len(src_window),
                ))

        return alerts

    def _detect_dga(self, global_window: list[dict]) -> list[Alert]:
        """Detect DGA domains using entropy and n-gram analysis.

        Args:
            global_window: All flows in the time window.

        Returns:
            List of DGA alerts.
        """
        alerts = []
        dns_flows = [f for f in global_window if f.get("is_dns") and f.get("dns_query")]

        for flow in dns_flows:
            domain = flow.get("dns_query", "")
            if not domain:
                continue

            entropy = compute_entropy(domain)
            ngram_score = compute_ngram_score(domain, n=3)

            # DGA indicators: high entropy + high ngram repetition
            if entropy > self._thresholds["dga_entropy_threshold"]:
                confidence = min(
                    (entropy / 4.0) * 0.5 + ngram_score * 0.5 + 0.2,
                    0.95
                )

                if confidence > 0.5:
                    validity = _validity_for(self._diode_mode, uses_reverse_path=False)
                    alerts.append(Alert(
                        timestamp=time.time(),
                        threat_class="dga_domain",
                        threat_type="dga",
                        confidence=confidence,
                        severity=_severity_from_confidence(confidence),
                        src_ip=flow.get("src_ip", ""),
                        dst_ip=flow.get("dst_ip", ""),
                        evidence={
                            "features": [
                                {"name": "domain", "value": domain, "unit": "", "validity": "MEASURED"},
                                {"name": "entropy", "value": round(entropy, 3), "unit": "bits", "validity": "MEASURED"},
                                {"name": "ngram_score", "value": round(ngram_score, 3), "unit": "", "validity": "MEASURED"},
                            ]
                        },
                        validity=validity,
                        flow_id=flow.get("id", ""),
                        flow_count=1,
                    ))

        return alerts

    def _detect_dns_tunnel(self, global_window: list[dict]) -> list[Alert]:
        """Detect DNS tunneling: high query name entropy + long query length + anomaly.

        Rule: query_length > threshold AND entropy > threshold AND (TXT/MX pattern or very long).

        Args:
            global_window: All flows in the time window.

        Returns:
            List of DNS tunnel alerts.
        """
        alerts = []
        dns_flows = [f for f in global_window if f.get("is_dns")]

        for flow in dns_flows:
            query = flow.get("dns_query", "") or ""
            query_length = len(query)
            entropy = compute_entropy(query)

            len_thresh = self._thresholds["dns_tunnel_query_length"]
            ent_thresh = self._thresholds["dns_tunnel_entropy"]

            # TXT/MX-like anomaly: very long queries with high entropy AND
            # unusual character patterns (hex, repeated chars)
            has_hex_pattern = any(c in "0123456789abcdefABCDEF" for c in query[:20])
            has_long_subdomain = query_length > 63  # exceeds single DNS label limit
            has_high_entropy = entropy > ent_thresh
            passes_length = query_length > len_thresh

            if passes_length and has_high_entropy and (has_long_subdomain or has_hex_pattern):
                confidence = min(query_length / 300.0, 0.95)
                confidence = min(confidence + entropy / 8.0, 0.95)

                if confidence > 0.5:
                    alerts.append(Alert(
                        timestamp=time.time(),
                        threat_class="dns_tunneling",
                        threat_type="dns_tunnel",
                        confidence=min(confidence, 0.95),
                        severity=_severity_from_confidence(min(confidence, 0.95)),
                        src_ip=flow.get("src_ip", ""),
                        dst_ip=flow.get("dst_ip", ""),
                        evidence={
                            "features": [
                                {"name": "query_length", "value": query_length, "unit": "chars", "validity": "MEASURED"},
                                {"name": "query_preview", "value": query[:50], "unit": "", "validity": "MEASURED"},
                                {"name": "entropy", "value": round(entropy, 3), "unit": "bits", "validity": "MEASURED"},
                                {"name": "hex_pattern", "value": has_hex_pattern, "unit": "", "validity": "MEASURED"},
                                {"name": "long_subdomain", "value": has_long_subdomain, "unit": "", "validity": "MEASURED"},
                            ]
                        },
                        validity=_validity_for(self._diode_mode, uses_reverse_path=False),
                        flow_id=flow.get("id", ""),
                        flow_count=1,
                    ))
        return alerts

    def _detect_tls_anomaly(self, global_window: list[dict]) -> list[Alert]:
        """Detect TLS anomalies based on JA3 fingerprint analysis.

        Args:
            global_window: All flows in the time window.

        Returns:
            List of TLS anomaly alerts.
        """
        alerts = []
        tls_flows = [f for f in global_window if f.get("is_tls")]

        # Count JA3 hashes
        ja3_counts: dict[str, list[dict]] = {}
        for flow in tls_flows:
            ja3 = flow.get("tls_ja3_hash", "") or ""
            if ja3:
                ja3_counts.setdefault(ja3, []).append(flow)

        for ja3_hash, flows in ja3_counts.items():
            if len(flows) < 2:
                continue

            is_suspicious = ja3_hash in _SUSPICIOUS_JA3
            is_unknown = ja3_hash not in _KNOWN_JA3

            if is_suspicious or (is_unknown and len(flows) > 3):
                confidence = 0.6 if is_unknown else 0.85
                confidence = min(confidence + len(flows) * 0.02, 0.95)

                src_ips = list(set(f.get("src_ip", "") for f in flows))
                validity = _validity_for(self._diode_mode, uses_reverse_path=False)
                alerts.append(Alert(
                    timestamp=time.time(),
                    threat_class="tls_anomaly",
                    threat_type="tls_anomaly",
                    confidence=confidence,
                    severity=_severity_from_confidence(confidence),
                    src_ip=src_ips[0] if src_ips else "",
                    dst_ip=flows[0].get("dst_ip", ""),
                    evidence={
                        "features": [
                            {"name": "ja3_hash", "value": ja3_hash[:30], "unit": "", "validity": "MEASURED"},
                            {"name": "is_suspicious", "value": is_suspicious, "unit": "", "validity": "MEASURED"},
                            {"name": "is_unknown", "value": is_unknown, "unit": "", "validity": "MEASURED"},
                            {"name": "flow_count", "value": len(flows), "unit": "flows", "validity": "MEASURED"},
                        ]
                    },
                    validity=validity,
                    flow_id=flows[0].get("id", ""),
                    flow_count=len(flows),
                ))

        return alerts

    def _detect_port_scan(self, src_window: list[dict], global_window: list[dict]) -> list[Alert]:
        """Detect port scanning by analyzing fan-out ratio.

        Many unique destination ports from a single source indicates scanning.

        Args:
            src_window: Flows from the current source IP.
            global_window: All flows in the time window.

        Returns:
            List of port scan alerts.
        """
        alerts = []
        if len(src_window) < 5:
            return alerts

        dst_ports = set(f.get("dst_port", 0) for f in src_window)
        unique_ports = len(dst_ports)

        # Fan-out ratio: unique ports / total flows
        fan_ratio = unique_ports / len(src_window)

        if (unique_ports > self._thresholds["port_scan_unique_ports"]
                and fan_ratio > self._thresholds["port_scan_fan_ratio"]):
            confidence = min(fan_ratio * 0.8, 0.95)
            confidence = min(confidence + unique_ports / 200.0, 0.95)

            if confidence > 0.5:
                now_ts = time.time()
                validity = _validity_for(self._diode_mode, uses_reverse_path=False)
                alerts.append(Alert(
                    timestamp=now_ts,
                    threat_class="port_scan",
                    threat_type="port_scan",
                    confidence=confidence,
                    severity=_severity_from_confidence(confidence),
                    src_ip=src_window[0].get("src_ip", ""),
                    dst_ip=src_window[0].get("dst_ip", ""),
                    evidence={
                        "features": [
                            {"name": "unique_ports", "value": unique_ports, "unit": "ports", "validity": "MEASURED"},
                            {"name": "fan_out_ratio", "value": round(fan_ratio, 3), "unit": "", "validity": "MEASURED"},
                            {"name": "probes", "value": len(src_window), "unit": "flows", "validity": "MEASURED"},
                        ]
                    },
                    validity=validity,
                    flow_id=src_window[0].get("id", ""),
                    flow_count=len(src_window),
                ))

        return alerts

    def _detect_exfiltration(self, global_window: list[dict]) -> list[Alert]:
        """Detect data exfiltration by analyzing asymmetric byte ratios.

        Large outbound data with minimal inbound traffic indicates exfiltration.

        Args:
            global_window: All flows in the time window.

        Returns:
            List of exfiltration alerts.
        """
        alerts = []
        if len(global_window) < 5:
            return alerts

        # Group by source IP
        src_groups: dict[str, list[dict]] = {}
        for f in global_window:
            src = f.get("src_ip", "unknown")
            src_groups.setdefault(src, []).append(f)

        for src_ip, flows in src_groups.items():
            if len(flows) < 3:
                continue

            total_sent = sum(f.get("bytes_sent", 0) for f in flows)
            total_recv = sum(f.get("bytes_recv", 0) for f in flows)

            if total_recv > 0:
                ratio = total_sent / total_recv
            elif total_sent > 0:
                ratio = 10.0
            else:
                continue

            if ratio > self._thresholds["exfil_ratio"] and total_sent > 100000:
                confidence = min(ratio / 20.0, 0.95)
                confidence = min(confidence + total_sent / 10000000.0, 0.95)

                if confidence > 0.5:
                    dst_ips = list(set(f.get("dst_ip", "") for f in flows))
                    now_ts = time.time()
                    validity = _validity_for(self._diode_mode, uses_reverse_path=False)
                    alerts.append(Alert(
                        timestamp=now_ts,
                        threat_class="data_exfiltration",
                        threat_type="exfiltration",
                        confidence=confidence,
                        severity=_severity_from_confidence(confidence),
                        src_ip=src_ip,
                        dst_ip=dst_ips[0] if dst_ips else "",
                        evidence={
                            "features": [
                                {"name": "bytes_sent", "value": total_sent, "unit": "bytes", "validity": "MEASURED"},
                                {"name": "bytes_recv", "value": total_recv, "unit": "bytes", "validity": _validity_for(self._diode_mode, uses_reverse_path=True)},
                                {"name": "ratio", "value": round(ratio, 2), "unit": "", "validity": _validity_for(self._diode_mode, uses_reverse_path=True)},
                                {"name": "flow_count", "value": len(flows), "unit": "flows", "validity": "MEASURED"},
                            ]
                        },
                        validity=validity,
                        flow_id=flows[0].get("id", ""),
                        flow_count=len(flows),
                    ))

        return alerts

    def _deduplicate(self, alerts: list[Alert]) -> list[Alert]:
        """Remove duplicate alerts of the same type from the same source within 10 seconds.

        Args:
            alerts: List of alerts to deduplicate.

        Returns:
            Deduplicated list of alerts.
        """
        seen: dict[str, float] = {}
        result = []
        now = time.time()

        for alert in alerts:
            key = f"{alert.threat_type}:{alert.src_ip}:{alert.dst_ip}"
            last_time = seen.get(key, 0.0)
            if now - last_time > 10.0:
                seen[key] = now
                result.append(alert)

        return result

    def _window_time_span(self, window: list[dict]) -> float:
        """Calculate the time span of a window in seconds.

        Args:
            window: List of flow dictionaries.

        Returns:
            Time span in seconds.
        """
        if not window:
            return 0.0
        timestamps = [f.get("timestamp", 0.0) for f in window]
        return max(max(timestamps) - min(timestamps), 0.001)

    def get_recent_alerts(self, limit: int = 50) -> list[Alert]:
        """Get recent alerts.

        Args:
            limit: Maximum number of alerts to return.

        Returns:
            List of recent Alert objects.
        """
        return self._alerts[-limit:]

    def get_stats(self) -> dict:
        """Get detection statistics.

        Returns:
            Dictionary with detection statistics.
        """
        elapsed = max(time.time() - self._stats["start_time"], 0.001)
        fps = self._stats["total_flows"] / elapsed
        avg_conf = 0.0
        if self._alerts:
            avg_conf = sum(a.confidence for a in self._alerts) / len(self._alerts)

        return {
            "total_flows": self._stats["total_flows"],
            "total_alerts": self._stats["total_alerts"],
            "threats_per_type": dict(self._stats["alerts_per_type"]),
            "avg_confidence": round(avg_conf, 4),
            "flows_per_sec": round(fps, 2),
            "uptime_sec": round(elapsed, 1),
        }
