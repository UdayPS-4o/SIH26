"""Traffic simulator for EKADHARA - generates synthetic network traffic scenarios.

Produces simple binary PCAP files for testing detection engines.
"""
import struct
import time
import random
import os


# ---- Low-level packet builders ----

def make_pcap_header(ts_sec_base=1700000000):
    """Create a PCAP file header (little-endian, microsecond resolution, Ethernet)."""
    return struct.pack('<IHHiIII',
        0xa1b2c3d4,  # magic
        2, 4,        # version major, minor
        0,           # thiszone
        0,           # sigfigs
        65535,       # snaplen
        1)           # network = Ethernet


def make_packet_header(timestamp, captured_len, original_len):
    ts_sec = int(timestamp)
    ts_usec = int((timestamp - ts_sec) * 1_000_000)
    return struct.pack('<IIII', ts_sec, ts_usec, captured_len, original_len)


def make_ethernet_frame(src_mac, dst_mac, eth_type, payload):
    return dst_mac + src_mac + struct.pack('>H', eth_type) + payload


def make_ipv4(src_ip, dst_ip, protocol, payload, ttl=64):
    src = bytes(int(p) for p in src_ip.split('.'))
    dst = bytes(int(p) for p in dst_ip.split('.'))
    total_len = 20 + len(payload)
    return struct.pack('!BBHHHBBH4s4s',
        0x45, 0x00, total_len, 0x1234, 0,
        ttl, protocol, 0, src, dst) + payload


def make_tcp(src_port, dst_port, payload=b'', flags=0x02):
    return struct.pack('!HHIIBBHHH',
        src_port, dst_port, random.randint(0, 0xFFFFFFFF), 0,
        5 << 4, flags, 65535, 0, 0) + payload


def make_udp(src_port, dst_port, payload=b''):
    return struct.pack('!HHHH', src_port, dst_port, 8 + len(payload), 0) + payload


def _make_dns_query(domain):
    tid = struct.pack('!H', random.randint(0, 65535))
    flags = struct.pack('!H', 0x0100)
    counts = struct.pack('!HHHH', 1, 0, 0, 0)
    qname = b''
    for part in domain.split('.'):
        qname += struct.pack('!B', len(part)) + part.encode('ascii')
    qname += b'\x00'
    return tid + flags + counts + qname + struct.pack('!HH', 1, 1)


# ---- Scenario generators ----

_SRC_MAC = bytes([0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0x01])
_DST_MAC = bytes([0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0x02])
_VICTIM = "203.0.113.10"


def _syn_packet(src_ip, dst_ip, dst_port=80, ttl=64):
    tcp = make_tcp(random.randint(1024, 65535), dst_port, flags=0x02)
    ip = make_ipv4(src_ip, dst_ip, 6, tcp, ttl=ttl)
    return make_ethernet_frame(_SRC_MAC, _DST_MAC, 0x0800, ip)


def _ack_packet(src_ip, dst_ip, src_port, dst_port):
    tcp = make_tcp(src_port, dst_port, b'\x00' * 64, flags=0x10)
    ip = make_ipv4(src_ip, dst_ip, 6, tcp)
    return make_ethernet_frame(_SRC_MAC, _DST_MAC, 0x0800, ip)


def _dns_udp(src_ip, dst_ip, domain):
    udp = make_udp(53000 + random.randint(0, 999), 53, _make_dns_query(domain))
    ip = make_ipv4(src_ip, dst_ip, 17, udp)
    return make_ethernet_frame(_SRC_MAC, _DST_MAC, 0x0800, ip)


def _normal_tcp(src_ip, dst_ip, payload_size=100):
    tcp = make_tcp(random.randint(1024, 65535),
                   random.choice([80, 443, 22, 53]),
                   b'\x00' * payload_size, flags=0x10)
    ip = make_ipv4(src_ip, dst_ip, 6, tcp)
    return make_ethernet_frame(_SRC_MAC, _DST_MAC, 0x0800, ip)


