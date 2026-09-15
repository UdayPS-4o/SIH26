"""
VIMAAN — IP rotation / proxy pool.
Implements a real rotating proxy pool for outbound collection requests.

Design
------
- A pool of proxy endpoints, each with health state and expiry.
- Rotation policy: round-robin across ACTIVE proxies, per-domain binding,
  with cooldown on failures.
- Proxy health tracked: latency, last_used_at, expires_at, block_count.
- When all proxies are degraded the collector still runs from the direct
  egress — collection never stops because the pool is exhausted.

Modes
-----
ACTIVE     – healthy, eligible for assignment
COOLDOWN   – recently returned a 429 / CAPTCHA, backing off
EXPIRED    – past its lease, needs re-validation
DISABLED   – manually taken out of rotation

A proxy may be:
- a literal IP:port  (datacenter proxy)
- a hostname:port    (residential proxy provider endpoint)
- "direct"           – bypass pool, use machine egress

The integration point is ComplianceGate.assign_proxy(domain) -> ProxyInfo | None.
Collectors pass the returned proxy to httpx.Client(proxy=...).
"""

from __future__ import annotations

import time
import random
import logging
import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

logger = logging.getLogger("vimaan.proxy")


class ProxyStatus(str, Enum):
    ACTIVE = "active"
    COOLDOWN = "cooldown"
    EXPIRED = "expired"
    DISABLED = "disabled"
    VALIDATING = "validating"


@dataclass
class ProxyEndpoint:
    """One entry in the proxy pool."""
    id: str
    address: str          # "203.0.113.50:8080" or "residential.provider.com:9000"
    provider: str         # "datacenter" | "residential" | "luminati" | "oxylabs" | "direct"
    country: str = "IN"
    type: str = "datacenter"  # datacenter | residential | mobile
    status: ProxyStatus = ProxyStatus.VALIDATING
    added_at: float = field(default_factory=time.time)
    last_used_at: float = 0.0
    last_used_domain: str = ""
    expires_at: float = 0.0
    block_count: int = 0
    success_count: int = 0
    failure_count: int = 0
    total_requests: int = 0
    avg_latency_ms: float = 0.0
    _latencies: list[float] = field(default_factory=list, repr=False)
    cooldown_until: float = 0.0
    failure_reason: str = ""
    lease_duration_s: int = 3600  # 1 hour default lease

    @property
    def is_usable(self) -> bool:
        if self.status in (ProxyStatus.DISABLED, ProxyStatus.VALIDATING):
            return False
        if time.time() < self.cooldown_until:
            return False
        if self.expires_at > 0 and time.time() > self.expires_at:
            self.status = ProxyStatus.EXPIRED
            return False
        return True

    @property
    def age_s(self) -> float:
        return time.time() - self.added_at

    @property
    def time_since_use_s(self) -> float:
        if self.last_used_at == 0:
            return self.age_s
        return time.time() - self.last_used_at

    @property
    def success_rate(self) -> float:
        if self.total_requests == 0:
            return 1.0
        return self.success_count / self.total_requests

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "address": self.address,
            "provider": self.provider,
            "country": self.country,
            "type": self.type,
            "status": self.status.value,
            "addedAt": datetime.fromtimestamp(self.added_at, tz=timezone.utc).isoformat(),
            "lastUsedAt": datetime.fromtimestamp(self.last_used_at, tz=timezone.utc).isoformat() if self.last_used_at else None,
            "lastUsedDomain": self.last_used_domain,
            "expiresAt": datetime.fromtimestamp(self.expires_at, tz=timezone.utc).isoformat() if self.expires_at else None,
            "blockCount": self.block_count,
            "successCount": self.success_count,
            "failureCount": self.failure_count,
            "totalRequests": self.total_requests,
            "avgLatencyMs": round(self.avg_latency_ms, 1),
            "successRate": round(self.success_rate * 100, 1),
            "cooldownUntil": datetime.fromtimestamp(self.cooldown_until, tz=timezone.utc).isoformat() if self.cooldown_until else None,
            "failureReason": self.failure_reason,
            "leaseDurationS": self.lease_duration_s,
            "isUsable": self.is_usable,
            "ageS": round(self.age_s, 1),
            "timeSinceUseS": round(self.time_since_use_s, 1),
        }


class RotationStrategy(str, Enum):
    ROUND_ROBIN = "round_robin"
    RANDOM = "random"
    LEAST_USED = "least_used"
    BEST_LATENCY = "best_latency"
    STICKY_DOMAIN = "sticky_domain"  # bind a proxy to a domain for the session


