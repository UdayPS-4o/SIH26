"""
VIMAAN — OTA collectors for Cleartrip, MakeMyTrip, and Yatra.

Cleartrip and MakeMyTrip use Playwright with response interception because
both sites are JS-rendered SPAs — fares only appear after internal API calls
populate the page. This is the same technique used in scraper/live_scrape.py,
the only version that actually produces real data.

Yatra remains a stub until its robots.txt review completes.

This module is intentionally self-contained — it does NOT import from
collectors.base to avoid the broken import chain in that file (which has
circular references to cleaning.pipeline that doesn't exist as a standalone
module). The FareQuote dataclass is defined locally.
"""

from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional

logger = logging.getLogger("vimaan.scrapy_collectors")


# ============================================================
# Minimal FareQuote — local to avoid broken import chain
# ============================================================

@dataclass
class FareQuote:
    """One cleaned fare quote from a single source."""
    source: str
    sector: str
    carrier: str
    departure_date: str
    lead_days: int
    cabin: str
    base_fare: float
    taxes: float
    udf: float
    convenience_fee: float
    total_fare: float
    flight_no: str = ""
    scraped_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    quote_hash: str = ""

    def __post_init__(self):
        if not self.quote_hash:
            raw = f"{self.source}|{self.sector}|{self.carrier}|{self.departure_date}|{self.lead_days}|{self.cabin}|{self.base_fare}"
            self.quote_hash = hashlib.sha256(raw.encode()).hexdigest()[:16]


# ============================================================
# Cleartrip — Playwright with response interception
# ============================================================

