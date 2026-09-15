"""
Real packet capture + threat detection engine.

Uses scapy to sniff live traffic on a network interface,
extracts flows, and runs heuristic-based threat detection.

This is the bridge between real network traffic and the alert system.
"""

import logging
import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)

# Try importing scapy
try:
    from scapy.all import (
        IP,
        TCP,
        UDP,
        ICMP,
        DNS,
        DNSQR,
        sniff,
        get_if_list,
        get_if_addr,
        conf,
    )
    SCAPY_AVAILABLE = True
    # Use L2 socket for better compatibility
    conf.L2socket = None
except ImportError:
    SCAPY_AVAILABLE = False
    logger.warning("[CAPTURE] Scapy not available — real packet capture disabled")

# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------


@dataclass
class FlowRecord:
    """A network flow extracted from captured packets."""
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    bytes_sent: int = 0
    bytes_recv: int = 0
    packets: int = 0
    syn_count: int = 0
    rst_count: int = 0
    first_seen: float = field(default_factory=time.time)
    last_seen: float = field(default_factory=time.time)
    dns_queries: list[str] = field(default_factory=list)
    dns_query_lengths: list[int] = field(default_factory=list)
    intervals: list[float] = field(default_factory=list)
    _last_ts: float = field(default_factory=time.time, repr=False)


@dataclass
class DetectedAlert:
    """A threat alert generated from real packet analysis."""
    timestamp: float
    threat_type: str
    confidence: float
    severity: str
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    evidence: dict[str, Any]
    flow_count: int
    id: str = ""


# ---------------------------------------------------------------------------
# Flow Table
# ---------------------------------------------------------------------------


