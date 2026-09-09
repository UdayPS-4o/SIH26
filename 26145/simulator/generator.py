"""
EKADHARA (SIH26145) — Synthetic Network Traffic Generator

Generates PCAP files with labeled benign and attack traffic using ONLY
the Python standard library (random, struct, time, json, io).

PCAP global header  (24 bytes):
    magic     4  = 0xa1b2c3d4  (little-endian)
    ver_maj   2  = 2
    ver_min   2  = 4
    thiszone  4  = 0
    sigfigs   4  = 0
    snaplen   4  = 65535
    network   4  = 1  (LINKTYPE_ETHERNET)

Per-packet header (16 bytes):
    ts_sec     4  (uint32)
    ts_usec    4  (uint32)
    incl_len   4  (uint32)  -- bytes captured
    orig_len   4  (uint32)  -- original on-wire length

Ethernet frame:
    dst_mac   6
    src_mac   6
    ethertype 2  = 0x0800  (IPv4)

IPv4 header (minimum 20 bytes):
    ver_ihl   1  = 0x45
    dscp      1  = 0x00
    tot_len   2
    id        2
    flags_off 2
    ttl       1  = 64
    proto     1
    checksum  2
    src_ip    4
    dst_ip    4

TCP header (minimum 20 bytes):
    src_port  2
    dst_port  2
    seq       4
    ack       4
    doff_flags 2
    window    2
    checksum  2
    urg_ptr   2

UDP header (8 bytes):
    src_port  2
    dst_port  2
    length    2
    checksum  2

ICMP header (8 bytes):
    type      1
    code      1
    checksum  2
    rest      4
"""

import struct
import time
import json
import io
import random
import zlib

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PCAP_MAGIC       = 0xa1b2c3d4
LINKTYPE_ETH     = 1
SNAPLEN          = 65535
ETH_TYPE_IPV4    = 0x0800
IP_IHL_NO_OPT    = 5
IP_TTL           = 64
IP_VERSION       = 4

PROTO_TCP        = 6
PROTO_UDP        = 17
PROTO_ICMP       = 1

INTERNAL_NET     = (10 << 24) | (0 << 16) | (0 << 8) | 0
INTERNAL_MASK    = 0xFF000000
EXTERNAL_NET     = (203 << 24) | (0 << 16) | (113 << 8) | 0
EXTERNAL_MASK    = 0xFFFFFF00

BENIGN_PORTS     = [80, 443, 53, 22, 8080, 3000]

# ---------------------------------------------------------------------------
# Low-level struct packing helpers
# ---------------------------------------------------------------------------

def _p8(v):
    return struct.pack("!B", v & 0xFF)

def _p16(v):
    return struct.pack("!H", v & 0xFFFF)

def _p32(v):
    return struct.pack("!I", v & 0xFFFFFFFF)

def _ip_str_to_int(s):
    parts = s.split(".")
    return (int(parts[0]) << 24) | (int(parts[1]) << 16) | \
           (int(parts[2]) << 8) | int(parts[3])

def _ip_int_to_str(v):
    return f"{(v>>24)&0xFF}.{(v>>16)&0xFF}.{(v>>8)&0xFF}.{v&0xFF}"

def _is_internal(ip_int):
    return (ip_int & INTERNAL_MASK) == INTERNAL_NET

def _rand_internal_ip(rng):
    octet = rng.randint(1, 255)
    return (10 << 24) | (rng.randint(0, 255) << 16) | \
           (rng.randint(1, 255) << 8) | octet

def _rand_external_ip(rng):
    return (203 << 24) | (0 << 16) | (113 << 8) | rng.randint(1, 254)

def _rand_spoofed_ip(rng):
    return rng.randint(1, 0xFFFFFFFF)

def _rand_port(rng, ports=None):
    if ports:
        return rng.choice(ports)
    return rng.randint(1, 65535)

# ---------------------------------------------------------------------------
# Checksum utilities  (Internet checksum, RFC 1071)
# ---------------------------------------------------------------------------

def _checksum(data: bytes) -> int:
    """Compute the Internet checksum (ones-complement of ones-complement sum)."""
    if len(data) % 2:
        data += b'\x00'
    total = 0
    for i in range(0, len(data), 2):
        total += (data[i] << 8) | data[i + 1]
    total = (total & 0xFFFF) + (total >> 16)
    total = (total & 0xFFFF) + (total >> 16)
    return (~total) & 0xFFFF

def _tcpudp_checksum(src_ip, dst_ip, proto, payload):
    """Compute TCP/UDP checksum with pseudo-header."""
    pseudo = (
        _p32(src_ip) + _p32(dst_ip) + _p8(0) + _p8(proto) +
        _p16(len(payload))
    )
    return _checksum(pseudo + payload)

