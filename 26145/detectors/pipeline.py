"""Main detection pipeline for EKADHARA.

Parses PCAP, extracts flows and features, runs all detectors,
and aggregates alerts.
"""
import json
import time
import os
from collections import defaultdict
from detectors.base import BaseDetector
from detectors.ddos import DDoSDetector
from detectors.beaconing import BeaconingDetector
from detectors.port_scan import PortScanDetector
from detectors.dga import DGADetector
from detectors.exfiltration import ExfiltrationDetector


def ip_to_int(ip_str):
    parts = ip_str.split('.')
    return (int(parts[0]) << 24) + (int(parts[1]) << 16) + (int(parts[2]) << 8) + int(parts[3])


class Flow:
    """Represents a network flow (5-tuple)."""

    def __init__(self, src_ip, dst_ip, src_port, dst_port, protocol):
        self.src_ip = src_ip
        self.dst_ip = dst_ip
        self.src_port = src_port
        self.dst_port = dst_port
        self.protocol = protocol
        self.packets = []
        self.packet_count = 0
        self.src_to_dst_bytes = 0
        self.dst_to_src_bytes = 0
        self.syn_count = 0
        self.first_seen = None
        self.last_seen = None
        self.timestamps = []
        self.has_payload = False
        self.ttls = []
        self.src_ips = []

    def add_packet(self, timestamp, src_ip, dst_ip, size, proto, ttl=64, src_port=0, dst_port=0):
        self.packets.append({
            'timestamp': timestamp,
            'src_ip': src_ip,
            'dst_ip': dst_ip,
            'size': size,
            'protocol': proto,
            'ttl': ttl,
            'src_port': src_port,
            'dst_port': dst_port
        })
        self.packet_count += 1
        self.timestamps.append(timestamp)
        if src_ip == self.src_ip:
            self.src_to_dst_bytes += size
        else:
            self.dst_to_src_bytes += size
        if self.first_seen is None or timestamp < self.first_seen:
            self.first_seen = timestamp
        if self.last_seen is None or timestamp > self.last_seen:
            self.last_seen = timestamp
        if ttl:
            self.ttls.append(ttl)
        if size > 0:
            self.has_payload = True

    def to_dict(self):
        return {
            'src_ip': self.src_ip,
            'dst_ip': self.dst_ip,
            'src_port': self.src_port,
            'dst_port': self.dst_port,
            'protocol': self.protocol,
            'packet_count': self.packet_count,
            'src_to_dst_bytes': self.src_to_dst_bytes,
            'dst_to_src_bytes': self.dst_to_src_bytes,
            'syn_count': self.syn_count,
            'first_seen': self.first_seen,
            'last_seen': self.last_seen,
            'duration': (self.last_seen - self.first_seen) if self.first_seen and self.last_seen else 0,
            'timestamps': self.timestamps,
            'has_payload': self.has_payload,
            'ttl': self.ttls[0] if self.ttls else None,
            'src_ips': list(set(p['src_ip'] for p in self.packets))
        }


