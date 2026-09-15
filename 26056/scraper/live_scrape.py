#!/usr/bin/env python3
"""
VIMAAN — Live Cleartrip scraper using Playwright.
Pulls real fares for the IDR→BLR fare ladder across T+1, T+7, T+15, T+30, T+45.

Outputs:
  liveFareLadder.json  — one fare card per lead window (pinned to flight 6E-6744)
  liveCabinCompare.json — cheapest fare in each cabin class for T+15 departure

Usage: python live_scrape.py
"""

import json
import re
import sys
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
log = logging.getLogger('vimaan.scraper')

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
except ImportError:
    log.error("Playwright not installed. Run: pip install playwright && python -m playwright install chromium")
    sys.exit(1)

SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR

ORIGIN = "IDR"
DEST = "BLR"
ORIGIN_CITY = "Indore"
DEST_CITY = "Bangalore"
TARGET_FLIGHT = "6E-6744"  # IndiGo daily non-stop IDR→BLR
LEAD_DAYS = [0, 1, 7, 15, 30, 45]
CABIN_LEAD = 15
CABINS = [
    {"param": "Economy", "label": "Economy"},
    {"param": "PREMIUM_ECONOMY", "label": "Premium Economy"},
    {"param": "Business", "label": "Business"},
]
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)


def ddmmyyyy(d: datetime) -> str:
    return f"{d.day:02d}/{d.month:02d}/{d.year}"


def results_url(depart: datetime, cabin: str) -> str:
    date = ddmmyyyy(depart)
    return (
        f"https://www.cleartrip.com/flights/results?"
        f"adults=1&childs=0&infants=0&class={cabin}"
        f"&depart_date={date}&from={ORIGIN}&to={DEST}&intl=false"
        f"&sd=&mmb=false"
    )


def pick_flight(json_data, target_flight):
    """Find the cheapest fare for a specific flight number."""
    fares = json_data.get("fares", {})
    flights = json_data.get("flights", {})
    best = None
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
        if flight_no != target_flight:
            continue
        if best is None or price < best["price"]:
            best = {
                "price": round(float(price), 2),
                "flightNumber": flight_no,
                "stops": 0,
                "departTime": f.get("departure", {}).get("airport", {}).get("time", ""),
                "arriveTime": f.get("arrival", {}).get("airport", {}).get("time", ""),
            }
    return best


def pick_cheapest(json_data):
    """Find the cheapest non-stop fare."""
    fares = json_data.get("fares", {})
    flights = json_data.get("flights", {})
    best = None
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
        if best is None or price < best["price"]:
            best = {
                "price": round(float(price), 2),
                "flightNumber": flight_no,
                "stops": 0,
                "departTime": f.get("departure", {}).get("airport", {}).get("time", ""),
                "arriveTime": f.get("arrival", {}).get("airport", {}).get("time", ""),
            }
    return best


def fetch_search(browser, url, timeout_ms=45000):
    """Navigate to Cleartrip search and capture the flight/search/v2 response."""
    page = browser.new_page(user_agent=UA)
    try:
        with page.expect_response(
            lambda r: "/flight/search/v2" in r.url and r.status == 200,
            timeout=timeout_ms,
        ) as resp_info:
            page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
        resp = resp_info.value
        return page, resp.json()
    except PWTimeout:
        log.warning(f"Timeout waiting for search API on {url[:80]}")
        page.close()
        return None, None
    except Exception as exc:
        log.warning(f"Navigation error: {exc}")
        try:
            page.close()
        except Exception:
            pass
        return None, None


def scrape_ladder(browser) -> list:
    """Scrape the fare ladder across all lead windows."""
    results = []
    for lead in LEAD_DAYS:
        depart = datetime.now(timezone.utc) + timedelta(days=lead)
        url = results_url(depart, "Economy")
        log.info(f"  T+{lead} ({depart.date()}): fetching {url[:90]}")

        page, data = fetch_search(browser, url)
        if data is None:
            log.warning(f"  T+{lead}: no data returned")
            results.append({
                "leadDays": lead,
                "departDate": depart.date().isoformat(),
                "scrapedAt": datetime.now(timezone.utc).isoformat(),
                "sourceUrl": url,
                "cheapest": None,
                "cardCount": 0,
                "error": "timeout or blocked",
            })
            continue

        # Try target flight first, fall back to cheapest
        fare = pick_flight(data, TARGET_FLIGHT) or pick_cheapest(data)
        card_count = len(data.get("fares", {}))

        if fare:
            source_url = results_url(depart, "Economy")
            results.append({
                "leadDays": lead,
                "departDate": depart.date().isoformat(),
                "scrapedAt": datetime.now(timezone.utc).isoformat(),
                "sourceUrl": source_url,
                "cheapest": fare,
                "cardCount": card_count,
                "flightSeen": fare["flightNumber"],
            })
            log.info(f"  T+{lead}: {fare['flightNumber']} ₹{fare['price']} ({card_count} fares)")
        else:
            results.append({
                "leadDays": lead,
                "departDate": depart.date().isoformat(),
                "scrapedAt": datetime.now(timezone.utc).isoformat(),
                "sourceUrl": url,
                "cheapest": None,
                "cardCount": card_count,
                "error": "no fares found",
            })
            log.warning(f"  T+{lead}: no fares found in {card_count} cards")

        if page:
            try:
                page.close()
            except Exception:
                pass

    return results