# ---------------------------------------------------------------------------
# PCAP Global header
# ---------------------------------------------------------------------------

def _pcap_global_header() -> bytes:
    return struct.pack(
        "<IHHiIII",
        PCAP_MAGIC,    # magic number
        2, 4,          # version major / minor
        0,             # thiszone (UTC)
        0,             # sigfigs
        SNAPLEN,       # snaplen
        LINKTYPE_ETH,  # network = LINKTYPE_ETHERNET
    )

# ---------------------------------------------------------------------------
# Packet builder helpers
# ---------------------------------------------------------------------------

def _tcp_packet(src_ip, dst_ip, src_port, dst_port, payload,
                seq=None, ack=0, flags=0x18, mac_seed=None):
    """
    Build a complete Ethernet/IPv4/TCP packet.
    flags: bitmask -- SYN=0x02, ACK=0x10, PSH=0x18, FIN=0x11, RST=0x14
    """
    r = random.Random(mac_seed) if mac_seed is not None else random.Random(
        random.randint(0, 2**32))
    payload_len = len(payload)

    # MAC addresses (randomised per packet)
    dst_mac = bytes([r.randint(0, 255) for _ in range(6)])
    src_mac = bytes([r.randint(0, 255) for _ in range(6)])

    # TCP header
    if seq is None:
        seq = r.randint(0, 0xFFFFFFFF)
    doff = 5
    doff_flags = (doff << 12) | flags
    window_val = r.randint(8192, 65535)
    tcp_raw = (
        _p16(src_port) + _p16(dst_port) +
        _p32(seq) + _p32(ack) +
        _p16(doff_flags) +
        _p16(window_val) +
        b'\x00\x00' +    # checksum placeholder
        b'\x00\x00'      # urgent pointer
    )

    # TCP pseudo-header for checksum
    tcp_pseudo = (
        _p32(src_ip) + _p32(dst_ip) +
        b'\x00' + _p8(PROTO_TCP) +
        _p16(len(tcp_raw) + payload_len)
    )
    tcp_cksum = _checksum(tcp_pseudo + tcp_raw + payload)
    tcp_raw = tcp_raw[:16] + _p16(tcp_cksum) + tcp_raw[18:]

    # IP header
    total_len = (IP_IHL_NO_OPT * 4) + len(tcp_raw) + payload_len
    ip_raw = (
        _p8((IP_VERSION << 4) | IP_IHL_NO_OPT) +
        b'\x00' +
        _p16(total_len) +
        _p16(r.randint(0, 65535)) +    # IP ID
        _p16(0x4000) +                  # flags: don't fragment
        _p8(IP_TTL) +
        _p8(PROTO_TCP) +
        b'\x00\x00' +                  # checksum placeholder
        _p32(src_ip) +
        _p32(dst_ip)
    )
    ip_cksum = _checksum(ip_raw)
    ip_raw = ip_raw[:10] + _p16(ip_cksum) + ip_raw[12:]

    pkt = dst_mac + src_mac + _p16(ETH_TYPE_IPV4) + ip_raw + tcp_raw + payload
    return pkt


def _udp_packet(src_ip, dst_ip, src_port, dst_port, payload,
                mac_seed=None):
    r = random.Random(mac_seed) if mac_seed is not None else random.Random(
        random.randint(0, 2**32))

    dst_mac = bytes([r.randint(0, 255) for _ in range(6)])
    src_mac = bytes([r.randint(0, 255) for _ in range(6)])

    udp_len = 8 + len(payload)
    udp_raw = (
        _p16(src_port) + _p16(dst_port) +
        _p16(udp_len) +
        b'\x00\x00'    # checksum placeholder
    )
    udp_cksum = _tcpudp_checksum(src_ip, dst_ip, PROTO_UDP,
                                  udp_raw + payload)
    udp_raw = udp_raw[:6] + _p16(udp_cksum)

    total_len = (IP_IHL_NO_OPT * 4) + len(udp_raw) + len(payload)
    ip_raw = (
        _p8((IP_VERSION << 4) | IP_IHL_NO_OPT) +
        b'\x00' +
        _p16(total_len) +
        _p16(r.randint(0, 65535)) +
        _p16(0x4000) +
        _p8(IP_TTL) +
        _p8(PROTO_UDP) +
        b'\x00\x00' +
        _p32(src_ip) +
        _p32(dst_ip)
    )
    ip_cksum = _checksum(ip_raw)
    ip_raw = ip_raw[:10] + _p16(ip_cksum) + ip_raw[12:]

    pkt = dst_mac + src_mac + _p16(ETH_TYPE_IPV4) + ip_raw + udp_raw + payload
    return pkt


