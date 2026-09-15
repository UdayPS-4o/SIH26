"""
Threat detection engine for network flow analysis.

Implements multiple detection strategies including DDoS, beaconing, DGA,
DNS tunneling, TLS anomalies, port scanning, and data exfiltration.
Uses sliding windows to analyze flow patterns over time.
"""

import logging
import time
import uuid
from dataclasses import dataclass, field
from typing import Any

import numpy as np

from .simulator import TrafficSimulator
from features import (
    compute_entropy,
    compute_ngram_score,
    extract_flow_features,
    sliding_window_stats,
)

logger = logging.getLogger(__name__)

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


@dataclass
class Alert:
    """Represents a detected threat alert.

    Attributes:
        id: Unique alert identifier.
        timestamp: Unix timestamp of detection.
        threat_type: Category of threat detected.
        confidence: Detection confidence (0.0 to 1.0).
        severity: Severity level (critical, high, medium, low).
        src_ip: Source IP address.
        dst_ip: Destination IP address.
        evidence: Human-readable evidence string.
        flow_count: Number of flows that contributed to this alert.
    """
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    timestamp: float = field(default_factory=time.time)
    threat_type: str = "unknown"
    confidence: float = 0.0
    severity: str = "low"
    src_ip: str = ""
    dst_ip: str = ""
    evidence: str = ""
    flow_count: int = 1
    details: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Convert alert to dictionary for JSON serialization.

        Returns:
            Dictionary representation of the alert.
        """
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "threat_type": self.threat_type,
            "confidence": self.confidence,
            "severity": self.severity,
            "src_ip": self.src_ip,
            "dst_ip": self.dst_ip,
            "evidence": self.evidence,
            "flow_count": self.flow_count,
            "details": self.details,
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

        # Thresholds
        self._thresholds = {
            "ddos_packet_rate": 1000,
            "ddos_flows_per_sec": 100,
            "beaconing_min_flows": 3,
            "beaconing_interval_std": 0.5,
            "dga_entropy_threshold": 3.5,
            "dns_tunnel_length": 100,
            "port_scan_unique_ports": 20,
            "port_scan_fan_ratio": 0.8,
            "exfil_ratio": 5.0,
        }

        # Statistics
        self._stats = {
            "total_flows": 0,
            "total_alerts": 0,
            "flows_per_sec": 0.0,
            "alerts_per_type": {},
            "start_time": time.time(),
        }

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
        alerts.extend(self._detect_ddos(global_window, src_window))
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

    def _detect_ddos(self, global_window: list[dict], src_window: list[dict]) -> list[Alert]:
        """Detect DDoS attacks based on rate and source entropy.

        Args:
            global_window: All flows in the time window.
            src_window: Flows from the current source IP.

        Returns:
            List of DDoS alerts.
        """
        alerts = []
        if len(global_window) < 10:
            return alerts

        # Aggregate stats
        total_packets = sum(
            f.get("packets_sent", 0) + f.get("packets_recv", 0) for f in global_window
        )
        time_span = self._window_time_span(global_window)
        if time_span <= 0:
            time_span = 1.0

        packets_per_sec = total_packets / time_span
        flows_per_sec = len(global_window) / time_span

        # Unique source IPs
        unique_sources = len(set(f.get("src_ip", "") for f in global_window))

        # Single source flooding
        if len(src_window) > 100:
            target_ip = src_window[0].get("dst_ip", "")
            confidence = min(len(src_window) / 500.0, 0.95)
            confidence = max(confidence, packets_per_sec / 5000.0)
            confidence = min(confidence, 0.95)

            if confidence > 0.5:
                alerts.append(Alert(
                    timestamp=time.time(),
                    threat_type="ddos",
                    confidence=confidence,
                    severity=_severity_from_confidence(confidence),
                    src_ip=src_window[0].get("src_ip", ""),
                    dst_ip=target_ip,
                    evidence=(
                        f"High packet rate: {packets_per_sec:.0f} pps, "
                        f"{len(src_window)} flows from single source, "
                        f"{unique_sources} total sources"
                    ),
                    flow_count=len(src_window),
                    details={
                        "packets_per_sec": round(packets_per_sec, 2),
                        "flows_per_sec": round(flows_per_sec, 2),
                        "unique_sources": unique_sources,
                    },
                ))

        # Distributed flood
        if flows_per_sec > 200 and unique_sources > 50:
            confidence = min(flows_per_sec / 1000.0, 0.9)
            alerts.append(Alert(
                timestamp=time.time(),
                threat_type="ddos",
                confidence=confidence,
                severity=_severity_from_confidence(confidence),
                src_ip="multiple",
                dst_ip=global_window[0].get("dst_ip", ""),
                evidence=(
                    f"Distributed traffic spike: {flows_per_sec:.0f} flows/sec, "
                    f"{unique_sources} unique sources"
                ),
                flow_count=len(global_window),
                details={
                    "flows_per_sec": round(flows_per_sec, 2),
                    "unique_sources": unique_sources,
                },
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

        mean_iat = np.mean(iats)
        std_iat = np.std(iats)

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
                alerts.append(Alert(
                    timestamp=time.time(),
                    threat_type="beaconing",
                    confidence=confidence,
                    severity=_severity_from_confidence(confidence),
                    src_ip=src_window[0].get("src_ip", ""),
                    dst_ip=dst_ips[0] if dst_ips else "",
                    evidence=(
                        f"Regular beaconing pattern: mean IAT={mean_iat:.1f}s, "
                        f"std={std_iat:.3f}s, CV={cv:.3f} over {len(src_window)} flows"
                    ),
                    flow_count=len(src_window),
                    details={
                        "mean_iat": round(mean_iat, 3),
                        "std_iat": round(std_iat, 3),
                        "coefficient_of_variation": round(cv, 3),
                        "unique_destinations": len(dst_ips),
                    },
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
                    alerts.append(Alert(
                        timestamp=time.time(),
                        threat_type="dga",
                        confidence=confidence,
                        severity=_severity_from_confidence(confidence),
                        src_ip=flow.get("src_ip", ""),
                        dst_ip=flow.get("dst_ip", ""),
                        evidence=(
                            f"Suspicious domain '{domain}': "
                            f"entropy={entropy:.3f}, ngram={ngram_score:.3f}"
                        ),
                        flow_count=1,
                        details={
                            "domain": domain,
                            "entropy": round(entropy, 3),
                            "ngram_score": round(ngram_score, 3),
                        },
                    ))

        return alerts

    def _detect_dns_tunnel(self, global_window: list[dict]) -> list[Alert]:
        """Detect DNS tunneling by analyzing query length anomalies.

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

            if query_length > self._thresholds["dns_tunnel_length"]:
                confidence = min(query_length / 300.0, 0.95)
                entropy = compute_entropy(query)

                alerts.append(Alert(
                    timestamp=time.time(),
                    threat_type="dns_tunnel",
                    confidence=confidence,
                    severity=_severity_from_confidence(confidence),
                    src_ip=flow.get("src_ip", ""),
                    dst_ip=flow.get("dst_ip", ""),
                    evidence=(
                        f"Unusually long DNS query ({query_length} chars): "
                        f"'{query[:50]}...' entropy={entropy:.3f}"
                    ),
                    flow_count=1,
                    details={
                        "query_length": query_length,
                        "entropy": round(entropy, 3),
                        "query_preview": query[:100],
                    },
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

            # Suspicious JA3 fingerprints
            known_ja3 = TrafficSimulator.KNOWN_JA3
            suspicious_ja3 = TrafficSimulator.SUSPICIOUS_JA3

            is_suspicious = ja3_hash in suspicious_ja3
            is_unknown = ja3_hash not in known_ja3

            if is_suspicious or (is_unknown and len(flows) > 3):
                confidence = 0.6 if is_unknown else 0.85
                confidence = min(confidence + len(flows) * 0.02, 0.95)

                src_ips = list(set(f.get("src_ip", "") for f in flows))
                alerts.append(Alert(
                    timestamp=time.time(),
                    threat_type="tls_anomaly",
                    confidence=confidence,
                    severity=_severity_from_confidence(confidence),
                    src_ip=src_ips[0] if src_ips else "",
                    dst_ip=flows[0].get("dst_ip", ""),
                    evidence=(
                        f"Suspicious TLS JA3 hash: {ja3_hash[:30]}... "
                        f"({len(flows)} flows from {len(src_ips)} sources)"
                    ),
                    flow_count=len(flows),
                    details={
                        "ja3_hash": ja3_hash,
                        "is_suspicious": is_suspicious,
                        "is_unknown": is_unknown,
                    },
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
                alerts.append(Alert(
                    timestamp=time.time(),
                    threat_type="port_scan",
                    confidence=confidence,
                    severity=_severity_from_confidence(confidence),
                    src_ip=src_window[0].get("src_ip", ""),
                    dst_ip=src_window[0].get("dst_ip", ""),
                    evidence=(
                        f"Port scanning detected: {unique_ports} unique ports, "
                        f"fan-out ratio={fan_ratio:.2f}, {len(src_window)} probes"
                    ),
                    flow_count=len(src_window),
                    details={
                        "unique_ports": unique_ports,
                        "fan_out_ratio": round(fan_ratio, 3),
                        "ports_scanned": sorted(list(dst_ports))[:20],
                    },
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
                    alerts.append(Alert(
                        timestamp=time.time(),
                        threat_type="exfiltration",
                        confidence=confidence,
                        severity=_severity_from_confidence(confidence),
                        src_ip=src_ip,
                        dst_ip=dst_ips[0] if dst_ips else "",
                        evidence=(
                            f"Possible data exfiltration: {total_sent / 1024 / 1024:.1f}MB "
                            f"sent vs {total_recv / 1024:.1f}KB received "
                            f"(ratio={ratio:.1f}) over {len(flows)} flows"
                        ),
                        flow_count=len(flows),
                        details={
                            "bytes_sent": total_sent,
                            "bytes_recv": total_recv,
                            "ratio": round(ratio, 2),
                        },
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
