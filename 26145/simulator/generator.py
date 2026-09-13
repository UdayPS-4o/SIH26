import random
import time
import csv
import json
import base64
import string
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from enum import Enum


class Protocol(Enum):
    TCP = 6
    UDP = 17
    ICMP = 1


@dataclass
class Flow:
    timestamp: float
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: int
    bytes_sent: int
    bytes_recv: int
    packets: int
    duration: float
    dns_query: Optional[str] = None
    tls_fingerprint: Optional[str] = None
    is_attack: bool = False
    attack_type: Optional[str] = None


class TrafficGenerator:
    """Generates realistic network traffic for testing a cyber threat detection system.

    Produces both benign flows (web browsing, DNS, email, streaming, file transfer)
    and attack flows (SYN floods, UDP floods, beaconing, DGA, port scans, exfiltration,
    DNS tunneling, TLS beaconing) for training and evaluating detection models.
    """

    # Common service ports observed in real enterprise networks.
    COMMON_PORTS: List[int] = [
        20, 21, 22, 23, 25, 53, 80, 110, 143, 443,
        465, 993, 995, 1433, 1521, 3306, 3389, 5432,
        5900, 6379, 8080, 8443, 8888, 9090,
    ]

    # High ephemeral port range used by clients.
    EPHEMERAL_PORTS: List[int] = list(range(49152, 65535))

    # Benign domain pools by traffic category.
    DOMAIN_POOLS: Dict[str, List[str]] = {
        "web_browsing": [
            "google.com", "microsoft.com", "apple.com", "amazon.com",
            "facebook.com", "youtube.com", "github.com", "stackoverflow.com",
            "linkedin.com", "twitter.com", "reddit.com", "wikipedia.org",
            "cloudflare.com", "akamai.net", "office365.microsoft.com",
            "drive.google.com", "docs.google.com", "outlook.office.com",
            "login.microsoftonline.com", "api.github.com",
        ],
        "dns_query": [
            "google.com", "cloudflare.com", "quad9.net", "opendns.com",
            "microsoft.com", "apple.com", "amazon.com", "ubuntu.com",
            "github.com", "npmjs.org", "pypi.org", "docker.io",
        ],
        "email": [
            "outlook.office365.com", "gmail.com", "smtp.office365.com",
            "imap.gmail.com", "pop.gmail.com", "mail.yahoo.com",
            "smtp.mailgun.org", "mailchimp.com",
        ],
        "streaming": [
            "netflix.com", "youtube.com", "spotify.com", "twitch.tv",
            "primevideo.com", "disneyplus.com", "hulu.com", "soundcloud.com",
        ],
        "file_transfer": [
            "ftp.microsoft.com", "sftp.github.com", "transfer.sh",
            "we.tl", "dropbox.com", "onedrive.live.com",
        ],
    }

    # Suspicious C2 server IPs used in attack flows.
    C2_SERVER_IPS: List[str] = [
        "185.220.101.34", "91.219.236.18", "194.165.16.103",
        "23.129.64.100", "198.96.155.3", "5.188.86.184",
        "103.224.182.246", "192.42.116.41", "89.248.165.236",
        "91.215.85.63", "199.249.230.126", "212.47.231.90",
    ]

    # JA3 fingerprints for common TLS clients (real-world hashes).
    BENIGN_JA3_FINGERPRINTS: List[str] = [
        "771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-34-51-43-13-45-28-21,29-23-24-25-256-257,0",
        "772,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-34-51-43-13-45-28-21,29-23-24-25-256-257,0",
        "768,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-34-51-43-13-45-28-21,29-23-24-25-256-257,0",
    ]

    # Unusual JA3 fingerprints used by malware/botnets.
    MALWARE_JA3_FINGERPRINTS: List[str] = [
        "769,47-53-5-10-131-72-178-132-132-129-132-132-11-10-35-65281-65281-65281-65281,0-11-10-35,29-23-24-25-256-257,0",
        "770,49196-49200-159-52393-52392-16501-16500-571-572-576-575-51503-51502-157-156-53-47-10-11,0-23-65281-10-11,29-23-24-25-256-257,0",
    ]

    # Private IPv4 prefixes used for internal hosts.
    _PRIVATE_PREFIXES: List[str] = [
        "10.", "172.16.", "172.17.", "172.18.", "172.19.",
        "172.20.", "172.21.", "172.22.", "172.23.", "172.24.",
        "172.25.", "172.26.", "172.27.", "172.28.", "172.29.",
        "172.30.", "172.31.", "192.168.",
    ]

    # Public IPv4 prefixes for external servers.
    _PUBLIC_PREFIXES: List[str] = [
        "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.",
        "9.", "11.", "23.", "34.", "52.", "54.", "64.", "65.",
        "104.", "108.", "128.", "136.", "151.", "157.", "162.",
        "174.", "185.", "198.", "216.",
    ]

    def __init__(self, benign_ratio: float = 0.95, seed: Optional[int] = None) -> None:
        """Initialize the traffic generator with configuration.

        Args:
            benign_ratio: Fraction of flows that should be benign.
            seed: Optional random seed for reproducible output.
        """
        if seed is not None:
            random.seed(seed)

        self.benign_ratio = benign_ratio

        # Pre-generate pools of IPs to avoid recomputing every call.
        self._private_ip_pool: List[str] = self._build_ip_pool(self._PRIVATE_PREFIXES, count=200)
        self._public_ip_pool: List[str] = self._build_ip_pool(self._PUBLIC_PREFIXES, count=300)
        self._internal_hosts: List[str] = self._private_ip_pool[:100]

        # Snapshot timestamp used as a base for generated flow timestamps.
        self._base_timestamp: float = time.time()
        self._flow_counter: int = 0

    # ------------------------------------------------------------------
    # IP address generation
    # ------------------------------------------------------------------
    @staticmethod
    def _build_ip_pool(prefixes: List[str], count: int) -> List[str]:
        """Build a pool of random IPs sharing the given octet prefixes."""
        pool: List[str] = []
        for _ in range(count):
            prefix = random.choice(prefixes)
            remaining_octets = ".".join(str(random.randint(0, 255)) for _ in range(4 - prefix.count(".")))
            pool.append(prefix + remaining_octets)
        return pool

    def generate_ip(self, private: bool = True) -> str:
        """Return a realistic IP address.

        Args:
            private: If True, return an RFC1918 address; otherwise a public one.

        Returns:
            A dotted-quad IPv4 string.
        """
        pool = self._private_ip_pool if private else self._public_ip_pool
        return random.choice(pool)

    # ------------------------------------------------------------------
    # Helper utilities
    # ------------------------------------------------------------------
    @staticmethod
    def _random_port(ephemeral_only: bool = False) -> int:
        """Return a random port number.

        Args:
            ephemeral_only: If True, restrict to the client ephemeral range.
        """
        if ephemeral_only:
            return random.choice(TrafficGenerator.EPHEMERAL_PORTS)
        return random.choice(TrafficGenerator.COMMON_PORTS + TrafficGenerator.EPHEMERAL_PORTS)

    @staticmethod
    def _random_bytes_sent(traffic_type: str) -> int:
        """Return a realistic byte count for the *sent* direction."""
        distributions = {
            "web_browsing": (200, 8000),
            "dns_query": (28, 512),
            "email": (500, 15000),
            "streaming": (1000, 5000),
            "file_transfer": (1024 * 100, 1024 * 1024 * 50),
            "ddos_syn": (40, 80),
            "ddos_udp": (40, 1200),
            "beaconing": (100, 800),
            "exfiltration": (1024 * 1024, 1024 * 1024 * 500),
        }
        low, high = distributions.get(traffic_type, (100, 10000))
        return random.randint(low, high)

    @staticmethod
    def _random_bytes_recv(traffic_type: str) -> int:
        """Return a realistic byte count for the *received* direction."""
        distributions = {
            "web_browsing": (1024 * 5, 1024 * 1024 * 5),
            "dns_query": (28, 512),
            "email": (1000, 20000),
            "streaming": (1024 * 1024, 1024 * 1024 * 20),
            "file_transfer": (1024 * 100, 1024 * 1024 * 50),
            "ddos_syn": (0, 0),
            "ddos_udp": (0, 0),
            "beaconing": (100, 800),
            "exfiltration": (0, 1024 * 100),
        }
        low, high = distributions.get(traffic_type, (100, 10000))
        return random.randint(low, high)

    @staticmethod
    def _random_duration(traffic_type: str) -> float:
        """Return a realistic flow duration in seconds."""
        distributions = {
            "web_browsing": (0.1, 5.0),
            "dns_query": (0.01, 0.2),
            "email": (0.5, 10.0),
            "streaming": (30.0, 3600.0),
            "file_transfer": (1.0, 600.0),
            "ddos_syn": (0.001, 0.05),
            "ddos_udp": (0.001, 0.05),
            "beaconing": (0.5, 3.0),
            "exfiltration": (5.0, 300.0),
        }
        low, high = distributions.get(traffic_type, (0.1, 10.0))
        return random.uniform(low, high)

    @staticmethod
    def _random_domain(pool_name: str) -> str:
        """Pick a domain from the named benign pool."""
        return random.choice(TrafficGenerator.DOMAIN_POOLS.get(pool_name, ["example.com"]))

    @staticmethod
    def _generate_dga_domain() -> str:
        """Generate a random DGA-style domain name."""
        lengths = [8, 9, 10, 11, 12, 13, 14, 15]
        length = random.choice(lengths)
        consonants = "bcdfghjklmnpqrstvwxyz"
        vowels = "aeiou"
        label = "".join(random.choice(vowels if i % 2 else consonants) for i in range(length))
        tlds = [".com", ".org", ".net", ".info", ".xyz", ".top"]
        return label + random.choice(tlds)

    @staticmethod
    def _generate_base64_token(length: int = 40) -> str:
        """Generate a random base64-looking string (for DNS tunneling data)."""
        chars = string.ascii_letters + string.digits + "+/"
        token = "".join(random.choice(chars) for _ in range(length))
        # Pad to a valid base64 length if needed.
        pad = 4 - len(token) % 4
        if pad != 4:
            token += "=" * pad
        return token

    def _next_timestamp(self, jitter_seconds: float = 0.01) -> float:
        """Advance an internal counter and return a timestamp with jitter."""
        self._flow_counter += 1
        base = self._base_timestamp + (self._flow_counter / 1000.0)
        return base + random.uniform(-jitter_seconds, jitter_seconds)

    # ------------------------------------------------------------------
    # Benign traffic
    # ------------------------------------------------------------------
    def generate_benign_flow(self) -> Flow:
        """Generate a single benign flow based on a weighted traffic-type distribution.

        Distribution:
            web_browsing  40 %
            dns_query     25 %
            email         10 %
            streaming     10 %
            file_transfer 10 %
            other          5 %
        """
        traffic_type = random.choices(
            ["web_browsing", "dns_query", "email", "streaming", "file_transfer", "other"],
            weights=[40, 25, 10, 10, 10, 5],
            k=1,
        )[0]

        timestamp = self._next_timestamp()
        src_ip = self.generate_ip(private=True)
        dst_ip = self.generate_ip(private=False)

        if traffic_type == "web_browsing":
            return self._make_web_browsing_flow(timestamp, src_ip, dst_ip)
        if traffic_type == "dns_query":
            return self._make_dns_query_flow(timestamp, src_ip, dst_ip)
        if traffic_type == "email":
            return self._make_email_flow(timestamp, src_ip, dst_ip)
        if traffic_type == "streaming":
            return self._make_streaming_flow(timestamp, src_ip, dst_ip)
        if traffic_type == "file_transfer":
            return self._make_file_transfer_flow(timestamp, src_ip, dst_ip)

        # "other" — generic TCP flow.
        return Flow(
            timestamp=timestamp,
            src_ip=src_ip,
            dst_ip=dst_ip,
            src_port=self._random_port(ephemeral_only=True),
            dst_port=random.choice(self.COMMON_PORTS),
            protocol=Protocol.TCP.value,
            bytes_sent=random.randint(200, 5000),
            bytes_recv=random.randint(200, 5000),
            packets=random.randint(1, 20),
            duration=random.uniform(0.1, 5.0),
        )

    def _make_web_browsing_flow(self, timestamp: float, src_ip: str, dst_ip: str) -> Flow:
        domain = self._random_domain("web_browsing")
        duration = random.uniform(0.1, 5.0)
        return Flow(
            timestamp=timestamp,
            src_ip=src_ip,
            dst_ip=dst_ip,
            src_port=self._random_port(ephemeral_only=True),
            dst_port=random.choice([80, 443]),
            protocol=Protocol.TCP.value,
            bytes_sent=random.randint(200, 8000),
            bytes_recv=random.randint(5 * 1024, 5 * 1024 * 1024),
            packets=random.randint(2, 100),
            duration=duration,
            tls_fingerprint=random.choice(self.BENIGN_JA3_FINGERPRINTS) if random.random() < 0.7 else None,
        )

    def _make_dns_query_flow(self, timestamp: float, src_ip: str, dst_ip: str) -> Flow:
        domain = self._random_domain("dns_query")
        return Flow(
            timestamp=timestamp,
            src_ip=src_ip,
            dst_ip=dst_ip,
            src_port=self._random_port(ephemeral_only=True),
            dst_port=53,
            protocol=Protocol.UDP.value,
            bytes_sent=random.randint(28, 512),
            bytes_recv=random.randint(28, 512),
            packets=1,
            duration=random.uniform(0.01, 0.2),
            dns_query=domain,
        )

    def _make_email_flow(self, timestamp: float, src_ip: str, dst_ip: str) -> Flow:
        return Flow(
            timestamp=timestamp,
            src_ip=src_ip,
            dst_ip=dst_ip,
            src_port=self._random_port(ephemeral_only=True),
            dst_port=random.choice([25, 110, 143, 993, 995]),
            protocol=random.choice([Protocol.TCP.value, Protocol.TCP.value, Protocol.TCP.value, Protocol.TCP.value]),
            bytes_sent=random.randint(500, 15000),
            bytes_recv=random.randint(1000, 20000),
            packets=random.randint(2, 50),
            duration=random.uniform(0.5, 10.0),
        )

    def _make_streaming_flow(self, timestamp: float, src_ip: str, dst_ip: str) -> Flow:
        return Flow(
            timestamp=timestamp,
            src_ip=src_ip,
            dst_ip=dst_ip,
            src_port=self._random_port(ephemeral_only=True),
            dst_port=random.choice([80, 443]),
            protocol=Protocol.TCP.value,
            bytes_sent=random.randint(1 * 1024, 5 * 1024),
            bytes_recv=random.randint(1024 * 1024, 20 * 1024 * 1024),
            packets=random.randint(100, 5000),
            duration=random.uniform(30.0, 3600.0),
        )

    def _make_file_transfer_flow(self, timestamp: float, src_ip: str, dst_ip: str) -> Flow:
        return Flow(
            timestamp=timestamp,
            src_ip=src_ip,
            dst_ip=dst_ip,
            src_port=self._random_port(ephemeral_only=True),
            dst_port=random.choice([20, 21, 22]),
            protocol=random.choice([Protocol.TCP.value, Protocol.UDP.value]),
            bytes_sent=random.randint(100 * 1024, 50 * 1024 * 1024),
            bytes_recv=random.randint(100 * 1024, 50 * 1024 * 1024),
            packets=random.randint(50, 5000),
            duration=random.uniform(1.0, 600.0),
        )

    # ------------------------------------------------------------------
    # Attack traffic generators
    # ------------------------------------------------------------------
    def generate_ddos_syn(self, count: int = 1000, target_ip: Optional[str] = None) -> List[Flow]:
        """Generate a SYN flood attack against a single target.

        Args:
            count: Number of SYN flows to generate in a 1-second window.
            target_ip: Destination IP to attack; chosen from C2 pool if omitted.
        """
        target = target_ip or random.choice(self.C2_SERVER_IPS)
        flows: List[Flow] = []
        base_time = self._next_timestamp()

        for i in range(count):
            timestamp = base_time + (i / count)  # spread over ~1 second
            src_ip = self.generate_ip(private=random.random() < 0.5)
            flows.append(
                Flow(
                    timestamp=timestamp,
                    src_ip=src_ip,
                    dst_ip=target,
                    src_port=random.randint(1024, 65535),
                    dst_port=random.choice([80, 443]),
                    protocol=Protocol.TCP.value,
                    bytes_sent=random.randint(40, 80),
                    bytes_recv=0,
                    packets=1,
                    duration=random.uniform(0.001, 0.05),
                    is_attack=True,
                    attack_type="ddos_syn_flood",
                )
            )
        return flows

    def generate_ddos_udp(self, count: int = 1000, target_ip: Optional[str] = None) -> List[Flow]:
        """Generate a UDP flood attack.

        Args:
            count: Number of UDP flows to generate in a 1-second window.
            target_ip: Destination IP to attack.
        """
        target = target_ip or random.choice(self.C2_SERVER_IPS)
        flows: List[Flow] = []
        base_time = self._next_timestamp()

        for i in range(count):
            timestamp = base_time + (i / count)
            src_ip = self.generate_ip(private=random.random() < 0.5)
            flows.append(
                Flow(
                    timestamp=timestamp,
                    src_ip=src_ip,
                    dst_ip=target,
                    src_port=random.randint(1024, 65535),
                    dst_port=random.randint(1, 65535),
                    protocol=Protocol.UDP.value,
                    bytes_sent=random.randint(40, 1200),
                    bytes_recv=0,
                    packets=random.randint(1, 5),
                    duration=random.uniform(0.001, 0.05),
                    is_attack=True,
                    attack_type="ddos_udp_flood",
                )
            )
        return flows

    def generate_beaconing(self, count: int = 10, base_interval: float = 60.0, src_ip: Optional[str] = None, dst_ip: Optional[str] = None) -> List[Flow]:
        """Generate botnet beaconing flows (periodic callbacks to C2).

        Args:
            count: Number of beacon flows to generate.
            base_interval: Seconds between consecutive beacons.
            src_ip: Infected host IP.
            dst_ip: C2 server IP.
        """
        source = src_ip or self.generate_ip(private=True)
        c2 = dst_ip or random.choice(self.C2_SERVER_IPS)
        flows: List[Flow] = []
        timestamp = self._next_timestamp()

        for _ in range(count):
            jitter = random.uniform(-base_interval * 0.1, base_interval * 0.1)
            timestamp += base_interval + jitter
            flows.append(
                Flow(
                    timestamp=timestamp,
                    src_ip=source,
                    dst_ip=c2,
                    src_port=random.choice(self.EPHEMERAL_PORTS),
                    dst_port=random.choice([443, 8080, 8443]),
                    protocol=Protocol.TCP.value,
                    bytes_sent=random.randint(100, 800),
                    bytes_recv=random.randint(100, 800),
                    packets=random.randint(2, 10),
                    duration=random.uniform(0.5, 3.0),
                    tls_fingerprint=random.choice(self.MALWARE_JA3_FINGERPRINTS),
                    is_attack=True,
                    attack_type="botnet_beaconing",
                )
            )
        return flows

    def generate_dga_flows(self, count: int = 20, src_ip: Optional[str] = None) -> List[Flow]:
        """Generate DNS flows for algorithmically generated (DGA) domains.

        Args:
            count: Number of DGA DNS flows to generate.
            src_ip: Source host IP.
        """
        source = src_ip or self.generate_ip(private=True)
        dns_server = self.generate_ip(private=False)
        flows: List[Flow] = []
        timestamp = self._next_timestamp()

        for _ in range(count):
            timestamp += random.uniform(0.01, 0.5)
            domain = self._generate_dga_domain()
            flows.append(
                Flow(
                    timestamp=timestamp,
                    src_ip=source,
                    dst_ip=dns_server,
                    src_port=self._random_port(ephemeral_only=True),
                    dst_port=53,
                    protocol=Protocol.UDP.value,
                    bytes_sent=random.randint(28, 512),
                    bytes_recv=random.randint(28, 512),
                    packets=1,
                    duration=random.uniform(0.01, 0.2),
                    dns_query=domain,
                    is_attack=True,
                    attack_type="dga_domains",
                )
            )
        return flows

    def generate_dns_tunnel(self, count: int = 10, src_ip: Optional[str] = None) -> List[Flow]:
        """Generate DNS tunneling flows with abnormally long query names.

        Args:
            count: Number of tunneling flows.
            src_ip: Source (compromised) host.
        """
        source = src_ip or self.generate_ip(private=True)
        dns_server = self.generate_ip(private=False)
        flows: List[Flow] = []
        timestamp = self._next_timestamp()

        for _ in range(count):
            timestamp += random.uniform(0.1, 1.0)
            encoded_data = self._generate_base64_token(length=random.randint(50, 200))
            subdomain = encoded_data.lower().replace("=", "")[: random.randint(50, 80)]
            domain = f"{subdomain}.tunnel.example.com"
            flows.append(
                Flow(
                    timestamp=timestamp,
                    src_ip=source,
                    dst_ip=dns_server,
                    src_port=self._random_port(ephemeral_only=True),
                    dst_port=53,
                    protocol=Protocol.UDP.value,
                    bytes_sent=random.randint(200, 1500),
                    bytes_recv=random.randint(200, 1500),
                    packets=random.randint(1, 3),
                    duration=random.uniform(0.05, 0.5),
                    dns_query=domain,
                    is_attack=True,
                    attack_type="dns_tunneling",
                )
            )
        return flows

    def generate_port_scan(self, count: int = 50, src_ip: Optional[str] = None, target_ip: Optional[str] = None) -> List[Flow]:
        """Generate sequential port-scan flows from a single source.

        Args:
            count: Number of ports to scan (ports 1..count).
            src_ip: Attacker IP.
            target_ip: Target IP.
        """
        source = src_ip or self.generate_ip(private=False)
        target = target_ip or self.generate_ip(private=True)
        flows: List[Flow] = []
        timestamp = self._next_timestamp()

        for port in range(1, count + 1):
            timestamp += random.uniform(0.001, 0.02)
            flows.append(
                Flow(
                    timestamp=timestamp,
                    src_ip=source,
                    dst_ip=target,
                    src_port=random.choice(self.EPHEMERAL_PORTS),
                    dst_port=port,
                    protocol=random.choice([Protocol.TCP.value, Protocol.UDP.value]),
                    bytes_sent=random.randint(40, 200),
                    bytes_recv=random.randint(0, 150),
                    packets=random.randint(1, 3),
                    duration=random.uniform(0.001, 0.05),
                    is_attack=True,
                    attack_type="port_scan",
                )
            )
        return flows

    def generate_exfiltration(self, count: int = 5, src_ip: Optional[str] = None) -> List[Flow]:
        """Generate large outbound flows indicative of data exfiltration.

        Args:
            count: Number of exfiltration flows.
            src_ip: Compromised internal host.
        """
        source = src_ip or self.generate_ip(private=True)
        external_dst = self.generate_ip(private=False)
        flows: List[Flow] = []
        timestamp = self._next_timestamp()

        for _ in range(count):
            timestamp += random.uniform(1.0, 10.0)
            sent = random.randint(1024 * 1024, 500 * 1024 * 1024)
            recv = random.randint(0, sent // 20)  # bytes_recv much smaller than bytes_sent
            flows.append(
                Flow(
                    timestamp=timestamp,
                    src_ip=source,
                    dst_ip=external_dst,
                    src_port=random.choice([443, 8080, 8443]),
                    dst_port=random.choice([443, 53]),
                    protocol=random.choice([Protocol.TCP.value, Protocol.TCP.value, Protocol.TCP.value]),
                    bytes_sent=sent,
                    bytes_recv=recv,
                    packets=random.randint(1000, 50000),
                    duration=random.uniform(5.0, 300.0),
                    is_attack=True,
                    attack_type="data_exfiltration",
                )
            )
        return flows

    def generate_tls_beaconing(self, count: int = 10, src_ip: Optional[str] = None) -> List[Flow]:
        """Generate periodic TLS handshake flows to suspicious destinations.

        Args:
            count: Number of TLS beacon flows.
            src_ip: Source host.
        """
        source = src_ip or self.generate_ip(private=True)
        dst = random.choice(self.C2_SERVER_IPS)
        flows: List[Flow] = []
        timestamp = self._next_timestamp()
        base_interval = 30.0

        for _ in range(count):
            timestamp += base_interval + random.uniform(-3.0, 3.0)
            flows.append(
                Flow(
                    timestamp=timestamp,
                    src_ip=source,
                    dst_ip=dst,
                    src_port=self._random_port(ephemeral_only=True),
                    dst_port=random.choice([443, 8443]),
                    protocol=Protocol.TCP.value,
                    bytes_sent=random.randint(200, 2000),
                    bytes_recv=random.randint(200, 2000),
                    packets=random.randint(3, 15),
                    duration=random.uniform(0.5, 2.0),
                    tls_fingerprint=random.choice(self.MALWARE_JA3_FINGERPRINTS),
                    is_attack=True,
                    attack_type="tls_beaconing",
                )
            )
        return flows

    # ------------------------------------------------------------------
    # Burst / mixed traffic
    # ------------------------------------------------------------------
    def generate_traffic_burst(self, duration: float = 1.0, flows_per_sec: int = 1000) -> List[Flow]:
        """Generate a burst of mixed benign and attack traffic.

        Args:
            duration: Seconds over which flows are spread.
            flows_per_sec: Average rate of flow generation.

        Returns:
            List of generated Flow objects.
        """
        total_flows = int(duration * flows_per_sec)
        flows: List[Flow] = []

        for _ in range(total_flows):
            if random.random() < self.benign_ratio:
                flows.append(self.generate_benign_flow())
            else:
                attack_type = random.choice(
                    ["ddos_syn", "ddos_udp", "beaconing", "dga", "port_scan", "exfiltration", "dns_tunnel", "tls_beaconing"]
                )
                if attack_type == "ddos_syn":
                    flows.extend(self.generate_ddos_syn(count=1))
                elif attack_type == "ddos_udp":
                    flows.extend(self.generate_ddos_udp(count=1))
                elif attack_type == "beaconing":
                    flows.extend(self.generate_beaconing(count=1))
                elif attack_type == "dga":
                    flows.extend(self.generate_dga_flows(count=1))
                elif attack_type == "port_scan":
                    flows.extend(self.generate_port_scan(count=1))
                elif attack_type == "exfiltration":
                    flows.extend(self.generate_exfiltration(count=1))
                elif attack_type == "dns_tunnel":
                    flows.extend(self.generate_dns_tunnel(count=1))
                elif attack_type == "tls_beaconing":
                    flows.extend(self.generate_tls_beaconing(count=1))

        return flows

    # ------------------------------------------------------------------
    # Export
    # ------------------------------------------------------------------
    def export_csv(self, flows: List[Flow], filename: str) -> None:
        """Write a list of flows to a CSV file.

        Args:
            flows: Flow objects to serialize.
            filename: Destination file path.
        """
        if not flows:
            return
        fieldnames = list(Flow.__dataclass_fields__.keys())
        with open(filename, "w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=fieldnames)
            writer.writeheader()
            for flow in flows:
                writer.writerow(asdict(flow))

    def export_json(self, flows: List[Flow], filename: str) -> None:
        """Write a list of flows to a JSON file (JSON Lines format).

        Args:
            flows: Flow objects to serialize.
            filename: Destination file path.
        """
        with open(filename, "w", encoding="utf-8") as fh:
            for flow in flows:
                fh.write(json.dumps(asdict(flow), default=str) + "\n")

    # ------------------------------------------------------------------
    # Statistics
    # ------------------------------------------------------------------
    def generate_stats(self, flows: List[Flow]) -> Dict:
        """Compute summary statistics for a list of flows.

        Returns:
            Dictionary with total, benign, and attack breakdowns.
        """
        total = len(flows)
        benign = sum(1 for f in flows if not f.is_attack)
        attack = total - benign

        attack_type_counts: Dict[str, int] = {}
        for flow in flows:
            if flow.is_attack and flow.attack_type:
                attack_type_counts[flow.attack_type] = attack_type_counts.get(flow.attack_type, 0) + 1

        protocols: Dict[str, int] = {}
        for flow in flows:
            protocols[str(flow.protocol)] = protocols.get(str(flow.protocol), 0) + 1

        return {
            "total_flows": total,
            "benign_count": benign,
            "attack_count": attack,
            "attack_ratio": round(attack / total, 4) if total else 0.0,
            "attack_types": attack_type_counts,
            "protocols": protocols,
            "total_bytes_sent": sum(f.bytes_sent for f in flows),
            "total_bytes_recv": sum(f.bytes_recv for f in flows),
            "time_span_seconds": round(
                (max(f.timestamp for f in flows) - min(f.timestamp for f in flows)), 3
            )
            if flows
            else 0.0,
        }
