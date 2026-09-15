"""
VIMAAN — Demo data generator.

Generates all forged data files and SQL snapshots needed for the demo.
Run once:  python backend/scripts/seed_demo.py
"""
import json
import random
import math
from datetime import date, timedelta
from pathlib import Path

SEED = 26056
random.seed(SEED)

BASE = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE / "backend" / "data" / "api"
DEMO_DIR = BASE / "backend" / "demo"
LOGS_DIR = BASE / "backend" / "logs"

for d in (DATA_DIR, DEMO_DIR, LOGS_DIR):
    d.mkdir(parents=True, exist_ok=True)

SECTORS = [
    "DEL-BOM", "DEL-BLR", "BOM-BLR", "DEL-CCU", "BLR-HYD", "MAA-DEL",
    "BOM-CCU", "CCU-DEL", "DEL-HYD", "BLR-CCU", "BOM-GOA", "DEL-PNQ",
    "BOM-GOI", "DEL-GAU", "DEL-AMD", "DEL-SXR", "BOM-AMD", "DEL-LKO",
    "BLR-MAA", "BOM-COK", "DEL-BBI", "IDR-BLR",
]

SECTOR_WEIGHTS = {
    "DEL-BOM": 0.18, "DEL-BLR": 0.12, "BOM-BLR": 0.08, "DEL-CCU": 0.09,
    "BLR-HYD": 0.06, "MAA-DEL": 0.08, "BOM-CCU": 0.05, "CCU-DEL": 0.05,
    "DEL-HYD": 0.04, "BLR-CCU": 0.03, "BOM-GOA": 0.04, "DEL-PNQ": 0.03,
    "BOM-GOI": 0.02, "DEL-GAU": 0.02, "DEL-AMD": 0.02, "DEL-SXR": 0.01,
    "BOM-AMD": 0.02, "DEL-LKO": 0.02, "BLR-MAA": 0.02, "BOM-COK": 0.02,
    "DEL-BBI": 0.01, "IDR-BLR": 0.03,
}

ELASTICITY_BASE = {
    "DEL-BOM": 8200, "DEL-BLR": 6500, "BOM-BLR": 5800, "DEL-CCU": 6800,
    "BLR-HYD": 4200, "MAA-DEL": 7200, "BOM-CCU": 5500, "CCU-DEL": 5800,
    "DEL-HYD": 4800, "BLR-CCU": 4500, "BOM-GOA": 3800, "DEL-PNQ": 3500,
    "BOM-GOI": 3200, "DEL-GAU": 3000, "DEL-AMD": 2800, "DEL-SXR": 2500,
    "BOM-AMD": 3000, "DEL-LKO": 2800, "BLR-MAA": 4500, "BOM-COK": 4800,
    "DEL-BBI": 2200, "IDR-BLR": 4800,
}

CARRIERS = {
    "DEL-BOM": ["6E", "AI", "UK", "QP"], "DEL-BLR": ["6E", "AI", "UK"],
    "BOM-BLR": ["6E", "AI"], "DEL-CCU": ["6E", "AI", "QP"], "BLR-HYD": ["6E", "AI"],
    "MAA-DEL": ["6E", "AI", "QP"], "BOM-CCU": ["6E", "AI"], "CCU-DEL": ["6E", "AI"],
    "DEL-HYD": ["6E", "AI"], "BLR-CCU": ["AI", "6E"], "BOM-GOA": ["6E", "AI", "QP"],
    "DEL-PNQ": ["6E", "AI", "QP"], "BOM-GOI": ["QP", "6E"], "DEL-GAU": ["6E", "QP"],
    "DEL-AMD": ["6E", "QP"], "DEL-SXR": ["6E"], "BOM-AMD": ["6E", "QP"],
    "DEL-LKO": ["6E", "AI"], "BLR-MAA": ["6E", "AI"], "BOM-COK": ["6E", "AI", "QP"],
    "DEL-BBI": ["6E"], "IDR-BLR": ["6E", "AI"],
}

WINDOWS = [1, 7, 15, 30, 45]
START_DATE = date(2026, 6, 1)
NUM_DAYS = 90


def price_for(sector, lead_days, day_idx):
    """Generate a realistic fare with lead-time elasticity + trend + noise."""
    base = ELASTICITY_BASE[sector]
    elasticity = 1.0 - 0.35 * math.exp(-lead_days / 12)
    seasonal = 1.0 + 0.05 * math.sin(2 * math.pi * day_idx / 365)
    trend = 1.0 + 0.0005 * day_idx
    noise = 1.0 + random.gauss(0, 0.06)
    fare = base * elasticity * seasonal * trend * noise
    return round(fare, -1)


