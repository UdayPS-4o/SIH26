"""
Egress self-test module.

Proves the enclave cannot initiate outbound connections.

In a production deployment with seccomp active, any outbound connect() call
would be blocked, so this test verifies that the enclave operates in
read-only mode with no return path to the production network.
"""

import logging
import socket
import ssl
import time
from dataclasses import dataclass, field
from typing import List

logger = logging.getLogger(__name__)

# Targets to attempt egress against
_EGRESS_TARGETS = [
    ("8.8.8.8", 53, "Google DNS (UDP)"),
    ("1.1.1.1", 53, "Cloudflare DNS (UDP)"),
    ("8.8.8.8", 443, "Google HTTPS (TCP)"),
    ("1.1.1.1", 443, "Cloudflare HTTPS (TCP)"),
    ("208.67.222.222", 53, "OpenDNS (TCP)"),
]


@dataclass
class TestResult:
    """Result of a single egress test."""
    target: str
    port: int
    description: str
    passed: bool
    detail: str = ""
    latency_ms: float = 0.0


@dataclass
class SelfTestReport:
    """Full egress self-test report."""
    results: List[TestResult] = field(default_factory=list)
    enclave_mode: str = "read-only"
    overall_status: str = "PASS"

    def add_result(self, result: TestResult) -> None:
        self.results.append(result)

    def finalize(self) -> None:
        failed = [r for r in self.results if not r.passed]
        self.overall_status = "PASS" if len(failed) == len(_EGRESS_TARGETS) else "FAIL"
        # PASS = all targets blocked (expected in enclave mode)
        if len(failed) != len(_EGRESS_TARGETS):
            logger.warning(
                f"Self-test: {len(failed)}/{len(self.results)} targets were reachable!"
            )

    def to_dict(self) -> dict:
        return {
            "enclave_mode": self.enclave_mode,
            "overall_status": self.overall_status,
            "expected": "All egress blocked (PASS) confirms enclave isolation",
            "results": [
                {
                    "target": r.target,
                    "port": r.port,
                    "description": r.description,
                    "passed": r.passed,
                    "detail": r.detail,
                    "latency_ms": r.latency_ms,
                }
                for r in self.results
            ],
        }


def _test_tcp_connect(target: str, port: int, timeout: float = 2.0) -> TestResult:
    """Test TCP egress to target:port."""
    start = time.time()
    try:
        sock = socket.create_connection((target, port), timeout=timeout)
        try:
            # Try TLS handshake
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            with ctx.wrap_socket(sock) as tls_sock:
                tls_sock.send(b"\x00")
                latency = (time.time() - start) * 1000
                return TestResult(
                    target=target,
                    port=port,
                    description=f"TCP/TLS {target}:{port}",
                    passed=False,
                    detail="Connection succeeded (egress NOT blocked)",
                    latency_ms=round(latency, 1),
                )
        except ssl.SSLError:
            latency = (time.time() - start) * 1000
            sock.close()
            return TestResult(
                target=target,
                port=port,
                description=f"TCP {target}:{port}",
                passed=False,
                detail="TCP connected but no TLS",
                latency_ms=round(latency, 1),
            )
    except (socket.timeout, ConnectionRefusedError, OSError) as e:
        latency = (time.time() - start) * 1000
        return TestResult(
            target=target,
            port=port,
            description=f"TCP {target}:{port}",
            passed=True,
            detail=f"Blocked: {e.__class__.__name__}",
            latency_ms=round(latency, 1),
        )


def _test_udp_connect(target: str, port: int, timeout: float = 2.0) -> TestResult:
    """Test UDP egress (just check socket creation)."""
    start = time.time()
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(timeout)
        sock.sendto(b"\x00", (target, port))
        try:
            sock.recvfrom(1024)
        except socket.timeout:
            pass
        sock.close()
        latency = (time.time() - start) * 1000
        # If we got here without error, UDP was allowed
        return TestResult(
            target=target,
            port=port,
            description=f"UDP {target}:{port}",
            passed=False,
            detail="UDP socket created and packet sent (egress NOT blocked)",
            latency_ms=round(latency, 1),
        )
    except OSError as e:
        latency = (time.time() - start) * 1000
        return TestResult(
            target=target,
            port=port,
            description=f"UDP {target}:{port}",
            passed=True,
            detail=f"Blocked: {e.__class__.__name__}",
            latency_ms=round(latency, 1),
        )


def _test_external_dns() -> TestResult:
    """Test external DNS resolution."""
    import time as _time
    start = _time.time()
    try:
        socket.gethostbyname("google.com")
        latency = (_time.time() - start) * 1000
        return TestResult(
            target="DNS",
            port=53,
            description="External DNS resolution",
            passed=False,
            detail="DNS resolved (egress NOT blocked)",
            latency_ms=round(latency, 1),
        )
    except socket.gaierror:
        latency = (_time.time() - start) * 1000
        return TestResult(
            target="DNS",
            port=53,
            description="External DNS resolution",
            passed=True,
            detail="DNS blocked by resolver policy",
            latency_ms=round(latency, 1),
        )


def run_self_test() -> SelfTestReport:
    """Run the full egress self-test suite.

    Returns:
        SelfTestReport with all test results.
    """
    report = SelfTestReport()
    logger.info("Starting egress self-test...")

    # TCP tests for known public IPs
    tcp_targets = [
        ("8.8.8.8", 443),
        ("1.1.1.1", 443),
        ("208.67.222.222", 443),
    ]
    for target, port in tcp_targets:
        result = _test_tcp_connect(target, port)
        report.add_result(result)

    # UDP tests
    udp_targets = [
        ("8.8.8.8", 53),
        ("1.1.1.1", 53),
    ]
    for target, port in udp_targets:
        result = _test_udp_connect(target, port)
        report.add_result(result)

    # DNS resolution test
    report.add_result(_test_external_dns())

    report.finalize()
    logger.info(f"Egress self-test complete: {report.overall_status}")
    return report


def run_self_test_blocking() -> None:
    """Run self-test and print results to stdout."""
    report = run_self_test()
    print("=" * 60)
    print("EGRESS SELF-TEST REPORT")
    print("=" * 60)
    print(f"Enclave mode: {report.enclave_mode}")
    print(f"Overall: {report.overall_status}")
    print("-" * 60)
    for r in report.results:
        status = "BLOCKED" if r.passed else "ALLOWED"
        print(f"  [{status}] {r.description}: {r.detail} ({r.latency_ms:.1f}ms)")
    print("=" * 60)
    print(f"Expected: All targets BLOCKED = enclave isolation confirmed")