class CleartripCollector:
    """
    Scrapes Cleartrip fares using Playwright.

    Cleartrip loads flight data by calling /flight/search/v2 internally
    after the user lands on the results page. We wait for that response
    and parse the embedded JSON — the same technique used in
    scraper/live_scrape.py which is the only version that actually works.
    """

    name = "Cleartrip"
    kind = "scrapy"
    base_url = "https://www.cleartrip.com"
    crawl_delay_s = 3.0
    nightly_cap = 300

    def __init__(self):
        self.status = "active"
        self.quotes_collected: int = 0
        self.last_run: str = ""
        self.consecutive_429s: int = 0

    def _fetch(self, session: Any, sector: str, lead_days: int) -> list[FareQuote]:
        """
        Scrape Cleartrip fares using Playwright response interception.
        """
        try:
            from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
        except ImportError:
            logger.warning("Playwright not installed — Cleartrip collector cannot run")
            return []

        origin, dest = sector.split("-")
        dep = datetime.now(timezone.utc).strftime("%d/%m/%Y")
        url = (
            f"https://www.cleartrip.com/flights/results?"
            f"adults=1&childs=0&infants=0&class=economy"
            f"&depart_date={dep}&from={origin}&to={dest}&intl=false"
            f"&sd=&mmb=false"
        )
        quotes: list[FareQuote] = []

        with sync_playwright() as pw:
            browser = pw.chromium.launch(
                headless=True,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                ],
            )
            context = browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/131.0.0.0 Safari/537.36"
                ),
                viewport={'width': 1440, 'height': 900},
                locale='en-IN',
                timezone_id='Asia/Kolkata',
                ignore_https_errors=True,
                permissions=['geolocation'],
            )
            page = context.new_page()
            # Remove navigator.webdriver and other automation fingerprints
            page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                delete navigator.__proto__.webdriver;
                window.chrome = { runtime: {} };
                Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
                Object.defineProperty(navigator, 'languages', { get: () => ['en-IN', 'en', 'hi'] });
            """)
            try:
                with page.expect_response(
                    lambda r: "/flight/search/v2" in r.url and r.status == 200,
                    timeout=45_000,
                ) as resp_info:
                    page.goto(url, wait_until="domcontentloaded", timeout=45_000)

                data = resp_info.value.json()
                fares = data.get("fares", {})
                flights = data.get("flights", {})

                for fare_id, fare in fares.items():
                    price = fare.get("pricing", {}).get("totalPricing", {}).get("totalPrice")
                    if not isinstance(price, (int, float)):
                        continue
                    legs = []
                    for sto in fare.get("subTravelOptionFare", []):
                        for ff in sto.get("flightFare", []):
                            legs.append(ff.get("flightId"))
                    if len(legs) != 1:
                        continue
                    f = flights.get(legs[0])
                    if not f:
                        continue
                    flight_no = f"{f.get('airlineCode', '')}-{f.get('fltNo', '')}"
                    base = round(float(price) / 1.12, 2)
                    quotes.append(FareQuote(
                        source="Cleartrip",
                        sector=sector,
                        carrier=flight_no.split("-")[0] if "-" in flight_no else "?",
                        departure_date=datetime.now(timezone.utc).date().isoformat(),
                        lead_days=lead_days,
                        cabin="Economy",
                        base_fare=base,
                        taxes=round(base * 0.12, 2),
                        udf=186.0,
                        convenience_fee=0,
                        total_fare=round(float(price), 2),
                        flight_no=flight_no,
                    ))
                    if len(quotes) >= 5:
                        break

            except Exception as exc:
                logger.warning(f"Cleartrip: {sector} T+{lead_days} — {exc}")
            finally:
                try:
                    browser.close()
                except Exception:
                    pass

        self.quotes_collected += len(quotes)
        return quotes

    def run(self, sectors: list[str], lead_windows: list[int]) -> list[FareQuote]:
        """Run the collector across all sectors and lead windows."""
        quotes: list[FareQuote] = []
        for sector in sectors:
            for lead in lead_windows:
                try:
                    result = self._fetch(None, sector, lead)
                    quotes.extend(result)
                except Exception as exc:
                    logger.warning(f"Cleartrip: {sector} T+{lead} — {exc}")
                    self.consecutive_429s += 1
        self.last_run = datetime.now(timezone.utc).isoformat()
        return quotes


# ============================================================
# MakeMyTrip — Playwright with DOM scraping
# ============================================================

class MakeMyTripCollector:
    """
    Scrapes MakeMyTrip fares via Playwright DOM extraction.

    MakeMyTrip renders fare cards client-side. We navigate to the search
    results page, wait for JS to render, then extract prices from the DOM.
    """

    name = "MakeMyTrip"
    kind = "scrapy"
    base_url = "https://www.makemytrip.com"
    crawl_delay_s = 4.0
    nightly_cap = 250

    def __init__(self):
        self.status = "active"
        self.quotes_collected: int = 0
        self.last_run: str = ""
        self.consecutive_429s: int = 0

    def _fetch(self, session: Any, sector: str, lead_days: int) -> list[FareQuote]:
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            logger.warning("Playwright not installed — MakeMyTrip collector cannot run")
            return []

        origin, dest = sector.split("-")
        dep = datetime.now(timezone.utc).strftime("%d%m%Y")
        url = (
            f"https://www.makemytrip.com/flight/search?"
            f"itinerary={origin}-{dest}-{dep}&tripType=O&paxType=A-1_C-0_I-0&cabinClass=E"
        )
        quotes: list[FareQuote] = []

        with sync_playwright() as pw:
            browser = pw.chromium.launch(
                headless=True,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                ],
            )
            context = browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/131.0.0.0 Safari/537.36"
                ),
                viewport={'width': 1440, 'height': 900},
                locale='en-IN',
                timezone_id='Asia/Kolkata',
                ignore_https_errors=True,
                permissions=['geolocation'],
            )
            page = context.new_page()
            page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                delete navigator.__proto__.webdriver;
                window.chrome = { runtime: {} };
                Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
                Object.defineProperty(navigator, 'languages', { get: () => ['en-IN', 'en', 'hi'] });
            """)
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=45_000)
                page.wait_for_timeout(3_000)

                price_selectors = [
                    '[data-testid="price"] .price',
                    '.price .actual-price',
                    '.fare-price',
                    '[class*="price"]',
                ]
                for sel in price_selectors:
                    elements = page.query_selector_all(sel)
                    if elements:
                        break
                else:
                    elements = []

                for el in elements[:4]:
                    try:
                        raw = el.inner_text()
                        price = float(raw.replace(",", "").replace("₹", "").replace(" ", "").strip())
                        base = round(price / 1.15, 2)
                        quotes.append(FareQuote(
                            source="MakeMyTrip",
                            sector=sector,
                            carrier="?",
                            departure_date=datetime.now(timezone.utc).date().isoformat(),
                            lead_days=lead_days,
                            cabin="Economy",
                            base_fare=base,
                            taxes=round(base * 0.13, 2),
                            udf=186.0,
                            convenience_fee=round(base * 0.02, 2),
                            total_fare=round(price, 2),
                        ))
                    except (ValueError, TypeError):
                        continue

            except Exception as exc:
                logger.warning(f"MakeMyTrip: {sector} T+{lead_days} — {exc}")
            finally:
                try:
                    browser.close()
                except Exception:
                    pass

        self.quotes_collected += len(quotes)
        return quotes

    def run(self, sectors: list[str], lead_windows: list[int]) -> list[FareQuote]:
        quotes: list[FareQuote] = []
        for sector in sectors:
            for lead in lead_windows:
                try:
                    result = self._fetch(None, sector, lead)
                    quotes.extend(result)
                except Exception as exc:
                    logger.warning(f"MakeMyTrip: {sector} T+{lead} — {exc}")
                    self.consecutive_429s += 1
        self.last_run = datetime.now(timezone.utc).isoformat()
        return quotes


# ============================================================
# Yatra — stub, on kill-switch
# ============================================================

class YatraCollector:
    """
    Yatra is on hold pending robots.txt review.
    Returns empty until the legal review completes.
    """

    name = "Yatra"
    kind = "scrapy"
    base_url = "https://www.yatra.com"
    crawl_delay_s = 4.0
    nightly_cap = 0

    def __init__(self):
        self.status = "disabled"
        self.quotes_collected: int = 0
        self.last_run: str = ""
        self.consecutive_429s: int = 0

    def _fetch(self, session: Any, sector: str, lead_days: int) -> list[FareQuote]:
        return []

    def run(self, sectors: list[str], lead_windows: list[int]) -> list[FareQuote]:
        return []
