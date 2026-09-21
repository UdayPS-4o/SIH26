"""Port scanner — scans target ports."""
import argparse
import ipaddress
import socket
import string
import struct
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Optional, Tuple

# ── ANSI Colors ─────────────────────────────────────────────────────────────
class Color:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"

def banner():
    print(f"""{Color.BOLD}{Color.CYAN}
╔══════════════════════════════════════════╗
║  [EKADHARA] Port Scanner — PS-26145     ║
╚══════════════════════════════════════════╝{Color.RESET}""")

def is_private(target: str) -> bool:
    try:
        addr = ipaddress.ip_address(target)
        return addr.is_private or addr.is_loopback
    except ValueError:
        try:
            addr = socket.gethostbyname(target)
            return ipaddress.ip_address(addr).is_private or ipaddress.ip_address(addr).is_loopback
        except socket.gaierror:
            return False

def safety_check(target: str):
    if not is_private(target):
        print(f"{Color.YELLOW}[!] WARNING: Target {target} is NOT a private/local IP!{Color.RESET}")
        print(f"{Color.YELLOW}[!] Only scan systems you own or have explicit permission to test.{Color.RESET}")
        confirm = input(f"{Color.YELLOW}[?] Type 'YES' to continue: {Color.RESET}")
        if confirm != "YES":
            print(f"{Color.RED}[!] Aborted.{Color.RESET}")
            sys.exit(0)
        print(f"{Color.GREEN}[*] Proceeding with external target...{Color.RESET}")

def parse_ports(port_spec: str) -> List[int]:
    """Parse port specification: '80', '22-100', '80,443,8080', 'common'."""
    if port_spec.lower() == "common":
        return [21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443,
                445, 993, 995, 1723, 3306, 3389, 5432, 5900, 8000, 8080, 8443, 8888]
    ports = set()
    for part in port_spec.split(","):
        part = part.strip()
        if "-" in part:
            start, end = part.split("-", 1)
            ports.update(range(int(start), int(end) + 1))
        else:
            ports.add(int(part))
    return sorted(ports)

def get_service_name(port: int, proto: str = "tcp") -> str:
    """Get common service name for a port."""
    services = {
        21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
        80: "HTTP", 110: "POP3", 111: "RPC", 135: "MSRPC", 139: "NetBIOS",
        143: "IMAP", 443: "HTTPS", 445: "SMB", 993: "IMAPS", 995: "POP3S",
        1723: "PPTP", 3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL",
        5900: "VNC", 8000: "HTTP-Alt", 8080: "HTTP-Proxy", 8443: "HTTPS-Alt",
        8888: "HTTP-Alt2", 27017: "MongoDB", 6379: "Redis"
    }
    return services.get(port, "")

# ── Scan Methods ────────────────────────────────────────────────────────────