def parse_pcap(filepath, diode_mode=False):
    """Parse a PCAP file and return (flows, features).

    Args:
        filepath: Path to PCAP file
        diode_mode: If True, only process forward-direction packets

    Returns:
        tuple: (flows_dict, features_dict)
    """
    flows = {}
    packet_count = 0

    with open(filepath, 'rb') as f:
        # Parse PCAP global header
        magic = f.read(4)
        if len(magic) < 4:
            return {}, {}

        magic_num = int.from_bytes(magic, 'little')
        if magic_num == 0xa1b2c3d4:
            swap = False
        elif magic_num == 0xd4c3b2a1:
            swap = True
        else:
            # Try nanosecond pcap
            magic_num2 = int.from_bytes(magic, 'big')
            if magic_num2 == 0xa1b23c4d:
                swap = True
            else:
                return {}, {}

        version_major = int.from_bytes(f.read(2), 'little')
        version_minor = int.from_bytes(f.read(2), 'little')
        thiszone = int.from_bytes(f.read(4), 'little', signed=True)
        sigfigs = int.from_bytes(f.read(4), 'little')
        snaplen = int.from_bytes(f.read(4), 'little')
        network = int.from_bytes(f.read(4), 'little')

        def read_int4():
            b = f.read(4)
            if len(b) < 4:
                return None
            return int.from_bytes(b, 'little', signed=True) if swap else int.from_bytes(b, 'little')

        pkt_idx = 0
        while True:
            ts_sec = read_int4()
            if ts_sec is None:
                break
            ts_usec = read_int4()
            if ts_usec is None:
                break
            incl_len = read_int4()
            if incl_len is None:
                break
            orig_len = read_int4()
            if orig_len is None:
                break

            timestamp = ts_sec + ts_usec / 1_000_000.0
            pkt_data = f.read(incl_len)
            if len(pkt_data) < incl_len:
                break

            # Parse Ethernet frame
            if len(pkt_data) < 14:
                pkt_idx += 1
                continue

            eth_type = (pkt_data[12] << 8) | pkt_data[13]
            offset = 14

            # VLAN tagging
            while eth_type in (0x8100, 0x88a8, 0x9100):
                offset += 2
                if offset >= len(pkt_data):
                    break
                eth_type = (pkt_data[offset] << 8) | pkt_data[offset + 1]
                offset += 2

            if eth_type == 0x0806:  # ARP
                pkt_idx += 1
                continue

            if eth_type == 0x0800:  # IPv4
                if offset + 20 > len(pkt_data):
                    pkt_idx += 1
                    continue
                ip_version = (pkt_data[offset] >> 4) & 0xF
                ip_header_len = ((pkt_data[offset] & 0x0F) * 4) if ip_version == 4 else 0
                total_ip_len = (pkt_data[offset + 2] << 8) | pkt_data[offset + 3]
                protocol = pkt_data[offset + 9]
                src_ip = "{}.{}.{}.{}".format(
                    pkt_data[offset + 12], pkt_data[offset + 13],
                    pkt_data[offset + 14], pkt_data[offset + 15])
                dst_ip = "{}.{}.{}.{}".format(
                    pkt_data[offset + 16], pkt_data[offset + 17],
                    pkt_data[offset + 18], pkt_data[offset + 19])
                ttl = pkt_data[offset + 8]
                payload_size = total_ip_len - ip_header_len

                if protocol == 6:  # TCP
                    if offset + ip_header_len + 14 > len(pkt_data):
                        pkt_idx += 1
                        continue
                    tcp_offset = offset + ip_header_len
                    src_port = (pkt_data[tcp_offset] << 8) | pkt_data[tcp_offset + 1]
                    dst_port = (pkt_data[tcp_offset + 2] << 8) | pkt_data[tcp_offset + 3]

                    # Check SYN flag
                    flags = pkt_data[tcp_offset + 13]
                    is_syn = (flags & 0x02) != 0

                    flow_key = (src_ip, dst_ip, str(src_port), str(dst_port), 'tcp')
                    if flow_key not in flows:
                        flows[flow_key] = Flow(src_ip, dst_ip, src_port, dst_port, 'tcp')
                    flow = flows[flow_key]
                    if is_syn:
                        flow.syn_count += 1
                    flow.add_packet(timestamp, src_ip, dst_ip, payload_size, 'tcp',
                                    ttl, src_port, dst_port)
                    packet_count += 1

                elif protocol == 17:  # UDP
                    if offset + ip_header_len + 8 > len(pkt_data):
                        pkt_idx += 1
                        continue
                    udp_offset = offset + ip_header_len
                    src_port = (pkt_data[udp_offset] << 8) | pkt_data[udp_offset + 1]
                    dst_port = (pkt_data[udp_offset + 2] << 8) | pkt_data[udp_offset + 3]

                    flow_key = (src_ip, dst_ip, str(src_port), str(dst_port), 'udp')
                    if flow_key not in flows:
                        flows[flow_key] = Flow(src_ip, dst_ip, src_port, dst_port, 'udp')
                    flow = flows[flow_key]
                    flow.add_packet(timestamp, src_ip, dst_ip, payload_size, 'udp',
                                    ttl, src_port, dst_port)
                    packet_count += 1

            elif eth_type == 0x86DD:  # IPv6
                if offset + 40 > len(pkt_data):
                    pkt_idx += 1
                    continue
                payload_len = (pkt_data[offset + 4] << 8) | pkt_data[offset + 5]
                next_header = pkt_data[offset + 6]
                src_ip = ":".join("{:02x}".format(pkt_data[offset + i]) for i in range(8, 16))
                dst_ip = ":".join("{:02x}".format(pkt_data[offset + i]) for i in range(24, 32))

                if next_header == 6:  # TCP
                    proto = 'tcp'
                elif next_header == 17:  # UDP
                    proto = 'udp'
                else:
                    pkt_idx += 1
                    continue

                flow_key = (src_ip, dst_ip, '0', '0', proto)
                if flow_key not in flows:
                    flows[flow_key] = Flow(src_ip, dst_ip, 0, 0, proto)
                flow = flows[flow_key]
                flow.add_packet(timestamp, src_ip, dst_ip, payload_len, proto)
                packet_count += 1

            elif eth_type in (0x0800,) and offset < len(pkt_data):
                pass

            pkt_idx += 1

    # Build features dict from flows
    features = {}
    for flow_key, flow in flows.items():
        features[flow_key] = flow.to_dict()

    return flows, features


class DetectionPipeline:
    """Main detection pipeline that runs all detectors."""

    def __init__(self, config=None, diode_mode=False):
        self.config = config or {}
        self.diode_mode = diode_mode
        self.detectors = [
            DDoSDetector(self.config.get('ddos', {})),
            BeaconingDetector(self.config.get('beaconing', {})),
            PortScanDetector(self.config.get('port_scan', {})),
            DGADetector(self.config.get('dga', {})),
            ExfiltrationDetector(self.config.get('exfiltration', {})),
        ]
        self.alert_counter = 0

    def run(self, flows, features, pcap_file="unknown"):
        """Run all detectors and aggregate alerts."""
        all_alerts = []
        start_time = time.time()

        for detector in self.detectors:
            detector.clear_alerts()
            try:
                alerts = detector.detect(flows, features)
                for alert in alerts:
                    self.alert_counter += 1
                    alert['id'] = f"alert-{self.alert_counter:04d}"
                    alert['validity'] = 'MEASURED'
                    if self.diode_mode:
                        # In diode mode, some features may be inferred
                        if alert['threat_type'] in ('exfiltration',):
                            alert['validity'] = 'ESTIMATED'
                    all_alerts.append(alert)
            except Exception as e:
                continue

        processing_time = (time.time() - start_time) * 1000

        # Sort by confidence descending
        all_alerts.sort(key=lambda a: a.get('confidence', 0), reverse=True)

        return {
            'timestamp': time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            'pcap_file': os.path.basename(pcap_file),
            'mode': 'diode' if self.diode_mode else 'full',
            'alerts': all_alerts,
            'stats': {
                'flows_analyzed': len(flows),
                'alerts_generated': len(all_alerts),
                'processing_time_ms': round(processing_time, 2),
                'detectors_run': len(self.detectors)
            }
        }