def _icmp_packet(src_ip, dst_ip, icmp_type, icmp_code, payload,
                 mac_seed=None):
    r = random.Random(mac_seed) if mac_seed is not None else random.Random(
        random.randint(0, 2**32))

    dst_mac = bytes([r.randint(0, 255) for _ in range(6)])
    src_mac = bytes([r.randint(0, 255) for _ in range(6)])

    icmp_raw = (
        _p8(icmp_type) + _p8(icmp_code) +
        b'\x00\x00' +        # checksum placeholder
        b'\x00\x00\x00\x00'  # rest of header
    )
    icmp_cksum = _checksum(icmp_raw + payload)
    icmp_raw = icmp_raw[:2] + _p16(icmp_cksum) + icmp_raw[4:]

    total_len = (IP_IHL_NO_OPT * 4) + len(icmp_raw) + len(payload)
    ip_raw = (
        _p8((IP_VERSION << 4) | IP_IHL_NO_OPT) +
        b'\x00' +
        _p16(total_len) +
        _p16(r.randint(0, 65535)) +
        _p16(0x4000) +
        _p8(IP_TTL) +
        _p8(PROTO_ICMP) +
        b'\x00\x00' +
        _p32(src_ip) +
        _p32(dst_ip)
    )
    ip_cksum = _checksum(ip_raw)
    ip_raw = ip_raw[:10] + _p16(ip_cksum) + ip_raw[12:]

    pkt = dst_mac + src_mac + _p16(ETH_TYPE_IPV4) + ip_raw + icmp_raw + payload
    return pkt


def _build_pcap(packets: list) -> bytes:
    """packets: list of (timestamp_float, packet_bytes)."""
    buf = io.BytesIO()
    buf.write(_pcap_global_header())
    for ts, pkt in packets:
        ts_sec  = int(ts)
        ts_usec = int((ts - ts_sec) * 1_000_000)
        buf.write(struct.pack("<IIII", ts_sec, ts_usec,
                               len(pkt), len(pkt)))
        buf.write(pkt)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Public API -- traffic generators
# ---------------------------------------------------------------------------

