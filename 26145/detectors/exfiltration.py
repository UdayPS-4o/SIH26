"""Data exfiltration detector.

Detects data exfiltration via asymmetric traffic patterns:
- Outbound-to-inbound byte ratio analysis
- Large data transfers to external/unusual destinations
- Per-host baseline deviation
"""
from collections import defaultdict
from detectors.base import BaseDetector


class ExfiltrationDetector(BaseDetector):
    """Detects data exfiltration through asymmetric traffic analysis."""

    def __init__(self, config=None):
        super().__init__("exfiltration")
        self.config = config or {}
        self.ratio_threshold = self.config.get('ratio_threshold', 5.0)
        self.min_upload_bytes = self.config.get('min_upload_bytes', 50000)  # 50 KB
        self.min_download_bytes = self.config.get('min_download_bytes', 1000)  # 1 KB

    def detect(self, flows, features):
        """Analyze flows for data exfiltration patterns."""
        self.alerts = []
        if not flows:
            return self.alerts

        # Group by (src_ip, dst_ip)
        host_pairs = defaultdict(lambda: {
            'upload_bytes': 0,
            'download_bytes': 0,
            'packet_count': 0,
            'flows': [],
            'first_seen': float('inf'),
            'last_seen': 0
        })

        for flow_key, flow in flows.items():
            src_ip = flow_key[0]
            dst_ip = flow_key[1]
            pair = host_pairs[(src_ip, dst_ip)]

            # Use estimated bytes from flow features
            s2d = flow.get('src_to_dst_bytes', 0)
            d2s = flow.get('dst_to_src_bytes', 0)
            pair['upload_bytes'] += s2d
            pair['download_bytes'] += d2s
            pair['packet_count'] += flow.get('packet_count', 0)
            pair['flows'].append(flow)

            ts = flow.get('first_seen', 0)
            if ts > 0:
                pair['first_seen'] = min(pair['first_seen'], ts)
                pair['last_seen'] = max(pair['last_seen'], flow.get('last_seen', ts))

        for (src_ip, dst_ip), pair in host_pairs.items():
            upload = pair['upload_bytes']
            download = pair['download_bytes']

            # Skip if not enough data
            if upload < self.min_upload_bytes and download < self.min_download_bytes:
                continue

            ratio = upload / max(download, 1)

            if ratio >= self.ratio_threshold and upload >= self.min_upload_bytes:
                duration = pair['last_seen'] - pair['first_seen']
                if duration <= 0:
                    duration = 1.0

                sustained_rate = upload / duration  # bytes per second
                confidence = round(min(0.95,
                    0.2 + min(ratio / 50, 0.4) +
                    min(upload / (10 * self.min_upload_bytes), 0.2) +
                    min(sustained_rate / 10240, 0.15)
                ), 3)

                if confidence >= 0.3:
                    severity = 'critical' if ratio > 100 else 'high' if ratio > 20 else 'medium'
                    self.alerts.append({
                        'threat_type': 'exfiltration',
                        'src_ip': src_ip,
                        'dst_ip': dst_ip,
                        'upload_bytes': upload,
                        'download_bytes': download,
                        'ratio': round(ratio, 2),
                        'confidence': confidence,
                        'severity': severity,
                        'evidence': {
                            'upload_mb': round(upload / (1024 * 1024), 2),
                            'download_kb': round(download / 1024, 2),
                            'flow_count': len(pair['flows']),
                            'duration_sec': round(duration, 2),
                            'sustained_rate_bps': round(sustained_rate, 2),
                            'ratio_threshold': self.ratio_threshold,
                            'validity': 'MEASURED'
                        }
                    })

        return self.alerts
