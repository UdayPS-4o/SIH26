"""Volumetric DDoS detector.

Detects:
- SYN floods: high rate of SYN packets from many sources to one destination
- UDP reflection: small requests followed by large responses
- Spoofed sources: high entropy in source IP addresses
"""
import math
from collections import defaultdict
from detectors.base import BaseDetector


def shannon_entropy(values):
    """Calculate Shannon entropy for a list of values."""
    if not values:
        return 0.0
    total = len(values)
    counts = {}
    for v in values:
        counts[v] = counts.get(v, 0) + 1
    entropy = 0.0
    for count in counts.values():
        p = count / total
        if p > 0:
            entropy -= p * math.log2(p)
    return entropy


def ip_prefix(ip_str, prefix_bits):
    """Get /24 or /16 prefix from IP string."""
    parts = ip_str.split('.')
    if len(parts) != 4:
        return ip_str
    ip_int = (int(parts[0]) << 24) + (int(parts[1]) << 16) + (int(parts[2]) << 8) + int(parts[3])
    mask = (0xFFFFFFFF << (32 - prefix_bits)) & 0xFFFFFFFF
    masked = ip_int & mask
    return "{}.{}.{}.{}/{}".format(
        (masked >> 24) & 0xFF, (masked >> 16) & 0xFF,
        (masked >> 8) & 0xFF, masked & 0xFF, prefix_bits)


class DDoSDetector(BaseDetector):
    """Detects volumetric DDoS attacks."""

    def __init__(self, config=None):
        super().__init__("ddos")
        self.config = config or {}
        self.syn_pps_threshold = self.config.get('syn_pps_threshold', 10)
        self.syn_src_count_min = self.config.get('syn_src_count_min', 5)
        self.udp_amp_ratio = self.config.get('udp_amp_ratio', 5.0)
        self.entropy_threshold = self.config.get('entropy_threshold', 4.0)
        self.window_sec = self.config.get('window_sec', 60)

    def detect(self, flows, features):
        self.alerts = []
        if not flows:
            return self.alerts

        # Group by destination IP
        dst_groups = defaultdict(list)
        for fk, flow in flows.items():
            dst_ip = fk[1]
            dst_groups[dst_ip].append((fk, flow))

        for dst_ip, items in dst_groups.items():
            self._check_syn_flood(dst_ip, items)
            self._check_udp_reflection(dst_ip, items)
            self._check_spoofed(dst_ip, items)

        return self.alerts

    def _check_syn_flood(self, dst_ip, items):
        syn_packets = 0
        src_ips = set()
        min_ts = float('inf')
        max_ts = 0

        for fk, flow in items:
            if fk[4] == 'tcp':
                syn_packets += flow.get('syn_count', 0)
                src_ips.add(fk[0])
                timestamps = flow.get('timestamps', [])
                for ts in timestamps:
                    if ts < min_ts:
                        min_ts = ts
                    if ts > max_ts:
                        max_ts = ts

        if syn_packets == 0 or len(src_ips) < 2:
            return

        duration = max_ts - min_ts
        if duration <= 0:
            duration = 1.0
        pps = syn_packets / duration

        if pps > self.syn_pps_threshold and len(src_ips) >= self.syn_src_count_min:
            confidence = round(min(0.95, 0.25 +
                min(pps / 200, 0.35) +
                min(len(src_ips) / 100, 0.35)), 3)
            self.alerts.append({
                'threat_type': 'ddos',
                'sub_type': 'syn_flood',
                'src_ips': sorted(src_ips)[:20],
                'dst_ip': dst_ip,
                'packet_rate': round(pps, 2),
                'src_count': len(src_ips),
                'confidence': confidence,
                'severity': 'critical',
                'evidence': {
                    'syn_packets': syn_packets,
                    'duration_sec': round(duration, 2),
                    'distinct_sources': len(src_ips),
                    'pps_threshold': self.syn_pps_threshold
                }
            })

    def _check_udp_reflection(self, dst_ip, items):
        for fk, flow in items:
            if fk[4] != 'udp':
                continue
            req = flow.get('src_to_dst_bytes', 0)
            resp = flow.get('dst_to_src_bytes', 0)
            if req > 0 and resp > req * self.udp_amp_ratio:
                ratio = resp / req
                self.alerts.append({
                    'threat_type': 'ddos',
                    'sub_type': 'udp_reflection',
                    'src_ips': [fk[0]],
                    'dst_ip': dst_ip,
                    'packet_rate': round(flow.get('packet_count', 0) / max(flow.get('duration', 1), 1), 2),
                    'confidence': round(min(0.95, 0.4 + min(ratio / 20, 0.55)), 3),
                    'severity': 'high',
                    'evidence': {
                        'request_bytes': req,
                        'response_bytes': resp,
                        'amplification_ratio': round(ratio, 2)
                    }
                })
                break  # one alert per dst

    def _check_spoofed(self, dst_ip, items):
        prefixes_24 = []
        prefixes_16 = []
        for fk, flow in items:
            if fk[4] == 'tcp' or fk[4] == 'udp':
                prefixes_24.append(ip_prefix(fk[0], 24))
                prefixes_16.append(ip_prefix(fk[0], 16))

        if len(prefixes_24) < self.syn_src_count_min:
            return

        entropy_24 = shannon_entropy(prefixes_24)
        unique_24 = len(set(prefixes_24))
        unique_16 = len(set(prefixes_16))

        # Spoofed: entropy high AND /16 and /24 diverge (random across address space)
        if entropy_24 > self.entropy_threshold and unique_16 > unique_24 * 0.6:
            confidence = round(min(0.90, 0.2 + min(entropy_24 / 8.0, 0.4) + 0.2), 3)
            self.alerts.append({
                'threat_type': 'ddos',
                'sub_type': 'spoofed_flood',
                'src_ips': sorted(set(fk[0] for fk, _ in items))[:20],
                'dst_ip': dst_ip,
                'packet_rate': sum(f.get('packet_count', 0) for _, f in items) / self.window_sec,
                'confidence': confidence,
                'severity': 'high',
                'evidence': {
                    'src_entropy_24': round(entropy_24, 3),
                    'unique_prefixes_24': unique_24,
                    'unique_prefixes_16': unique_16
                }
            })