def _generate_mixed(duration, start_ts):
    """Mixed scenario: SYN flood + beaconing + port scan + DGA DNS + exfil."""
    packets = []

    # 1. SYN flood (15-25 s)
    flood_start = start_ts + 15
    for i in range(300):
        ts = flood_start + (i / 299.0) * 10
        s = f"{(i * 3) % 256}.{(i * 7) % 256}.{(i * 11) % 256}.{(i * 17) % 256}"
        packets.append((ts, _syn_packet(s, _VICTIM, ttl=random.randint(40, 128))))

    # 2. C2 beaconing (every 5 s throughout)
    infected, c2 = "10.0.1.5", "198.51.100.10"
    n_beacons = int(duration / 5)
    for i in range(n_beacons):
        ts = start_ts + i * 5 + random.uniform(-0.5, 0.5)
        tcp = make_tcp(49152 + i % 1000, 443, b'\x00' * 8, flags=0x10)
        ip = make_ipv4(infected, c2, 6, tcp)
        packets.append((ts, make_ethernet_frame(_SRC_MAC, _DST_MAC, 0x0800, ip)))

    # 3. Port scan (35-45 s)
    scanner, target = "10.0.2.50", "192.168.1.20"
    scan_ts = start_ts + 35
    for port in range(20, 80):
        ts = scan_ts + (port - 20) * 0.3
        packets.append((ts, _syn_packet(scanner, target, dst_port=port)))

    # 4. DGA DNS queries (40 s onward)
    dga_domains = [
        "asdfqwertyuiopzxcvbnm1234567890.net",
        "xkcdvbnmlpouiythgjdswq.net",
        "a1b2c3d4e5f6g7h8i9j0k1l2.net",
        "randomstring12345longdomainnameexample.org",
        "qwertyuiopasdfghjklzxcvbnm123456.net",
    ]
    for i in range(30):
        ts = start_ts + 40 + random.uniform(0, duration - 40)
        domain = random.choice(dga_domains) if random.random() < 0.4 else f"example{i}.com"
        packets.append((ts, _dns_udp("10.0.1.100", "10.0.0.1", domain)))

    # 5. Exfiltration (50-55 s)
    exfil_src, exfil_dst = "10.0.1.50", "203.0.113.99"
    for chunk in range(50):
        ts = start_ts + 50 + chunk * 0.1
        large = b'\x00' * 1400
        tcp = make_tcp(50000 + chunk, 443, large, flags=0x10)
        ip = make_ipv4(exfil_src, exfil_dst, 6, tcp)
        packets.append((ts, make_ethernet_frame(_SRC_MAC, _DST_MAC, 0x0800, ip)))
    for chunk in range(10):
        ts = start_ts + 50 + chunk * 0.5
        small = b'\x00' * 64
        tcp = make_tcp(443, 50000 + chunk, small, flags=0x10)
        ip = make_ipv4(exfil_dst, exfil_src, 6, tcp)
        packets.append((ts, make_ethernet_frame(_SRC_MAC, _DST_MAC, 0x0800, ip)))

    # 6. Normal background traffic
    normal_ips = [f"10.0.{i}.{j}" for i in range(1, 4) for j in range(10, 30)]
    normal_dsts = [f"192.168.1.{i}" for i in range(2, 10)]
    for _ in range(500):
        ts = start_ts + random.uniform(0, duration)
        packets.append((ts, _normal_tcp(random.choice(normal_ips), random.choice(normal_dsts))))

    packets.sort(key=lambda p: p[0])
    return packets


def _generate_ddos(duration, start_ts):
    packets = []
    flood_start = start_ts + 5
    n_syns = max(200, int(duration * 8))
    for i in range(n_syns):
        ts = flood_start + (i / max(n_syns - 1, 1)) * (duration - 10)
        s = f"{(i * 3) % 256}.{(i * 7) % 256}.{(i * 11) % 256}.{(i * 17) % 256}"
        packets.append((ts, _syn_packet(s, _VICTIM, ttl=random.randint(40, 128))))

    for _ in range(200):
        ts = start_ts + random.uniform(0, duration)
        src = f"10.0.{random.randint(1,3)}.{random.randint(10,30)}"
        dst = f"192.168.1.{random.randint(2,9)}"
        packets.append((ts, _normal_tcp(src, dst)))
    packets.sort(key=lambda p: p[0])
    return packets


def _generate_beaconing(duration, start_ts):
    packets = []
    infected, c2 = "10.0.1.5", "198.51.100.10"
    interval = 10.0
    n = int(duration / interval)
    for i in range(n):
        ts = start_ts + i * interval + random.uniform(-1.5, 1.5)
        tcp = make_tcp(49152 + i % 1000, 443, b'\x00' * random.randint(50, 200), flags=0x10)
        ip = make_ipv4(infected, c2, 6, tcp)
        packets.append((ts, make_ethernet_frame(_SRC_MAC, _DST_MAC, 0x0800, ip)))
    for _ in range(50):
        ts = start_ts + random.uniform(0, duration)
        src = f"10.0.1.{random.randint(10,20)}"
        dst = f"192.168.1.{random.randint(2,9)}"
        packets.append((ts, _normal_tcp(src, dst)))
    packets.sort(key=lambda p: p[0])
    return packets