def tcp_connect_scan(target_ip: str, port: int, timeout: float) -> Tuple[int, str]:
    """TCP connect scan — uses OS connect()."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((target_ip, port))
        sock.close()
        if result == 0:
            return port, "open"
        elif result in (61, 111):  # ECONNREFUSED
            return port, "closed"
        else:
            return port, "filtered"
    except socket.timeout:
        return port, "filtered"
    except Exception:
        return port, "filtered"

def syn_scan_socket(target_ip: str, port: int, timeout: float) -> Tuple[int, str]:
    """
    Attempt a SYN scan via raw socket (requires root/Administrator).
    Falls back to connect scan if raw socket unavailable.
    """
    try:
        # Try raw socket for SYN scan
        sock = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_TCP)
        sock.settimeout(timeout)
        sock.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)
    except PermissionError:
        return tcp_connect_scan(target_ip, port, timeout)

    try:
        src_port = random.randint(1024, 65535)
        seq = random.randint(0, 0xFFFFFFFF)
        window = random.randint(1024, 65535)

        # IP header
        saddr = socket.inet_aton("10.0.1.100")
        daddr = socket.inet_aton(target_ip)
        ip_header = struct.pack("!BBHHHBBH4s4s",
            69, 0, 40, random.randint(1, 65535), 0, 64,
            socket.IPPROTO_TCP, 0, saddr, daddr)

        # TCP header (SYN flag = 0x02)
        tcp_header = struct.pack("!HHLLBBHHH",
            src_port, port, seq, 0, 5 << 4, 0x02, window, 0, 0)

        # TCP checksum
        psh = saddr + daddr + struct.pack("!BBH", 0, socket.IPPROTO_TCP, len(tcp_header))
        tcp_checksum = _checksum(psh + tcp_header)
        tcp_header = struct.pack("!HHLLBBHHH",
            src_port, port, seq, 0, 5 << 4, 0x02, window, tcp_checksum, 0)

        sock.sendto(ip_header + tcp_header, (target_ip, 0))

        # Try to receive response
        data, _ = sock.recvfrom(1024)
        # If we get here, the port is likely open (responded with SYN+ACK)
        return port, "open"
    except socket.timeout:
        return port, "filtered"
    except Exception:
        return port, "filtered"
    finally:
        sock.close()

def _checksum(data: bytes) -> int:
    if len(data) % 2:
        data += b'\x00'
    s = sum(struct.unpack(f'!{len(data)//2}H', data))
    s = (s >> 16) + (s & 0xFFFF)
    s += s >> 16
    return (~s) & 0xFFFF

# ── Scan Orchestrator ───────────────────────────────────────────────────────

def run_port_scan(target_ip: str, ports: List[int], speed: str, method: str,
                   timeout: float, stats: dict, results: dict):
    """Run the port scan with controlled concurrency."""
    speed_workers = {"slow": 5, "normal": 20, "fast": 100}
    workers = speed_workers.get(speed, 20)
    scanned = 0
    open_ports = []
    closed_ports = []

    scan_func = syn_scan_socket if method == "syn" else tcp_connect_scan

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(scan_func, target_ip, p, timeout): p for p in ports}

        for future in as_completed(futures):
            port, status = future.result()
            scanned += 1

            if status == "open":
                open_ports.append(port)
                svc = get_service_name(port)
                print(f"  {Color.GREEN}[OPEN]{Color.RESET}   Port {port:>5}  {Color.CYAN}{svc:>15}{Color.RESET}")
            elif status == "closed":
                closed_ports.append(port)

            stats["scanned"] = scanned
            stats["open"] = len(open_ports)
            stats["total"] = len(ports)

    results["open"] = sorted(open_ports)
    results["closed"] = sorted(closed_ports)


def run_attack(target: str, ports: str = "common", speed: str = "normal",
               method: str = "connect", timeout: float = 2.0, **kwargs):
    """
    Run a port scan on the target.

    Args:
        target:    Target IP or hostname
        ports:     Port specification (default: common well-known ports)
        speed:     Scan speed: slow, normal, fast
        method:    Scan method: connect (default), syn
        timeout:   Per-port timeout in seconds (default: 2.0)
    """
    banner()
    parsed_ports = parse_ports(ports)
    print(f"{Color.BLUE}[*] Target: {target}{Color.RESET}")
    print(f"{Color.BLUE}[*] Ports: {len(parsed_ports)} ({parsed_ports[0]}-{parsed_ports[-1]}){Color.RESET}")
    print(f"{Color.BLUE}[*] Method: {method} | Speed: {speed} | Timeout: {timeout}s{Color.RESET}")

    safety_check(target)

    try:
        target_ip = socket.gethostbyname(target)
    except socket.gaierror:
        print(f"{Color.RED}[!] Could not resolve {target}{Color.RESET}")
        return None, {}

    print(f"{Color.GREEN}[+] Resolved {target} -> {target_ip}{Color.RESET}\n")

    print(f"{Color.CYAN}{'─'*55}{Color.RESET}")
    print(f"  {Color.WHITE}{'Port':>10}  {'Status':>12}  {'Service':>20}{Color.RESET}")
    print(f"{Color.CYAN}{'─'*55}{Color.RESET}")

    stats = {"scanned": 0, "open": 0, "total": len(parsed_ports)}
    results = {"open": [], "closed": []}

    t = threading.Thread(target=run_port_scan,
                         args=(target_ip, parsed_ports, speed, method, timeout, stats, results),
                         daemon=True)
    t.start()
    return t, stats


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Port Scanner — EKADHARA PS-26145")
    parser.add_argument("--target", required=True, help="Target IP or hostname")
    parser.add_argument("--ports", default="common",
                        help="Ports to scan: 'common', '80', '1-1000', '22,80,443' (default: common)")
    parser.add_argument("--speed", choices=["slow", "normal", "fast"], default="normal",
                        help="Scan speed/concurrency (default: normal)")
    parser.add_argument("--method", choices=["connect", "syn"], default="connect",
                        help="Scan method (default: connect)")
    parser.add_argument("--timeout", type=float, default=2.0, help="Per-port timeout in seconds (default: 2.0)")
    args = parser.parse_args()

    banner()
    t, stats = run_attack(args.target, args.ports, args.speed, args.method, args.timeout)

    try:
        while t.is_alive():
            print(f"\r{Color.DIM}  Scanning: {stats['scanned']}/{stats['total']} ports...{Color.RESET}", end="", flush=True)
            time.sleep(0.3)
    except KeyboardInterrupt:
        pass

    t.join(timeout=5)
    print(f"\n\n{Color.GREEN}[+] Scan complete.{Color.RESET}")
    print(f"  {Color.WHITE}Open ports: {stats['open']}{Color.RESET}")
    print(f"  {Color.DIM}Scanned: {stats['scanned']}/{stats['total']}{Color.RESET}")