class FlowTable:
    """Maintains active flows and detects threats from packet patterns."""

    def __init__(self, alert_callback, flow_timeout: float = 120.0):
        self.flows: dict[str, FlowRecord] = {}
        self.alert_callback = alert_callback
        self.flow_timeout = flow_timeout
        self._lock = threading.Lock()
        self._alert_callbacks: list = []
        self._total_packets = 0
        self._total_bytes = 0

    def _flow_key(self, src_ip, dst_ip, src_port, dst_port, proto) -> str:
        return f"{src_ip}:{src_port}->{dst_ip}:{dst_port}/{proto}"

    def process_packet(self, pkt) -> None:
        """Process a single captured packet."""
        if not pkt.haslayer(IP):
            return

        ip = pkt[IP]
        src_ip = ip.src
        dst_ip = ip.dst
        proto = ip.proto
        pkt_len = len(pkt)
        ts = time.time()

        with self._lock:
            self._total_packets += 1
            self._total_bytes += pkt_len

        # Determine ports and protocol
        src_port = 0
        dst_port = 0
        protocol_name = "OTHER"

        if pkt.haslayer(TCP):
            tcp = pkt[TCP]
            src_port = tcp.sport
            dst_port = tcp.dport
            protocol_name = "TCP"
        elif pkt.haslayer(UDP):
            udp = pkt[UDP]
            src_port = udp.sport
            dst_port = udp.dport
            protocol_name = "UDP"
        elif pkt.haslayer(ICMP):
            protocol_name = "ICMP"

        key = self._flow_key(src_ip, dst_ip, src_port, dst_port, protocol_name)

        with self._lock:
            if key not in self.flows:
                self.flows[key] = FlowRecord(
                    src_ip=src_ip, dst_ip=dst_ip,
                    src_port=src_port, dst_port=dst_port,
                    protocol=protocol_name,
                )

            flow = self.flows[key]
            flow.last_seen = ts
            flow.packets += 1

            # Track bytes direction (rough heuristic)
            if src_port > dst_port or (src_port == dst_port and src_ip < dst_ip):
                flow.bytes_sent += pkt_len
            else:
                flow.bytes_recv += pkt_len

            # TCP flags
            if pkt.haslayer(TCP):
                tcp = pkt[TCP]
                if tcp.flags & 0x02:  # SYN
                    flow.syn_count += 1
                if tcp.flags & 0x04:  # RST
                    flow.rst_count += 1

                # Beaconing: track intervals between packets from same src
                if flow.packets > 1:
                    interval = ts - flow._last_ts
                    if interval > 0.1 and interval < 10.0:
                        flow.intervals.append(interval)
                        if len(flow.intervals) > 20:
                            flow.intervals.pop(0)
                flow._last_ts = ts

            # DNS queries
            if pkt.haslayer(DNS) and pkt.haslayer(DNSQR):
                try:
                    qname = pkt[DNSQR].qname.decode("utf-8", errors="replace").rstrip(".")
                    if qname:
                        flow.dns_queries.append(qname)
                        flow.dns_query_lengths.append(len(qname))
                        if len(flow.dns_queries) > 50:
                            flow.dns_queries.pop(0)
                            flow.dns_query_lengths.pop(0)
                except Exception:
                    pass

        # Run detections after updating flow
        self._detect_threats(flow, key)

    def _detect_threats(self, flow: FlowRecord, key: str) -> None:
        """Run heuristic detections on a flow."""
        # 1. DDoS: many SYN packets to one destination
        if flow.syn_count >= 20 and flow.packets >= 30:
            self._emit_alert(DetectedAlert(
                timestamp=time.time(),
                threat_type="DDoS",
                confidence=min(0.5 + (flow.syn_count - 20) * 0.01, 0.99),
                severity="critical" if flow.syn_count > 100 else "high",
                src_ip=flow.src_ip,
                dst_ip=flow.dst_ip,
                src_port=flow.src_port,
                dst_port=flow.dst_port,
                protocol=flow.protocol,
                evidence={
                    "syn_count": flow.syn_count,
                    "packet_count": flow.packets,
                    "unique_dst_ports": self._count_dst_ports(flow.dst_ip),
                    "detection_method": "syn_flood_heuristic",
                },
                flow_count=flow.packets,
                id=f"rt-ddos-{int(time.time()*1000)}",
            ))

        # 2. Port Scan: many different ports from one source
        if flow.syn_count >= 8:
            unique_ports = self._count_src_dst_ports(flow.src_ip)
            if unique_ports >= 8:
                self._emit_alert(DetectedAlert(
                    timestamp=time.time(),
                    threat_type="Port Scan",
                    confidence=min(0.5 + unique_ports * 0.04, 0.99),
                    severity="high" if unique_ports > 15 else "medium",
                    src_ip=flow.src_ip,
                    dst_ip=flow.dst_ip,
                    src_port=flow.src_port,
                    dst_port=flow.dst_port,
                    protocol=flow.protocol,
                    evidence={
                        "unique_ports_scanned": unique_ports,
                        "syn_count": flow.syn_count,
                        "target_ports": list(self._get_src_ports(flow.src_ip))[:20],
                        "detection_method": "port_scan_heuristic",
                    },
                    flow_count=flow.packets,
                    id=f"rt-portscan-{int(time.time()*1000)}",
                ))

        # 3. Beaconing: regular intervals
        if len(flow.intervals) >= 5:
            avg = sum(flow.intervals) / len(flow.intervals)
            variance = sum((x - avg) ** 2 for x in flow.intervals) / len(flow.intervals)
            cv = (variance ** 0.5) / avg if avg > 0 else 1
            if cv < 0.3 and 0.5 < avg < 10:
                self._emit_alert(DetectedAlert(
                    timestamp=time.time(),
                    threat_type="Beaconing",
                    confidence=min(0.6 + (1 - cv) * 0.3, 0.99),
                    severity="high",
                    src_ip=flow.src_ip,
                    dst_ip=flow.dst_ip,
                    src_port=flow.src_port,
                    dst_port=flow.dst_port,
                    protocol=flow.protocol,
                    evidence={
                        "avg_interval_sec": round(avg, 3),
                        "interval_variance": round(variance, 4),
                        "coefficient_of_variation": round(cv, 4),
                        "beacon_count": len(flow.intervals),
                        "detection_method": "interval_regularity",
                    },
                    flow_count=flow.packets,
                    id=f"rt-beacon-{int(time.time()*1000)}",
                ))

        # 4. DNS Tunneling: long domain names
        if flow.dns_query_lengths and len(flow.dns_query_lengths) >= 3:
            avg_len = sum(flow.dns_query_lengths) / len(flow.dns_query_lengths)
            if avg_len > 30:
                self._emit_alert(DetectedAlert(
                    timestamp=time.time(),
                    threat_type="DNS Tunneling",
                    confidence=min(0.5 + (avg_len - 30) * 0.01, 0.95),
                    severity="medium" if avg_len < 50 else "high",
                    src_ip=flow.src_ip,
                    dst_ip=flow.dst_ip,
                    src_port=flow.src_port,
                    dst_port=flow.dst_port,
                    protocol="DNS",
                    evidence={
                        "avg_query_length": round(avg_len, 1),
                        "query_count": len(flow.dns_queries),
                        "sample_queries": flow.dns_queries[:5],
                        "detection_method": "dns_length_analysis",
                    },
                    flow_count=len(flow.dns_queries),
                    id=f"rt-dns-{int(time.time()*1000)}",
                ))

    def _emit_alert(self, alert: DetectedAlert) -> None:
        if self.alert_callback:
            try:
                self.alert_callback(alert)
            except Exception:
                pass

    def _count_dst_ports(self, dst_ip: str) -> int:
        return sum(1 for f in self.flows.values() if f.dst_ip == dst_ip and f.syn_count > 0)

    def _count_src_dst_ports(self, src_ip: str) -> int:
        ports = set()
        for f in self.flows.values():
            if f.src_ip == src_ip and f.syn_count > 0:
                ports.add(f.dst_port)
        return len(ports)

    def _get_src_ports(self, src_ip: str) -> set[int]:
        return {f.dst_port for f in self.flows.values() if f.src_ip == src_ip and f.syn_count > 0}

    def prune_old_flows(self) -> int:
        """Remove flows that haven't been seen recently. Returns count removed."""
        now = time.time()
        old_keys = [
            k for k, f in self.flows.items()
            if now - f.last_seen > self.flow_timeout
        ]
        for k in old_keys:
            del self.flows[k]
        return len(old_keys)

    @property
    def total_packets(self) -> int:
        return self._total_packets

    @property
    def total_bytes(self) -> int:
        return self._total_bytes

    @property
    def active_flow_count(self) -> int:
        return len(self.flows)


