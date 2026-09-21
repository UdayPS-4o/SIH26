"""DNS Tunneling / DGA simulator — sends high-entropy DNS queries."""
import argparse
import ipaddress
import random
import re
import socket
import string
import sys
import threading
import time
from typing import List, Optional

try:
    from scapy.all import IP, UDP, DNS, DNSQR, send, RandShort, conf
    from scapy.layers.inet import IP as SC_IP, UDP as SC_UDP
    from scapy.layers.dns import DNS as SC_DNS, DNSQR as SC_DNSQR
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
    RESET = "\033[0m"
    BOLD = "\033[1m"

def banner():
    print(f"""{Color.BOLD}{Color.MAGENTA}
╔══════════════════════════════════════════╗
║  [EKADHARA] DNS Tunneling — PS-26145    ║
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

# ── DGA / Domain Generators ────────────────────────────────────────────────

def generate_dga_domain(length: int, tld: str = ".com") -> str:
    """Generate a random high-entropy domain (Domain Generation Algorithm)."""
    chars = string.ascii_lowercase + string.digits
    subdomain = ''.join(random.choices(chars, k=random.randint(5, min(length, 30))))
    return f"{subdomain}{tld}"

def generate_tunnel_domain(query: str, base: str = "tunnel.local") -> str:
    """Encode data into a subdomain (simulates DNS tunneling)."""
    encoded = base64_encode_truncated(query)
    return f"{encoded}.{base}"

def base64_encode_truncated(data: str) -> str:
    """Base64-ish encoding truncated for domain name use."""
    import base64
    encoded = base64.b64encode(data.encode()).decode('ascii')
    # Keep it URL-safe and truncate
    encoded = encoded.replace('+', '-').replace('/', '_').rstrip('=')
    return encoded[:random.randint(10, 40)]

def generate_txt_tunnel_domain(data: str, base: str = "exfil.local") -> str:
    """Generate a domain carrying data in subdomain for TXT exfiltration."""
    encoded = ''.join(f"{ord(c):02x}" for c in data)
    return f"{encoded[:random.randint(10, 30)]}.{base}"

# ── Query Generators ────────────────────────────────────────────────────────

def generate_dga_queries(count: int, base_domain: str = "dga-sim.local") -> List[str]:
    """Generate DGA-style DNS queries."""
    queries = []
    tlds = [".com", ".net", ".org", ".xyz", ".top", ".tk", ".ga", ".ml", ".cf"]
    record_types = ["A", "AAAA", "TXT", "NULL", "MX"]

    for i in range(count):
        if random.random() < 0.3:
            # Domain tunneling encoding
            tld = random.choice(tlds)
            domain = generate_dga_domain(random.randint(8, 30), tld)
            rtype = random.choice(["TXT", "NULL", "A"])
            queries.append((domain, rtype))
        elif random.random() < 0.5:
            # Pure DGA domains
            tld = random.choice(tlds[:4])
            domain = generate_dga_domain(random.randint(8, 25), tld)
            queries.append((domain, "A"))
        else:
            # DNS tunneling — data in subdomain
            payload_chars = ''.join(random.choices(string.ascii_letters + string.digits, k=random.randint(4, 16)))
            encoded = base64_encode_truncated(payload_chars)
            queries.append((f"{encoded}.{base_domain}", random.choice(["TXT", "AAAA", "NULL"])))

    return queries

# ── Attack Backends ─────────────────────────────────────────────────────────

def run_scapy_dns(target_ip: str, queries: List[tuple], stop_event: threading.Event, stats: dict):
    """Send DNS queries using scapy."""
    sent = 0
    start = time.time()
    print(f"{Color.GREEN}[+] Scapy DNS mode active{Color.RESET}")

    query_types = {"A": "A", "AAAA": "AAAA", "TXT": "TXT", "NULL": "ALL", "MX": "MX"}
    idx = 0

    while not stop_event.is_set():
        batch_size = min(len(queries) - idx if idx < len(queries) else len(queries), 20)
        if batch_size <= 0:
            queries.extend(generate_dga_queries(50))
            batch_size = 20
            idx = 0

        packets = []
        for _ in range(batch_size):
            domain, rtype = queries[idx % len(queries)]
            idx += 1
            sport = random.randint(1024, 65535)
            pkt = (IP(src=f"10.0.{random.randint(0,255)}.{random.randint(1,254)}", dst=target_ip)
                   / UDP(sport=sport, dport=53)
                   / DNS(rd=1, qd=DNSQR(qname=domain, qtype=query_types.get(rtype, "A"))))
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
        time.sleep(0.3)


def run_socket_dns(target_ip: str, queries: List[tuple], stop_event: threading.Event, stats: dict):
    """Send DNS queries using raw UDP sockets (without scapy)."""
    def build_dns_query(domain: str, qtype: int = 1) -> bytes:
        """Build a raw DNS query packet."""
        tid = random.randint(0, 0xFFFF)
        flags = 0x0100  # Standard query, recursion desired
        qdcount = 1
        ancount = 0
        nscount = 0
        arcount = 0

        header = struct.pack('!HHHHHH', tid, flags, qdcount, ancount, nscount, arcount)

        # Encode domain name
        qname = b''
        for part in domain.split('.'):
            qname += struct.pack('!B', len(part)) + part.encode()
        qname += b'\x00'

        qtype_val = qtype  # 1=A, 28=AAAA, 16=TXT
        qclass = 1  # IN
        question = qname + struct.pack('!HH', qtype_val, qclass)

        return header + question

    qtype_map = {"A": 1, "AAAA": 28, "TXT": 16, "NULL": 10, "MX": 15}
    sent = 0
    start = time.time()
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(2.0)
    print(f"{Color.GREEN}[+] Socket DNS mode active{Color.RESET}")
    idx = 0

    while not stop_event.is_set():
        batch_size = 20
        for _ in range(batch_size):
            domain, rtype = queries[idx % len(queries)]
            idx += 1
            qtype = qtype_map.get(rtype, 1)
            pkt = build_dns_query(domain, qtype)
            try:
                sock.sendto(pkt, (target_ip, 53))
                sent += 1
            except Exception:
                pass

        stats["sent"] = sent
        elapsed = time.time() - start
        if elapsed > 0:
            stats["rate"] = sent / elapsed
        time.sleep(0.3)

        if idx >= len(queries):
            queries.extend(generate_dga_queries(50))
            idx = 0

    sock.close()


def attack_thread(target_ip: str, count: int, stats: dict):
    stop_event = threading.Event()
    stats["stop_event"] = stop_event
    queries = generate_dga_queries(count if count > 0 else 100)

    if SCAPY_AVAILABLE:
        run_scapy_dns(target_ip, queries, stop_event, stats)
    else:
        run_socket_dns(target_ip, queries, stop_event, stats)


def run_attack(target: str, count: int = 100, **kwargs):
    """
    Launch DNS tunneling / DGA simulation.

    Args:
        target: DNS server IP or hostname
        count:  Number of unique queries to cycle through (default 100)
    """
    banner()
    print(f"{Color.BLUE}[*] Target DNS: {target}:53{Color.RESET}")
    print(f"{Color.BLUE}[*] Query count: {count if count > 0 else 'Continuous'}{Color.RESET}")
    print(f"{Color.BLUE}[*] Backend: {'Scapy' if SCAPY_AVAILABLE else 'Socket (fallback)'}{Color.RESET}")
    print(f"{Color.MAGENTA}[*] Simulating: DGA domains, DNS tunneling, mixed record types{Color.RESET}")

    safety_check(target)
    stats = {"sent": 0, "rate": 0.0}
    t = threading.Thread(target=attack_thread, args=(target, count, stats), daemon=True)
    t.start()
    return t, stats


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DNS Tunneling / DGA Simulator — EKADHARA PS-26145")
    parser.add_argument("--target", required=True, help="DNS server IP or hostname")
    parser.add_argument("--count", type=int, default=100, help="Number of unique queries to cycle (default: 100)")
    args = parser.parse_args()

    banner()
    t, stats = run_attack(args.target, args.count)

    print(f"\n{Color.GREEN}[+] Attack running — Press Ctrl+C to stop{Color.RESET}")
    print(f"{Color.CYAN}{'─'*55}{Color.RESET}")
    print(f"  {'Queries':>10}  {'Rate':>10}  {'Type':>12}  {'Status':>15}")
    print(f"{Color.CYAN}{'─'*55}{Color.RESET}")

    last_count = 0
    query_types = ["DGA", "Tunnel", "Random"]

    try:
        while t.is_alive():
            qtype = query_types[int(time.time()) % 3]
            print(f"\r  {Color.GREEN}{stats['sent']:>10,}{Color.RESET}  "
                  f"{Color.YELLOW}{stats['rate']:>9.1f}/s{Color.RESET}  "
                  f"{Color.MAGENTA}{qtype:>12}{Color.RESET}  "
                  f"{'Querying':>15}", end="", flush=True)
            time.sleep(0.5)
    except KeyboardInterrupt:
        print(f"\n\n{Color.YELLOW}[!] Stopping...{Color.RESET}")
        if "stop_event" in stats:
            stats["stop_event"].set()
        t.join(timeout=3)
        print(f"{Color.GREEN}[+] Sent {stats['sent']:,} DNS queries total.{Color.RESET}")
