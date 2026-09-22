"""
pcap_replay.py — PCAP replay engine for the Ekadhara / WATCHTOWER system.

Reads .pcap / .pcapng files using scapy and replays them into the detector
pipeline at a configurable speed.  Used for live demonstrations on recorded
traffic and for regression testing against known attack PCAPs.
"""

from __future__ import annotations

import os
import time
import threading
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional, Callable

from scapy.all import rdpcap, Packet, PcapWriter
from scapy.layers.inet import IP, TCP, UDP, ICMP
from scapy.layers.inet6 import IPv6
from scapy.layers.dns import DNSQR

from detector import ThreatDetector
from features import extract_flow_features

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DEFAULT_REPLAY_SPEED: float = 1.0       # 1× real-time
DEFAULT_BATCH_SIZE: int = 500           # packets per flush
DEFAULT_PCAP_GLOB: str = "data/*.pcap"  # default glob for auto-discovery

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------


@dataclass
class ReplayStats:
    """Accumulates statistics across a replay session."""

    total_packets: int = 0
    total_flows: int = 0
    alerts_generated: int = 0
    start_wall: float = field(default_factory=time.time)
    end_wall: float = 0.0

    @property
    def elapsed_sec(self) -> float:
        end = self.end_wall or time.time()
        return max(end - self.start_wall, 0.001)

    @property
    def packets_per_sec(self) -> float:
        return self.total_packets / self.elapsed_sec

    @property
    def flows_per_sec(self) -> float:
        return self.total_flows / self.elapsed_sec


# ---------------------------------------------------------------------------
# Packet → flow-key helper
# ---------------------------------------------------------------------------


def _flow_key(pkt: Packet) -> Optional[tuple]:
    """Return a canonical 5-tuple key or None if the packet is not IP."""
    if IP in pkt:
        ip = pkt[IP]
        proto = ip.proto
        sport = 0
        dport = 0
        if proto == 6 and TCP in pkt:
            sport = pkt[TCP].sport
            dport = pkt[TCP].dport
        elif proto == 17 and UDP in pkt:
            sport = pkt[UDP].sport
            dport = pkt[UDP].dport
        return (ip.src, ip.dst, proto, sport, dport)
    if IPv6 in pkt:
        ip6 = pkt[IPv6]
        proto = ip6.nh
        return (str(ip6.src), str(ip6.dst), proto, 0, 0)
    return None


# ---------------------------------------------------------------------------
# Replay engine
# ---------------------------------------------------------------------------


class PCAPReplayEngine:
    """Replays a PCAP file through the detection pipeline."""

    def __init__(
        self,
        detector: ThreatDetector,
        speed: float = DEFAULT_REPLAY_SPEED,
        batch_size: int = DEFAULT_BATCH_SIZE,
        on_alert: Optional[Callable] = None,
        on_progress: Optional[Callable] = None,
    ) -> None:
        self.detector = detector
        self.speed = speed
        self.batch_size = batch_size
        self.on_alert = on_alert          # callback(dict_alert)
        self.on_progress = on_progress    # callback(current, total)
        self.stats = ReplayStats()
        self._cancel = threading.Event()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def load(self, path: str | Path) -> List[Packet]:
        """Load a PCAP file and return the list of packets."""
        pcap_path = Path(path)
        if not pcap_path.exists():
            raise FileNotFoundError(f"PCAP file not found: {pcap_path}")
        print(f"[pcap_replay] Loading {pcap_path} …")
        pkts = rdpcap(str(pcap_path))
        print(f"[pcap_replay] Loaded {len(pkts)} packets from {pcap_path.name}")
        return pkts

    def replay(self, packets: List[Packet]) -> ReplayStats:
        """Replay *packets* through the detector, respecting self.speed."""
        self.stats = ReplayStats()
        self._cancel.clear()
        total = len(packets)
        if total == 0:
            return self.stats

        flow_buffers: dict[tuple, list] = {}
        first_ts: float = packets[0].time
        last_process_ts: float = time.perf_counter()

        for idx, pkt in enumerate(packets):
            if self._cancel.is_set():
                break

            # --- timing control ---
            pkt_delta: float = pkt.time - first_ts   # seconds since first pkt
            target_wall: float = pkt_delta / max(self.speed, 0.01)
            now: float = time.perf_counter() - self.stats.start_wall
            sleep_needed: float = target_wall - now
            if sleep_needed > 0:
                time.sleep(sleep_needed)

            # --- flow grouping ---
            key = _flow_key(pkt)
            if key is None:
                continue
            flow_buffers.setdefault(key, []).append(pkt)

            # --- flush every batch_size new packets ---
            if len(flow_buffers.get(key, [])) >= self.batch_size:
                self._process_flow(key, flow_buffers.pop(key))

            self.stats.total_packets += 1

            # --- progress callback ---
            if self.on_progress and idx % max(1, total // 100) == 0:
                self.on_progress(idx, total)

        # Flush remaining flows
        for key, buf in flow_buffers.items():
            self._process_flow(key, buf)

        self.stats.end_wall = time.time()
        print(
            f"[pcap_replay] Complete — {self.stats.total_packets} pkts, "
            f"{self.stats.total_flows} flows, {self.stats.alerts_generated} alerts "
            f"in {self.stats.elapsed_sec:.1f}s "
            f"({self.stats.packets_per_sec:.0f} pkt/s)"
        )
        return self.stats

    def replay_file(self, path: str | Path) -> ReplayStats:
        """Convenience: load then replay."""
        pkts = self.load(path)
        return self.replay(pkts)

    def cancel(self) -> None:
        """Signal the replay loop to stop."""
        self._cancel.set()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _process_flow(self, key: tuple, pkts: list) -> None:
        """Extract features and run detection on a single flow."""
        features = extract_flow_features(pkts)
        if features is None:
            return

        self.stats.total_flows += 1
        alerts = self.detector.analyze_flow(features)
        for alert in alerts:
            self.stats.alerts_generated += 1
            if self.on_alert:
                self.on_alert(alert)

    # ------------------------------------------------------------------
    # Convenience: demo replay from data/ directory
    # ------------------------------------------------------------------

    @staticmethod
    def find_pcaps(directory: str = "data") -> List[Path]:
        """Return all .pcap / .pcapng files in *directory*."""
        base = Path(directory)
        if not base.exists():
            return []
        return sorted(base.glob("**/*.pcap")) + sorted(base.glob("**/*.pcapng"))