def generate_benign(duration_s=60, flows_per_sec=100, seed=42):
    """
    Generate benign mixed-traffic PCAP bytes.

    Mix: TCP 80 %, UDP 15 %, ICMP 5 %.
    Common ports: 80, 443, 53, 22, 8080, 3000.
    Internal IPs (10.0.0.0/8) <-> External IPs (203.0.113.0/24).
    Variable packet sizes (64-1500 bytes).
    Some regular flows (like DNS every 30s).
    """
    rng = random.Random(seed)
    packets = []
    labels  = []

    # Pool of pre-seeded internal clients and external servers
    internal_ips = [_rand_internal_ip(rng) for _ in range(20)]
    external_ips = [_rand_external_ip(rng) for _ in range(10)]

    # Regular heartbeat flows (e.g. keep-alives, periodic DNS)
    regular_interval = 30
    regular_flows = []
    for _ in range(max(1, duration_s // regular_interval)):
        src = rng.choice(internal_ips)
        dst = rng.choice(external_ips)
        port = 443 if rng.random() < 0.6 else 53
        regular_flows.append((src, dst, port, rng.randint(1024, 65535)))

    # Main loop
    ts = 0.0
    interval = 1.0 / flows_per_sec

    while ts < duration_s:
        # Inject regular heartbeat flows
        for (src, dst, dport, sport) in regular_flows:
            if ts % regular_interval < interval * 2:
                payload_len = rng.randint(40, 120)
                payload = bytes([rng.randint(0, 255)
                                 for _ in range(payload_len)])
                proto_rand = rng.random()
                if proto_rand < 0.5:
                    pkt = _tcp_packet(src, dst, sport, dport,
                                       payload, flags=0x18)
                    proto = "TCP"
                else:
                    pkt = _udp_packet(src, dst, sport, dport, payload)
                    proto = "UDP"
                packets.append((ts, pkt))
                labels.append({
                    "flow_id":      f"{_ip_int_to_str(src)}:{sport}->"
                                    f"{_ip_int_to_str(dst)}:{dport}",
                    "src_ip":       _ip_int_to_str(src),
                    "dst_ip":       _ip_int_to_str(dst),
                    "src_port":     sport,
                    "dst_port":     dport,
                    "protocol":     proto,
                    "packet_count": 1,
                    "byte_count":   len(pkt),
                    "start_time":   round(ts, 4),
                    "end_time":     round(ts, 4),
                    "label":        "benign",
                    "direction_visible": "both",
                })

        # Random flows this tick
        flows_this_tick = rng.randint(1, 3)
        for _ in range(flows_this_tick):
            proto_rand = rng.random()
            if proto_rand < 0.80:
                proto = "TCP"
                src = rng.choice(internal_ips)
                dst = rng.choice(external_ips)
                dport = rng.choice(BENIGN_PORTS)
                sport = rng.randint(1024, 65535)
                payload_len = rng.randint(64, 1500)
                payload = bytes([rng.randint(0, 255)
                                 for _ in range(payload_len)])
                flags = 0x18
                if rng.random() < 0.1:
                    flags = 0x02
                pkt = _tcp_packet(src, dst, sport, dport,
                                   payload, flags=flags)
            elif proto_rand < 0.95:
                proto = "UDP"
                src = rng.choice(internal_ips)
                dst = rng.choice(external_ips)
                dport = rng.choice(BENIGN_PORTS)
                sport = rng.randint(1024, 65535)
                payload_len = rng.randint(64, 1400)
                payload = bytes([rng.randint(0, 255)
                                 for _ in range(payload_len)])
                pkt = _udp_packet(src, dst, sport, dport, payload)
            else:
                proto = "ICMP"
                src = rng.choice(internal_ips)
                dst = rng.choice(external_ips)
                payload_len = rng.randint(32, 512)
                payload = bytes([rng.randint(0, 255)
                                 for _ in range(payload_len)])
                pkt = _icmp_packet(src, dst, 8, 0, payload)

            packets.append((ts, pkt))
            labels.append({
                "flow_id":      f"{_ip_int_to_str(src)}:{sport}->"
                                f"{_ip_int_to_str(dst)}:{dport}",
                "src_ip":       _ip_int_to_str(src),
                "dst_ip":       _ip_int_to_str(dst),
                "src_port":     sport,
                "dst_port":     dport,
                "protocol":     proto,
                "packet_count": 1,
                "byte_count":   len(pkt),
                "start_time":   round(ts, 4),
                "end_time":     round(ts, 4),
                "label":        "benign",
                "direction_visible": "both",
            })

        ts += interval

    # Merge labels for identical flows
    merged = {}
    for lab in labels:
        fid = lab["flow_id"]
        if fid not in merged:
            merged[fid] = dict(lab)
        else:
            merged[fid]["packet_count"] += 1
            merged[fid]["byte_count"]   += lab["byte_count"]
            merged[fid]["end_time"]      = lab["end_time"]

    # Store raw labels for run_scenario to pick up
    generate_benign._last_labels = list(merged.values())
    return _build_pcap(packets)


def generate_ddos(target_ip, duration_s=30, seed=42):
    """
    Generate DDoS SYN-flood PCAP bytes directed at target_ip.

    SYN flood: 10k+ packets/sec to target.
    Random spoofed source IPs (high entropy).
    UDP reflection pattern included.
    """
    rng = random.Random(seed)
    target_int = _ip_str_to_int(target_ip)

    packets = []
    labels  = []
    ts      = 0.0
    pkt_iv  = 1.0 / 10000

    syn_ports = [80, 443, 8080, 22, 53]

    while ts < duration_s:
        for _ in range(8):
            spoofed = _rand_spoofed_ip(rng)
            sport   = rng.randint(1024, 65535)
            dport   = rng.choice(syn_ports)
            payload = b'\x00' * 40
            pkt = _tcp_packet(spoofed, target_int, sport, dport,
                               payload, flags=0x02)
            packets.append((ts, pkt))
            labels.append({
                "flow_id":      f"{_ip_int_to_str(spoofed)}:{sport}->"
                                f"{target_ip}:{dport}",
                "src_ip":       _ip_int_to_str(spoofed),
                "dst_ip":       target_ip,
                "src_port":     sport,
                "dst_port":     dport,
                "protocol":     "TCP",
                "packet_count": 1,
                "byte_count":   len(pkt),
                "start_time":   round(ts, 4),
                "end_time":     round(ts, 4),
                "label":        "ddos_syn_flood",
                "direction_visible": "both",
            })

        for _ in range(2):
            spoofed = _rand_spoofed_ip(rng)
            sport   = rng.choice([53, 123, 1900])
            payload = bytes([rng.randint(0, 255) for _ in range(64)])
            pkt = _udp_packet(spoofed, target_int, sport, 53, payload)
            packets.append((ts, pkt))
            labels.append({
                "flow_id":      f"{_ip_int_to_str(spoofed)}:{sport}->"
                                f"{target_ip}:53",
                "src_ip":       _ip_int_to_str(spoofed),
                "dst_ip":       target_ip,
                "src_port":     sport,
                "dst_port":     53,
                "protocol":     "UDP",
                "packet_count": 1,
                "byte_count":   len(pkt),
                "start_time":   round(ts, 4),
                "end_time":     round(ts, 4),
                "label":        "ddos_udp_reflection",
                "direction_visible": "both",
            })

        ts += pkt_iv

    merged = {}
    for lab in labels:
        fid = lab["flow_id"]
        if fid not in merged:
            merged[fid] = dict(lab)
        else:
            merged[fid]["packet_count"] += 1
            merged[fid]["byte_count"]   += lab["byte_count"]
            merged[fid]["end_time"]      = lab["end_time"]
    generate_ddos._last_labels = list(merged.values())
    return _build_pcap(packets)


def generate_beaconing(c2_ip, duration_s=60, seed=42):
    """
    Generate C2 beaconing PCAP bytes.

    Regular intervals (30-120s) with +/-10% jitter.
    Small payloads (64-256 bytes) to port 443.
    Looks like HTTPS beaconing.
    """
    rng = random.Random(seed)
    c2_int = _ip_str_to_int(c2_ip)

    client_ip = (10 << 24) | (0 << 16) | (1 << 8) | 55
    client_port = 54321

    packets = []
    labels  = []

    ts = 0.0
    interval = rng.randint(30, 120)
    jitter   = interval * 0.10

    while ts < duration_s:
        payload_len = rng.randint(64, 256)
        payload = bytes([rng.randint(0, 255) for _ in range(payload_len)])

        pkt = _tcp_packet(client_ip, c2_int, client_port, 443,
                          payload, flags=0x18)
        packets.append((ts, pkt))

        labels.append({
            "flow_id":      f"10.0.1.55:{client_port}->{c2_ip}:443",
            "src_ip":       "10.0.1.55",
            "dst_ip":       c2_ip,
            "src_port":     client_port,
            "dst_port":     443,
            "protocol":     "TCP",
            "packet_count": 1,
            "byte_count":   len(pkt),
            "start_time":   round(ts, 4),
            "end_time":     round(ts, 4),
            "label":        "beaconing",
            "direction_visible": "both",
        })

        ts += max(interval + rng.uniform(-jitter, jitter), 1.0)

    generate_beaconing._last_labels = labels
    return _build_pcap(packets)


def generate_port_scan(scanner_ip, duration_s=30, seed=42):
    """
    Generate port scan PCAP bytes.

    Sequential port scan 1-10000.
    SYN to closed ports (no response expected).
    One source, many destinations.
    """
    rng = random.Random(seed)
    scanner_int = _ip_str_to_int(scanner_ip)

    dst_ips = [_rand_internal_ip(rng) for _ in range(50)]

    packets = []
    labels  = []
    ts      = 0.0

    total_ports   = 10000
    scan_interval = duration_s / total_ports

    for port in range(1, total_ports + 1):
        dst = dst_ips[port % len(dst_ips)]
        payload = b'\x00' * 20
        pkt = _tcp_packet(scanner_int, dst, rng.randint(1024, 65535),
                          port, payload, flags=0x02)
        packets.append((ts, pkt))

        labels.append({
            "flow_id":      f"{scanner_ip}:*->"
                            f"{_ip_int_to_str(dst)}:{port}",
            "src_ip":       scanner_ip,
            "dst_ip":       _ip_int_to_str(dst),
            "src_port":     "(varied)",
            "dst_port":     port,
            "protocol":     "TCP",
            "packet_count": 1,
            "byte_count":   len(pkt),
            "start_time":   round(ts, 4),
            "end_time":     round(ts, 4),
            "label":        "port_scan",
            "direction_visible": "outbound",
        })
        ts += scan_interval

    generate_port_scan._last_labels = labels
    return _build_pcap(packets)


# ---------------------------------------------------------------------------
# DGA-DNS -- mix of legitimate + algorithmically generated domains
# ---------------------------------------------------------------------------

_VOWELS     = "aeiou"
_CONSONANTS = "bcdfghjklmnpqrstvwxyz"

def _dga_domain(rng, min_len=8, max_len=20):
    """Generate a random consonant-vowel pattern domain."""
    length = rng.randint(min_len, max_len)
    label  = ""
    use_vowel = rng.random() < 0.5
    for _ in range(length):
        if use_vowel:
            label += rng.choice(_VOWELS)
        else:
            label += rng.choice(_CONSONANTS)
        use_vowel = not use_vowel
    return label + "." + rng.choice(["com", "net", "org", "xyz", "top"])

_LEGIT_DOMAINS = [
    "google.com", "microsoft.com", "amazon.com", "facebook.com",
    "apple.com", "cloudflare.com", "github.com", "stackoverflow.com",
    "wikipedia.org", "youtube.com", "twitter.com", "linkedin.com",
]

def _build_dns_query(domain, txid):
    """Minimal DNS query packet (UDP payload)."""
    header = struct.pack("!HHHHHH", txid, 0x0100, 1, 0, 0, 0)
    qname = b""
    for part in domain.split("."):
        qname += _p8(len(part)) + part.encode("ascii")
    qname += b'\x00'
    question = qname + struct.pack("!HH", 1, 1)
    return header + question

def _build_dns_response(domain, txid, src_ip, dst_ip):
    """Minimal DNS response."""
    answer_ip = (203 << 24) | (0 << 16) | (113 << 8) | random.randint(1, 254)
    header = struct.pack("!HHHHHH", txid, 0x8180, 1, 1, 0, 0)
    qname = b""
    for part in domain.split("."):
        qname += _p8(len(part)) + part.encode("ascii")
    qname += b'\x00'
    question = qname + struct.pack("!HH", 1, 1)
    answer = b'\xc0\x0c' + struct.pack("!HHIH", 1, 1, 300, 4) + \
             struct.pack("!I", answer_ip)
    return header + question + answer

def generate_dga_dns(dns_server, duration_s=30, seed=42):
    """
    Generate DGA-DNS PCAP bytes.

    Mix of legitimate domains and DGA domains.
    DGA domains: random consonant-vowel patterns, high entropy.
    DNS query/response pairs.
    """
    rng = random.Random(seed)
    dns_srv_int = _ip_str_to_int(dns_server)

    client_ip   = (10 << 24) | (0 << 16) | (2 << 8) | 10
    client_port = 5353
    dns_port    = 53

    packets = []
    labels  = []
    ts      = 0.0
    txid    = 1000

    while ts < duration_s:
        is_dga = rng.random() < 0.4
        if is_dga:
            domain = _dga_domain(rng)
            label  = "dga_dns"
        else:
            domain = rng.choice(_LEGIT_DOMAINS)
            label  = "dns_legitimate"

        query_payload = _build_dns_query(domain, txid)
        query_pkt = _udp_packet(client_ip, dns_srv_int,
                                 client_port, dns_port, query_payload)
        packets.append((ts, query_pkt))
        labels.append({
            "flow_id":      f"10.0.2.10:{client_port}->{dns_server}:53",
            "src_ip":       "10.0.2.10",
            "dst_ip":       dns_server,
            "src_port":     client_port,
            "dst_port":     dns_port,
            "protocol":     "UDP",
            "packet_count": 1,
            "byte_count":   len(query_pkt),
            "start_time":   round(ts, 4),
            "end_time":     round(ts, 4),
            "label":        label,
            "direction_visible": "outbound",
        })

        resp_payload = _build_dns_response(domain, txid,
                                            dns_srv_int, client_ip)
        resp_pkt = _udp_packet(dns_srv_int, client_ip,
                                dns_port, client_port, resp_payload)
        packets.append((ts + 0.01, resp_pkt))
        labels.append({
            "flow_id":      f"{dns_server}:53->10.0.2.10:{client_port}",
            "src_ip":       dns_server,
            "dst_ip":       "10.0.2.10",
            "src_port":     dns_port,
            "dst_port":     client_port,
            "protocol":     "UDP",
            "packet_count": 1,
            "byte_count":   len(resp_pkt),
            "start_time":   round(ts + 0.01, 4),
            "end_time":     round(ts + 0.01, 4),
            "label":        label,
            "direction_visible": "inbound",
        })

        txid += 1
        ts  += rng.uniform(0.5, 2.0)

    generate_dga_dns._last_labels = labels
    return _build_pcap(packets)


# ---------------------------------------------------------------------------
# Exfiltration -- large outbound data transfers
# ---------------------------------------------------------------------------

def generate_exfiltration(exfil_ip, target_ip, duration_s=60, seed=42):
    """
    Generate exfiltration PCAP bytes.

    Large data transfers (upload >> download).
    Periodic large chunks (1-10MB total).
    Unusual outbound patterns.
    """
    rng = random.Random(seed)
    exfil_int  = _ip_str_to_int(exfil_ip)
    target_int = _ip_str_to_int(target_ip)

    exfil_port = rng.randint(50000, 65535)
    tgt_port   = 443

    packets   = []
    labels    = []
    ts        = 0.0

    total_bytes = rng.randint(1_000_000, 10_000_000)
    chunk_size  = rng.randint(50_000, 200_000)
    num_chunks  = max(3, total_bytes // chunk_size)
    chunks      = [bytes([rng.randint(0, 255)
                          for _ in range(chunk_size)])
                   for _ in range(num_chunks)]

    chunk_interval = duration_s / num_chunks

    for chunk in chunks:
        offset = 0
        seg_size = 1460
        while offset < len(chunk):
            seg = chunk[offset: offset + seg_size]
            pkt = _tcp_packet(exfil_int, target_int,
                               exfil_port, tgt_port,
                               seg, flags=0x18)
            packets.append((ts, pkt))
            offset += len(seg)

        labels.append({
            "flow_id":      f"{exfil_ip}:{exfil_port}->{target_ip}:{tgt_port}",
            "src_ip":       exfil_ip,
            "dst_ip":       target_ip,
            "src_port":     exfil_port,
            "dst_port":     tgt_port,
            "protocol":     "TCP",
            "packet_count": (len(chunk) + seg_size - 1) // seg_size,
            "byte_count":   len(chunk),
            "start_time":   round(ts, 4),
            "end_time":     round(ts + chunk_interval * 0.4, 4),
            "label":        "exfiltration_upload",
            "direction_visible": "outbound",
        })

        ts += chunk_interval * 0.5

        ack_payload = bytes([rng.randint(0, 255) for _ in range(32)])
        ack_pkt = _tcp_packet(target_int, exfil_int,
                               tgt_port, exfil_port,
                               ack_payload, flags=0x10)
        packets.append((ts, ack_pkt))
        labels.append({
            "flow_id":      f"{target_ip}:{tgt_port}->{exfil_ip}:{exfil_port}",
            "src_ip":       target_ip,
            "dst_ip":       exfil_ip,
            "src_port":     tgt_port,
            "dst_port":     exfil_port,
            "protocol":     "TCP",
            "packet_count": 1,
            "byte_count":   len(ack_pkt),
            "start_time":   round(ts, 4),
            "end_time":     round(ts, 4),
            "label":        "exfiltration_ack",
            "direction_visible": "inbound",
        })

        ts += chunk_interval * 0.5

    generate_exfiltration._last_labels = labels
    return _build_pcap(packets)


# ---------------------------------------------------------------------------
# make_diode_twin -- filter PCAP by direction
# ---------------------------------------------------------------------------

def make_diode_twin(pcap_bytes, direction="outbound"):
    """
    Parse a PCAP and keep only packets matching *direction*.

    direction = "outbound"  -> source IP is in 10.0.0.0/8
    direction = "inbound"   -> destination IP is in 10.0.0.0/8
    """
    INTERNAL_NET_MASK = INTERNAL_NET & INTERNAL_MASK
    offset    = 24
    out_buf   = io.BytesIO()
    kept      = 0

    out_buf.write(pcap_bytes[:offset])

    while offset + 16 <= len(pcap_bytes):
        ts_sec, ts_usec, incl_len, orig_len = struct.unpack_from(
            "<IIII", pcap_bytes, offset)
        offset += 16

        if offset + incl_len > len(pcap_bytes):
            break

        pkt_data = pcap_bytes[offset: offset + incl_len]
        offset  += incl_len

        if len(pkt_data) < 34:
            continue

        eth_ethertype = struct.unpack_from("!H", pkt_data, 12)[0]
        if eth_ethertype != ETH_TYPE_IPV4:
            continue

        ip_src = struct.unpack_from("!I", pkt_data, 26)[0]
        ip_dst = struct.unpack_from("!I", pkt_data, 30)[0]

        if direction == "outbound" and (ip_src & INTERNAL_MASK) == INTERNAL_NET_MASK:
            keep = True
        elif direction == "inbound" and (ip_dst & INTERNAL_MASK) == INTERNAL_NET_MASK:
            keep = True
        else:
            keep = False

        if keep:
            out_buf.write(struct.pack("<IIII",
                                      ts_sec, ts_usec,
                                      incl_len, orig_len))
            out_buf.write(pkt_data)
            kept += 1

    return out_buf.getvalue()


# ---------------------------------------------------------------------------
# run_scenario -- orchestrate mixed traffic + diode twin + labels
# ---------------------------------------------------------------------------

def run_scenario(scenario_name, duration=60):
    """
    Generate a full scenario PCAP combining benign + attack traffic,
    produce a diode-twin (outbound-filtered) PCAP, and return labels.

    Returns
    -------
    (full_pcap: bytes, diode_pcap: bytes, labels: dict)
    """
    seed      = hash(scenario_name) % (2**32) + 42
    base_seed = seed

    all_packets = []
    all_labels  = []

    # 1. Benign background traffic
    benign_pcap = generate_benign(
        duration_s=duration, flows_per_sec=100, seed=seed)
    seed += 1

    # Collect benign labels from the function attribute
    benign_labels = getattr(generate_benign, '_last_labels', [])
    offset = 24
    while offset + 16 <= len(benign_pcap):
        ts_sec, ts_usec, incl_len, orig_len = struct.unpack_from(
            "<IIII", benign_pcap, offset)
        offset += 16
        pkt = benign_pcap[offset: offset + incl_len]
        offset += incl_len
        ts = ts_sec + ts_usec / 1_000_000.0
        all_packets.append((ts, pkt))
    all_labels.extend(benign_labels)

    # 2. Attack traffic (scenario-specific)
    if scenario_name in ("ddos", "mixed", "full"):
        target_ip = "203.0.113.10"
        ddos_pcap = generate_ddos(
            target_ip=target_ip, duration_s=duration, seed=seed)
        seed += 1
        ddos_labels = getattr(generate_ddos, '_last_labels', [])
        offset = 24
        while offset + 16 <= len(ddos_pcap):
            ts_sec, ts_usec, incl_len, orig_len = struct.unpack_from(
                "<IIII", ddos_pcap, offset)
            offset += 16
            pkt = ddos_pcap[offset: offset + incl_len]
            offset += incl_len
            ts = ts_sec + ts_usec / 1_000_000.0
            all_packets.append((ts + duration * 0.2, pkt))
        all_labels.extend(ddos_labels)

    if scenario_name in ("beaconing", "mixed", "full"):
        c2_ip = "198.51.100.42"
        bcn_pcap = generate_beaconing(
            c2_ip=c2_ip, duration_s=duration, seed=seed)
        seed += 1
        bcn_labels = getattr(generate_beaconing, '_last_labels', [])
        offset = 24
        while offset + 16 <= len(bcn_pcap):
            ts_sec, ts_usec, incl_len, orig_len = struct.unpack_from(
                "<IIII", bcn_pcap, offset)
            offset += 16
            pkt = bcn_pcap[offset: offset + incl_len]
            offset += incl_len
            ts = ts_sec + ts_usec / 1_000_000.0
            all_packets.append((ts + duration * 0.3, pkt))
        all_labels.extend(bcn_labels)

    if scenario_name in ("portscan", "mixed", "full"):
        scanner_ip = "10.0.99.1"
        scan_pcap = generate_port_scan(
            scanner_ip=scanner_ip, duration_s=duration, seed=seed)
        seed += 1
        scan_labels = getattr(generate_port_scan, '_last_labels', [])
        offset = 24
        while offset + 16 <= len(scan_pcap):
            ts_sec, ts_usec, incl_len, orig_len = struct.unpack_from(
                "<IIII", scan_pcap, offset)
            offset += 16
            pkt = scan_pcap[offset: offset + incl_len]
            offset += incl_len
            ts = ts_sec + ts_usec / 1_000_000.0
            all_packets.append((ts + duration * 0.1, pkt))
        all_labels.extend(scan_labels)

    if scenario_name in ("dga", "mixed", "full"):
        dns_server = "10.0.5.10"
        dga_pcap = generate_dga_dns(
            dns_server=dns_server, duration_s=duration, seed=seed)
        seed += 1
        dga_labels = getattr(generate_dga_dns, '_last_labels', [])
        offset = 24
        while offset + 16 <= len(dga_pcap):
            ts_sec, ts_usec, incl_len, orig_len = struct.unpack_from(
                "<IIII", dga_pcap, offset)
            offset += 16
            pkt = dga_pcap[offset: offset + incl_len]
            offset += incl_len
            ts = ts_sec + ts_usec / 1_000_000.0
            all_packets.append((ts + duration * 0.15, pkt))
        all_labels.extend(dga_labels)

    if scenario_name in ("exfil", "mixed", "full"):
        exfil_ip  = "10.0.10.10"
        target_ip = "203.0.113.200"
        exf_pcap = generate_exfiltration(
            exfil_ip=exfil_ip, target_ip=target_ip,
            duration_s=duration, seed=seed)
        seed += 1
        exf_labels = getattr(generate_exfiltration, '_last_labels', [])
        offset = 24
        while offset + 16 <= len(exf_pcap):
            ts_sec, ts_usec, incl_len, orig_len = struct.unpack_from(
                "<IIII", exf_pcap, offset)
            offset += 16
            pkt = exf_pcap[offset: offset + incl_len]
            offset += incl_len
            ts = ts_sec + ts_usec / 1_000_000.0
            all_packets.append((ts + duration * 0.25, pkt))
        all_labels.extend(exf_labels)

    # 3. Sort by timestamp
    all_packets.sort(key=lambda x: x[0])

    # 4. Merge labels for same flow_id
    merged = {}
    for lab in all_labels:
        fid = lab["flow_id"]
        if fid not in merged:
            merged[fid] = dict(lab)
        else:
            merged[fid]["packet_count"] += 1
            merged[fid]["byte_count"]   += lab["byte_count"]
            if lab["start_time"] < merged[fid]["start_time"]:
                merged[fid]["start_time"] = lab["start_time"]
            if lab["end_time"] > merged[fid]["end_time"]:
                merged[fid]["end_time"] = lab["end_time"]
    final_labels_list = list(merged.values())

    labels_dict = {
        "scenario":   scenario_name,
        "duration_s": duration,
        "seed":       base_seed,
        "flows":      final_labels_list,
    }

    full_pcap  = _build_pcap(all_packets)
    diode_pcap = make_diode_twin(full_pcap, direction="outbound")

    return full_pcap, diode_pcap, labels_dict