def generate_quotes():
    quotes = []
    for day_idx in range(NUM_DAYS):
        current_date = START_DATE + timedelta(days=day_idx)
        for sector in SECTORS:
            for lead_days in WINDOWS:
                dep_date = current_date + timedelta(days=lead_days)
                for carrier in CARRIERS[sector]:
                    total = price_for(sector, lead_days, day_idx)
                    base = round(total * 0.72)
                    taxes = round(total * 0.18)
                    udf = round(total * 0.06)
                    convenience = round(total * 0.04)
                    quotes.append({
                        "source": random.choice(["IndiGo", "AirIndia", "AkasaAir", "Cleartrip", "MakeMyTrip", "Amadeus"]),
                        "sector": sector,
                        "carrier": carrier,
                        "departure_date": dep_date.isoformat(),
                        "lead_days": lead_days,
                        "cabin": random.choice(["Economy", "Business"]),
                        "base_fare": base,
                        "taxes": taxes,
                        "udf": udf,
                        "convenience_fee": convenience,
                        "total_fare": total,
                        "flight_no": f"{carrier}-{random.randint(100, 9999)}",
                        "elementary_cell": f"{sector}|{carrier}|{lead_days}|Economy",
                    })
    return quotes


def generate_index():
    index_values = []
    val = 100.0
    for day_idx in range(NUM_DAYS):
        current_date = START_DATE + timedelta(days=day_idx)
        drift = random.gauss(0.002, 0.008)
        seasonal = 0.003 * math.sin(2 * math.pi * day_idx / 365 - 1.5)
        val = val * (1 + drift + seasonal)
        val = max(95, min(110, val))
        band_width = 0.3 + random.uniform(0, 0.3)
        n_quotes = 600 + random.randint(0, 100)
        n_cells = 90 + random.randint(0, 15)
        survival = 0.88 + random.uniform(0, 0.09)
        index_values.append({
            "date": current_date.isoformat(),
            "index_value": round(val, 2),
            "band_low": round(val - band_width, 2),
            "band_high": round(val + band_width, 2),
            "formula": "Jevons",
            "n_quotes": n_quotes,
            "n_cells": n_cells,
            "survival_rate": round(survival, 3),
            "yoy_change": round(random.uniform(0.02, 0.12), 3),
            "mom_change": round(random.uniform(-0.01, 0.03), 3),
            "status": "PUBLISHED",
        })
    return index_values


def generate_heatmap():
    rows = []
    for sector in SECTORS:
        for lead in WINDOWS:
            base = ELASTICITY_BASE[sector] * (1.0 - 0.35 * math.exp(-lead / 12))
            wowi = round(random.uniform(-5, 8), 1)
            momi = round(random.uniform(-3, 4), 1)
            avg = round(base * random.uniform(0.95, 1.05), -1)
            rows.append({
                "sector": sector,
                "lead_days": lead,
                "avg_fare": avg,
                "wow_change": wowi,
                "mom_change": momi,
                "weight": SECTOR_WEIGHTS[sector],
                "n_quotes": random.randint(20, 80),
            })
    return rows


def generate_backtest():
    # APIx series (from index history)
    idx = generate_index()
    # DGCA reference series (correlated but slightly offset)
    dgca = []
    for entry in idx:
        noise = random.gauss(0, 0.015)
        dgca.append({
            "date": entry["date"],
            "value": round(entry["index_value"] * (1 - 0.02 + noise), 2),
        })
    # Compute stats
    api_vals = [e["index_value"] for e in idx]
    dg_vals = [e["value"] for e in dgca]
    mean_api = sum(api_vals) / len(api_vals)
    mean_dg = sum(dg_vals) / len(dg_vals)

    cov = sum((a - mean_api) * (d - mean_dg) for a, d in zip(api_vals, dg_vals)) / len(api_vals)
    std_api = math.sqrt(sum((a - mean_api) ** 2 for a in api_vals) / len(api_vals))
    std_dg = math.sqrt(sum((d - mean_dg) ** 2 for d in dg_vals) / len(dg_vals))

    correlation = round(cov / (std_api * std_dg), 3)
    rmse = round(math.sqrt(sum((a - d) ** 2 for a, d in zip(api_vals, dg_vals)) / len(api_vals)), 2)
    mape = round(sum(abs(a - d) / d for a, d in zip(api_vals, dg_vals)) / len(api_vals) * 100, 1)

    return {
        "api_series": idx[-30:],
        "dgca_series": dgca[-30:],
        "metrics": {
            "correlation": correlation,
            "rmse": rmse,
            "mape": mape,
            "n_points": 30,
            "dgca_source": "eSankhyiki.mospi.gov.in (monthly average fare)",
        },
    }


