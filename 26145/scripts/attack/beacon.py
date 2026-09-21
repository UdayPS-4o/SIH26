"""C2 Beaconing simulator — periodic TCP connections."""
import argparse
import ipaddress
import os
import random
import socket
import ssl
import sys
import threading
import time
from typing import Optional

try:
    from scapy.all import IP, TCP, RandShort, send, conf
    from scapy.layers.inet import IP as SC_IP, TCP as SC_TCP
    SCAPY_AVAILABLE = True
    conf.verb = 0
except ImportError:
    SCAPY_AVAILABLE = False

# ── ANSI Colors ─────────────────────────────────────────────────────────────
class Color:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"

def banner():
    print(f"""{Color.BOLD}{Color.MAGENTA}
╔══════════════════════════════════════════╗
║  [EKADHARA] C2 Beaconing — PS-26145     ║
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
        print(f"{Color.YELLOW}[!] Only run against systems you own or have explicit permission to test.{Color.RESET}")
        confirm = input(f"{Color.YELLOW}[?] Type 'YES' to continue: {Color.RESET}")
        if confirm != "YES":
            print(f"{Color.RED}[!] Aborted.{Color.RESET}")
            sys.exit(0)
        print(f"{Color.GREEN}[*] Proceeding with external target...{Color.RESET}")

def generate_beacon_payload(beacon_id: int, target: str) -> bytes:
    """Generate a realistic-looking C2 beacon payload."""
    # Simulates a small HTTP-like beacon check-in
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)",
        "curl/7.68.0",
    ]
    ua = user_agents[beacon_id % len(user_agents)]
    paths = ["/check", "/ping", "/status", "/heartbeat", "/wp-content", "/api/v1/health"]
    path = paths[beacon_id % len(paths)]

    payload = (
        f"GET {path}?id={beacon_id:04x}&t={int(time.time())} HTTP/1.1\r\n"
        f"Host: {target}\r\n"
        f"User-Agent: {ua}\r\n"
        f"Connection: keep-alive\r\n"
        f"\r\n"
    ).encode()
    return payload

def beacon_socket(target_ip: str, port: int, beacon_id: int, timeout: float) -> bool:
    """Send a single beacon and try to receive response."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect((target_ip, port))

        payload = generate_beacon_payload(beacon_id, target)
        sock.sendall(payload)

        try:
            response = sock.recv(4096)
            return bool(response)
        except socket.timeout:
            return False
    except (ConnectionRefusedError, socket.timeout, OSError):
        return False
    finally:
        try:
            sock.close()
        except Exception:
            pass

def beacon_thread(target_ip: str, port: int, interval: float, jitter: float,
                  count: int, timeout: float, stop_event: threading.Event, stats: dict):
    """Run the beaconing loop."""
    beacon_id = random.randint(1000, 9999)
    connections = 0
    start = time.time()

    print(f"{Color.GREEN}[+] Beacon #{beacon_id} started{Color.RESET}")
    print(f"{Color.BLUE}[*] Interval: {interval:.1f}s ± {jitter*100:.0f}% jitter{Color.RESET}")

    while not stop_event.is_set() and (count == 0 or connections < count):
        # Apply jitter
        jitter_amount = interval * jitter * (2 * random.random() - 1)
        sleep_time = max(0.5, interval + jitter_amount)

        connected = beacon_socket(target_ip, port, beacon_id, timeout)
        connections += 1
        stats["beacons"] = connections
        elapsed = time.time() - start
        if elapsed > 0:
            stats["rate"] = connections / elapsed
        stats["last_jitter"] = jitter_amount

        status = f"{Color.GREEN}OK{Color.RESET}" if connected else f"{Color.YELLOW}TIMEOUT{Color.RESET}"
        print(f"  [{Color.CYAN}#{beacon_id}{Color.RESET}] Beacon #{connections}: {status} "
              f"(interval: {sleep_time:.2f}s)")
        time.sleep(sleep_time)

def run_attack(target: str, port: int = 8080, interval: float = 10.0,
               jitter: float = 0.3, count: int = 0, timeout: float = 5.0, **kwargs):
    """
    Run C2 beaconing simulation.

    Args:
        target:   C2 server IP or hostname
        port:     C2 server port (default: 8080)
        interval: Beacon interval in seconds (default: 10)
        jitter:   Jitter percentage 0.0-1.0 (default: 0.3 = 30%)
        count:    Number of beacons (0 = unlimited)
        timeout:  Connection timeout in seconds (default: 5.0)
    """
    banner()
    print(f"{Color.BLUE}[*] Target: {target}:{port}{Color.RESET}")
    print(f"{Color.BLUE}[*] Interval: {interval}s ± {int(jitter*100)}% jitter{Color.RESET}")
    print(f"{Color.BLUE}[*] Beacons: {'Unlimited' if count == 0 else count}{Color.RESET}")
    print(f"{Color.MAGENTA}[*] Simulating: C2 phone-home beaconing with jitter{Color.RESET}")

    safety_check(target)

    try:
        target_ip = socket.gethostbyname(target)
    except socket.gaierror:
        print(f"{Color.RED}[!] Could not resolve {target}{Color.RESET}")
        return None, {}

    print(f"{Color.GREEN}[+] Resolved {target} -> {target_ip}{Color.RESET}\n")

    stats = {"beacons": 0, "rate": 0.0, "last_jitter": 0.0}
    stop_event = threading.Event()
    stats["stop_event"] = stop_event

    t = threading.Thread(
        target=beacon_thread,
        args=(target_ip, port, interval, jitter, count, timeout, stop_event, stats),
        daemon=True
    )
    t.start()
    return t, stats


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="C2 Beaconing Simulator — EKADHARA PS-26145")
    parser.add_argument("--target", required=True, help="Target C2 IP or hostname")
    parser.add_argument("--port", type=int, default=8080, help="Target port (default: 8080)")
    parser.add_argument("--interval", type=float, default=10.0, help="Beacon interval in seconds (default: 10)")
    parser.add_argument("--jitter", type=float, default=0.3, help="Jitter percentage 0.0-1.0 (default: 0.3)")
    parser.add_argument("--count", type=int, default=0, help="Number of beacons (0=unlimited)")
    parser.add_argument("--timeout", type=float, default=5.0, help="Connection timeout in seconds (default: 5.0)")
    args = parser.parse_args()

    banner()
    t, stats = run_attack(args.target, args.port, args.interval, args.jitter, args.count, args.timeout)

    print(f"\n{Color.GREEN}[+] Beaconing active — Press Ctrl+C to stop{Color.RESET}")
    print(f"{Color.CYAN}{'─'*60}{Color.RESET}")
    print(f"  {'Beacons':>10}  {'Rate':>10}  {'Last Jitter':>12}  {'Status':>20}")
    print(f"{Color.CYAN}{'─'*60}{Color.RESET}")

    try:
        while t.is_alive():
            jitter_str = f"±{stats['last_jitter']:.2f}s"
            print(f"\r  {Color.GREEN}{stats['beacons']:>10,}{Color.RESET}  "
                  f"{Color.YELLOW}{stats['rate']:>9.2f}/m{Color.RESET}  "
                  f"{Color.CYAN}{jitter_str:>12}{Color.RESET}  "
                  f"{'Beaconing...':>20}", end="", flush=True)
            time.sleep(0.5)
    except KeyboardInterrupt:
        print(f"\n\n{Color.YELLOW}[!] Stopping beacons...{Color.RESET}")
        if "stop_event" in stats:
            stats["stop_event"].set()
        t.join(timeout=3)
        print(f"{Color.GREEN}[+] Sent {stats['beacons']} beacons total.{Color.RESET}")
