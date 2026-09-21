#!/usr/bin/env python3
"""
EKADHARA Attack Script — Port Scanner
PS-26145 | SIH 2026 Hackathon Prototype

Scans target ports using SYN or connect probes.
Generates real port scan traffic detectable by the EKADHARA monitoring pipeline.

Usage:
    python port_scan.py --target <ip> [--ports <range>] [--speed <fast|normal|slow>] [--verbose]
"""

import argparse
import ipaddress
import socket
import struct
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
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
║   Port Scanner — PS-26145 | SIH 2026            ║
╚══════════════════════════════════════════════════╝{RESET}"""

LEGAL_WARNING = (
    f"\n{RED}{BOLD}[!] LEGAL WARNING:{RESET}\n"
    f"    This tool performs REAL port scanning.\n"
    f"    Only use against localhost (127.0.0.1) or IPs you OWN.\n"
    f"    Unauthorized port scanning is ILLEGAL.{RESET}\n"
)

# ============================================================
# Global state
# ============================================================
scan_stats = {
    'scanned': 0,
    'open': 0,
    'closed': 0,
    'filtered': 0,
    'total': 0,
    'start_time': 0,
    'running': False,
    'open_ports': [],
}


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
# Port Scanning Functions
# ============================================================
def parse_port_range(port_range_str):
    """Parse port range string like '80', '80-100', '80,443,8080', or '1-1024'."""
    ports = set()
    for part in port_range_str.split(','):
        part = part.strip()
        if '-' in part:
            start, end = part.split('-', 1)
            start, end = int(start), int(end)
            ports.update(range(max(1, start), min(65535, end) + 1))
        else:
            ports.add(int(part))
    return sorted(ports)


COMMON_PORTS = {
    21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
    80: "HTTP", 110: "POP3", 143: "IMAP", 443: "HTTPS", 445: "SMB",
    465: "SMTPS", 993: "IMAPS", 995: "POP3S", 1433: "MSSQL",
    1521: "Oracle", 3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL",
    5900: "VNC", 6379: "Redis", 8000: "HTTP-ALT", 8080: "HTTP-PROXY",
    8443: "HTTPS-ALT", 27017: "MongoDB"
}


def syn_scan_port(target_ip, port, timeout=1.0):
    """
    Attempt a TCP SYN scan on a single port.
    Returns: ('open', port, service) | ('closed', port, None) | ('filtered', port, None)
    """
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((target_ip, port))
        sock.close()

        if result == 0:
            service = COMMON_PORTS.get(port, "unknown")
            return ('open', port, service)
        elif result == 10061:  # Connection refused (Windows)
            return ('closed', port, None)
        elif result == 111:  # Connection refused (Linux)
            return ('closed', port, None)
        else:
            return ('filtered', port, None)
    except socket.timeout:
        return ('filtered', port, None)
    except Exception:
        return ('filtered', port, None)


def scan_worker(target_ip, ports, timeout, speed_label):
    """Worker function for scanning ports in a thread pool."""
    results = []
    for port in ports:
        if not scan_stats['running']:
            break
        result = syn_scan_port(target_ip, port, timeout)
        results.append(result)

        with threading.Lock():
            scan_stats['scanned'] += 1
            status, p, svc = result
            if status == 'open':
                scan_stats['open'] += 1
                scan_stats['open_ports'].append((p, svc))
            elif status == 'closed':
                scan_stats['closed'] += 1
            else:
                scan_stats['filtered'] += 1

    return results


# ============================================================
# Stats Display
# ============================================================
def display_progress(stop_event, target_ip, total_ports):
    """Display real-time scanning progress."""
    while not stop_event.is_set():
        time.sleep(0.5)
        s = scan_stats
        pct = (s['scanned'] / total_ports * 100) if total_ports > 0 else 0
        elapsed = time.time() - s['start_time'] if s['start_time'] > 0 else 0
        rate = s['scanned'] / elapsed if elapsed > 0 else 0
        eta = (total_ports - s['scanned']) / rate if rate > 0 else 0

        tgt_str = f"{BOLD}{GREEN}{target_ip}{RESET}"
        sc_str = f"{BOLD}{WHITE}{s['scanned']}{RESET}/{BOLD}{WHITE}{total_ports}{RESET}"
        pct_str = f"{BOLD}{CYAN}{pct:.1f}%{RESET}"
        rate_str = f"{BOLD}{YELLOW}{rate:.0f}{RESET}"
        open_str = f"{BOLD}{GREEN}{s['open']}{RESET}"

        print(
            f"\r{BOLD}[SCAN]{RESET} {tgt_str} | "
            f"Scanned: {sc_str} ({pct_str}) | "
            f"Rate: {rate_str} p/s | "
            f"Open: {open_str} | ETA: {BOLD}{YELLOW}{eta:.0f}s{RESET}   ",
            end="",
            flush=True
        )


# ============================================================
# Main Entry Point
# ============================================================
def run_attack(**kwargs):
    """
    Main entry point for the port scanner.

    Accepts kwargs dict with keys:
        target (str): Target IP address
        ports (str): Port range string (e.g., '1-1024', '80,443,8080')
        speed (str): Scan speed 'fast', 'normal', or 'slow'
        verbose (bool): Enable verbose output
    """
    target = kwargs.get('target', '127.0.0.1')
    ports_str = kwargs.get('ports', '1-1024')
    speed = kwargs.get('speed', 'normal')
    verbose = kwargs.get('verbose', False)

    print(BANNER)
    print(LEGAL_WARNING)

    warn_external_target(target)

    # Parse speed settings
    speed_config = {
        'fast': {'workers': 100, 'timeout': 0.5},
        'normal': {'workers': 20, 'timeout': 1.0},
        'slow': {'workers': 5, 'timeout': 2.0},
    }
    config = speed_config.get(speed, speed_config['normal'])

    # Parse ports
    ports = parse_port_range(ports_str)
    if not ports:
        print(f"{RED}[ERROR] No valid ports specified.{RESET}")
        return

    total_ports = len(ports)
    scan_stats['total'] = total_ports
    scan_stats['running'] = True
    scan_stats['start_time'] = time.time()

    print(f"\n{BOLD}[*] Target:{RESET}    {target}")
    print(f"{BOLD}[*] Ports:{RESET}     {total_ports} ports ({ports[0]}-{ports[-1]})")
    print(f"{BOLD}[*] Speed:{RESET}     {speed} ({config['workers']} workers, {config['timeout']}s timeout)")
    print(f"{BOLD}[*] Start:{RESET}     {datetime.now().strftime('%H:%M:%S')}")
    print(f"\n{BOLD}{RED}Press Ctrl+C to stop.{RESET}\n")

    stop_event = threading.Event()

    # Progress display
    progress_thread = threading.Thread(
        target=display_progress,
        args=(stop_event, target, total_ports),
        daemon=True
    )
    progress_thread.start()

    # Split ports into chunks for workers
    chunk_size = max(1, total_ports // config['workers'])
    port_chunks = [ports[i:i + chunk_size] for i in range(0, total_ports, chunk_size)]

    try:
        with ThreadPoolExecutor(max_workers=config['workers']) as executor:
            futures = {
                executor.submit(scan_worker, target, chunk, config['timeout'], speed): chunk
                for chunk in port_chunks
            }
            for future in as_completed(futures):
                try:
                    future.result()
                except Exception as e:
                    if verbose:
                        print(f"\n{RED}Worker error: {e}{RESET}")

    except KeyboardInterrupt:
        print(f"\n\n{BOLD}{YELLOW}[*] Stopping scan...{RESET}")
        scan_stats['running'] = False

    scan_stats['running'] = False
    time.sleep(0.5)

    # Results
    s = scan_stats
    elapsed = time.time() - s['start_time']

    print(f"\n\n{BOLD}{GREEN}{'='*60}{RESET}")
    print(f"{BOLD}{GREEN}  PORT SCAN RESULTS{RESET}")
    print(f"{BOLD}{GREEN}{'='*60}{RESET}")
    print(f"  Target:          {target}")
    print(f"  Ports scanned:   {s['scanned']}/{total_ports}")
    print(f"  Open ports:      {BOLD}{GREEN}{s['open']}{RESET}")
    print(f"  Closed ports:    {s['closed']}")
    print(f"  Filtered:        {s['filtered']}")
    print(f"  Duration:        {elapsed:.1f}s")

    if s['open_ports']:
        print(f"\n  {BOLD}{GREEN}Open Ports:{RESET}")
        print(f"  {'Port':<10} {'Service':<20} {'State'}")
        print(f"  {'-'*45}")
        for port, service in sorted(s['open_ports']):
            print(f"  {BOLD}{GREEN}{port:<10}{RESET} {service:<20} {GREEN}open{RESET}")
    else:
        print(f"\n  {YELLOW}No open ports found.{RESET}")

    print(f"{BOLD}{GREEN}{'='*60}{RESET}")


# ============================================================
# CLI
# ============================================================
def main():
    parser = argparse.ArgumentParser(
        description="EKADHARA Port Scanner — PS-26145",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python port_scan.py --target 127.0.0.1
  python port_scan.py --target 127.0.0.1 --ports 1-1024 --speed fast
  python port_scan.py --target 127.0.0.1 --ports 80,443,8080 --speed slow
  python port_scan.py --target 127.0.0.1 --ports 3389,5900 --verbose
        """
    )
    parser.add_argument('--target', required=True, help='Target IP address')
    parser.add_argument('--ports', default='1-1024', help='Port range (default: 1-1024)')
    parser.add_argument(
        '--speed', choices=['fast', 'normal', 'slow'], default='normal',
        help='Scan speed: fast (100 workers), normal (20), slow (5)'
    )
    parser.add_argument('--verbose', action='store_true', help='Enable verbose output')

    args = parser.parse_args()
    run_attack(
        target=args.target,
        ports=args.ports,
        speed=args.speed,
        verbose=args.verbose
    )


if __name__ == '__main__':
    main()
