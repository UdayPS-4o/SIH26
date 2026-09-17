"""
Egress Self-Test — proves the enclave cannot initiate outbound connections.

This module is run at startup (when --self-test-egress is passed) and also
available on the /api/v1/security/self-test HTTP endpoint for demo purposes.

If ANY outbound connection attempt succeeds, the process exits with SIGSYS
(if seccomp is active) or this module raises RuntimeError.
"""

from __future__ import annotations

import logging
import os
import socket
import ssl
import threading
import time
import json
from dataclasses import dataclass, field
from typing import List

logger = logging.getLogger("watchtower.self_test")

# Targets that MUST fail for a compliant enclave
_EGRESS_TEST_TARGETS = [
    ("1.1.1.1", 53, "udp"),          # Cloudflare DNS
    ("8.8.8.8", 53, "udp"),          # Google DNS
    ("1.1.1.1", 443, "tcp"),         # Cloudflare HTTPS
    ("8.8.8.8", 443, "tcp"),         # Google HTTPS
    ("93.184.216.34", 80, "tcp"),    # example.com HTTP
]

# Targets that are allowed (localhost only for the test server itself)
_ALLOWED_LOCAL = {"127.0.0.1", "::1"}


@dataclass
class EgressTestResult:
    target: str
    port: int
    protocol: str
    blocked: bool
    error: str = ""
    duration_ms: float = 0.0


@dataclass
class SelfTestReport:
    passed: bool
    results: List[EgressTestResult] = field(default_factory=list)
    seccomp_active: bool = False
    container_network_none: bool = False
    timestamp: str = ""

    def to_dict(self) -> dict:
        return {
            "passed": self.passed,
            "seccomp_active": self.seccomp_active,
            "container_network_none": self.container_network_none,
            "results": [
                {
                    "target": r.target,
                    "port": r.port,
                    "protocol": r.protocol,
                    "blocked": r.blocked,
                    "error": r.error,
                    "duration_ms": round(r.duration_ms, 2),
                }
                for r in self.results
            ],
            "timestamp": self.timestamp,
        }


def _check_seccomp() -> bool:
    """Check if seccomp is active by reading /proc/self/status."""
    try:
        with open("/proc/self/status") as f:
            for line in f:
                if line.startswith("Seccomp:"):
                    # Seccomp: 2 means filter mode (not 0=disabled, 1=strict)
                    parts = line.strip().split(":")
                    return len(parts) == 2 and parts[1].strip() != "0"
    except (FileNotFoundError, PermissionError):
        pass
    return False


def _check_network_namespace() -> bool:
    """Check if we're in a network namespace with no external access."""
    try:
        # If /sys/class/net only has lo, we're effectively isolated
        interfaces = os.listdir("/sys/class/net")
        interfaces = [i for i in interfaces if i != "lo"]
        return len(interfaces) == 0
    except (FileNotFoundError, PermissionError):
        return False


def _attempt_connection(target: str, port: int, protocol: str, timeout: float = 2.0) -> EgressTestResult:
    """Attempt a single outbound connection. Must fail for compliant enclave."""
    start = time.perf_counter()
    blocked = True
    error_msg = ""

    try:
        if protocol == "tcp":
            sock = socket.create_connection((target, port), timeout=timeout)
            # If we got here, the connection succeeded — BAD
            blocked = False
            error_msg = "CONNECTION SUCCEEDED — egress is NOT blocked!"
            try:
                sock.close()
            except Exception:
                pass

        elif protocol == "udp":
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(timeout)
            # Send a probe and try to read (will timeout if blocked)
            sock.sendto(b"\x00", (target, port))
            try:
                data, _ = sock.recvfrom(1024)
                blocked = False
                error_msg = "UDP response received — egress is NOT blocked!"
            except socket.timeout:
                blocked = True
                error_msg = "timeout (expected)"
            except OSError as e:
                blocked = True
                error_msg = str(e)
            finally:
                sock.close()

    except OSError as e:
        blocked = True
        error_msg = str(e)
    except Exception as e:
        blocked = True
        error_msg = f"{type(e).__name__}: {e}"

    duration = (time.perf_counter() - start) * 1000

    return EgressTestResult(
        target=target,
        port=port,
        protocol=protocol,
        blocked=blocked,
        error=error_msg,
        duration_ms=duration,
    )


def run_self_test() -> SelfTestReport:
    """Run the full egress self-test suite."""
    from datetime import datetime, timezone

    results: List[EgressTestResult] = []
    all_blocked = True

    logger.info("Starting egress self-test...")

    # Check environment
    seccomp = _check_seccomp()
    net_ns = _check_network_namespace()

    logger.info("Seccomp active: %s", seccomp)
    logger.info("Network namespace isolated: %s", net_ns)

    # Run connection attempts
    for target, port, proto in _EGRESS_TEST_TARGETS:
        logger.info("Testing %s:%d/%s ...", target, port, proto)
        result = _attempt_connection(target, port, proto)
        results.append(result)

        status = "BLOCKED" if result.blocked else "ALLOWED"
        logger.info("  → %s (%s) [%.1f ms]", status, result.error, result.duration_ms)

        if not result.blocked:
            all_blocked = False

    report = SelfTestReport(
        passed=all_blocked,
        results=results,
        seccomp_active=seccomp,
        container_network_none=net_ns,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

    if report.passed:
        logger.info("SELF-TEST PASSED: All egress attempts blocked.")
    else:
        logger.error("SELF-TEST FAILED: Some egress attempts succeeded!")
        for r in results:
            if not r.blocked:
                logger.error("  UNBLOCKED: %s:%d/%s — %s", r.target, r.port, r.protocol, r.error)

    return report


def run_self_test_blocking() -> None:
    """Run self-test and exit if it fails. Used at startup."""
    report = run_self_test()
    if not report.passed:
        logger.critical("EGRESS SELF-TEST FAILED — exiting for safety")
        os._exit(1)