def _generate_port_scan(duration, start_ts):
    packets = []
    scanner, target = "10.0.2.50", "192.168.1.20"
    scan_ts = start_ts + 5
    for port in range(1, 101):
        ts = scan_ts + port * 0.3
        packets.append((ts, _syn_packet(scanner, target, dst_port=port)))
    for _ in range(100):
        ts = start_ts + random.uniform(0, duration)
        src = f"10.0.{random.randint(1,3)}.{random.randint(10,30)}"
        dst = f"192.168.1.{random.randint(2,9)}"
        packets.append((ts, _normal_tcp(src, dst)))
    packets.sort(key=lambda p: p[0])
    return packets


_DGA_DOMAINS = [
    "asdfqwertyuiopzxcvbnm1234567890.net",
    "xkcdvbnmlpouiythgjdswq.net",
    "a1b2c3d4e5f6g7h8i9j0k1l2.net",
    "randomstring12345longdomainnameexample.org",
    "qwertyuiopasdfghjklzxcvbnm123456.net",
    "plmoknijbuhvygctfxrdzeswaq.net",
    "mznbvcxlasdfghjklpoiuytrewq.net",
    "zyxwvutsrqponmlkjihgfedcba.net",
]


def _generate_dga(duration, start_ts):
    packets = []
    n_q = int(duration * 3)
    for i in range(n_q):
        ts = start_ts + i / 3.0
        domain = _DGA_DOMAINS[i % len(_DGA_DOMAINS)]
        packets.append((ts, _dns_udp("10.0.1.100", "10.0.0.1", domain)))
    for i in range(50):
        ts = start_ts + random.uniform(0, duration)
        packets.append((ts, _dns_udp("10.0.1.10", "10.0.0.1", f"normal{i}.example.com")))
    packets.sort(key=lambda p: p[0])
    return packets


def _generate_exfiltration(duration, start_ts):
    packets = []
    exfil_src, exfil_dst = "10.0.1.50", "203.0.113.99"
    start = start_ts + 10
    end = start_ts + min(duration - 5, 50)
    n = int((end - start) * 10)
    for chunk in range(n):
        ts = start + chunk / 10.0
        tcp = make_tcp(50000 + chunk % 1000, 443, b'\x00' * 1400, flags=0x10)
        ip = make_ipv4(exfil_src, exfil_dst, 6, tcp)
        packets.append((ts, make_ethernet_frame(_SRC_MAC, _DST_MAC, 0x0800, ip)))
    for chunk in range(n // 5):
        ts = start + chunk / 2.0
        tcp = make_tcp(443, 50000 + chunk % 1000, b'\x00' * 64, flags=0x10)
        ip = make_ipv4(exfil_dst, exfil_src, 6, tcp)
        packets.append((ts, make_ethernet_frame(_SRC_MAC, _DST_MAC, 0x0800, ip)))
    for _ in range(100):
        ts = start_ts + random.uniform(0, duration)
        src = f"10.0.{random.randint(1,3)}.{random.randint(10,30)}"
        dst = f"192.168.1.{random.randint(2,9)}"
        packets.append((ts, _normal_tcp(src, dst)))
    packets.sort(key=lambda p: p[0])
    return packets


_GENERATORS = {
    'mixed': _generate_mixed,
    'ddos': _generate_ddos,
    'beaconing': _generate_beaconing,
    'port_scan': _generate_port_scan,
    'dga': _generate_dga,
    'exfiltration': _generate_exfiltration,
}


def generate_scenario(scenario, duration=60, output_path=None):
    """Generate a synthetic traffic scenario as a PCAP file.

    Args:
        scenario: One of 'mixed', 'ddos', 'beaconing', 'port_scan', 'dga', 'exfiltration'
        duration: Duration in seconds
        output_path: Output PCAP file path

    Returns:
        str: Path to generated PCAP file
    """
    if scenario not in _GENERATORS:
        raise ValueError(f"Unknown scenario: {scenario}. Choose from {list(_GENERATORS.keys())}")

    if output_path is None:
        output_path = f"simulator/data/pcaps/{scenario}_{duration}s.pcap"

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    start_ts = time.time() - duration
    packets = _GENERATORS[scenario](duration, start_ts)

    with open(output_path, 'wb') as f:
        f.write(make_pcap_header(start_ts))
        for ts, pkt in packets:
            f.write(make_packet_header(ts, len(pkt), len(pkt)))
            f.write(pkt)

    return output_path
