"""
VIMAAN — Scrapy-based collectors for OTA pages.
Run through a Scrapy CrawlerRunner with CONCURRENT_REQUESTS_PER_DOMAIN=2.
Yatra is on the kill-switch until the robots.txt question is resolved.
"""

from datetime import datetime, timezone
from typing import Any, Optional

try:
    from collectors.base import BaseCollector, FareQuote, CollectorKind, CollectorStatus  # type: ignore
except ImportError:
    pass


class CleartripCollector(BaseCollector):
    name = "Cleartrip"
    kind = CollectorKind.SCRAPY
    base_url = "https://www.cleartrip.com"
    crawl_delay_s = 3.0
    nightly_cap = 300

    def _fetch(self, session: Any, sector: str, lead_days: int) -> list:
        origin, dest = sector.split("-")
        dep = datetime.now(timezone.utc).strftime("%d/%m/%Y")
        url = (
            f"https://www.cleartrip.com/flights/search?"
            f"from={origin}&to={dest}&depart_date={dep}&adults=1&class=economy"
        )
        quotes = []
        try:
            resp = session.get(url, timeout=10)
            if resp.status_code == 200:
                import re
                prices = re.findall(r'"fare":\s*([\d.]+)', resp.text)
                for p in prices[:5]:
                    base = float(p)
                    quotes.append(FareQuote(
                        source="Cleartrip",
                        sector=sector,
                        carrier="6E",
                        departure_date=datetime.now(timezone.utc).date().isoformat(),
                        lead_days=lead_days,
                        cabin="Economy",
                        base_fare=base,
                        taxes=round(base * 0.12, 2),
                        udf=186.0,
                        convenience_fee=0,
                        total_fare=round(base * 1.12 + 186, 2),
                    ))
        except Exception as exc:
            import logging
            logging.warning(f"Cleartrip: {sector} T+{lead_days} — {exc}")
        return quotes


class MakeMyTripCollector(BaseCollector):
    name = "MakeMyTrip"
    kind = CollectorKind.SCRAPY
    base_url = "https://www.makemytrip.com"
    crawl_delay_s = 4.0
    nightly_cap = 300

    def _fetch(self, session: Any, sector: str, lead_days: int) -> list:
        origin, dest = sector.split("-")
        dep = datetime.now(timezone.utc).strftime("%d%m%Y")
        url = f"https://www.makemytrip.com/flight/search?itinerary={origin}-{dest}-{dep}&tripType=O&paxType=A-1_C-0_I-0&cabinClass=E"
        quotes = []
        try:
            resp = session.get(url, timeout=10, headers={"User-Agent": "VIMAAN/1.0 (+https://mospi.gov.in)"})
            if resp.status_code == 200:
                import re
                prices = re.findall(r'"price":\s*([\d.]+)', resp.text)
                carriers = re.findall(r'"airline":\s*"([^"]+)"', resp.text)
                for i, p in enumerate(prices[:4]):
                    base = float(p)
                    carrier = carriers[i] if i < len(carriers) else "?"
                    quotes.append(FareQuote(
                        source="MakeMyTrip",
                        sector=sector,
                        carrier=carrier,
                        departure_date=datetime.now(timezone.utc).date().isoformat(),
                        lead_days=lead_days,
                        cabin="Economy",
                        base_fare=base,
                        taxes=round(base * 0.13, 2),
                        udf=186.0,
                        convenience_fee=round(base * 0.02, 2),
                        total_fare=round(base * 1.15 + 186, 2),
                    ))
        except Exception as exc:
            import logging
            logging.warning(f"MakeMyTrip: {sector} T+{lead_days} — {exc}")
        return quotes


class YatraCollector(BaseCollector):
    name = "Yatra"
    kind = CollectorKind.SCRAPY
    base_url = "https://www.yatra.com"
    crawl_delay_s = 4.0
    nightly_cap = 0  # on hold — robots.txt under review

    def _fetch(self, session: Any, sector: str, lead_days: int) -> list:
        return []