def scrape_cabin(browser) -> list:
    """Scrape cheapest fare per cabin class for T+15 departure."""
    depart = datetime.now(timezone.utc) + timedelta(days=CABIN_LEAD)
    results = []
    for cabin in CABINS:
        url = results_url(depart, cabin["param"])
        log.info(f"  {cabin['label']}: fetching {url[:90]}")

        page, data = fetch_search(browser, url)
        if data is None:
            log.warning(f"  {cabin['label']}: no data")
            results.append({
                "cabin": cabin["label"],
                "scrapedAt": datetime.now(timezone.utc).isoformat(),
                "sourceUrl": url,
                "cheapest": None,
                "cardCount": 0,
                "error": "timeout",
            })
            continue

        fare = pick_cheapest(data)
        card_count = len(data.get("fares", {}))

        if fare:
            results.append({
                "cabin": cabin["label"],
                "scrapedAt": datetime.now(timezone.utc).isoformat(),
                "sourceUrl": url,
                "cheapest": fare,
                "cardCount": card_count,
            })
            log.info(f"  {cabin['label']}: {fare['flightNumber']} ₹{fare['price']}")
        else:
            results.append({
                "cabin": cabin["label"],
                "scrapedAt": datetime.now(timezone.utc).isoformat(),
                "sourceUrl": url,
                "cheapest": None,
                "cardCount": card_count,
                "error": "no fares",
            })

        if page:
            try:
                page.close()
            except Exception:
                pass

    return results


def main():
    log.info("VIMAAN Live Scrape — Cleartrip IDR→BLR")
    log.info(f"Target flight: {TARGET_FLIGHT}")
    log.info(f"Lead windows: {LEAD_DAYS}")

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)

        log.info("")
        log.info("Phase 1: Fare ladder")
        ladder = scrape_ladder(browser)

        log.info("")
        log.info("Phase 2: Cabin comparison")
        cabins = scrape_cabin(browser)

        browser.close()

    # Write outputs
    ladder_out = OUTPUT_DIR / "liveFareLadder.json"
    cabin_out = OUTPUT_DIR / "liveCabinCompare.json"

    ladder_payload = {
        "origin": ORIGIN,
        "dest": DEST,
        "originCity": ORIGIN_CITY,
        "destCity": DEST_CITY,
        "targetFlight": TARGET_FLIGHT,
        "results": ladder,
    }
    cabin_payload = {
        "origin": ORIGIN,
        "dest": DEST,
        "originCity": ORIGIN_CITY,
        "destCity": DEST_CITY,
        "departDate": (datetime.now(timezone.utc) + timedelta(days=CABIN_LEAD)).date().isoformat(),
        "leadDays": CABIN_LEAD,
        "results": cabins,
    }

    writeFileSync(ladder_out, json.dumps(ladder_payload, indent=2))
    writeFileSync(cabin_out, json.dumps(cabin_payload, indent=2))

    log.info("")
    log.info("=" * 60)
    log.info("RESULTS SUMMARY")
    log.info("=" * 60)
    for r in ladder:
        if r.get("cheapest"):
            log.info(f"  T+{r['leadDays']:2d} | {r['departDate']} | {r['cheapest']['flightNumber']:10s} | ₹{r['cheapest']['price']:>8,.0f} | {r['cardCount']} fares")
        else:
            log.info(f"  T+{r['leadDays']:2d} | {r['departDate']} | {'FAILED':10s} | {'—':>8s} | {r.get('cardCount', 0)} fares")
    log.info("")

    spreads = [r["cheapest"]["price"] for r in ladder if r.get("cheapest")]
    if len(spreads) >= 2:
        log.info(f"  Spread: ₹{min(spreads):,.0f} – ₹{max(spreads):,.0f} ({max(spreads)/min(spreads):.1f}x)")
    log.info(f"  Output: {ladder_out}")
    log.info(f"  Output: {cabin_out}")


def writeFileSync(path, content):
    with open(path, "w") as f:
        f.write(content)


if __name__ == "__main__":
    main()
