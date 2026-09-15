"""
Network traffic simulator for generating realistic network flows.

Generates both benign and attack traffic for testing the threat detection system.
Supports multiple attack types including DDoS, beaconing, DGA, DNS tunneling,
port scanning, data exfiltration, and TLS anomalies.
"""

import ipaddress
import logging
import os
import random
import socket
import threading
import time
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)


def _random_private_ip() -> str:
    """Generate a random private IP address."""
    subnets = [
        ipaddress.ip_network("10.0.0.0/8"),
        ipaddress.ip_network("172.16.0.0/12"),
        ipaddress.ip_network("192.168.0.0/16"),
        ipaddress.ip_network("192.168.1.0/24"),
        ipaddress.ip_network("192.168.0.0/24"),
    ]
    subnet = random.choice(subnets)
    hosts = list(subnet.hosts())
    return str(random.choice(hosts))


def _random_external_ip() -> str:
    """Generate a random external (non-private) IP address."""
    while True:
        ip_parts = [str(random.randint(1, 223)) for _ in range(4)]
        # Avoid private ranges
        first = int(ip_parts[0])
        if first == 10:
            continue
        if first == 172 and 16 <= int(ip_parts[1]) <= 31:
            continue
        if first == 192 and int(ip_parts[1]) == 168:
            continue
        if first == 127:
            continue
        return ".".join(ip_parts)


def _random_ip() -> str:
    """Generate a random IP address (70% external, 30% internal)."""
    if random.random() < 0.3:
        return _random_private_ip()
    return _random_external_ip()


def _random_domain() -> str:
    """Generate a realistic domain name."""
    prefixes = [
        "app", "api", "cdn", "mail", "smtp", "ftp", "vpn", "proxy",
        "gateway", "router", "server", "client", "node", "edge", "core",
        "data", "web", "cloud", "srv", "gw", "mx", "ns", "db",
        "auth", "login", "portal", "admin", "api", "static", "media",
    ]
    domains = [
        "company.com", "corp.net", "enterprise.org", "business.io",
        "services.co", "solutions.tech", "platform.dev", "infra.net",
        "cdn.net", "cloudprovider.com", "emailservice.io", "authservice.com",
        "cdn.jsdelivr.net", "unpkg.com", "cloudflare.com", "akamai.net",
        "amazonaws.com", "microsoft.com", "google.com", "apple.com",
    ]
    prefix = random.choice(prefixes)
    domain = random.choice(domains)
    if random.random() > 0.5:
        prefix += str(random.randint(1, 99))
    return f"{prefix}.{domain}"


def _random_dga_domain() -> str:
    """Generate a DGA-like domain name."""
    tlds = [".com", ".net", ".org", ".xyz", ".tk", ".top", ".info", ".biz"]
    consonants = "bcdfghjklmnpqrstvwxyz"
    vowels = "aeiou"

    length = random.randint(10, 25)
    name = ""
    for i in range(length):
        if i % 3 == 0:
            name += random.choice(consonants)
        elif i % 3 == 1:
            name += random.choice(vowels)
        else:
            name += random.choice(consonants + vowels)

    # Occasionally add a random number
    if random.random() > 0.7:
        name += str(random.randint(0, 999))

    return name + random.choice(tlds)


def _random_user_agent() -> tuple[str, bool]:
    """Return a (user_agent, is_known) tuple."""
    known_uas = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
        "curl/8.4.0",
        "python-requests/2.31.0",
        "Wget/1.21.4",
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "PostmanRuntime/7.32.3",
    ]
    suspicious_uas = [
        "Mozilla/5.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)",
        "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)",
        "",
        "A",
        "Test/1.0",
        "Python/3.11 aiohttp/3.9.0",
        "Go-http-client/1.1",
    ]
    if random.random() > 0.15:
        return random.choice(known_uas), True
    return random.choice(suspicious_uas), False