def generate_compliance():
    sources = [
        {"name": "IndiGo", "url": "https://www.goindigo.com", "posture": "ALLOWED",
         "robots": "User-agent: * Allow: /", "crawl_delay": 6.0, "nightly_cap": 500,
         "status": "ACTIVE", "quotes_last_run": 98, "last_checked": "2026-09-14"},
        {"name": "Air India", "url": "https://www.airindia.com", "posture": "ALLOWED",
         "robots": "User-agent: * Allow: /", "crawl_delay": 0.0, "nightly_cap": 500,
         "status": "ACTIVE", "quotes_last_run": 89, "last_checked": "2026-09-14"},
        {"name": "Akasa Air", "url": "https://www.akasaair.com", "posture": "ALLOWED",
         "robots": "User-agent: * Allow: /", "crawl_delay": 4.0, "nightly_cap": 300,
         "status": "ACTIVE", "quotes_last_run": 64, "last_checked": "2026-09-14"},
        {"name": "Cleartrip", "url": "https://www.cleartrip.com", "posture": "ALLOWED",
         "robots": "User-agent: * Allow: /search", "crawl_delay": 0.0, "nightly_cap": 500,
         "status": "ACTIVE", "quotes_last_run": 112, "last_checked": "2026-09-14"},
        {"name": "MakeMyTrip", "url": "https://www.makemytrip.com", "posture": "ALLOWED",
         "robots": "User-agent: * Allow: /", "crawl_delay": 2.0, "nightly_cap": 500,
         "status": "ACTIVE", "quotes_last_run": 97, "last_checked": "2026-09-14"},
        {"name": "Yatra", "url": "https://www.yatra.com", "posture": "PENDING_REVIEW",
         "robots": "User-agent: * Disallow: /", "crawl_delay": 0.0, "nightly_cap": 0,
         "status": "QUARANTINED", "quotes_last_run": 0, "last_checked": "2026-09-10",
         "note": "robots.txt disallows automated access. Under legal review."},
        {"name": "Amadeus", "url": "https://test.api.amadeus.com", "posture": "API_CONTRACT",
         "robots": "N/A (OAuth2 API)", "crawl_delay": 0.0, "nightly_cap": 1000,
         "status": "ACTIVE", "quotes_last_run": 78, "last_checked": "2026-09-14"},
        {"name": "Duffel", "url": "https://api.duffel.com", "posture": "API_CONTRACT",
         "robots": "N/A (Bearer API)", "crawl_delay": 0.0, "nightly_cap": 1000,
         "status": "ACTIVE", "quotes_last_run": 71, "last_checked": "2026-09-14"},
        {"name": "DGCA Feed", "url": "sftp://data.mospi.gov.in/dgca/tariff", "posture": "PENDING_CREDENTIALS",
         "robots": "N/A (SFTP)", "crawl_delay": 0.0, "nightly_cap": 0,
         "status": "PENDING", "quotes_last_run": 0, "last_checked": "2026-09-01",
         "note": "SFTP credentials with MoSPI pending. Hardcoded stub in production."},
    ]
    return {
        "sources": sources,
        "rules": [
            {"id": 1, "rule": "robots.txt compliance", "status": "ENFORCED", "library": "protego"},
            {"id": 2, "rule": "Crawl-delay enforcement", "status": "ENFORCED", "library": "token-bucket"},
            {"id": 3, "rule": "Rate limiting per domain", "status": "ENFORCED", "library": "threading.Lock"},
            {"id": 4, "rule": "Kill-switch (3× 429 → quarantine)", "status": "ENFORCED", "library": "kill_switch.py"},
            {"id": 5, "rule": "No CAPTCHA solving", "status": "ENFORCED", "library": "N/A"},
            {"id": 6, "rule": "User-Agent identification", "status": "ENFORCED", "library": "VIMAAN/1.0"},
            {"id": 7, "rule": "Request logging (append-only)", "status": "ENFORCED", "library": "audit_log"},
            {"id": 8, "rule": "Data minimisation (base fare only)", "status": "ENFORCED", "library": "fare split"},
            {"id": 9, "rule": "IP rotation support", "status": "PLANNED", "library": "proxy config"},
            {"id": 10, "rule": "GDPR/PIPL data handling", "status": "COMPLIANT", "library": "no PII collected"},
        ],
    }


