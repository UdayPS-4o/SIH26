"""Port scanning detector.

Detects reconnaissance activity:
- Single source touching many destinations or ports
- Fan-out threshold: >10 unique ports in 60 seconds from one source
- Sequential port scanning patterns
"""
import math
import time
from collections import defaultdict
from detectors.base import BaseDetector


def shannon_entropy(values):
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


def sequential_score(ports):
    """Calculate how likely ports are in a sequential scan pattern."""
    if len(ports) < 3:
        return 0.0
    sorted_ports = sorted(ports)
    consecutive = sum(1 for i in range(len(sorted_ports) - 1)
                      if sorted_ports[i + 1] - sorted_ports[i] == 1)
    return consecutive / (len(sorted_ports) - 1)


class PortScanDetector(BaseDetector):
    """Detects port scanning and reconnaissance activity."""

    def __init__(self, config=None):
        super().__init__("port_scan")
        self.config = config or {}
        self.ports_threshold = self.config.get('ports_threshold', 10)
        self.time_window = self.config.get('time_window', 60)  # seconds
        self.targets_threshold = self.config.get('targets_threshold', 5)
        self.min_packets = self.config.get('min_packets', 5)

    def detect(self, flows, features):
        """Analyze flows for port scanning patterns."""
        self.alerts = []
        if not flows:
            return self.alerts

        # Track per-source activity
        src_activity = defaultdict(lambda: {
            'ports': set(),
            'targets': set(),
            'timestamps': [],
            'packets': 0,
            'syn_only': 0,
            'total': 0
        })

        for flow_key, flow in flows.items():
            src_ip, dst_ip = flow_key[0], flow_key[1]
            dst_port = flow_key[3]
            proto = flow_key[4]
            activity = src_activity[src_ip]
            activity['ports'].add(dst_port)
            activity['targets'].add(dst_ip)
            activity['packets'] += flow.get('packet_count', 0)
            activity['total'] += 1
            if proto == 'tcp' and not flow.get('has_payload', False):
                activity['syn_only'] += 1

            timestamps = flow.get('timestamps', [])
            activity['timestamps'].extend(timestamps)

        for src_ip, activity in src_activity.items():
            port_count = len(activity['ports'])
            target_count = len(activity['targets'])

            # Skip if not enough activity
            if activity['packets'] < self.min_packets:
                continue

            # Time-based analysis
            timestamps = sorted(activity['timestamps'])
            time_span = timestamps[-1] - timestamps[0] if len(timestamps) > 1 else 0

            # Vertical scan: one source, many ports, few targets
            if port_count >= self.ports_threshold:
                syn_ratio = activity['syn_only'] / activity['total'] if activity['total'] > 0 else 0
                ports_list = list(activity['ports'])
                seq_score = sequential_score([int(p) if isinstance(p, str) else p
                                              for p in ports_list])

                # Detect time-constrained scans
                if time_span <= self.time_window or time_span == 0:
                    port_entropy = shannon_entropy([str(p) for p in activity['ports']])
                    confidence = round(min(0.95,
                        0.25 + (port_count / 100) * 0.3 +
                        seq_score * 0.2 + syn_ratio * 0.15 +
                        (port_entropy / 8.0) * 0.1
                    ), 3)

                    if confidence >= 0.35:
                        severity = 'critical' if port_count > 50 else 'high' if port_count > 20 else 'medium'
                        self.alerts.append({
                            'threat_type': 'port_scan',
                            'scan_type': 'vertical' if target_count < port_count else 'horizontal' if target_count > port_count else 'block',
                            'scanner_ip': src_ip,
                            'ports_scanned': sorted([int(p) if isinstance(p, str) else p
                                                     for p in activity['ports']]),
                            'port_count': port_count,
                            'targets': list(activity['targets'])[:20],
                            'target_count': target_count,
                            'time_span_sec': round(time_span, 2),
                            'packet_count': activity['packets'],
                            'confidence': confidence,
                            'severity': severity,
                            'evidence': {
                                'sequential_score': round(seq_score, 4),
                                'syn_ratio': round(syn_ratio, 4),
                                'port_entropy': round(port_entropy, 4),
                                'ports_threshold': self.ports_threshold,
                                'ports_per_sec': round(port_count / max(time_span, 1), 2)
                            }
                        })

        return self.alerts
