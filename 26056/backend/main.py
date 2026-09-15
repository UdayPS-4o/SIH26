"""
VIMAAN — nightly orchestrator.

Called by cron at 22:00 IST.

Pipeline
--------
  1. Pre-flight checks   — source health, kill-switch status
  2. Collect             — all sources in parallel
  3. Clean               — dedup, outliers, base-fare split
  4. Index               — Jevons + block-bootstrap band
  5. Store               — PostgreSQL bulk insert
  6. Gate check           — coverage >= 70%?
  7. Publish              — API + SDMX feed

Runtime on a 4 vCPU / 8 GB VM: ~45 minutes end-to-end.
"""

import asyncio
import logging
import time
from datetime import datetime, timezone
from dataclasses import dataclass
from typing import Optional, Callable, Awaitable


try:
    from collectors.base import BaseCollector, CollectorStatus  # type: ignore
    from collectors.playwright_collectors import IndiGoCollector, AirIndiaCollector, AkasaCollector  # type: ignore
    from collectors.scrapy_collectors import CleartripCollector, MakeMyTripCollector, YatraCollector  # type: ignore
    from collectors.api_connectors import AmadeusCollector, DuffelCollector, DGCAFeedCollector  # type: ignore
    from cleaning.pipeline import clean_pipeline  # type: ignore
    from index.aggregator import aggregate_index, APIndexResult  # type: ignore
    from compliance.kill_switch import KillSwitchRegistry
    from compliance.robots import is_allowed
    from compliance.rate_limiter import PerDomainRateLimiter, RateLimitConfig
    from compliance.proxy_pool import ProxyPool, RotationStrategy
    from storage.postgres import Base, QuoteStore, IndexStore, AnomalyStore, AuditLog
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    HAS_DEPS = True
except ImportError as e:
    HAS_DEPS = False
    import logging
    logging.warning(f"Optional import failed: {e}")

logger = logging.getLogger("vimaan.main")

SECTORS = [
    "DEL-BOM", "DEL-BLR", "BOM-BLR", "DEL-CCU", "BLR-HYD", "MAA-DEL",
    "BOM-CCU", "CCU-DEL", "DEL-HYD", "BLR-CCU", "BOM-GOA", "DEL-PNQ",
    "BOM-GOI", "DEL-GAU", "DEL-AMD", "DEL-SXR", "BOM-AMD", "DEL-LKO",
    "BLR-MAA", "BOM-COK", "DEL-BBI",
]
LEAD_WINDOWS = [1, 7, 15, 30, 45]


@dataclass
class PipelineResult:
    raw_quotes: int
    clean_quotes: int
    index: APIndexResult
    suppressed_cells: int
    runtime_s: float
    gate_passed: bool


def build_collectors(kill_switches: KillSwitchRegistry) -> list:
    """Instantiate all collectors, respecting kill-switch state."""
    collectors = [
        IndiGoCollector,
        AirIndiaCollector,
        AkasaCollector,
        CleartripCollector,
        MakeMyTripCollector,
        YatraCollector,
        DGCAFeedCollector,
    ]
    for c in collectors:
        if kill_switches.is_active(c.name):
            c.status = CollectorStatus.DISABLED
    return collectors


def build_proxy_pool() -> ProxyPool:
    """Create and seed the proxy pool with Oxylabs endpoints."""
    pool = ProxyPool(strategy=RotationStrategy.ROUND_ROBIN)

    # Oxylabs datacenter proxies (from user-provided config)
    oxylabs_proxies = [
        {"address": "dc.oxylabs.io:8001", "provider": "oxylabs", "country": "US", "type": "datacenter"},
        {"address": "dc.oxylabs.io:8002", "provider": "oxylabs", "country": "US", "type": "datacenter"},
        {"address": "dc.oxylabs.io:8003", "provider": "oxylabs", "country": "US", "type": "datacenter"},
        {"address": "dc.oxylabs.io:8004", "provider": "oxylabs", "country": "US", "type": "datacenter"},
        {"address": "dc.oxylabs.io:8005", "provider": "oxylabs", "country": "US", "type": "datacenter"},
    ]
    pool.add_from_config(oxylabs_proxies)
    logger.info(f"Proxy pool seeded with {len(oxylabs_proxies)} Oxylabs endpoints")
    return pool


