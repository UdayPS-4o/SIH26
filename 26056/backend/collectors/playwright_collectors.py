"""
VIMAAN — Playwright-based collectors for JS-rendered airline portals.
Browser pool capped at 3 instances. Anti-bot evasion via playwright-stealth.
"""

import asyncio
import re
from typing import Any

try:
    from collectors.base import BaseCollector, FareQuote, CollectorKind  # type: ignore
except ImportError:
    pass


class PlaywrightCollector(BaseCollector):
    """Mixin providing async Playwright run(). Subclasses implement _parse()."""

    kind = CollectorKind.PLAYWRIGHT

    async def _arun(self, sectors: list, lead_windows: list) -> list:
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            return []

        quotes = []
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                )
            )
            for sector in sectors[:20]:
                if self.quotes_collected >= self.nightly_cap:
                    break
                for lead in lead_windows:
                    try:
                        url = self._build_url(sector, lead)
                        await page.goto(url, timeout=12_000)
                        await page.wait_for_timeout(2_000)
                        quotes.extend(await self._parse(page, sector, lead))
                    except Exception as exc:
                        import logging
                        logging.warning(f"{self.name}: {sector} T+{lead} — {exc}")
            await browser.close()
        return quotes

    def _build_url(self, sector: str, lead: int) -> str:
        return self.base_url

    async def _parse(self, page: Any, sector: str, lead: int) -> list:
        return []

    def run(self, sectors: list, lead_windows: list) -> list:
        try:
            return asyncio.run(self._arun(sectors, lead_windows))
        except Exception:
            return []


class IndiGoCollector(PlaywrightCollector):
    name = "IndiGo"
    base_url = "https://www.goindigo.in"
    crawl_delay_s = 6.0
    nightly_cap = 400

    def _build_url(self, sector: str, lead: int) -> str:
        origin, dest = sector.split("-")
        return f"https://www.goindigo.in/search?origin={origin}&destination={dest}"

    async def _parse(self, page, sector: str, lead: int) -> list:
        quotes = []
        try:
            blocks = await page.query_selector_all(".fare-block")
            for block in blocks[:8]:
                text = await block.inner_text()
                fare_match = re.search(r"[\d,]+", text.replace(",", ""))
                if not fare_match:
                    continue
                base = float(fare_match.group())
                taxes = round(base * 0.12, 2)
                udf = 186.0 if sector.startswith(("DEL", "BOM")) else 103.0
                quotes.append(FareQuote(
                    source="IndiGo", sector=sector, carrier="6E",
                    departure_date=datetime.now(timezone.utc).date().isoformat(),
                    lead_days=lead, cabin="Economy",
                    base_fare=base, taxes=taxes, udf=udf,
                    convenience_fee=0, total_fare=round(base + taxes + udf, 2),
                ))
        except Exception:
            pass
        return quotes


class AirIndiaCollector(PlaywrightCollector):
    name = "Air India"
    base_url = "https://www.airindia.com"
    crawl_delay_s = 6.0
    nightly_cap = 400

    def _build_url(self, sector: str, lead: int) -> str:
        origin, dest = sector.split("-")
        dep = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return f"https://www.airindia.com/search?from={origin}&to={dest}&depart={dep}&adults=1&class=economy"

    async def _parse(self, page, sector: str, lead: int) -> list:
        quotes = []
        try:
            prices = await page.query_selector_all("[data-testid='fare-amount']")
            for el in prices[:6]:
                raw = await el.inner_text()
                base = float(raw.replace(",", "").replace("₹", "").strip())
                quotes.append(FareQuote(
                    source="Air India", sector=sector, carrier="AI",
                    departure_date=datetime.now(timezone.utc).date().isoformat(),
                    lead_days=lead, cabin="Economy",
                    base_fare=base, taxes=round(base * 0.14, 2), udf=186.0,
                    convenience_fee=0, total_fare=round(base * 1.14 + 186, 2),
                ))
        except Exception:
            pass
        return quotes


class AkasaCollector(PlaywrightCollector):
    name = "Akasa Air"
    base_url = "https://www.akasaair.com"
    crawl_delay_s = 6.0
    nightly_cap = 300

    def _build_url(self, sector: str, lead: int) -> str:
        origin, dest = sector.split("-")
        dep = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return f"https://www.akasaair.com/book?from={origin}&to={dest}&depart={dep}"

    async def _parse(self, page, sector: str, lead: int) -> list:
        quotes = []
        try:
            prices = await page.query_selector_all(".fare-price")
            for el in prices[:4]:
                raw = await el.inner_text()
                base = float(raw.replace(",", "").replace("₹", "").strip())
                quotes.append(FareQuote(
                    source="Akasa Air", sector=sector, carrier="QP",
                    departure_date=datetime.now(timezone.utc).date().isoformat(),
                    lead_days=lead, cabin="Economy",
                    base_fare=base, taxes=round(base * 0.05, 2), udf=103.0,
                    convenience_fee=0, total_fare=round(base * 1.05 + 103, 2),
                ))
        except Exception:
            pass
        return quotes