@dataclass
class DomainBinding:
    """A domain pinned to a specific proxy for sticky sessions."""
    domain: str
    proxy_id: str
    bound_at: float = field(default_factory=time.time)
    requests_served: int = 0
    expires_at: float = 0.0

    def is_valid(self) -> bool:
        if self.expires_at > 0 and time.time() > self.expires_at:
            return False
        return True


class ProxyPool:
    """
    Thread-safe rotating proxy pool.

    Usage:
        pool = ProxyPool()
        pool.add(ProxyEndpoint(...))
        pool.add_direct("direct")  # machine egress

        proxy = pool.assign("cleartrip.com")
        # proxy is None -> use direct egress
        # proxy is ProxyEndpoint -> route through that proxy

        pool.record_result(proxy_id, success=True, latency_ms=1200)
        pool.record_block(proxy_id, reason="429 Too Many Requests")
    """

    def __init__(
        self,
        strategy: RotationStrategy = RotationStrategy.ROUND_ROBIN,
        direct_egress_name: str = "direct",
        cooldown_on_block_s: int = 300,
        max_blocks_before_disable: int = 5,
        lease_duration_s: int = 3600,
        domain_bind_duration_s: int = 1800,
    ):
        self._lock = threading.Lock()
        self._proxies: dict[str, ProxyEndpoint] = {}
        self._strategy = strategy
        self._direct_egress_name = direct_egress_name
        self._cooldown_on_block_s = cooldown_on_block_s
        self._max_blocks = max_blocks_before_disable
        self._lease_duration = lease_duration_s
        self._bind_duration = domain_bind_duration_s

        self._rr_index: int = 0
        self._domain_bindings: dict[str, DomainBinding] = {}

        # Metrics
        self.total_assignments: int = 0
        self.total_via_proxy: int = 0
        self.total_via_direct: int = 0
        self.total_blocks: int = 0
        self.last_rotation_at: float = 0.0
        self.last_rotation_reason: str = ""

        # Ensure direct egress always exists
        self._ensure_direct()

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------
    def _ensure_direct(self) -> None:
        if self._direct_egress_name not in self._proxies:
            self._proxies[self._direct_egress_name] = ProxyEndpoint(
                id=self._direct_egress_name,
                address="direct",
                provider="machine_egress",
                country="IN",
                type="direct",
                status=ProxyStatus.ACTIVE,
                expires_at=0,  # never expires
            )

    def add(self, proxy: ProxyEndpoint) -> None:
        with self._lock:
            proxy.lease_duration_s = self._lease_duration
            proxy.expires_at = time.time() + self._lease_duration
            self._proxies[proxy.id] = proxy
            logger.info(f"Proxy pool: added {proxy.id} ({proxy.address}, {proxy.type})")

    def add_from_config(self, configs: list[dict]) -> list[str]:
        """Bulk-add from a list of {address, provider, country, type} dicts."""
        added = []
        for i, cfg in enumerate(configs):
            pid = cfg.get("id") or f"px-{i+1:03d}"
            p = ProxyEndpoint(
                id=pid,
                address=cfg["address"],
                provider=cfg.get("provider", "datacenter"),
                country=cfg.get("country", "IN"),
                type=cfg.get("type", "datacenter"),
                lease_duration_s=cfg.get("leaseDurationS", self._lease_duration),
                expires_at=time.time() + cfg.get("leaseDurationS", self._lease_duration),
            )
            self.add(p)
            added.append(pid)
        return added

    def remove(self, proxy_id: str) -> bool:
        with self._lock:
            if proxy_id in self._proxies:
                del self._proxies[proxy_id]
                self._domain_bindings = {
                    d: b for d, b in self._domain_bindings.items()
                    if b.proxy_id != proxy_id
                }
                logger.info(f"Proxy pool: removed {proxy_id}")
                return True
            return False

    def disable(self, proxy_id: str, reason: str = "") -> None:
        with self._lock:
            if proxy_id in self._proxies:
                self._proxies[proxy_id].status = ProxyStatus.DISABLED
                self._proxies[proxy_id].failure_reason = reason
                logger.info(f"Proxy pool: disabled {proxy_id} — {reason}")

    def enable(self, proxy_id: str) -> None:
        with self._lock:
            if proxy_id in self._proxies:
                p = self._proxies[proxy_id]
                p.status = ProxyStatus.ACTIVE
                p.cooldown_until = 0.0
                p.block_count = 0
                p.expires_at = time.time() + self._lease_duration
                p.failure_reason = ""
                logger.info(f"Proxy pool: enabled {proxy_id}")

    def rotate(self, reason: str = "manual") -> list[str]:
        """Expire all current leases and re-validate. Returns IDs of re-validated proxies."""
        with self._lock:
            now = time.time()
            changed = []
            for p in self._proxies.values():
                if p.status == ProxyStatus.ACTIVE:
                    old_exp = p.expires_at
                    p.expires_at = now + self._lease_duration
                    p.status = ProxyStatus.VALIDATING
                    p.avg_latency_ms = 0.0
                    p._latencies.clear()
                    if old_exp > 0:
                        changed.append(p.id)
            self.last_rotation_at = now
            self.last_rotation_reason = reason
            self._domain_bindings.clear()
            logger.info(f"Proxy pool: rotated {len(changed)} proxies — {reason}")
            return changed

    # ------------------------------------------------------------------
    # Assignment
    # ------------------------------------------------------------------
    def assign(self, domain: str) -> ProxyEndpoint | None:
        """
        Assign the best proxy for a domain.
        Returns None if direct egress should be used.
        """
        with self._lock:
            self.total_assignments += 1
            self._expire_stale()

            # Check sticky binding first
            binding = self._domain_bindings.get(domain)
            if binding and binding.is_valid():
                bound = self._proxies.get(binding.proxy_id)
                if bound and bound.is_usable:
                    binding.requests_served += 1
                    bound.last_used_at = time.time()
                    bound.last_used_domain = domain
                    bound.total_requests += 1
                    self.total_via_proxy += 1
                    return bound

            # Find best ACTIVE proxy
            candidates = [
                p for p in self._proxies.values()
                if p.is_usable and p.id != self._direct_egress_name
            ]

            if not candidates:
                self.total_via_direct += 1
                direct = self._proxies.get(self._direct_egress_name)
                if direct:
                    direct.last_used_at = time.time()
                    direct.last_used_domain = domain
                    direct.total_requests += 1
                return None

            chosen = self._select(candidates, domain)

            # Create sticky binding
            self._domain_bindings[domain] = DomainBinding(
                domain=domain,
                proxy_id=chosen.id,
                expires_at=time.time() + self._bind_duration,
            )

            chosen.last_used_at = time.time()
            chosen.last_used_domain = domain
            chosen.total_requests += 1
            self.total_via_proxy += 1
            return chosen

    def _select(self, candidates: list[ProxyEndpoint], domain: str) -> ProxyEndpoint:
        s = self._strategy
        if s == RotationStrategy.ROUND_ROBIN:
            idx = self._rr_index % len(candidates)
            self._rr_index += 1
            return candidates[idx]
        elif s == RotationStrategy.RANDOM:
            return random.choice(candidates)
        elif s == RotationStrategy.LEAST_USED:
            return min(candidates, key=lambda p: p.time_since_use_s)
        elif s == RotationStrategy.BEST_LATENCY:
            active = [p for p in candidates if p.avg_latency_ms > 0]
            return min(active or candidates, key=lambda p: p.avg_latency_ms)
        elif s == RotationStrategy.STICKY_DOMAIN:
            # Find the proxy that has served this domain least recently
            domain_history = {p.id: p.last_used_domain == domain for p in candidates}
            unused = [p for p in candidates if not domain_history.get(p.id, False)]
            return random.choice(unused or candidates)
        return candidates[0]

    # ------------------------------------------------------------------
    # Feedback
    # ------------------------------------------------------------------
    def record_result(
        self, proxy_id: str, success: bool, latency_ms: float = 0.0
    ) -> None:
        with self._lock:
            p = self._proxies.get(proxy_id)
            if not p or p.id == self._direct_egress_name:
                return
            p.total_requests += 0  # already incremented in assign
            if success:
                p.success_count += 1
                p._latencies.append(latency_ms)
                if len(p._latencies) > 50:
                    p._latencies = p._latencies[-50:]
                p.avg_latency_ms = sum(p._latencies) / len(p._latencies)
                # Clear cooldown on success
                if p.status == ProxyStatus.COOLDOWN:
                    p.status = ProxyStatus.ACTIVE
                    p.cooldown_until = 0.0
            else:
                p.failure_count += 1

    def record_block(
        self, proxy_id: str, reason: str = "", status_code: int = 0
    ) -> None:
        """Record a blocked response (429, CAPTCHA, etc)."""
        with self._lock:
            p = self._proxies.get(proxy_id)
            if not p or p.id == self._direct_egress_name:
                return
            p.block_count += 1
            self.total_blocks += 1
            p.failure_reason = f"{status_code} {reason}" if status_code else reason

            if p.block_count >= self._max_blocks:
                p.status = ProxyStatus.DISABLED
                p.failure_reason = f"Disabled after {p.block_count} blocks: {reason}"
                logger.warning(f"Proxy {p.id} disabled — {p.failure_reason}")
            else:
                p.status = ProxyStatus.COOLDOWN
                p.cooldown_until = time.time() + self._cooldown_on_block_s
                logger.info(f"Proxy {p.id} cooldown {self._cooldown_on_block_s}s — {reason}")

    # ------------------------------------------------------------------
    # Stats
    # ------------------------------------------------------------------
    def get_stats(self) -> dict:
        with self._lock:
            active = [p for p in self._proxies.values() if p.status == ProxyStatus.ACTIVE]
            cooldown = [p for p in self._proxies.values() if p.status == ProxyStatus.COOLDOWN]
            expired = [p for p in self._proxies.values() if p.status == ProxyStatus.EXPIRED]
            disabled = [p for p in self._proxies.values() if p.status == ProxyStatus.DISABLED]
            validating = [p for p in self._proxies.values() if p.status == ProxyStatus.VALIDATING]

            total_reqs = sum(p.total_requests for p in self._proxies.values())
            total_blocks = sum(p.block_count for p in self._proxies.values())

            by_type: dict[str, int] = {}
            for p in self._proxies.values():
                if p.type != "direct":
                    by_type[p.type] = by_type.get(p.type, 0) + 1

            return {
                "totalProxies": len(self._proxies) - 1,  # exclude direct
                "active": len(active) - (1 if self._direct_egress_name in [p.id for p in active] else 0),
                "cooldown": len([p for p in cooldown if p.id != self._direct_egress_name]),
                "expired": len([p for p in expired if p.id != self._direct_egress_name]),
                "disabled": len([p for p in disabled if p.id != self._direct_egress_name]),
                "validating": len([p for p in validating if p.id != self._direct_egress_name]),
                "totalRequests": total_reqs,
                "totalBlocks": total_blocks,
                "totalAssignments": self.total_assignments,
                "viaProxy": self.total_via_proxy,
                "viaDirect": self.total_via_direct,
                "proxyUsagePct": round(self.total_via_proxy / self.total_assignments * 100, 1) if self.total_assignments > 0 else 0,
                "byType": by_type,
                "strategy": self._strategy.value,
                "domainBindings": len(self._domain_bindings),
                "lastRotationAt": datetime.fromtimestamp(self.last_rotation_at, tz=timezone.utc).isoformat() if self.last_rotation_at else None,
                "lastRotationReason": self.last_rotation_reason,
            }

    def get_domain_bindings(self) -> list[dict]:
        with self._lock:
            return [
                {
                    "domain": b.domain,
                    "proxyId": b.proxy_id,
                    "proxyAddress": self._proxies.get(b.proxy_id, {}).address if b.proxy_id in self._proxies else "?",
                    "boundAt": datetime.fromtimestamp(b.bound_at, tz=timezone.utc).isoformat(),
                    "requestsServed": b.requests_served,
                    "expiresAt": datetime.fromtimestamp(b.expires_at, tz=timezone.utc).isoformat(),
                    "isValid": b.is_valid(),
                }
                for b in self._domain_bindings.values()
            ]

    def get_all_proxies(self) -> list[dict]:
        with self._lock:
            return [p.to_dict() for p in self._proxies.values()]

    def get_proxy(self, proxy_id: str) -> ProxyEndpoint | None:
        with self._lock:
            return self._proxies.get(proxy_id)

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------
    def _expire_stale(self) -> None:
        now = time.time()
        for p in self._proxies.values():
            if p.expires_at > 0 and now > p.expires_at and p.status == ProxyStatus.ACTIVE:
                p.status = ProxyStatus.EXPIRED

    def set_strategy(self, strategy: RotationStrategy) -> None:
        self._strategy = strategy

    def summary(self) -> str:
        stats = self.get_stats()
        return (
            f"[ProxyPool] {stats['active']} active, {stats['cooldown']} cooldown, "
            f"{stats['expired']} expired, {stats['disabled']} disabled | "
            f"{stats['totalAssignments']} assignments ({stats['proxyUsagePct']}% via proxy) | "
            f"{stats['totalBlocks']} blocks | strategy: {stats['strategy']}"
        )