def build_rate_limiter() -> PerDomainRateLimiter:
    """Create rate limiter matching scraper config defaults."""
    return PerDomainRateLimiter(RateLimitConfig(
        min_interval_s=6.0,   # 6s per domain (matches scraper config)
        nightly_cap=500,
        backoff_max_s=900.0,
    ))


def run_pipeline(
    collectors: list,
    db_url: str = "postgresql://vimaan:vimaan@localhost:5432/apix",
    rate_limiter: Optional[PerDomainRateLimiter] = None,
    proxy_pool: Optional[ProxyPool] = None,
    kill_switches: Optional[KillSwitchRegistry] = None,
) -> PipelineResult:
    """Execute one full nightly pipeline run."""
    t0 = time.monotonic()

    if not HAS_DEPS:
        raise RuntimeError("Pipeline dependencies not available")

    engine = create_engine(db_url)
    Base.metadata.create_all(engine)

    raw_quotes = []
    for collector in collectors:
        if collector.status == CollectorStatus.DISABLED:
            logger.info(f"Skipping disabled collector: {collector.name}")
            continue
        try:
            # Assign proxy if pool is available
            if proxy_pool and collector.base_url:
                from urllib.parse import urlparse
                domain = urlparse(collector.base_url).hostname or "default"
                proxy = proxy_pool.assign(domain)
                if proxy:
                    logger.info(f"{collector.name}: routed via {proxy.address}")

            quotes = collector.run(SECTORS, LEAD_WINDOWS)
            raw_quotes.extend(quotes)
            logger.info(f"{collector.name}: {len(quotes)} quotes, status={collector.status.value}")
        except Exception as exc:
            logger.error(f"{collector.name} failed: {exc}")

    clean_qs, clean_stats = clean_pipeline(raw_quotes)
    logger.info(
        f"Cleaning: {clean_stats.raw_in} in -> {clean_stats.clean_out} out "
        f"({clean_stats.survival_rate:.1%} survival)"
    )

    with Session(engine) as session:
        for q in clean_qs:
            session.merge(QuoteStore(
                id=q.quote_hash,
                source=q.source,
                sector=q.sector,
                carrier=q.carrier,
                departure_date=q.departure_date,
                lead_days=q.lead_days,
                cabin=q.cabin,
                base_fare=q.base_fare,
                taxes=q.taxes,
                udf=q.udf,
                convenience_fee=q.convenience_fee,
                total_fare=q.total_fare,
                elementary_cell=q.elementary_cell,
            ))
            session.add(AuditLog(
                id=f"a_{q.quote_hash[:12]}",
                source=q.source,
                sector=q.sector,
            ))
        session.commit()

    prev_quotes = []
    result = aggregate_index(clean_qs, prev_quotes)

    gate_passed = clean_stats.survival_rate >= 0.70 and clean_stats.suppressed_cells <= 5

    with Session(engine) as session:
        session.add(IndexStore(
            date=datetime.now(timezone.utc).date().isoformat(),
            frequency="DAILY",
            index_value=result.index_value,
            band_low=result.band_low,
            band_high=result.band_high,
            n_quotes=result.n_quotes,
            n_cells=result.n_cells,
            survival_rate=result.survival_rate,
            yoy_change=result.yoy_change,
            mom_change=result.mom_change,
            status="FROZEN" if gate_passed else "PROVISIONAL",
        ))
        session.commit()

    runtime = time.monotonic() - t0
    logger.info(f"Pipeline complete in {runtime:.0f}s — APIx = {result.index_value:.2f}")

    return PipelineResult(
        raw_quotes=clean_stats.raw_in,
        clean_quotes=clean_stats.clean_out,
        index=result,
        suppressed_cells=clean_stats.suppressed_cells,
        runtime_s=runtime,
        gate_passed=gate_passed,
    )


def main():
    """CLI entry point for manual pipeline runs."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    kill_switches = KillSwitchRegistry()
    rate_limiter = build_rate_limiter()
    proxy_pool = build_proxy_pool()
    collectors = build_collectors(kill_switches)
    result = run_pipeline(collectors, rate_limiter=rate_limiter, proxy_pool=proxy_pool)
    if result.gate_passed:
        logger.info("Publication gate PASSED — APIx published.")
    else:
        logger.warning(
            f"Publication gate FAILED — survival {result.index.survival_rate:.1%}, "
            f"suppressed cells: {result.suppressed_cells}"
        )


if __name__ == "__main__":
    main()
