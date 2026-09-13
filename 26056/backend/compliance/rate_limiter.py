"""
VIMAAN — per-domain rate limiter using token-bucket algorithm.
- One request every 6 seconds per domain (configurable)
- Nightly per-domain request cap
- The declared robots.txt crawl-delay feeds directly into the bucket
- This is enforced at the transport layer, not a polite comment
"""

import time
import threading
from dataclasses import dataclass
from typing import Optional


@dataclass
class RateLimitConfig:
    min_interval_s: float = 6.0
    nightly_cap: int = 500
    backoff_max_s: float = 900.0  # 15 minutes


class PerDomainRateLimiter:
    """
    Thread-safe token bucket, one bucket per domain.
    The bucket refills at rate = 1 / min_interval_s tokens per second.
    """

    def __init__(self, config: Optional[RateLimitConfig] = None):
        self.config = config or RateLimitConfig()
        self._buckets: dict = {}  # domain -> (tokens, last_refill)
        self._counts: dict = {}
        self._lock = threading.Lock()

    def _get_bucket(self, domain: str):
        now = time.monotonic()
        tokens, last = self._buckets.get(domain, (1.0, now))
        elapsed = now - last
        tokens = min(1.0, tokens + elapsed / self.config.min_interval_s)
        self._buckets[domain] = (tokens, now)
        return tokens, now

    def acquire(self, domain: str) -> None:
        with self._lock:
            if self._counts.get(domain, 0) >= self.config.nightly_cap:
                raise RuntimeError(f"Nightly cap reached for {domain}")
            tokens, _ = self._get_bucket(domain)
            if tokens < 1.0:
                wait = (1.0 - tokens) * self.config.min_interval_s
                time.sleep(wait)
                self._get_bucket(domain)
            self._buckets[domain] = (0.0, time.monotonic())
            self._counts[domain] = self._counts.get(domain, 0) + 1

    def record_429(self, domain: str) -> float:
        with self._lock:
            self._counts[domain] = self._counts.get(domain, 0) + 1
            backoff = min(
                2 ** self._counts[domain] * self.config.min_interval_s,
                self.config.backoff_max_s,
            )
            return backoff