class TrafficSimulator:
    """Network traffic simulator that generates realistic flows.

    Generates both normal and attack traffic patterns for testing
    the threat detection system. Runs a background thread to continuously
    produce flows at configurable rates.
    """

    # Well-known JA3 hashes for common clients
    KNOWN_JA3 = [
        "771,5-29-23-30-256-0-10-11-9-100-98-63-51-43-45-41",
        "772,5-29-23-30-256-0-10-11-9-100-98-63-51-43-45-41",
        "771,47-53-5-10-131-72-63-51-43-45-41",
        "772,47-53-5-10-131-72-63-51-43-45-41",
    ]
    SUSPICIOUS_JA3 = [
        "771,4-5-2-8-10-9-7-6-3-1",
        "772,4-5-2-8-10-9-7-6-3-1",
        "769,4-5-2-8-10-9-7-6-3-1",
    ]

    def __init__(self, attack_probability: float = 0.05) -> None:
        """Initialize the simulator.

        Args:
            attack_probability: Probability of generating an attack flow
                instead of benign traffic (0.0 to 1.0).
        """
        self.attack_probability = attack_probability
        self.running = False
        self.thread: threading.Thread | None = None
        self._flow_callbacks: list[Any] = []
        self._counter = 0
        self._lock = threading.Lock()
        self._start_time: float = 0.0
        self._flows_generated = 0

        # State for attack generation
        self._beacon_target: str | None = None
        self._beacon_interval: float = 0.0
        self._beacon_last: float = 0.0
        self._scan_source: str | None = None
        self._scan_ports: list[int] = []
        self._scan_idx: int = 0

    def start(self) -> None:
        """Start the background traffic generation thread."""
        if self.running:
            return
        self.running = True
        self._start_time = time.time()
        self.thread = threading.Thread(target=self._generation_loop, daemon=True)
        self.thread.start()
        logger.info("Traffic simulator started")

    def stop(self) -> None:
        """Stop the background traffic generation thread."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=2.0)
            self.thread = None
        logger.info("Traffic simulator stopped")

    def on_flow(self, callback: Any) -> None:
        """Register a callback to receive generated flows.

        Args:
            callback: Function that accepts a flow dict.
        """
        self._flow_callbacks.append(callback)

    def _emit(self, flow: dict) -> None:
        """Send a flow to all registered callbacks."""
        for cb in self._flow_callbacks:
            try:
                cb(flow)
            except Exception as e:
                logger.debug(f"Callback error: {e}")

    def _generation_loop(self) -> None:
        """Main generation loop running in background thread."""
        while self.running:
            try:
                flow = self.generate_flow()
                self._flows_generated += 1
                self._emit(flow)

                # Adaptive sleep based on load
                if random.random() < 0.3:
                    # Burst of flows
                    for _ in range(random.randint(1, 5)):
                        flow = self._gen_benign_flow()
                        self._emit(flow)
                        self._flows_generated += 1

                time.sleep(random.uniform(0.01, 0.1))
            except Exception as e:
                logger.debug(f"Generation loop error: {e}")
                time.sleep(0.1)

    def generate_flow(self) -> dict:
        """Generate a single network flow.

        Returns either a benign or attack flow based on configured probability.
        For active attack modes (beaconing, port scanning), may continue
        generating attack-specific flows.

        Returns:
            Flow dictionary with all required fields.
        """
        if random.random() < self.attack_probability:
            return self.inject_attack(random.choice([
                "syn_flood", "udp_flood", "beaconing", "dga",
                "dns_tunnel", "port_scan", "exfiltration", "tls_beaconing",
            ]))
        return self._gen_benign_flow()

    def inject_attack(self, attack_type: str) -> dict:
        """Generate an attack-specific flow.

        Args:
            attack_type: Type of attack to simulate.

        Returns:
            Attack flow dictionary.
        """
        generators = {
            "syn_flood": self._gen_syn_flood,
            "udp_flood": self._gen_udp_flood,
            "beaconing": self._gen_beaconing,
            "dga": self._gen_dga_flow,
            "dns_tunnel": self._gen_dns_tunnel,
            "port_scan": self._gen_port_scan,
            "exfiltration": self._gen_exfiltration,
            "tls_beaconing": self._gen_tls_beaconing,
        }
        generator = generators.get(attack_type, self._gen_benign_flow)
        return generator()

    def _gen_benign_flow(self) -> dict:
        """Generate a realistic benign network flow.

        Returns:
            Benign flow dictionary.
        """
        protocols = ["TCP", "TCP", "TCP", "UDP", "UDP", "ICMP"]
        protocol = random.choice(protocols)

        # Common service ports
        well_known = [22, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 3389, 5432, 3306, 6379]
        ephemeral = list(range(49152, 65535))

        is_request = random.random() > 0.4
        if is_request:
            src_port = random.choice(ephemeral)
            dst_port = random.choice(well_known)
            sent_mult = random.uniform(0.3, 0.8)
        else:
            src_port = random.choice(well_known)
            dst_port = random.choice(ephemeral)
            sent_mult = random.uniform(0.6, 0.95)

        src_ip = _random_ip()
        dst_ip = _random_ip()

        duration = random.uniform(0.001, 30.0)
        packet_count = max(int(random.expovariate(1.0 / 50)), 1)

        if packet_count > 1:
            iat = sorted([random.uniform(0.0001, duration / packet_count * 2)
                          for _ in range(min(packet_count, 20))])
        else:
            iat = [duration]

        base_pkt_size = random.choice([64, 128, 256, 512, 1024, 1400])
        pkt_sizes = [base_pkt_size + random.randint(-20, 100) for _ in range(min(packet_count, 20))]
        pkt_sizes = [max(40, min(s, 1500)) for s in pkt_sizes]

        bytes_sent = int(sum(pkt_sizes[:int(packet_count * sent_mult)]) if pkt_sizes else base_pkt_size)
        bytes_recv = int(sum(pkt_sizes[int(packet_count * sent_mult):]) if pkt_sizes else 0)
        packets_sent = max(int(packet_count * sent_mult), 1)
        packets_recv = packet_count - packets_sent

        is_dns = dst_port == 53
        is_tls = dst_port in (443, 465, 587, 993, 995)
        is_http = dst_port in (80, 8080, 8000, 3000)

        dns_query = ""
        tls_sni = ""
        tls_ja3 = ""
        ua, has_ua = _random_user_agent()

        if is_dns and random.random() > 0.3:
            dns_query = _random_domain()
        if is_tls and random.random() > 0.3:
            tls_sni = _random_domain()
            tls_ja3 = random.choice(self.KNOWN_JA3)

        return {
            "id": self._next_id(),
            "timestamp": time.time(),
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "src_port": src_port,
            "dst_port": dst_port,
            "protocol": protocol,
            "packets_sent": packets_sent,
            "packets_recv": packets_recv,
            "bytes_sent": bytes_sent,
            "bytes_recv": bytes_recv,
            "duration": duration,
            "inter_arrival_times": iat,
            "packet_sizes": pkt_sizes,
            "is_dns": is_dns,
            "is_tls": is_tls,
            "is_http": is_http,
            "dns_query": dns_query,
            "tls_has_sni": bool(tls_sni),
            "tls_ja3_hash": tls_ja3,
            "user_agent": ua,
            "has_known_useragent": has_ua,
            "attack_type": None,
        }

    def _gen_syn_flood(self) -> dict:
        """Generate a SYN flood attack flow (1000+ flows simulated in window).

        Returns:
            SYN flood flow dictionary.
        """
        src_ip = _random_external_ip()
        dst_ip = _random_private_ip()
        target_port = random.choice([80, 443, 22, 3389, 8080])

        return {
            "id": self._next_id(),
            "timestamp": time.time(),
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "src_port": random.randint(1024, 65535),
            "dst_port": target_port,
            "protocol": "TCP",
            "packets_sent": random.randint(1000, 5000),
            "packets_recv": random.randint(0, 50),
            "bytes_sent": random.randint(40000, 200000),
            "bytes_recv": random.randint(0, 2000),
            "duration": random.uniform(0.1, 2.0),
            "inter_arrival_times": [random.uniform(0.00001, 0.001) for _ in range(10)],
            "packet_sizes": [60] * 10,
            "is_dns": False,
            "is_tls": False,
            "is_http": target_port in (80, 8080),
            "dns_query": "",
            "tls_has_sni": False,
            "tls_ja3_hash": "",
            "user_agent": "",
            "has_known_useragent": False,
            "attack_type": "syn_flood",
            "packet_rate": random.randint(1000, 5000),
        }

    def _gen_udp_flood(self) -> dict:
        """Generate a UDP flood attack flow.

        Returns:
            UDP flood flow dictionary.
        """
        return {
            "id": self._next_id(),
            "timestamp": time.time(),
            "src_ip": _random_external_ip(),
            "dst_ip": _random_private_ip(),
            "src_port": random.randint(1024, 65535),
            "dst_port": random.randint(1, 65535),
            "protocol": "UDP",
            "packets_sent": random.randint(500, 5000),
            "packets_recv": 0,
            "bytes_sent": random.randint(50000, 500000),
            "bytes_recv": 0,
            "duration": random.uniform(0.5, 3.0),
            "inter_arrival_times": [random.uniform(0.0001, 0.001) for _ in range(10)],
            "packet_sizes": [random.choice([64, 128, 256, 512]) for _ in range(10)],
            "is_dns": False,
            "is_tls": False,
            "is_http": False,
            "dns_query": "",
            "tls_has_sni": False,
            "tls_ja3_hash": "",
            "user_agent": "",
            "has_known_useragent": False,
            "attack_type": "udp_flood",
        }

    def _gen_beaconing(self) -> dict:
        """Generate a C2 beaconing flow with periodic timing and jitter.

        Returns:
            Beaconing flow dictionary.
        """
        now = time.time()
        interval = random.uniform(30.0, 120.0)  # 30-120 second beacon interval

        return {
            "id": self._next_id(),
            "timestamp": now,
            "src_ip": _random_private_ip(),
            "dst_ip": random.choice([
                "185.220.101.1", "91.219.237.229", "23.129.64.100",
                "198.96.155.3", "103.224.182.251",
            ]),
            "src_port": random.randint(1024, 65535),
            "dst_port": random.choice([443, 8080, 53, 4443]),
            "protocol": random.choice(["TCP", "TCP", "UDP"]),
            "packets_sent": random.randint(3, 15),
            "packets_recv": random.randint(3, 15),
            "bytes_sent": random.randint(100, 1500),
            "bytes_recv": random.randint(100, 1500),
            "duration": random.uniform(0.5, 5.0),
            "inter_arrival_times": [interval + random.uniform(-5.0, 5.0) for _ in range(5)],
            "packet_sizes": [random.randint(50, 200) for _ in range(5)],
            "is_dns": random.random() > 0.7,
            "is_tls": random.random() > 0.4,
            "is_http": False,
            "dns_query": _random_domain() if random.random() > 0.5 else "",
            "tls_has_sni": random.random() > 0.3,
            "tls_ja3_hash": random.choice(self.SUSPICIOUS_JA3),
            "user_agent": "",
            "has_known_useragent": False,
            "attack_type": "beaconing",
            "beacon_interval": interval,
        }

    def _gen_dga_flow(self) -> dict:
        """Generate a flow with a DGA-like DNS query.

        Returns:
            DGA flow dictionary.
        """
        domain = _random_dga_domain()
        return {
            "id": self._next_id(),
            "timestamp": time.time(),
            "src_ip": _random_private_ip(),
            "dst_ip": _random_private_ip(),
            "src_port": random.randint(1024, 65535),
            "dst_port": 53,
            "protocol": "UDP",
            "packets_sent": random.randint(2, 10),
            "packets_recv": random.randint(2, 10),
            "bytes_sent": random.randint(100, 1000),
            "bytes_recv": random.randint(100, 1000),
            "duration": random.uniform(0.01, 1.0),
            "inter_arrival_times": [random.uniform(0.001, 0.01) for _ in range(5)],
            "packet_sizes": [random.randint(50, 300) for _ in range(5)],
            "is_dns": True,
            "is_tls": False,
            "is_http": False,
            "dns_query": domain,
            "tls_has_sni": False,
            "tls_ja3_hash": "",
            "user_agent": "",
            "has_known_useragent": False,
            "attack_type": "dga",
        }

    def _gen_dns_tunnel(self) -> dict:
        """Generate a DNS tunneling flow with suspiciously long queries.

        Returns:
            DNS tunnel flow dictionary.
        """
        # Generate a very long DNS query (typical of DNS tunneling)
        tunnel_data = "".join(random.choice("abcdef0123456789") for _ in range(200))
        domain = f"{tunnel_data}.{random.choice(['example.com', 'test.net', 'data.org'])}"
        # DNS labels max 63 chars
        truncated = domain[:63]

        return {
            "id": self._next_id(),
            "timestamp": time.time(),
            "src_ip": _random_private_ip(),
            "dst_ip": _random_external_ip(),
            "src_port": random.randint(1024, 65535),
            "dst_port": 53,
            "protocol": "UDP",
            "packets_sent": random.randint(10, 100),
            "packets_recv": random.randint(10, 100),
            "bytes_sent": random.randint(5000, 50000),
            "bytes_recv": random.randint(500, 5000),
            "duration": random.uniform(1.0, 30.0),
            "inter_arrival_times": [random.uniform(0.01, 0.5) for _ in range(10)],
            "packet_sizes": [random.randint(500, 1400) for _ in range(10)],
            "is_dns": True,
            "is_tls": False,
            "is_http": False,
            "dns_query": truncated,
            "tls_has_sni": False,
            "tls_ja3_hash": "",
            "user_agent": "",
            "has_known_useragent": False,
            "attack_type": "dns_tunnel",
        }

    def _gen_port_scan(self) -> dict:
        """Generate a port scanning flow (sequential probes from single source).

        Returns:
            Port scan flow dictionary.
        """
        if not self._scan_source or self._scan_idx >= len(self._scan_ports):
            self._scan_source = _random_private_ip()
            self._scan_target = _random_external_ip()
            self._scan_ports = list(range(1, 1025))
            random.shuffle(self._scan_ports)
            self._scan_idx = 0

        src_ip = self._scan_source
        dst_ip = self._scan_target
        dst_port = self._scan_ports[self._scan_idx]
        self._scan_idx += 1

        return {
            "id": self._next_id(),
            "timestamp": time.time(),
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "src_port": random.randint(1024, 65535),
            "dst_port": dst_port,
            "protocol": random.choice(["TCP", "TCP", "UDP"]),
            "packets_sent": random.randint(1, 3),
            "packets_recv": random.choice([0, 0, 0, 1]),
            "bytes_sent": random.randint(40, 120),
            "bytes_recv": random.choice([0, 60]),
            "duration": random.uniform(0.001, 0.5),
            "inter_arrival_times": [random.uniform(0.001, 0.05) for _ in range(3)],
            "packet_sizes": [40, 44, 48],
            "is_dns": False,
            "is_tls": False,
            "is_http": False,
            "dns_query": "",
            "tls_has_sni": False,
            "tls_ja3_hash": "",
            "user_agent": "",
            "has_known_useragent": False,
            "attack_type": "port_scan",
        }

    def _gen_exfiltration(self) -> dict:
        """Generate a data exfiltration flow (large outbound with high bytes_ratio).

        Returns:
            Exfiltration flow dictionary.
        """
        return {
            "id": self._next_id(),
            "timestamp": time.time(),
            "src_ip": _random_private_ip(),
            "dst_ip": _random_external_ip(),
            "src_port": random.randint(1024, 65535),
            "dst_port": random.choice([443, 8080, 53, 4443, 21]),
            "protocol": random.choice(["TCP", "UDP"]),
            "packets_sent": random.randint(500, 5000),
            "packets_recv": random.randint(0, 50),
            "bytes_sent": random.randint(500000, 50000000),
            "bytes_recv": random.randint(0, 5000),
            "duration": random.uniform(30.0, 300.0),
            "inter_arrival_times": [random.uniform(0.01, 0.1) for _ in range(10)],
            "packet_sizes": [random.randint(1000, 1400) for _ in range(10)],
            "is_dns": False,
            "is_tls": random.random() > 0.3,
            "is_http": False,
            "dns_query": "",
            "tls_has_sni": random.random() > 0.3,
            "tls_ja3_hash": random.choice(self.SUSPICIOUS_JA3 + self.KNOWN_JA3),
            "user_agent": "",
            "has_known_useragent": False,
            "attack_type": "exfiltration",
        }

    def _gen_tls_beaconing(self) -> dict:
        """Generate a TLS beaconing flow with suspicious JA3 fingerprint.

        Returns:
            TLS beaconing flow dictionary.
        """
        now = time.time()

        return {
            "id": self._next_id(),
            "timestamp": now,
            "src_ip": _random_private_ip(),
            "dst_ip": random.choice([
                "185.220.101.1", "91.219.237.229", "23.129.64.100",
                "198.96.155.3", "103.224.182.251", "45.33.32.156",
            ]),
            "src_port": random.randint(1024, 65535),
            "dst_port": random.choice([443, 8443]),
            "protocol": "TCP",
            "packets_sent": random.randint(10, 60),
            "packets_recv": random.randint(10, 60),
            "bytes_sent": random.randint(200, 3000),
            "bytes_recv": random.randint(200, 3000),
            "duration": random.uniform(1.0, 10.0),
            "inter_arrival_times": [random.uniform(30.0, 120.0) for _ in range(5)],
            "packet_sizes": [random.randint(80, 300) for _ in range(5)],
            "is_dns": False,
            "is_tls": True,
            "is_http": False,
            "dns_query": "",
            "tls_has_sni": random.random() > 0.3,
            "tls_ja3_hash": random.choice(self.SUSPICIOUS_JA3),
            "user_agent": "",
            "has_known_useragent": False,
            "attack_type": "tls_beaconing",
        }

    def _next_id(self) -> int:
        """Generate a unique flow ID.

        Returns:
            Integer flow ID.
        """
        with self._lock:
            self._counter += 1
            return self._counter

    def get_stats(self) -> dict:
        """Get simulator statistics.

        Returns:
            Dictionary with uptime, flows_generated, and running status.
        """
        uptime = time.time() - self._start_time if self._start_time else 0.0
        return {
            "running": self.running,
            "uptime_sec": uptime,
            "flows_generated": self._flows_generated,
            "attack_probability": self.attack_probability,
        }


def generate_sample_data(num_flows: int = 1000, output_path: str | None = None) -> list[dict]:
    """Generate sample flow data for demo/testing purposes.

    Creates a list of flows with a mix of benign and attack traffic
    suitable for demonstrating the detection system.

    Args:
        num_flows: Number of flows to generate.
        output_path: Optional file path to save flows as JSON.

    Returns:
        List of flow dictionaries.
    """
    import json

    sim = TrafficSimulator(attack_probability=0.1)
    flows: list[dict] = []

    # Override emit to capture flows
    original_emit = sim._emit
    captured: list[dict] = []

    def capture_emit(flow: dict) -> None:
        captured.append(flow)
        original_emit(flow)

    sim._emit = capture_emit  # type: ignore[method-assign]

    # Generate flows in bursts
    for batch in range(num_flows // 10):
        for _ in range(10):
            flow = sim.generate_flow()
            flows.append(flow)
        # Occasionally inject attacks
        if random.random() < 0.15:
            attack_types = [
                "syn_flood", "udp_flood", "beaconing", "dga",
                "dns_tunnel", "port_scan", "exfiltration", "tls_beaconing",
            ]
            attack = sim.inject_attack(random.choice(attack_types))
            flows.append(attack)

    sim.stop()

    if output_path:
        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(flows, f, indent=2, default=str)
        logger.info(f"Saved {len(flows)} flows to {output_path}")

    attack_count = sum(1 for f in flows if f.get("attack_type"))
    logger.info(
        f"Generated {len(flows)} flows ({attack_count} attacks, "
        f"{len(flows) - attack_count} benign)"
    )

    return flows