# ---------------------------------------------------------------------------
# Packet Sniffer
# ---------------------------------------------------------------------------


class PacketSniffer:
    """
    Scapy-based packet sniffer that feeds packets into a FlowTable.

    Listens on a network interface and calls process_packet for each packet.
    """

    def __init__(self, interface: str = "lo", flow_table: FlowTable | None = None):
        if not SCAPY_AVAILABLE:
            raise RuntimeError("Scapy is not installed. Run: pip install scapy")

        self.interface = interface
        self.flow_table = flow_table or FlowTable(alert_callback=None)
        self._running = False
        self._sniff_thread: threading.Thread | None = None
        self._stop_event = threading.Event()
        self._packets_captured = 0

    def _packet_handler(self, pkt) -> None:
        if not self._running:
            return
        self._packets_captured += 1
        self.flow_table.process_packet(pkt)

    def start(self) -> None:
        """Start capturing packets in a background thread."""
        if self._running:
            return

        self._running = True
        self._stop_event.clear()

        def _sniff():
            try:
                sniff(
                    iface=self.interface,
                    prn=self._packet_handler,
                    store=0,
                    stop_filter=lambda _: self._stop_event.is_set(),
                )
            except Exception as e:
                logger.error(f"[CAPTURE] Sniff error: {e}")
                self._running = False

        self._sniff_thread = threading.Thread(target=_sniff, daemon=True, name="sniffer")
        self._sniff_thread.start()
        logger.info(f"[CAPTURE] Sniffing on {self.interface}")

    def stop(self) -> None:
        """Stop capturing."""
        self._running = False
        self._stop_event.set()
        if self._sniff_thread:
            self._sniff_thread.join(timeout=3)

    @staticmethod
    def list_interfaces() -> list[str]:
        """List available network interfaces."""
        if SCAPY_AVAILABLE:
            try:
                return get_if_list()
            except Exception:
                pass
        return ["lo"]

    @property
    def packets_captured(self) -> int:
        return self._packets_captured

    @property
    def is_running(self) -> bool:
        return self._running