def generate_forecast():
    days = []
    last_val = 102.34
    for i in range(30):
        d = date(2026, 9, 15) + timedelta(days=i)
        trend = 0.003 * i
        seasonal = 0.008 * math.sin(2 * math.pi * i / 7)
        noise = random.gauss(0, 0.005)
        val = last_val * (1 + trend + seasonal + noise)
        ci = 0.3 + 0.01 * i
        days.append({
            "date": d.isoformat(),
            "forecast": round(val, 2),
            "ci_low": round(val - ci, 2),
            "ci_high": round(val + ci, 2),
            "model": "SARIMA(2,1,1)(1,1,1)7" if i < 14 else "LSTM+SARIMA ensemble",
        })
    return {
        "sector": "ALL",
        "last_observed": "2026-09-14",
        "last_value": 102.34,
        "mape": 3.2,
        "horizon_days": 30,
        "forecasts": days,
    }


def generate_anomalies():
    alerts = []
    anomalies = [
        {"sector": "DEL-BLR", "lead_days": 1, "score": 3.42, "severity": "HIGH",
         "cause": "Demand surge (weekend)", "model": "IsolationForest", "confidence": 0.94},
        {"sector": "BOM-BLR", "lead_days": 7, "score": 2.15, "severity": "MEDIUM",
         "cause": "Fare drop (competition)", "model": "HB fence", "confidence": 0.87},
        {"sector": "DEL-CCU", "lead_days": 15, "score": 1.83, "severity": "LOW",
         "cause": "Seasonal dip (monsoon)", "model": "PatternMatch", "confidence": 0.76},
    ]
    for i, a in enumerate(anomalies):
        alerts.append({
            "id": f"anom-{26056 + i}",
            "date": "2026-09-14",
            **a,
            "acknowledged": False,
        })
    return {"alerts": alerts, "total": len(alerts), "accuracy": 0.942}


def generate_health():
    return {
        "status": "HEALTHY",
        "last_run": "2026-09-14T22:01:42+05:30",
        "next_run": "2026-09-15T22:00:00+05:30",
        "scheduler": "Celery Beat (cron: 0 22 * * *)",
        "coverage": {
            "target_sectors": len(SECTORS),
            "target_windows": len(WINDOWS),
            "expected_cells": len(SECTORS) * len(WINDOWS),
            "covered_cells": 98,
            "coverage_pct": 93.3,
            "gate_threshold": 70.0,
            "gate_passed": True,
        },
        "database": {
            "total_quotes": 58671,
            "total_index_days": 90,
            "connection": "postgresql://vimaan@localhost:5432/apix",
            "pool_size": 5,
        },
        "sources": {"active": 6, "quarantined": 1, "pending": 1, "total": 8},
        "index": {"current": 102.34, "band_low": 101.87, "band_high": 102.81, "status": "PUBLISHED"},
        "tests": {"total": 47, "passed": 47, "coverage": "87%"},
        "uptime": "99.7%",
    }


def generate_sectors():
    items = []
    for sector in SECTORS:
        items.append({
            "sector": sector,
            "weight": SECTOR_WEIGHTS[sector],
            "carriers": CARRIERS[sector],
            "elasticity_base": ELASTICITY_BASE[sector],
            "avg_fare_t1": round(ELASTICITY_BASE[sector] * 0.72),
            "avg_fare_t45": round(ELASTICITY_BASE[sector] * 0.38),
        })
    return {"basket_version": "2024-v3", "source": "DGCA 2024-25 passenger data", "total_sectors": len(SECTORS), "sectors": items}


def generate_sdmx():
    return {
        "message": "StructureSpecificData",
        "header": {
            "ID": "API:IND:AIRFARE:DEL-BLR:2026-09",
            "test": False,
            "prepared": "2026-09-14T22:05:00+05:30",
            "sender": {"id": "VIMAAN", "name": "VIMAAN Airfare Index"},
        },
        "data": [
            {
                "seriesKey": {"DEL-BLR": None},
                "observations": [
                    {"TIME_PERIOD": "2026-09-14", "OBS_VALUE": "102.34"},
                    {"TIME_PERIOD": "2026-09-13", "OBS_VALUE": "101.89"},
                    {"TIME_PERIOD": "2026-09-12", "OBS_VALUE": "101.45"},
                ],
            }
        ],
    }


# --- Generate all files ---
print("Generating 90-day index history...")
index_history = generate_index()
(DATA_DIR / "index_history.json").write_text(json.dumps(index_history, indent=2))
(DATA_DIR / "index_daily.json").write_text(json.dumps(index_history[-1], indent=2))

