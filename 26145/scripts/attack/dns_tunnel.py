#!/usr/bin/env python3
"""
EKADHARA Attack Script — DNS Tunneling Simulator
PS-26145 | SIH 2026 Hackathon Prototype

Generates DNS queries with high-entropy subdomains, simulating
DGA (Domain Generation Algorithm) + DNS tunneling exfiltration.
Generates real DNS traffic detectable by the EKADHARA monitoring pipeline.

Usage:
    python dns_tunnel.py --target <dns_server> [--domain <domain>] [--count <num>] [--verbose]
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
# Constants
# ============================================================
BANNER = f"""{BOLD}{MAGENTA}
╔══════════════════════════════════════════════════╗
║   EKADHARA Attack Traffic Generator             ║
║   DNS Tunneling Simulator — PS-26145            ║
╚══════════════════════════════════════════════════╝{RESET}"""

LEGAL_WARNING = (
    f"\n{RED}{BOLD}[!] LEGAL WARNING:{RESET}\n"
    f"    This tool generates REAL DNS query packets.\n"
    f"    Only use against localhost (127.0.0.1) or IPs you OWN.\n"
    f"    Unauthorized DNS probing is ILLEGAL.\n"
)

# ============================================================
# Global stats
# ============================================================
stats = {'queries': 0, 'rate': 0.0, 'duration': 0.0}

# Query types that are suspicious for tunneling
TUNNEL_QUERY_TYPES = {
    0x0001: "A",      # Standard A record
    0x0010: "TXT",    # TXT records — common for tunneling
    0x000C: "NULL",   # NULL records — very suspicious
    0x00FF: "ANY",    # ANY query — reconnaissance
    0x000F: "MX",     # MX records
    0x0002: "NS",     # NS records
    0x0005: "CNAME",  # CNAME
}

TUNNEL_QTYPES = [0x0010, 0x000C, 0x00FF, 0x0001, 0x000F]


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
# DNS Message Builder
# ============================================================
def generate_dga_subdomain(length=32):
    """Generate a high-entropy random subdomain simulating DGA output."""
    # Mix of lowercase letters and digits for realistic DGA look
    chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    return ''.join(random.choice(chars) for _ in range(length))


def encode_domain_name(domain):
    """Encode a domain name into DNS wire format (length-prefixed labels)."""
    encoded = b''
    for part in domain.split('.'):
        encoded += struct.pack('!B', len(part)) + part.encode('ascii')
    encoded += b'\x00'  # Root label terminator
    return encoded


def build_dns_query(query_id, domain, qtype, qclass=0x0001):
    """
    Build a complete DNS query message.

    Args:
        query_id: 16-bit transaction ID
        domain: Domain name to query
        qtype: DNS query type (A=1, TXT=16, NULL=12, ANY=255)
        qclass: DNS class (1 = IN)
    """
    # ---- DNS Header (12 bytes) ----
    flags = 0x0100  # Standard query, recursion desired (RD=1)
    qdcount = 1
    ancount = 0
    nscount = 0
    arcount = 0

    header = struct.pack(
        "!HHHHHH",
        query_id, flags, qdcount, ancount, nscount, arcount
    )

    # ---- Question Section ----
    encoded_name = encode_domain_name(domain)
    question = encoded_name + struct.pack("!HH", qtype, qclass)

    # ---- Optional: Add EDNS(0) OPT record for longer payloads ----
    # This makes the query larger, simulating data exfiltration
    opt_name = b'\x00'  # Root domain for OPT
    opt_type = 41  # OPT
    udp_payload = 4096
    opt_z = 0
    opt_data = b''  # Can contain exfiltrated data

    additional = (
        opt_name
        + struct.pack("!HHH", opt_type, udp_payload, opt_z)
        + struct.pack('!B', len(opt_data)) + opt_data
    )

    return header + question + additional


def build_dns_response(query_id, domain):
    """Build a fake DNS response (simulating tunneling data in TXT records)."""
    flags = 0x8180  # Standard response, recursion available (QR=1)
    qdcount = 1
    ancount = 1
    nscount = 0
    arcount = 0

    header = struct.pack(
        "!HHHHHH",
        query_id, flags, qdcount, ancount, nscount, arcount
    )

    encoded_name = encode_domain_name(domain)

    # Answer section — TXT record with random data (simulating exfiltration)
    txt_data = bytes(random.randint(0, 255) for _ in range(random.randint(10, 100)))
    answer = (
        encoded_name
        + struct.pack("!HHHHH", 0x0005, 0x0001, 0, 0, len(txt_data) + 1)
        + struct.pack('!B', len(txt_data)) + txt_data
    )

    return header + encoded_name + struct.pack("!HH", 0x0010, 0x0001) + answer


# ============================================================
# DNS Tunneling Simulation
# ============================================================
def dns_tunnel_attack(target_ip, domain, count, stop_event, verbose):
    """
    Simulate DNS tunneling by sending high-entropy DNS queries.
    Uses multiple query types and varying subdomain lengths.
    """
    queries_sent = 0
    start_time = time.time()
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(2.0)

    last_display = start_time

    while not stop_event.is_set():
        if count > 0 and queries_sent >= count:
            break

        # Random query type (weighted toward TXT/NULL for tunneling)
        qtype = random.choices(
            TUNNEL_QTYPES,
            weights=[35, 25, 20, 15, 5],  # TXT most common for tunneling
            k=1
        )[0]

        query_id = random.randint(0, 65535)
        qtype_name = TUNNEL_QUERY_TYPES.get(qtype, f"TYPE{qtype}")

        # Generate tunneling subdomain with embedded data
        subdomain = generate_dga_subdomain(random.randint(16, 48))
        fqdn = f"{subdomain}.{domain}"

        # Build and send the query
        dns_msg = build_dns_query(query_id, fqdn, qtype)

        try:
            sock.sendto(dns_msg, (target_ip, 53))
            queries_sent += 1

            stats['queries'] = queries_sent
            elapsed = time.time() - start_time
            stats['duration'] = elapsed
            if elapsed > 0:
                stats['rate'] = queries_sent / elapsed

            if verbose:
                print(f"  {DIM}Query #{queries_sent}: {qtype_name} {subdomain[:24]}...{RESET}")

            # Simulate exfiltration "response" handling
            if random.random() < 0.3:  # 30% of queries get a response
                try:
                    resp, _ = sock.recvfrom(1024)
                    if verbose:
                        print(f"  {DIM}Response received for TXID 0x{query_id:04x}{RESET}")
                except socket.timeout:
                    pass

            # Small delay to avoid overwhelming
            time.sleep(random.uniform(0.01, 0.05))

        except Exception as e:
            if verbose:
                print(f"  {RED}Error: {e}{RESET}")

        # Display update every second
        now = time.time()
        if now - last_display >= 1.0:
            last_display = now

    sock.close()


# ============================================================
# Stats Display
# ============================================================
def display_stats(stop_event, domain):
    """Periodic stats display thread."""
    while not stop_event.is_set():
        time.sleep(1.0)
        q = stats['queries']
        rate = stats['rate']
        dur = stats['duration']

        dom_str = f"{BOLD}{GREEN}{domain}{RESET}"
        q_str = f"{BOLD}{WHITE}{q}{RESET}"
        rate_str = f"{BOLD}{CYAN}{rate:.1f}{RESET}"

        print(
            f"\r{BOLD}[DNS TUNNEL]{RESET} Domain: {dom_str} | "
            f"Queries: {q_str} | Rate: {rate_str} qps | "
            f"Duration: {BOLD}{YELLOW}{dur:.1f}s{RESET}   ",
            end="",
            flush=True
        )


# ============================================================
# Main Entry Point
# ============================================================
def run_attack(**kwargs):
    """
    Main entry point for the DNS tunneling attack.

    Accepts kwargs dict with keys:
        target (str): Target DNS server IP
        domain (str): Domain to use for queries
        count (int): Number of queries (0 = unlimited)
        verbose (bool): Enable verbose output
    """
    target = kwargs.get('target', '127.0.0.1')
    domain = kwargs.get('domain', 'example.com')
    count = kwargs.get('count', 0)
    verbose = kwargs.get('verbose', False)

    print(BANNER)
    print(LEGAL_WARNING)

    warn_external_target(target)

    print(f"\n{BOLD}[*] DNS Server:{RESET} {target}:53")
    print(f"{BOLD}[*] Domain:{RESET}     {domain}")
    print(f"{BOLD}[*] Count:{RESET}      {'Unlimited' if count == 0 else count}")
    print(f"{BOLD}[*] Modes:{RESET}      TXT, NULL, ANY, A, MX")
    print(f"{BOLD}[*] Start:{RESET}      {datetime.now().strftime('%H:%M:%S')}")
    print(f"\n{BOLD}{RED}Press Ctrl+C to stop.{RESET}\n")

    stop_event = threading.Event()
    start_time = time.time()

    # Stats display
    stats_thread = threading.Thread(
        target=display_stats,
        args=(stop_event, domain),
        daemon=True
    )
    stats_thread.start()

    # Attack
    attack_thread = threading.Thread(
        target=dns_tunnel_attack,
        args=(target, domain, count, stop_event, verbose),
        daemon=True
    )
    attack_thread.start()

    try:
        while attack_thread.is_alive():
            attack_thread.join(timeout=1)
    except KeyboardInterrupt:
        print(f"\n\n{BOLD}{YELLOW}[*] Stopping DNS tunnel...{RESET}")
        stop_event.set()
        attack_thread.join(timeout=2)

    # Summary
    elapsed = time.time() - start_time
    print(f"\n\n{BOLD}{GREEN}{'='*50}{RESET}")
    print(f"{BOLD}{GREEN}  DNS TUNNEL SUMMARY{RESET}")
    print(f"{BOLD}{GREEN}{'='*50}{RESET}")
    print(f"  DNS Server:      {target}:53")
    print(f"  Domain:          {domain}")
    print(f"  Queries sent:    {stats['queries']}")
    print(f"  Avg rate:        {stats['rate']:.1f} qps" if elapsed > 0 else "  Avg rate:        N/A")
    print(f"  Duration:        {elapsed:.1f}s")
    print(f"{BOLD}{GREEN}{'='*50}{RESET}")


# ============================================================
# CLI
# ============================================================
def main():
    parser = argparse.ArgumentParser(
        description="EKADHARA DNS Tunneling Simulator — PS-26145",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python dns_tunnel.py --target 127.0.0.1 --domain example.com
  python dns_tunnel.py --target 127.0.0.1 --domain evil.tk --count 1000
  python dns_tunnel.py --target 127.0.0.1 --domain c2.bot --verbose
        """
    )
    parser.add_argument('--target', required=True, help='DNS server IP address')
    parser.add_argument('--domain', default='example.com', help='Domain for queries (default: example.com)')
    parser.add_argument('--count', type=int, default=0, help='Number of queries (0=unlimited)')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose output')

    args = parser.parse_args()
    run_attack(
        target=args.target,
        domain=args.domain,
        count=args.count,
        verbose=args.verbose
    )


if __name__ == '__main__':
    main()