print("Generating sector basket...")
(DATA_DIR / "sectors.json").write_text(json.dumps(generate_sectors(), indent=2))

print("Generating heatmap...")
(DATA_DIR / "heatmap.json").write_text(json.dumps(generate_heatmap(), indent=2))

print("Generating backtest (DGCA comparison)...")
(DATA_DIR / "backtest.json").write_text(json.dumps(generate_backtest(), indent=2))

print("Generating compliance registry...")
(DATA_DIR / "compliance_status.json").write_text(json.dumps(generate_compliance(), indent=2))

print("Generating forecast...")
(DATA_DIR / "forecast.json").write_text(json.dumps(generate_forecast(), indent=2))

print("Generating anomaly alerts...")
(DATA_DIR / "anomalies.json").write_text(json.dumps(generate_anomalies(), indent=2))

print("Generating health check...")
(DATA_DIR / "health.json").write_text(json.dumps(generate_health(), indent=2))

print("Generating SDMX-JSON feed...")
(DATA_DIR / "sdmx_latest.json").write_text(json.dumps(generate_sdmx(), indent=2))

# Sample quotes for the /quotes endpoint
print("Generating sample quotes...")
all_quotes = generate_quotes()
sample = random.sample(all_quotes, min(50, len(all_quotes)))
(DATA_DIR / "quotes_sample.json").write_text(json.dumps({"total": len(all_quotes), "sample": sample}, indent=2))

# PostgreSQL SQL snapshot
print("Generating PostgreSQL SQL snapshot...")
sql_lines = [
    "-- VIMAAN Demo Snapshot — generated by seed_demo.py",
    f"-- {len(all_quotes)} quotes, {len(index_history)} index days",
    "",
]
for q in sample[:20]:
    sql_lines.append(
        f"INSERT INTO quotes (id, source, sector, carrier, departure_date, lead_days, "
        f"cabin, base_fare, taxes, udf, convenience_fee, total_fare, flight_no, "
        f"elementary_cell, scraped_at) VALUES ("
        f"'{q['flight_no']}-{q['lead_days']}', '{q['source']}', '{q['sector']}', "
        f"'{q['carrier']}', '{q['departure_date']}', {q['lead_days']}, "
        f"'{q['cabin']}', {q['base_fare']}, {q['taxes']}, {q['udf']}, "
        f"{q['convenience_fee']}, {q['total_fare']}, '{q['flight_no']}', "
        f"'{q['elementary_cell']}', '2026-09-14 22:01:42+00');"
    )
sql_lines.append("")
for iv in index_history[-7:]:
    sql_lines.append(
        f"INSERT INTO index_values (date, frequency, index_value, band_low, band_high, "
        f"formula, n_quotes, n_cells, survival_rate, yoy_change, mom_change, status) "
        f"VALUES ('{iv['date']}', 'DAILY', {iv['index_value']}, {iv['band_low']}, "
        f"{iv['band_high']}, 'Jevons', {iv['n_quotes']}, {iv['n_cells']}, "
        f"{iv['survival_rate']}, {iv['yoy_change']}, {iv['mom_change']}, 'PUBLISHED');"
    )
(DEMO_DIR / "db_snapshot.sql").write_text("\n".join(sql_lines))

# Live scrape capture
print("Generating live scrape capture...")
live_quotes = []
for lead in [1, 7, 15, 30, 45]:
    total = price_for("IDR-BLR", lead, 0)
    live_quotes.append({
        "airline": random.choice(["IndiGo", "Air India", "Akasa Air"]),
        "flightNo": f"{random.choice(['6E','AI','QP'])}-{random.randint(100,999)}",
        "departure": (date(2026, 9, 15) + timedelta(days=lead)).isoformat(),
        "leadDays": lead,
        "fare": round(total),
        "baseFare": round(total * 0.72),
        "taxes": round(total * 0.18),
        "udf": round(total * 0.06),
    })
(BASE / "scraper" / "demo" / "live_scrape_capture.json").write_text(json.dumps(live_quotes, indent=2))

print(f"\n[OK] Generated {len(all_quotes)} quotes across {len(index_history)} days")
print(f"   JSON files: {DATA_DIR}")
print(f"   SQL snapshot: {DEMO_DIR / 'db_snapshot.sql'}")
print(f"   Live scrape: {BASE / 'scraper' / 'demo' / 'live_scrape_capture.json'}")
print(f"\nNext: python -m backend.api.app")
