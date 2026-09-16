"""
VIMAAN Airfare Price Index – Expanded API server
Deterministic synthetic data (seeded, mirrors TypeScript fixture panel)
+ live scraper JSON files + JWT auth (python-jose + passlib).

Start:  uvicorn backend.api.app:app --reload --port 8000
Docs:   http://localhost:8000/docs
"""

from __future__ import annotations

import math
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from jose import JWTError, jwt
from passlib.context import CryptContext

try:
    from playwright_stealth import Stealth
    HAS_STEALTH = True
except ImportError:
    HAS_STEALTH = False

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="VIMAAN Airfare Price Index API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    description="Official API for the VIMAAN airfare price index. "
                "SDMX-JSON feeds, quote panel, compliance, and live scrape data.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

ROOT = Path(__file__).resolve().parent.parent.parent
SCRAPER_DIR = ROOT / "scraper"

# ---------------------------------------------------------------------------
# JWT auth (python-jose + passlib)
# ---------------------------------------------------------------------------

SECRET_KEY = "vimaan-26056-demo-secret-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_USERS = {
    "admin": {
        "username": "admin",
        "hashed_password": pwd_context.hash("admin123"),
        "role": "admin",
        "scopes": ["read", "write", "admin"],
    },
    "analyst": {
        "username": "analyst",
        "hashed_password": pwd_context.hash("analyst123"),
        "role": "analyst",
        "scopes": ["read"],
    },
    "viewer": {
        "username": "viewer",
        "hashed_password": pwd_context.hash("viewer123"),
        "role": "viewer",
        "scopes": ["read:public"],
    },
}


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_user(username: str):
    return _USERS.get(username)


def authenticate_user(username: str, password: str):
    user = get_user(username)
    if user is None or not verify_password(password, user["hashed_password"]):
        return None
    return user


def create_access_token(username: str, role: str, scopes: list[str]) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": username, "role": role, "scopes": scopes, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def _get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


def _require_role(required: str):
    def checker(payload: dict = Depends(_get_current_user)):
        role = payload.get("role", "viewer")
        if required == "admin" and role != "admin":
            raise HTTPException(status_code=403, detail="Admin role required")
        return payload
    return checker


# ---------------------------------------------------------------------------
# Deterministic PRNG (mirrors TypeScript makeRng)
# ---------------------------------------------------------------------------

class Rng:
    """Seeded PRNG matching the TypeScript implementation exactly."""

    def __init__(self, seed: int):
        self._a = seed & 0xFFFFFFFF

    def _next(self) -> float:
        self._a = (self._a + 0x6d2b79f5) & 0xFFFFFFFF
        t = self._a
        t = (t ^ (t >> 15)) * (t | 1) & 0xFFFFFFFF
        t = t ^ (t + ((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    def range(self, lo: float, hi: float) -> float:
        return lo + self._next() * (hi - lo)

    def int(self, lo: int, hi: int) -> int:
        return math.floor(lo + self._next() * (hi - lo + 1))

    def gauss(self, mean: float = 0, sd: float = 1) -> float:
        u = max(self._next(), 1e-9)
        v = self._next()
        return mean + sd * math.sqrt(-2.0 * math.log(u)) * math.cos(2.0 * math.pi * v)

    def chance(self, p: float) -> bool:
        return self._next() < p

    def pick(self, arr):
        return arr[math.floor(self._next() * len(arr))]


def _hash_seed(s: str) -> int:
    """FNV-1a hash matching the TypeScript seedFrom."""
    h = 2166136261
    for ch in s:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    return h


def _clamp(v: float, lo: float, hi: float) -> float:
    return min(hi, max(lo, v))


def _make_rng(seed: int) -> Rng:
    return Rng(seed)


# ---------------------------------------------------------------------------
# Reference data
# ---------------------------------------------------------------------------

AIRPORTS = [
    {"iata": "DEL", "city": "Delhi", "name": "Indira Gandhi Intl"},
    {"iata": "BOM", "city": "Mumbai", "name": "Chhatrapati Shivaji Maharaj Intl"},
    {"iata": "BLR", "city": "Bengaluru", "name": "Kempegowda Intl"},
    {"iata": "CCU", "city": "Kolkata", "name": "Netaji Subhas Chandra Bose Intl"},
    {"iata": "HYD", "city": "Hyderabad", "name": "Rajiv Gandhi Intl"},
    {"iata": "MAA", "city": "Chennai", "name": "Chennai Intl"},
    {"iata": "PNQ", "city": "Pune", "name": "Pune"},
    {"iata": "GOI", "city": "Goa", "name": "Dabolim"},
    {"iata": "GAU", "city": "Guwahati", "name": "Lokpriya Gopinath Bordoloi Intl"},
    {"iata": "AMD", "city": "Ahmedabad", "name": "Sardar Vallabhbhai Patel Intl"},
    {"iata": "SXR", "city": "Srinagar", "name": "Sheikh ul-Alam Intl"},
    {"iata": "LKO", "city": "Lucknow", "name": "Chaudhary Charan Singh Intl"},
    {"iata": "COK", "city": "Kochi", "name": "Cochin Intl"},
    {"iata": "BBI", "city": "Bhubaneswar", "name": "Biju Patnaik Intl"},
]
AIRPORT_MAP = {a["iata"]: a for a in AIRPORTS}

CARRIERS = [
    {"code": "6E", "name": "IndiGo", "isLcc": True, "presence": 0.61},
    {"code": "AI", "name": "Air India", "isLcc": False, "presence": 0.16},
    {"code": "IX", "name": "Air India Express", "isLcc": True, "presence": 0.09},
    {"code": "QP", "name": "Akasa Air", "isLcc": True, "presence": 0.07},
    {"code": "SG", "name": "SpiceJet", "isLcc": True, "presence": 0.07},
]

SECTORS = [
    {"id": "DEL-BOM", "origin": "DEL", "destination": "BOM", "paxK": 520, "isTrunk": True, "seasonality": "trunk", "carriers": ["6E", "AI", "QP", "SG"]},
    {"id": "DEL-BLR", "origin": "DEL", "destination": "BLR", "paxK": 415, "isTrunk": True, "seasonality": "trunk", "carriers": ["6E", "AI", "QP"]},
    {"id": "BOM-BLR", "origin": "BOM", "destination": "BLR", "paxK": 330, "isTrunk": True, "seasonality": "trunk", "carriers": ["6E", "AI", "QP"]},
    {"id": "DEL-CCU", "origin": "DEL", "destination": "CCU", "paxK": 300, "isTrunk": True, "seasonality": "metro", "carriers": ["6E", "AI", "SG"]},
    {"id": "DEL-HYD", "origin": "DEL", "destination": "HYD", "paxK": 250, "isTrunk": True, "seasonality": "metro", "carriers": ["6E", "AI", "QP"]},
    {"id": "DEL-MAA", "origin": "DEL", "destination": "MAA", "paxK": 205, "isTrunk": True, "seasonality": "metro", "carriers": ["6E", "AI", "SG"]},
    {"id": "BOM-HYD", "origin": "BOM", "destination": "HYD", "paxK": 148, "isTrunk": False, "seasonality": "metro", "carriers": ["6E", "IX", "QP"]},
    {"id": "BLR-CCU", "origin": "BLR", "destination": "CCU", "paxK": 140, "isTrunk": False, "seasonality": "metro", "carriers": ["6E", "AI", "SG"]},
    {"id": "BOM-CCU", "origin": "BOM", "destination": "CCU", "paxK": 132, "isTrunk": False, "seasonality": "metro", "carriers": ["6E", "AI", "IX"]},
    {"id": "DEL-PNQ", "origin": "DEL", "destination": "PNQ", "paxK": 128, "isTrunk": False, "seasonality": "metro", "carriers": ["6E", "AI", "QP"]},
    {"id": "BOM-GOI", "origin": "BOM", "destination": "GOI", "paxK": 118, "isTrunk": False, "seasonality": "leisure", "carriers": ["6E", "IX", "SG"]},
    {"id": "DEL-GAU", "origin": "DEL", "destination": "GAU", "paxK": 112, "isTrunk": False, "seasonality": "regional", "carriers": ["6E", "AI", "SG"]},
    {"id": "BLR-HYD", "origin": "BLR", "destination": "HYD", "paxK": 105, "isTrunk": False, "seasonality": "metro", "carriers": ["6E", "IX", "QP"]},
    {"id": "DEL-AMD", "origin": "DEL", "destination": "AMD", "paxK": 102, "isTrunk": False, "seasonality": "metro", "carriers": ["6E", "AI", "IX"]},
    {"id": "DEL-SXR", "origin": "DEL", "destination": "SXR", "paxK": 96, "isTrunk": False, "seasonality": "leisure", "carriers": ["6E", "AI"]},
    {"id": "BOM-AMD", "origin": "BOM", "destination": "AMD", "paxK": 88, "isTrunk": False, "seasonality": "regional", "carriers": ["6E", "IX", "QP"]},
    {"id": "DEL-LKO", "origin": "DEL", "destination": "LKO", "paxK": 84, "isTrunk": False, "seasonality": "regional", "carriers": ["6E", "AI", "IX"]},
    {"id": "BLR-MAA", "origin": "BLR", "destination": "MAA", "paxK": 78, "isTrunk": False, "seasonality": "metro", "carriers": ["6E", "IX", "QP"]},
    {"id": "BOM-COK", "origin": "BOM", "destination": "COK", "paxK": 72, "isTrunk": False, "seasonality": "leisure", "carriers": ["6E", "IX", "SG"]},
    {"id": "DEL-BBI", "origin": "DEL", "destination": "BBI", "paxK": 68, "isTrunk": False, "seasonality": "regional", "carriers": ["6E", "AI", "IX"]},
]

SECTOR_MAP = {s["id"]: s for s in SECTORS}

LEAD_BUCKETS = [1, 7, 15, 30, 45]
BOOKING_SHARE = {1: 0.12, 7: 0.23, 15: 0.27, 30: 0.24, 45: 0.14}
DOW_BANDS = ["WEEKDAY", "WEEKEND"]

SOURCES = [
    {"slug": "indigo", "label": "IndiGo", "domain": "goindigo.in", "kind": "AIRLINE", "access": "PLAYWRIGHT", "robots": "PENDING_REVIEW", "tos": "PENDING_REVIEW", "ratePerMin": 10, "nightlyCap": 400, "illustrative": False, "inPanel": True},
    {"slug": "airindia", "label": "Air India", "domain": "airindia.com", "kind": "AIRLINE", "access": "PLAYWRIGHT", "robots": "PENDING_REVIEW", "tos": "PENDING_REVIEW", "ratePerMin": 10, "nightlyCap": 400, "illustrative": False, "inPanel": True},
    {"slug": "airindiaexpress", "label": "Air India Express", "domain": "airindiaexpress.com", "kind": "AIRLINE", "access": "PLAYWRIGHT", "robots": "PENDING_REVIEW", "tos": "PENDING_REVIEW", "ratePerMin": 10, "nightlyCap": 300, "illustrative": False, "inPanel": True},
    {"slug": "akasa", "label": "Akasa Air", "domain": "akasaair.com", "kind": "AIRLINE", "access": "PLAYWRIGHT", "robots": "PENDING_REVIEW", "tos": "PENDING_REVIEW", "ratePerMin": 10, "nightlyCap": 300, "illustrative": False, "inPanel": False},
    {"slug": "spicejet", "label": "SpiceJet", "domain": "spicejet.com", "kind": "AIRLINE", "access": "PLAYWRIGHT", "robots": "PENDING_REVIEW", "tos": "PENDING_REVIEW", "ratePerMin": 10, "nightlyCap": 300, "illustrative": False, "inPanel": False},
    {"slug": "makemytrip", "label": "MakeMyTrip", "domain": "makemytrip.com", "kind": "OTA", "access": "SCRAPY", "robots": "PENDING_REVIEW", "tos": "PENDING_REVIEW", "ratePerMin": 6, "nightlyCap": 250, "illustrative": False, "inPanel": False},
    {"slug": "yatra", "label": "Yatra", "domain": "yatra.com", "kind": "OTA", "access": "SCRAPY", "robots": "PENDING_REVIEW", "tos": "PENDING_REVIEW", "ratePerMin": 6, "nightlyCap": 250, "illustrative": False, "inPanel": False},
    {"slug": "easemytrip", "label": "EaseMyTrip", "domain": "easemytrip.com", "kind": "OTA", "access": "SCRAPY", "robots": "PENDING_REVIEW", "tos": "PENDING_REVIEW", "ratePerMin": 6, "nightlyCap": 250, "illustrative": False, "inPanel": False},
    {"slug": "cleartrip", "label": "Cleartrip", "domain": "cleartrip.com", "kind": "OTA", "access": "SCRAPY", "robots": "PENDING_REVIEW", "tos": "PENDING_REVIEW", "ratePerMin": 6, "nightlyCap": 250, "illustrative": False, "inPanel": False},
    {"slug": "ixigo", "label": "ixigo", "domain": "ixigo.com", "kind": "OTA", "access": "SCRAPY", "robots": "PENDING_REVIEW", "tos": "PENDING_REVIEW", "ratePerMin": 6, "nightlyCap": 250, "illustrative": False, "inPanel": False},
    {"slug": "goibibo", "label": "Goibibo", "domain": "goibibo.com", "kind": "OTA", "access": "SCRAPY", "robots": "PENDING_REVIEW", "tos": "PENDING_REVIEW", "ratePerMin": 6, "nightlyCap": 250, "illustrative": False, "inPanel": False},
    {"slug": "portal-f", "label": "Portal F", "domain": "portal-f.example", "kind": "OTA", "access": "NOT_ROUTED", "robots": "DISALLOW", "tos": "DISALLOW", "ratePerMin": 0, "nightlyCap": 0, "illustrative": True, "demotedTo": "amadeus", "demotedReason": "robots.txt Disallow on the fare-search path; terms decline automated retrieval", "inPanel": False},
    {"slug": "amadeus", "label": "Amadeus Self-Service", "domain": "api.amadeus.com", "kind": "LICENSED_API", "access": "API", "robots": "LICENSED", "tos": "LICENSED", "ratePerMin": 30, "nightlyCap": 2000, "illustrative": False, "inPanel": True},
    {"slug": "duffel", "label": "Duffel", "domain": "api.duffel.com", "kind": "LICENSED_API", "access": "API", "robots": "LICENSED", "tos": "LICENSED", "ratePerMin": 20, "nightlyCap": 1200, "illustrative": False, "inPanel": True},
    {"slug": "dgca-feed", "label": "DGCA tariff feed", "domain": "dgca.gov.in", "kind": "MOU", "access": "FEED", "robots": "STATUTORY", "tos": "STATUTORY", "ratePerMin": 0, "nightlyCap": 0, "illustrative": False, "inPanel": True},
]

PANEL_SOURCES = [s for s in SOURCES if s["inPanel"]]

# ---------------------------------------------------------------------------
# Fixture parameters
# ---------------------------------------------------------------------------

SEED = 26056
DEMO_DATE = "2026-09-04"
DAYS = 90
START_TOTAL = 108.42
START_BASE = 106.91

EVENTS = [
    {"id": "monsoon", "from": "2026-06-22", "to": "2026-06-27", "kind": "capacity", "lift": 0.021},
    {"id": "atf", "from": "2026-07-01", "to": "2026-07-01", "kind": "cost", "lift": 0.009},
    {"id": "independence", "from": "2026-08-13", "to": "2026-08-18", "kind": "demand", "lift": 0.052},
    {"id": "onam", "from": "2026-08-26", "to": "2026-08-31", "kind": "demand", "lift": 0.028},
]

SUPPRESSED_DAYS = {"2026-07-19", "2026-08-24"}
DELBOM_ANCHORS = {45: 4180, 30: 5340, 15: 7412, 7: 11900, 1: 18650}

_PAX_TOTAL = sum(s["paxK"] for s in SECTORS)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _event_lift(iso: str) -> float:
    lift = 0.0
    for e in EVENTS:
        if e["kind"] == "cost":
            if iso >= e["from"]:
                lift += e["lift"]
        else:
            if e["from"] <= iso <= e["to"]:
                lift += e["lift"]
    return lift


def _geomean(xs: list[float]) -> float:
    if not xs:
        return float("nan")
    return math.exp(sum(math.log(x) for x in xs) / len(xs))


def _build_dates() -> list[str]:
    dates = []
    for i in range(DAYS):
        d = datetime.strptime(DEMO_DATE, "%Y-%m-%d")
        d += timedelta(days=i - (DAYS - 1))
        dates.append(d.strftime("%Y-%m-%d"))
    return dates


DATES = _build_dates()


def _pearson(a, b):
    n = len(a)
    ma = sum(a) / n
    mb = sum(b) / n
    num = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    da = sum((x - ma) ** 2 for x in a)
    db = sum((y - mb) ** 2 for y in b)
    return num / math.sqrt(da * db) if da and db else 0


def _log_diff(xs):
    return [math.log(xs[i] / xs[i - 1]) for i in range(1, len(xs))]


def _fare_at_lead(sector_id: str, lead: int) -> int:
    """Log-linear interpolation between anchor fares."""
    s = SECTOR_MAP[sector_id]
    floor = DELBOM_ANCHORS[45]
    if sector_id == "DEL-BOM":
        level, steep = 1.0, 1.0
    else:
        rng = _make_rng(_hash_seed(sector_id))
        pax_factor = s["paxK"] / 520
        level = _clamp(0.42 + pax_factor * 0.72 + rng.gauss(0, 0.07), 0.34, 1.24)
        trunk = 1.0 if s["isTrunk"] else 0.84
        leisure = 0.12 if s["seasonality"] == "leisure" else 0.0
        steep = _clamp(trunk + leisure + rng.gauss(0, 0.07), 0.66, 1.18)

    anchors = [(1, 18650), (7, 11900), (15, 7412), (30, 5340), (45, 4180)]
    if lead >= 45:
        ref = 4180
    elif lead <= 1:
        ref = 18650
    else:
        hi = next(a for a in anchors if a[0] >= lead)
        lo = next(reversed([a for a in anchors if a[0] <= lead]))
        if hi[0] == lo[0]:
            ref = hi[1]
        else:
            t = (lead - lo[0]) / (hi[0] - lo[0])
            ref = math.exp(math.log(lo[1]) * (1 - t) + math.log(hi[1]) * t)

    premium = (ref / floor) ** steep
    return round(floor * level * premium)


# ---------------------------------------------------------------------------
# Build all fixture data
# ---------------------------------------------------------------------------

def _build_daily():
    rng = _make_rng(SEED)
    out = []
    log_total = math.log(START_TOTAL)
    log_base = math.log(START_BASE)

    for i in range(DAYS):
        date = DATES[i]
        dow = datetime.strptime(date, "%Y-%m-%d").weekday()
        weekly = 0.0055 * math.sin((2 * math.pi * (dow - 2)) / 7)
        shock = rng.gauss(0, 0.0033)

        if i > 0:
            log_total += 0.00042 + weekly * 0.35 + shock
            log_base += 0.00042 * 0.82 + weekly * 0.3 + shock * 0.93

        lift = _event_lift(date)
        total = math.exp(log_total + weekly) * (1 + lift)
        base = math.exp(log_base + weekly) * (1 + lift * 0.86)

        suppressed = date in SUPPRESSED_DAYS
        cells_expected = len(SECTORS) * sum(len(s["carriers"]) for s in SECTORS) * len(LEAD_BUCKETS) * len(DOW_BANDS)
        coverage = rng.range(56, 64) if suppressed else rng.range(78.5, 96.4)
        cells_filled = round((coverage / 100) * cells_expected)

        half_band = _clamp(1.4 * (88 / coverage) + rng.gauss(0, 0.14), 1.0, 2.9)
        base_half_band = half_band * 0.94

        days_back = DAYS - 1 - i
        if suppressed:
            status = "SUPPRESSED"
        elif days_back < 7:
            status = "PROVISIONAL"
        elif days_back < 30:
            status = "REVISED"
        else:
            status = "FROZEN"

        out.append({
            "date": date,
            "total": round(total, 2),
            "totalLow": round(total - half_band, 2),
            "totalHigh": round(total + half_band, 2),
            "base": round(base, 2),
            "baseLow": round(base - base_half_band, 2),
            "baseHigh": round(base + base_half_band, 2),
            "coverage": round(coverage, 1),
            "status": status,
            "quotes": round(cells_filled * rng.range(4.2, 5.4)),
            "cellsFilled": cells_filled,
            "cellsExpected": cells_expected,
        })
    return out


_DAILY = _build_daily()


def _week_key(iso):
    idx = DATES.index(iso)
    wk = idx // 7
    return DATES[min(wk * 7 + 6, DAYS - 1)]


WEEKLY = []
for k, ps in __import__("itertools").groupby(_DAILY, lambda p: _week_key(p["date"])):
    ps = list(ps)
    WEEKLY.append({
        "date": k,
        "total": round(_geomean([p["total"] for p in ps]), 2),
        "totalLow": round(_geomean([p["totalLow"] for p in ps]), 2),
        "totalHigh": round(_geomean([p["totalHigh"] for p in ps]), 2),
        "base": round(_geomean([p["base"] for p in ps]), 2),
        "baseLow": round(_geomean([p["baseLow"] for p in ps]), 2),
        "baseHigh": round(_geomean([p["baseHigh"] for p in ps]), 2),
        "coverage": round(sum(p["coverage"] for p in ps) / len(ps), 1),
        "status": ps[-1]["status"],
        "quotes": sum(p["quotes"] for p in ps),
        "cellsFilled": sum(p["cellsFilled"] for p in ps),
        "cellsExpected": sum(p["cellsExpected"] for p in ps),
    })

MONTHLY = []
for m, ps in __import__("itertools").groupby(_DAILY, lambda p: f"{p['date'][:8]}01"):
    ps = list(ps)
    d0 = ps[0]["date"]
    if d0 < "2026-07-01":
        continue
    MONTHLY.append({
        "date": d0,
        "total": round(_geomean([p["total"] for p in ps]), 2),
        "totalLow": round(_geomean([p["totalLow"] for p in ps]), 2),
        "totalHigh": round(_geomean([p["totalHigh"] for p in ps]), 2),
        "base": round(_geomean([p["base"] for p in ps]), 2),
        "baseLow": round(_geomean([p["baseLow"] for p in ps]), 2),
        "baseHigh": round(_geomean([p["baseHigh"] for p in ps]), 2),
        "coverage": round(sum(p["coverage"] for p in ps) / len(ps), 1),
        "status": ps[-1]["status"],
        "quotes": sum(p["quotes"] for p in ps),
        "cellsFilled": sum(p["cellsFilled"] for p in ps),
        "cellsExpected": sum(p["cellsExpected"] for p in ps),
    })

LATEST = _DAILY[-1]
PREVIOUS = _DAILY[-2]

CELLS_EXPECTED = len(SECTORS) * sum(len(s["carriers"]) for s in SECTORS) * len(LEAD_BUCKETS) * len(DOW_BANDS)


def _build_cells():
    cells = []
    for s in SECTORS:
        for carrier in s["carriers"]:
            for lead in LEAD_BUCKETS:
                for band in DOW_BANDS:
                    key = f"{s['id']}|{carrier}|{lead}|ECONOMY|{band}"
                    rng_c = _make_rng(_hash_seed(key))
                    weekend_lift = 1.09 if band == "WEEKEND" else 1.0
                    carrier_lift = 1.13 if carrier == "AI" else (0.97 if carrier == "QP" else 1.0)
                    mean_fare = round(_fare_at_lead(s["id"], lead) * weekend_lift * carrier_lift * rng_c.range(0.94, 1.07))
                    relative = _clamp(1 + rng_c.gauss(0.0011, 0.021), 0.83, 1.24)
                    cells.append({
                        "key": key,
                        "sectorId": s["id"],
                        "carrier": carrier,
                        "lead": lead,
                        "band": band,
                        "quotes": rng_c.int(9, 74),
                        "imputed": rng_c.chance(0.027),
                        "winsorised": rng_c.int(0, 3) if rng_c.chance(0.11) else 0,
                        "relative": round(relative, 4),
                        "level": round(100 * rng_c.range(1.02, 1.31), 2),
                        "meanFare": mean_fare,
                        "prevMeanFare": round(mean_fare / relative),
                    })
    return cells


CELLS = _build_cells()

# Heatmap
def _build_heatmap():
    out = []
    for s in SECTORS:
        for lead in LEAD_BUCKETS:
            rng_h = _make_rng(_hash_seed(f"heat|{s['id']}|{lead}"))
            lead_gain = {1: 2.5, 7: 1.9, 15: 1.25, 30: 0.8, 45: 0.55}[lead]
            season_gain = {"leisure": 1.5, "regional": 1.2, "metro": 1.0, "trunk": 1.0}[s["seasonality"]]
            pct = rng_h.gauss(0.85, 7.1) * lead_gain * 0.62 * season_gain
            if s["id"] == "DEL-CCU" and lead == 7:
                pct = 34.0
            pct = _clamp(pct, -19, 41)
            members = [c for c in CELLS if c["sectorId"] == s["id"] and c["lead"] == lead]
            quotes = 62 if (s["id"] == "DEL-CCU" and lead == 7) else sum(c["quotes"] for c in members)
            carriers = ["6E", "AI", "SG", "IX"] if (s["id"] == "DEL-CCU" and lead == 7) else s["carriers"]
            imputed = False if (s["id"] == "DEL-CCU" and lead == 7) else any(c["imputed"] for c in members)
            out.append({"sectorId": s["id"], "lead": lead, "pctChange": round(pct, 1),
                        "quotes": quotes, "carriers": carriers, "imputed": imputed})
    return out


HEATMAP = _build_heatmap()

SECTOR_WEIGHT = {s["id"]: s["paxK"] / _PAX_TOTAL for s in SECTORS}


def _build_contributions():
    rng = _make_rng(_hash_seed(f"contrib|{LATEST['date']}"))
    move = LATEST["total"] - PREVIOUS["total"]
    raw = []
    for s in SECTORS:
        w = s["paxK"] / _PAX_TOTAL
        sector_move = rng.gauss(move / PREVIOUS["total"], 0.011)
        raw.append({"sectorId": s["id"], "raw": w * sector_move * PREVIOUS["total"]})
    total_raw = sum(r["raw"] for r in raw)
    scale = move / total_raw if total_raw != 0 else 0
    contribs = []
    for r in raw:
        points = r["raw"] * scale
        contribs.append({
            "sectorId": r["sectorId"],
            "points": round(points, 3),
            "pctChange": round((points / PREVIOUS["total"]) * 100, 3),
        })
    return sorted(contribs, key=lambda x: x["points"], reverse=True)


CONTRIBUTIONS = _build_contributions()

# Decomposition
DECOMPOSITION = []
rng_dec = _make_rng(SEED + 3)
for i, p in enumerate(_DAILY):
    total = 6820 * (p["total"] / START_TOTAL)
    base_share = 0.726 - (i / DAYS) * 0.014 + rng_dec.gauss(0, 0.004)
    tax_share = 0.137 + (i / DAYS) * 0.008 + rng_dec.gauss(0, 0.002)
    udf_share = 0.081 + (i / DAYS) * 0.004 + rng_dec.gauss(0, 0.0015)
    conv_share = _clamp(1 - base_share - tax_share - udf_share, 0.035, 0.09)
    DECOMPOSITION.append({
        "date": p["date"],
        "baseFare": round(total * base_share),
        "taxes": round(total * tax_share),
        "udf": round(total * udf_share),
        "convenience": round(total * conv_share),
        "total": round(total),
    })

SECTOR_DECOMPOSITION = []
rng_sd = _make_rng(SEED + 4)
for s in SECTORS:
    fares = [_fare_at_lead(s["id"], b) for b in LEAD_BUCKETS]
    total = round(sum(fares) / len(fares))
    udf = round(_clamp(rng_sd.range(430, 690), 400, 720))
    convenience = round(rng_sd.range(240, 460))
    taxes = round((total - udf - convenience) * rng_sd.range(0.155, 0.185))
    SECTOR_DECOMPOSITION.append({
        "sectorId": s["id"],
        "baseFare": total - udf - convenience - taxes,
        "taxes": taxes,
        "udf": udf,
        "convenience": convenience,
        "total": total,
    })
SECTOR_DECOMPOSITION.sort(key=lambda x: x["total"], reverse=True)

# Formula series
FORMULA_SERIES = []
jev = START_TOTAL
dut = START_TOTAL
car = START_TOTAL
for i, p in enumerate(_DAILY):
    if i > 0:
        rel = p["total"] / _DAILY[i - 1]["total"]
        rng_f = _make_rng(_hash_seed(f"form|{p['date']}"))
        jev *= rel
        dut *= rel * (1 + rng_f.gauss(0, 0.00022))
        car *= rel * (1 + (0.036 + rng_f.gauss(0, 0.008)) ** 2 / 2)
    FORMULA_SERIES.append({"date": p["date"], "jevons": round(jev, 2), "dutot": round(dut, 2), "carli": round(car, 2)})

# Imputation series
IMPUTATION_SERIES = []
carry = START_TOTAL
for i, p in enumerate(_DAILY):
    if i > 0:
        rel = p["total"] / _DAILY[i - 1]["total"]
        rng_imp = _make_rng(_hash_seed(f"imp|{p['date']}"))
        frozen = 0.0
        if rng_imp.chance(0.15):
            frozen = rng_imp.range(0.02, 0.06)
        carry *= 1 + (rel - 1) * (1 - frozen) - 0.00028
    IMPUTATION_SERIES.append({"date": p["date"], "cellMean": p["total"], "carryForward": round(carry, 2)})

# Backtest
BACKTEST_DAYS = 30
OFFER_PRICE_GAP = 0.024
window = _DAILY[-BACKTEST_DAYS:]
anchor = window[0]["total"]
rng_bt = _make_rng(SEED + 5)
BACKTEST = []
for i, p in enumerate(window):
    apix = (p["total"] / anchor) * 100
    wander = 0.018 * math.sin((2 * math.pi * i) / 55 + 0.9)
    dgca = apix * (1 - OFFER_PRICE_GAP + wander + rng_bt.gauss(0, 0.003))
    cpi = None
    if i % 10 == 4:
        cpi = apix * (1 - OFFER_PRICE_GAP * 1.2 + rng_bt.gauss(0, 0.0026))
    BACKTEST.append({"date": p["date"], "apix": round(apix, 2), "dgca": round(dgca, 2),
                      "cpi": round(cpi, 2) if cpi is not None else None})

apix_vals = [p["apix"] for p in BACKTEST]
ref_vals = [p["dgca"] for p in BACKTEST]
n_bt = len(apix_vals)
rmse_bt = math.sqrt(sum((a - r) ** 2 for a, r in zip(apix_vals, ref_vals)) / n_bt)
mape_bt = (sum(abs(a - r) / r for a, r in zip(apix_vals, ref_vals)) / n_bt) * 100
da_log = _log_diff(apix_vals)
dr_log = _log_diff(ref_vals)
dir_agree = sum(1 for x, y in zip(da_log, dr_log) if math.copysign(1, x) == math.copysign(1, y))

BACKTEST_METRICS = {
    "n": n_bt,
    "rLevels": round(_pearson(apix_vals, ref_vals), 4),
    "rLogDiff": round(_pearson(da_log, dr_log), 4),
    "rmse": round(rmse_bt, 2),
    "mape": round(mape_bt, 2),
    "dirAgree": dir_agree,
    "dirTotal": len(da_log),
}

# Recovery
RECOVERY = []
rng_rec = _make_rng(_hash_seed("recovery"))
truth = 100.0
for d in range(61):
    truth = 100 * math.exp(0.000131 * d) * (1.03 if d >= 30 else 1.0)
    est = truth * (1 + rng_rec.gauss(0, 0.0042))
    half = 1.32 + rng_rec.gauss(0, 0.1)
    RECOVERY.append({"day": d, "truth": round(truth, 2), "estimate": round(est, 2),
                      "low": round(est - half, 2), "high": round(est + half, 2)})
RECOVERY_INSIDE_BAND = sum(1 for r in RECOVERY if r["truth"] >= r["low"] and r["truth"] <= r["high"])

# Cleaning funnel
RAW_QUOTES = 268400
FUNNEL = [
    {"id": "raw", "label": "Landed raw", "kept": RAW_QUOTES, "removed": 0},
    {"id": "dedupe", "label": "De-duplicated", "kept": RAW_QUOTES - 9142, "removed": 9142},
    {"id": "contract", "label": "Contract-checked", "kept": RAW_QUOTES - 9142 - 2963, "removed": 2963},
    {"id": "outlier", "label": "Outlier-edited", "kept": RAW_QUOTES - 9142 - 2963 - 4318, "removed": 4318},
]
CLEAN_QUOTES = FUNNEL[-1]["kept"]
SURVIVAL_RATE = round((CLEAN_QUOTES / RAW_QUOTES) * 100, 2)
IMPUTED_SHARE = 2.7
WINSORISED_QUOTES = 1874
SUPPRESSED_COUNT = len(SUPPRESSED_DAYS)
MEAN_BAND_HALFWIDTH = round(sum((p["totalHigh"] - p["totalLow"]) / 2 for p in _DAILY) / len(_DAILY), 2)

# Source health
SOURCE_HEALTH = []
for s in PANEL_SOURCES:
    rng_h = _make_rng(_hash_seed(f"health|{s['slug']}"))
    if s["kind"] == "MOU":
        expected = 1200
        yield_pct = 100.0
    elif s["kind"] == "LICENSED_API":
        expected = 1450
        yield_pct = _clamp(rng_h.range(81, 97.5), 60, 100)
    else:
        expected = rng_h.int(680, 980)
        yield_pct = _clamp(rng_h.range(81, 97.5), 60, 100)
    quotes = round((expected * yield_pct) / 100)
    block_rate = rng_h.range(0, 0.6) if s["kind"] != "AIRLINE" else rng_h.range(0.4, 3.2)
    latency = (rng_h.range(240, 520) if s["kind"] in ("LICENSED_API", "MOU") else rng_h.range(1900, 5200))
    SOURCE_HEALTH.append({
        "slug": s["slug"], "label": s["label"], "kind": s["kind"],
        "quotes": quotes, "expected": expected, "yieldPct": round(yield_pct, 1),
        "blockRate": round(block_rate, 2), "p95Latency": round(latency),
        "requestsToday": round(s["nightlyCap"] * rng_h.range(0.42, 0.86)),
        "cap": s["nightlyCap"],
        "lastBlock": (f"{DEMO_DATE}T02:{rng_h.int(10, 55):02d}:00+05:30"
                      if s["kind"] == "AIRLINE" and rng_h.chance(0.5) else None),
        "killSwitch": "ARMED",
    })

# Nightly run
NIGHTLY_RUN = [
    {"id": "gate", "label": "Compliance gate warm-up", "startedAt": "01:30", "durationMin": 4, "status": "OK",
     "detail": "robots.txt re-fetched for 13 sources, 2 served from the 24h cache"},
    {"id": "collect", "label": "Collection fan-out", "startedAt": "01:34", "durationMin": 96, "status": "OK",
     "detail": "600 cell tasks dispatched across 6 workers"},
    {"id": "land", "label": "Bronze landing", "startedAt": "03:10", "durationMin": 11, "status": "OK",
     "detail": "Raw payloads written as Parquet, partitioned by capture date"},
    {"id": "clean", "label": "Cleaning pipeline", "startedAt": "03:21", "durationMin": 18, "status": "WARN",
     "detail": "4,318 quotes edited by the outlier rule, above the 30-day median of 3,780"},
    {"id": "index", "label": "Index compilation", "startedAt": "03:39", "durationMin": 7, "status": "OK",
     "detail": "Jevons per cell, weighted aggregation, chain-link, rebase"},
    {"id": "variance", "label": "Block bootstrap", "startedAt": "03:46", "durationMin": 14, "status": "OK",
     "detail": "1,000 replicates, resampled within cell"},
    {"id": "publish", "label": "Publication gate", "startedAt": "04:00", "durationMin": 2, "status": "OK",
     "detail": f"Coverage {LATEST['coverage']}% cleared the 70% threshold, released as PROVISIONAL"},
]

# Audit log
AUDIT_PATHS = {
    "indigo": ["/api/search/fare", "/booking/availability"],
    "airindia": ["/flights/search", "/api/v1/availability"],
    "airindiaexpress": ["/api/search/fare", "/flights/lowfare"],
    "amadeus": ["/v2/shopping/flight-offers", "/v1/reference-data/locations"],
    "duffel": ["/air/offer_requests", "/air/offers"],
    "dgca-feed": ["/tariff/monthly-extract", "/traffic/city-pair-extract"],
}

AUDIT = []
rng_audit = _make_rng(_hash_seed("audit"))
for i in range(140):
    src = PANEL_SOURCES[i % len(PANEL_SOURCES)]
    total_min = 30 + int(i * 1.4)
    hh = str(1 + total_min // 60).zfill(2)
    mm = str(total_min % 60).zfill(2)
    ss = str(rng_audit.int(0, 59)).zfill(2)
    scraped = src["kind"] in ("AIRLINE", "OTA")
    status = 200
    if scraped and rng_audit.chance(0.06):
        status = (429 if rng_audit.chance(0.6) else 503)
    paths = AUDIT_PATHS.get(src["slug"], ["/api/v1/quote"])
    AUDIT.append({
        "id": f"req-{i}",
        "at": f"{DEMO_DATE}T{hh}:{mm}:{ss}+05:30",
        "source": src["label"],
        "path": paths[i % len(paths)],
        "status": status,
        "latencyMs": round(rng_audit.range(900, 6400) if scraped else rng_audit.range(180, 620)),
        "robotsAllowed": True,
        "throttled": scraped and rng_audit.chance(0.24),
    })
AUDIT.reverse()

# Quotes
AIRLINE_PORTAL_CARRIER = {
    "indigo": "6E", "airindia": "AI", "airindiaexpress": "IX",
    "akasa": "QP", "spicejet": "SG",
}

QUOTES = []
rng_q = _make_rng(_hash_seed("quotes"))
for i in range(420):
    src = PANEL_SOURCES[rng_q.int(0, len(PANEL_SOURCES) - 1)]
    forced = AIRLINE_PORTAL_CARRIER.get(src["slug"])
    eligible = SECTORS if not forced else [s for s in SECTORS if forced in s["carriers"]]
    sector = eligible[rng_q.int(0, len(eligible) - 1)]
    carrier = forced or rng_q.pick(sector["carriers"])
    lead = rng_q.pick(LEAD_BUCKETS)
    band = rng_q.pick(DOW_BANDS)
    total = round(_fare_at_lead(sector["id"], lead) * (1.09 if band == "WEEKEND" else 1.0) * rng_q.range(0.9, 1.14))
    udf = round(rng_q.range(430, 690))
    convenience = round(rng_q.range(240, 460)) if src["kind"] == "OTA" else round(rng_q.range(0, 90))
    taxes = round((total - udf - convenience) * rng_q.range(0.15, 0.19))
    base_fare = total - udf - convenience - taxes
    min_t = rng_q.int(30, 230)
    hh_q = str(1 + min_t // 60).zfill(2)
    mm_q = str(min_t % 60).zfill(2)
    QUOTES.append({
        "id": f"q-{i}",
        "capturedAt": f"{DEMO_DATE}T{hh_q}:{mm_q}:00+05:30",
        "source": src["label"],
        "sectorId": sector["id"],
        "carrier": carrier,
        "flightNo": f"{carrier} {rng_q.int(101, 989)}",
        "lead": lead,
        "band": band,
        "baseFare": base_fare,
        "taxes": taxes,
        "udf": udf,
        "convenience": convenience,
        "total": total,
        "imputed": rng_q.chance(0.027),
        "winsorised": rng_q.chance(0.008),
        "soldOut": rng_q.chance(0.035),
    })

# Carrier mix
CARRIER_MIX = []
rng_cm = _make_rng(SEED + 6)
for c in CARRIERS:
    rng_c = _make_rng(_hash_seed(f"mix|{c['code']}"))
    cells = [cell for cell in CELLS if cell["carrier"] == c["code"]]
    quotes_c = round(CLEAN_QUOTES * c["presence"] * rng_c.range(0.94, 1.06))
    mean_fare = round(sum(cell["meanFare"] for cell in cells) / len(cells)) if cells else 0
    CARRIER_MIX.append({"code": c["code"], "name": c["name"], "quotes": quotes_c, "share": 0, "meanFare": mean_fare})
total_cm = sum(c["quotes"] for c in CARRIER_MIX)
for c in CARRIER_MIX:
    c["share"] = round((c["quotes"] / total_cm) * 100, 1)
CARRIER_MIX.sort(key=lambda x: x["quotes"], reverse=True)

# Anomaly alerts
ANOMALY_ALERTS = [
    {"id": "a1", "severity": "CRITICAL", "sector": "DEL-BOM", "leadWindow": "T+7",
     "description": "Single-sector fare jumped 41% in the last 24 hours on the DEL-BOM trunk. The movement is 1.6 standard deviations beyond the expected seasonal band for this lead window.",
     "confidence": 0.92, "cause": "Demand shock", "status": "Open", "detectedAt": "2026-09-11T08:14:00+05:30"},
    {"id": "a2", "severity": "CRITICAL", "sector": "BOM-CCU", "leadWindow": "T+15",
     "description": "Five consecutive data points from the BOM-CCU sector are missing after a CAPTCHA interstitial appeared on the aggregator source. Panel yield for this cell dropped to zero.",
     "confidence": 0.88, "cause": "Data error", "status": "Investigating", "detectedAt": "2026-09-11T06:42:00+05:30"},
    {"id": "a3", "severity": "WARN", "sector": "BLR-CJB", "leadWindow": "T+30",
     "description": "Cross-sector correlation between BLR-CJB and BLR-HYD broke down. The two sectors typically move together within a 5% band; they diverged by 12% over 48 hours.",
     "confidence": 0.74, "cause": "Demand shock", "status": "Open", "detectedAt": "2026-09-10T21:30:00+05:30"},
    {"id": "a4", "severity": "WARN", "sector": "DEL-HYD", "leadWindow": "T+7",
     "description": "Fare reversal detected: price dropped 18% mid-week then spiked back to near-original levels within 36 hours. Pattern is consistent with a temporary promotional flash sale.",
     "confidence": 0.67, "cause": "Fuel surcharge", "status": "Resolved", "detectedAt": "2026-09-09T14:10:00+05:30"},
    {"id": "a5", "severity": "INFO", "sector": "CCU-DEL", "leadWindow": "T+22",
     "description": "Lead-time curve distortion on CCU-DEL: the T+22 fare is priced below T+30 for the first time in the 90-day training window. Mild, but worth watching before it stabilises.",
     "confidence": 0.53, "cause": "Festival", "status": "Investigating", "detectedAt": "2026-09-10T09:55:00+05:30"},
]
ANOMALY_MODEL_PERF = [
    {"model": "Isolation Forest", "precision": 0.913, "recall": 0.886, "f1": 0.899, "latencyMs": 42, "status": "Active"},
    {"model": "Statistical Fence", "precision": 0.847, "recall": 0.912, "f1": 0.879, "latencyMs": 8, "status": "Active"},
    {"model": "Pattern Match", "precision": 0.781, "recall": 0.754, "f1": 0.767, "latencyMs": 15, "status": "Active"},
    {"model": "Ensemble", "precision": 0.942, "recall": 0.918, "f1": 0.930, "latencyMs": 65, "status": "Active"},
]
ANOMALY_RULES = [
    {"name": "Single-sector jump", "threshold": ">30% in 24h", "sensitivity": "High",
     "lastTriggered": "Today, 08:14", "autoAction": "Flag for review, suppress index cell"},
    {"name": "Cross-sector correlation break", "threshold": "Divergence >10% over 48h", "sensitivity": "Medium",
     "lastTriggered": "Yesterday, 21:30", "autoAction": "Alert analyst, tag both sectors"},
    {"name": "Fare reversal", "threshold": "Drop then spike within 72h", "sensitivity": "Medium",
     "lastTriggered": "2 days ago", "autoAction": "Mark transient, exclude from daily average"},
    {"name": "CAPTCHA / block pattern", "threshold": "Zero yield for a sector for >4h", "sensitivity": "High",
     "lastTriggered": "Today, 06:42", "autoAction": "Demote source, reroute to licensed API"},
    {"name": "Lead-time curve distortion", "threshold": "Fare at T+n below T+(n+8)", "sensitivity": "Low",
     "lastTriggered": "Yesterday, 09:55", "autoAction": "Watch for 48h before escalation"},
]

ANOMALY_TIMELINE = []
rng_at = _make_rng(SEED + 7)
scores = [0.18, 0.22, 0.15, 0.25, 0.31, 0.72, 0.45, 0.28, 0.19, 0.24,
          0.33, 0.55, 0.21, 0.17, 0.29, 0.38, 0.81, 0.52, 0.27, 0.14,
          0.22, 0.35, 0.19, 0.41, 0.63, 0.28, 0.16, 0.24, 0.88, 0.47]
base_date = datetime(2026, 9, 11)
for i in range(30):
    d = base_date - timedelta(days=29 - i)
    ANOMALY_TIMELINE.append({"date": d.strftime("%Y-%m-%d"), "score": scores[i]})

# Forecast
def _build_forecast():
    base_index = 104.2
    data = []
    for i in range(59, -1, -1):
        d = datetime(2026, 9, 4) + timedelta(days=i - 59)
        seasonal = math.sin((60 - i) / 60 * math.pi * 1.3) * 1.8
        noise = (math.sin(i * 3.7 + 0.5) + math.sin(i * 7.1 + 2.3)) * 0.4
        data.append({"date": d.strftime("%Y-%m-%d"), "actual": round(base_index + seasonal + noise, 2),
                     "forecast14": None, "forecast30": None,
                     "band14Low": None, "band14High": None, "band30Low": None, "band30High": None})

    last_hist = data[-1]["actual"]
    for i in range(1, 15):
        d = datetime(2026, 9, 4) + timedelta(days=60 - 59 + i - 1)
        trend = i * 0.3
        seasonal = math.sin((60 + i) / 60 * math.pi * 1.3) * 1.8
        noise = (math.sin(i * 2.3 + 1.1) + math.sin(i * 5.7 + 0.8)) * 0.3
        val = round(last_hist + trend + seasonal + noise, 2)
        bw = 0.3 + i * 0.18
        data.append({"date": d.strftime("%Y-%m-%d"), "actual": None, "forecast14": val, "forecast30": None,
                     "band14Low": round(val - bw, 2), "band14High": round(val + bw, 2),
                     "band30Low": None, "band30High": None})

    for i in range(15, 31):
        d = datetime(2026, 9, 4) + timedelta(days=60 - 59 + i - 1)
        trend = 14 * 0.3 + (i - 14) * 0.28
        seasonal = math.sin((60 + i) / 60 * math.pi * 1.3) * 1.8
        noise = (math.sin(i * 2.3 + 1.1) + math.sin(i * 5.7 + 0.8)) * 0.3
        val = round(last_hist + trend + seasonal + noise, 2)
        bw = 1.5 + (i - 14) * 0.35
        data.append({"date": d.strftime("%Y-%m-%d"), "actual": None, "forecast14": None, "forecast30": val,
                     "band14Low": None, "band14High": None,
                     "band30Low": round(val - bw, 2), "band30High": round(val + bw, 2)})
    return data


FORECAST_DATA = _build_forecast()

SECTOR_FORECAST = []
rng_sf = _make_rng(SEED + 9)
for s in SECTORS[:8]:
    base_fare = 4200 + rng_sf.range(0, 1800) if s["isTrunk"] else 2800 + rng_sf.range(0, 1600)
    current_fare = round(base_fare)
    trend_seeds = [0.8, -0.5, 0.6, 1.2, -0.3, 0.5, 0.1, -0.7]
    trends = ["rising", "falling", "rising", "rising", "falling", "rising", "stable", "falling"]
    confidences = ["high", "high", "high", "medium", "medium", "high", "high", "low"]
    idx = SECTORS[:8].index(s)
    SECTOR_FORECAST.append({
        "sectorId": s["id"],
        "origin": s["origin"],
        "destination": s["destination"],
        "isTrunk": s["isTrunk"],
        "currentFare": current_fare,
        "forecast7": round(current_fare * (1 + trend_seeds[idx] * 0.5)),
        "forecast14": round(current_fare * (1 + trend_seeds[idx] * 0.9)),
        "forecast30": round(current_fare * (1 + trend_seeds[idx] * 1.6)),
        "trend": trends[idx],
        "confidence": confidences[idx],
    })

FESTIVAL_EVENTS = [
    {"id": "diwali", "name": "Diwali 2026", "dateRange": "Oct 15 - Nov 5, 2026", "expectedSurge": "+15 - 25%",
     "affectedSectors": ["DEL-BOM", "DEL-BLR", "DEL-CCU", "BOM-BLR", "DEL-HYD"], "confidence": "high",
     "description": "The largest annual demand surge. Outbound leisure from metro origins to family destinations peaks three days before and after Diwali. Return bookings lag by 4-6 days."},
    {"id": "winter", "name": "Winter peak season", "dateRange": "Dec 15, 2026 - Jan 15, 2027", "expectedSurge": "+8 - 12%",
     "affectedSectors": ["DEL-GAU", "DEL-SXR", "DEL-BLR", "BOM-GOI"], "confidence": "high",
     "description": "Hill-station and leisure destinations see sustained elevated demand through year-end holidays."},
    {"id": "summer", "name": "Summer school holidays", "dateRange": "Apr 15 - May 31, 2027", "expectedSurge": "+10 - 18%",
     "affectedSectors": ["DEL-BOM", "DEL-CCU", "BOM-GOI", "BLR-MAA", "DEL-PNQ"], "confidence": "medium",
     "description": "Family travel across the April-May school break. Confidence is slightly lower because school-exam schedules vary year to year."},
]


# ---------------------------------------------------------------------------
# Live scraper data loader
# ---------------------------------------------------------------------------

def _load_json(path: Path) -> Any:
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


_live_fare_ladder = _load_json(SCRAPER_DIR / "liveFareLadder.json")
_live_cabin_compare = _load_json(SCRAPER_DIR / "liveCabinCompare.json")


# ===========================================================================
# AUTH ENDPOINTS
# ===========================================================================

@app.post("/api/v1/auth/login", tags=["Auth"])
def login(username: str = Query(...), password: str = Query(...)):
    user = authenticate_user(username, password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(user["username"], user["role"], user["scopes"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {"username": user["username"], "role": user["role"], "scopes": user["scopes"]},
    }


@app.get("/api/v1/auth/me", tags=["Auth"])
def me(payload: dict = Depends(_get_current_user)):
    return {"username": payload["sub"], "role": payload["role"], "scopes": payload["scopes"]}


# ===========================================================================
# ROOT
# ===========================================================================

@app.get("/", tags=["Root"])
def root():
    return {
        "service": "VIMAAN Airfare Price Index API",
        "version": "2.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "health": "/api/v1/health",
        "auth": "/api/v1/auth/login",
        "sdmx": "/api/v1/sdmx/latest",
        "panelSeed": SEED,
    }


@app.get("/api/v1/endpoints", tags=["Root"])
def get_endpoints():
    return {
        "total": 46,
        "groups": [
            {"group": "Root", "endpoints": ["/", "/docs", "/openapi.json", "/api/v1/health"]},
            {"group": "Auth", "endpoints": ["/api/v1/auth/login", "/api/v1/auth/me"]},
            {"group": "Index", "endpoints": [
                "/api/v1/index/daily", "/api/v1/index/weekly", "/api/v1/index/monthly",
                "/api/v1/index/latest", "/api/v1/index/apix", "/api/v1/index/elementary",
                "/api/v1/index/contributions", "/api/v1/index/forecast",
            ]},
            {"group": "Sectors", "endpoints": [
                "/api/v1/sectors", "/api/v1/sectors/heatmap",
                "/api/v1/sectors/{id}/elasticity", "/api/v1/sectors/{id}/decomposition",
            ]},
            {"group": "Quotes", "endpoints": ["/api/v1/quotes"]},
            {"group": "Validation", "endpoints": [
                "/api/v1/backtest", "/api/v1/backtest/recovery",
            ]},
            {"group": "Compliance", "endpoints": [
                "/api/v1/compliance/sources", "/api/v1/compliance/rules",
                "/api/v1/compliance/audit", "/api/v1/compliance/posture",
            ]},
            {"group": "Anomalies", "endpoints": ["/api/v1/anomalies"]},
            {"group": "Forecast", "endpoints": ["/api/v1/forecast"]},
            {"group": "Analysis", "endpoints": ["/api/v1/decomposition"]},
            {"group": "Methodology", "endpoints": [
                "/api/v1/methodology/formulas", "/api/v1/methodology/imputation",
                "/api/v1/methodology/fence", "/api/v1/methodology/sample-pairs",
            ]},
            {"group": "Scraper", "endpoints": [
                "/api/v1/scraper/fare-ladder", "/api/v1/scraper/cabin-compare",
                "/api/v1/scraper/status", "/api/v1/scraper/config",
            ]},
            {"group": "Reports", "endpoints": ["/api/v1/reports"]},
            {"group": "SDMX", "endpoints": ["/api/v1/sdmx/latest"]},
            {"group": "Admin", "endpoints": [
                "/api/v1/admin/rerun", "/api/v1/admin/basket",
                "/api/v1/admin/weights", "/api/v1/admin/seed-demo",
            ]},
        ],
    }


# ===========================================================================
# HEALTH
# ===========================================================================

@app.get("/api/v1/health", tags=["Health"])
def health():
    return {
        "status": "healthy",
        "service": "VIMAAN Airfare Price Index API",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "liveScraper": {
            "fareLadderLoaded": _live_fare_ladder is not None,
            "cabinCompareLoaded": _live_cabin_compare is not None,
        },
        "panel": {
            "dailyPoints": len(_DAILY),
            "weeklyPoints": len(WEEKLY),
            "monthlyPoints": len(MONTHLY),
            "cellsExpected": CELLS_EXPECTED,
            "cleanQuotes": CLEAN_QUOTES,
            "latestCoverage": LATEST["coverage"],
        },
    }


@app.get("/api/v1/health/coverage", tags=["Health"])
def get_coverage():
    return {
        "gateThreshold": 70,
        "latest": LATEST["coverage"],
        "suppressed": SUPPRESSED_COUNT,
        "data": [{"date": p["date"], "coverage": p["coverage"], "status": p["status"]} for p in _DAILY],
    }


@app.get("/api/v1/health/scrapers", tags=["Health"])
def get_scraper_health():
    return {"sources": SOURCE_HEALTH}


# ===========================================================================
# INDEX ENDPOINTS
# ===========================================================================

@app.get("/api/v1/index/daily", tags=["Index"])
def get_index_daily(measure: str = Query("total", regex="^(total|base)$"),
                    from_date: Optional[str] = None, to_date: Optional[str] = None):
    key = measure
    data = _DAILY
    if from_date:
        data = [p for p in data if p["date"] >= from_date]
    if to_date:
        data = [p for p in data if p["date"] <= to_date]
    return {"frequency": "DAILY", "measure": key, "count": len(data), "data": data}


@app.get("/api/v1/index/weekly", tags=["Index"])
def get_index_weekly(measure: str = Query("total", regex="^(total|base)$")):
    return {"frequency": "WEEKLY", "measure": measure, "count": len(WEEKLY), "data": WEEKLY}


@app.get("/api/v1/index/monthly", tags=["Index"])
def get_index_monthly(measure: str = Query("total", regex="^(total|base)$")):
    return {"frequency": "MONTHLY", "measure": measure, "count": len(MONTHLY), "data": MONTHLY}


@app.get("/api/v1/index/latest", tags=["Index"])
def get_index_latest():
    return {
        "latest": LATEST,
        "previous": PREVIOUS,
        "dayDelta": round(LATEST["total"] - PREVIOUS["total"], 2),
        "monthAgo": _DAILY[-31] if len(_DAILY) >= 31 else None,
    }


@app.get("/api/v1/index/apix", tags=["Index"])
def get_apix(frequency: str = Query("daily", regex="^(daily|weekly|monthly)$"), measure: str = Query("total")):
    freq_map = {"daily": "DAILY", "weekly": "WEEKLY", "monthly": "MONTHLY"}
    series_map = {"DAILY": _DAILY, "WEEKLY": WEEKLY, "MONTHLY": MONTHLY}
    freq = freq_map[frequency]
    series = series_map[freq]
    return {"frequency": freq, "measure": measure, "count": len(series), "data": series}


@app.get("/api/v1/index/elementary", tags=["Index"])
def get_elementary_cells(sector: Optional[str] = None):
    cells = CELLS
    if sector:
        cells = [c for c in cells if c["sectorId"] == sector]
    return {"count": len(cells), "data": cells}


@app.get("/api/v1/index/contributions", tags=["Index"])
def get_contributions():
    return {
        "count": len(CONTRIBUTIONS),
        "totalMove": round(sum(c["points"] for c in CONTRIBUTIONS), 3),
        "data": CONTRIBUTIONS,
    }


@app.get("/api/v1/index/forecast", tags=["Forecast"])
def get_index_forecast():
    return {
        "horizon14": round(LATEST["total"] + 2.3, 2),
        "horizon30": round(LATEST["total"] + 6.6, 2),
        "mape": 3.2,
        "model": "LSTM + Seasonal ARIMA",
        "data": FORECAST_DATA,
    }


# ===========================================================================
# SECTORS
# ===========================================================================

@app.get("/api/v1/sectors", tags=["Sectors"])
def get_sectors():
    return {"count": len(SECTORS), "data": SECTORS}


@app.get("/api/v1/sectors/heatmap", tags=["Sectors"])
def get_sector_heatmap(sector: Optional[str] = None):
    data = HEATMAP
    if sector:
        data = [h for h in data if h["sectorId"] == sector]
    return {"count": len(data), "data": data}


@app.get("/api/v1/sectors/{sector_id}/elasticity", tags=["Sectors"])
def get_sector_elasticity(sector_id: str):
    if sector_id not in SECTOR_MAP:
        raise HTTPException(status_code=404, detail="Sector not found")
    points = [{"lead": lead, "fare": _fare_at_lead(sector_id, lead), "isBucket": lead in LEAD_BUCKETS}
              for lead in range(1, 46)]
    return {"sectorId": sector_id, "count": len(points), "data": points}


@app.get("/api/v1/sectors/{sector_id}/decomposition", tags=["Sectors"])
def get_sector_decomposition(sector_id: str):
    sd = next((s for s in SECTOR_DECOMPOSITION if s["sectorId"] == sector_id), None)
    if sd is None:
        raise HTTPException(status_code=404, detail="Sector not found")
    return sd


# ===========================================================================
# QUOTES
# ===========================================================================

@app.get("/api/v1/quotes", tags=["Quotes"])
def get_quotes(sector: Optional[str] = None, carrier: Optional[str] = None,
               lead: Optional[int] = None, source: Optional[str] = None,
               limit: int = Query(50, le=420)):
    data = QUOTES
    if sector:
        data = [q for q in data if q["sectorId"] == sector]
    if carrier:
        data = [q for q in data if q["carrier"] == carrier]
    if lead:
        data = [q for q in data if q["lead"] == lead]
    if source:
        data = [q for q in data if q["source"] == source]
    return {"total": len(data), "returned": min(limit, len(data)), "data": data[:limit]}


# ===========================================================================
# BACKTEST
# ===========================================================================

@app.get("/api/v1/backtest", tags=["Validation"])
def get_backtest():
    return {"data": BACKTEST, "metrics": BACKTEST_METRICS}


@app.get("/api/v1/backtest/recovery", tags=["Validation"])
def get_backtest_recovery():
    return {"insideBand": RECOVERY_INSIDE_BAND, "total": len(RECOVERY), "data": RECOVERY}


# ===========================================================================
# COMPLIANCE
# ===========================================================================

@app.get("/api/v1/compliance/sources", tags=["Compliance"])
def get_compliance_sources():
    return {"total": len(SOURCES), "data": SOURCES}


@app.get("/api/v1/compliance/rules", tags=["Compliance"])
def get_compliance_rules():
    return {"total": 8, "rules": [
        {"id": "r1", "name": "Robots-txt check", "description": "Verify robots.txt before every crawl cycle", "severity": "HIGH"},
        {"id": "r2", "name": "Rate limit", "description": "Respect Crawl-Delay; enforce per-source rate limit", "severity": "HIGH"},
        {"id": "r3", "name": "Terms of Service", "description": "Review TOS before adding a new source", "severity": "HIGH"},
        {"id": "r4", "name": "Data retention", "description": "Retain raw payloads for 24 months", "severity": "MEDIUM"},
        {"id": "r5", "name": "Audit trail", "description": "Log every request with source, path, status, timestamp", "severity": "HIGH"},
        {"id": "r6", "name": "Kill-switch", "description": "ARMED per source; TRIGGERED on repeated blocks", "severity": "MEDIUM"},
        {"id": "r7", "name": "Publication gate", "description": "Release only when coverage >= 70%", "severity": "MEDIUM"},
        {"id": "r8", "name": "DGCA MoU", "description": "Statutory feed has separate retention rules", "severity": "MEDIUM"},
    ]}


@app.get("/api/v1/compliance/audit", tags=["Compliance"])
def get_compliance_audit():
    return {"total": len(AUDIT), "data": AUDIT}


@app.get("/api/v1/compliance/posture", tags=["Compliance"])
def get_compliance_posture():
    posture_map = {
        "PENDING_REVIEW": "Pending review", "ALLOW": "Allow", "DISALLOW": "Disallow",
        "PARTIAL": "Partial", "LICENSED": "Licensed", "STATUTORY": "Statutory",
    }
    return {"sources": [
        {"slug": s["slug"], "label": s["label"], "domain": s["domain"],
         "kind": s["kind"], "robots": posture_map.get(s["robots"], s["robots"]),
         "tos": posture_map.get(s["tos"], s["tos"]),
         "ratePerMin": s["ratePerMin"], "nightlyCap": s["nightlyCap"],
         "illustrative": s.get("illustrative", False),
         "demotedTo": s.get("demotedTo"), "demotedReason": s.get("demotedReason"),
         "inPanel": s["inPanel"]}
        for s in SOURCES
    ]}


# ===========================================================================
# ANOMALIES
# ===========================================================================

@app.get("/api/v1/anomalies", tags=["Anomalies"])
def get_anomalies(severity: Optional[str] = None):
    alerts = ANOMALY_ALERTS
    if severity:
        alerts = [a for a in alerts if a["severity"] == severity]
    return {
        "total": len(alerts),
        "accuracy": {"precision": 0.942, "recall": 0.918, "f1": 0.930},
        "alerts": alerts,
        "modelPerformance": ANOMALY_MODEL_PERF,
        "rules": ANOMALY_RULES,
        "timeline": ANOMALY_TIMELINE,
    }


# ===========================================================================
# FORECAST
# ===========================================================================

@app.get("/api/v1/forecast", tags=["Forecast"])
def get_forecast_api():
    return {
        "horizon14": round(LATEST["total"] + 2.3, 2),
        "horizon30": round(LATEST["total"] + 6.6, 2),
        "mape": 3.2,
        "model": "LSTM + Seasonal ARIMA",
        "data": FORECAST_DATA,
        "sectorForecasts": SECTOR_FORECAST,
        "festivals": FESTIVAL_EVENTS,
    }


# ===========================================================================
# DECOMPOSITION
# ===========================================================================

@app.get("/api/v1/decomposition", tags=["Analysis"])
def get_decomposition():
    return {"daily": DECOMPOSITION, "bySector": SECTOR_DECOMPOSITION}


# ===========================================================================
# METHODOLOGY
# ===========================================================================

@app.get("/api/v1/methodology/formulas", tags=["Methodology"])
def get_formula_series():
    return {"data": FORMULA_SERIES}


@app.get("/api/v1/methodology/imputation", tags=["Methodology"])
def get_imputation_series():
    return {"data": IMPUTATION_SERIES}


@app.get("/api/v1/methodology/fence", tags=["Methodology"])
def get_fence_sensitivity(k: float = Query(3.0, ge=1, le=5)):
    kk = _clamp(k, 1, 5)
    edited = round(21400 * math.exp(-1.05 * (kk - 1)) + 260)
    drag = (edited / 21400) * 3.1
    return {"k": kk, "level": round(LATEST["total"] - drag, 2), "edited": edited,
            "keptSurge": kk >= 2.2, "published": LATEST["total"]}


@app.get("/api/v1/methodology/sample-pairs", tags=["Methodology"])
def get_sample_pairs():
    rng_sp = _make_rng(_hash_seed("relatives"))
    pairs = []
    for _ in range(24):
        prev = round(rng_sp.range(3200, 19000))
        now = round(prev * _clamp(math.exp(rng_sp.gauss(0, 0.19)), 0.52, 2.1))
        pairs.append({"prev": prev, "now": now})
    return {"count": len(pairs), "data": pairs}


# ===========================================================================
# LIVE SCRAPER DATA
# ===========================================================================

@app.get("/api/v1/scraper/fare-ladder", tags=["Scraper"])
def get_fare_ladder():
    if _live_fare_ladder is None:
        raise HTTPException(status_code=503, detail="Live scraper data not available")
    return _live_fare_ladder


@app.get("/api/v1/scraper/cabin-compare", tags=["Scraper"])
def get_cabin_compare():
    if _live_cabin_compare is None:
        raise HTTPException(status_code=503, detail="Live scraper data not available")
    return _live_cabin_compare


@app.get("/api/v1/scraper/status", tags=["Scraper"])
def get_scraper_status():
    return {
        "fareLadder": _live_fare_ladder is not None,
        "cabinCompare": _live_cabin_compare is not None,
        "fareLadderOrigin": _live_fare_ladder.get("origin") if _live_fare_ladder else None,
        "fareLadderDest": _live_fare_ladder.get("dest") if _live_fare_ladder else None,
        "cabinCompareOrigin": _live_cabin_compare.get("origin") if _live_cabin_compare else None,
        "cabinCompareDest": _live_cabin_compare.get("dest") if _live_cabin_compare else None,
    }


# ===========================================================================
# REPORTS
# ===========================================================================

@app.get("/api/v1/reports", tags=["Reports"])
def get_reports():
    return {
        "templates": [
            {"id": "daily-brief", "name": "Daily Brief", "pages": 1, "formats": ["PDF", "HTML"],
             "audience": "MoSPI eSankhyiki, RBI desk", "genTime": "2.1s"},
            {"id": "weekly-summary", "name": "Weekly Summary", "pages": 4, "formats": ["PDF"],
             "audience": "Internal analysts", "genTime": "4.8s"},
            {"id": "monthly-release", "name": "Monthly Release", "pages": 8, "formats": ["PDF", "HTML"],
             "audience": "Public, MoSPI, RBI", "genTime": "12.3s"},
            {"id": "sector-deep-dive", "name": "Sector Deep-dive", "pages": 2, "formats": ["PDF", "CSV"],
             "audience": "Sector-specific subscribers", "genTime": "3.7s"},
            {"id": "anomaly-alert", "name": "Anomaly Alert", "pages": 1, "formats": ["PDF", "JSON", "HTML"],
             "audience": "Operations team", "genTime": "0.8s"},
            {"id": "compliance-report", "name": "Compliance Report", "pages": 3, "formats": ["PDF", "CSV", "JSON"],
             "audience": "Legal, MoSPI compliance", "genTime": "5.4s"},
        ],
        "queue": [
            {"id": "q1", "reportType": "Daily Brief", "generatedAt": f"{DEMO_DATE}T04:02:00+05:30",
             "format": "PDF", "size": "142", "status": "completed"},
            {"id": "q2", "reportType": "Weekly Summary", "generatedAt": f"{DEMO_DATE}T03:15:00+05:30",
             "format": "PDF", "size": "891", "status": "completed"},
            {"id": "q3", "reportType": "Anomaly Alert", "generatedAt": f"{DEMO_DATE}T02:48:00+05:30",
             "format": "JSON", "size": "23", "status": "completed"},
            {"id": "q4", "reportType": "Compliance Report", "generatedAt": f"{DEMO_DATE}T06:00:00+05:30",
             "format": "PDF", "size": "456", "status": "completed"},
        ],
    }


# ===========================================================================
# SDMX-JSON
# ===========================================================================

@app.get("/api/v1/sdmx/latest", tags=["SDMX"])
def get_sdmx_latest(frequency: str = Query("daily")):
    freq_code = {"daily": "D", "weekly": "W", "monthly": "M"}.get(frequency, "D")
    series = {"daily": _DAILY, "weekly": WEEKLY, "monthly": MONTHLY}[frequency]
    slice_data = series[-6:]
    return {
        "meta": {
            "schema": "https://sdmx.org/schema/2.1/data/sdmx-json.json",
            "id": f"APIX-{frequency.upper()}-{DEMO_DATE}",
            "prepared": f"{DEMO_DATE}T04:02:00+05:30",
            "contentLanguages": ["en"],
            "sender": {"id": "MOSPI-DIID", "name": "Ministry of Statistics and Programme Implementation"},
        },
        "data": {
            "structure": {
                "name": "Airfare Price Index for India (APIx)",
                "dimensions": {
                    "series": [
                        {"id": "REF_AREA", "name": "Reference area", "values": [{"id": "IN", "name": "India"}]},
                        {"id": "MEASURE", "name": "Measure", "values": [{"id": "TOTAL_FARE", "name": "Total fare"}]},
                        {"id": "FREQ", "name": "Frequency", "values": [{"id": freq_code, "name": frequency}]},
                    ],
                    "observation": [{"id": "TIME_PERIOD", "name": "Time period",
                                     "values": [{"id": p["date"], "name": p["date"]} for p in slice_data]}],
                },
                "attributes": {"observation": [
                    {"id": "OBS_STATUS", "name": "Observation status", "values": [
                        {"id": "A", "name": "Normal"},
                        {"id": "P", "name": "Provisional"},
                        {"id": "M", "name": "Missing, suppressed for low coverage"},
                    ]},
                ]},
            },
            "dataSets": [{
                "action": "Replace",
                "series": {"0:0:0": {
                    "attributes": [],
                    "observations": {
                        str(i): [p["total"],
                                 1 if p["status"] == "PROVISIONAL" else (2 if p["status"] == "SUPPRESSED" else 0),
                                 p["totalLow"], p["totalHigh"]]
                        for i, p in enumerate(slice_data)
                    },
                }},
            }],
        },
    }


# ===========================================================================
# ADMIN ENDPOINTS (admin role required)
# ===========================================================================

@app.post("/api/v1/admin/basket", tags=["Admin"])
def admin_basket(payload: dict = Depends(_require_role("admin"))):
    return {"status": "ok", "message": "Sector basket updated", "updatedBy": payload["sub"]}


@app.post("/api/v1/admin/weights", tags=["Admin"])
def admin_weights(payload: dict = Depends(_require_role("admin"))):
    return {"status": "ok", "message": "Stratum weights loaded from DGCA extract", "updatedBy": payload["sub"]}


@app.post("/api/v1/admin/rerun", tags=["Admin"])
def admin_rerun(payload: dict = Depends(_require_role("admin"))):
    return {"status": "ok", "message": "Index re-run triggered", "updatedBy": payload["sub"]}


@app.post("/api/v1/admin/seed-demo", tags=["Admin"])
def admin_seed_demo(payload: dict = Depends(_require_role("admin"))):
    return {"status": "ok", "message": "Synthetic panel regenerated", "seed": SEED, "updatedBy": payload["sub"]}


# ===========================================================================
# SCRAPER CONFIG
# ===========================================================================

@app.get("/api/v1/scraper/config", tags=["Scraper"])
def get_scraper_config():
    return {
        "global": {
            "collectionEnabled": False,
            "rateLimit": 6,
            "maxConcurrent": 3,
            "timeout": 45,
            "retries": 3,
            "backoffBase": 6,
            "windowStart": "22:00",
            "windowEnd": "06:00",
            "publicationGate": 70,
        },
        "sources": [
            {
                "slug": s["slug"], "label": s["label"], "kind": s["kind"],
                "access": s["access"], "ratePerMin": s["ratePerMin"], "nightlyCap": s["nightlyCap"],
                "crawlDelay": (6 if s["access"] == "PLAYWRIGHT" else (10 if s["access"] == "SCRAPY" else 0)),
                "timeout": (45 if s["access"] == "PLAYWRIGHT" else (15 if s["access"] == "API" else 30)),
                "enabled": s["inPanel"] or s["access"] != "NOT_ROUTED",
                "killSwitch": "ARMED",
            }
            for s in SOURCES
        ],
        "scheduledJobs": [
            {"name": "Daily collection", "schedule": "22:00 IST", "icon": "Timer"},
            {"name": "Weekly aggregation", "schedule": "06:00 IST Monday", "icon": "CalendarBlank"},
            {"name": "Monthly release", "schedule": "08:00 IST on the 5th", "icon": "Play"},
            {"name": "Backtest run", "schedule": "04:00 IST daily", "icon": "Lightning"},
            {"name": "Report generation", "schedule": "23:30 IST daily", "icon": "DownloadSimple"},
            {"name": "Data purge", "schedule": "02:00 IST Sunday", "icon": "Trash"},
        ],
        "auditLog": [
            {"at": "2026-09-10T22:05:14+05:30", "by": "R. Krishnan", "parameter": "global.rateLimit",
             "oldValue": "8 req/min", "newValue": "6 req/min",
             "reason": "Reduced after two consecutive 429 blocks from goindigo.in"},
            {"at": "2026-09-09T06:02:41+05:30", "by": "A. Mehta", "parameter": "source.akasa.crawlDelay",
             "oldValue": "4 s", "newValue": "6 s",
             "reason": "robots.txt updated on akasaair.com/fare-search"},
            {"at": "2026-09-08T23:30:00+05:30", "by": "System", "parameter": "publicationGate",
             "oldValue": "65%", "newValue": "70%",
             "reason": "Raised after backtest showed stabilised yield at 88%"},
            {"at": "2026-09-07T04:15:22+05:30", "by": "P. Sharma", "parameter": "source.ixigo.killSwitch",
             "oldValue": "ARMED", "newValue": "TRIGGERED",
             "reason": "Three consecutive 503 responses during nightly run"},
            {"at": "2026-09-05T06:10:03+05:30", "by": "R. Krishnan", "parameter": "global.backoffBase",
             "oldValue": "4 s", "newValue": "6 s",
             "reason": "Exponential backoff insufficient for easemytrip.com"},
            {"at": "2026-09-03T01:45:00+05:30", "by": "System", "parameter": "global.timeout",
             "oldValue": "30 s", "newValue": "45 s",
             "reason": "Puppeteer wait timeout increased for Akasa Air slow-render pages"},
        ],
    }


# ===========================================================================
# ADDITIONAL ENDPOINTS
# ===========================================================================

@app.get("/api/v1/carriers", tags=["Reference"])
def get_carriers():
    return {"count": len(CARRIERS), "data": CARRIERS}


@app.get("/api/v1/airports", tags=["Reference"])
def get_airports():
    return {"count": len(AIRPORTS), "data": AIRPORTS}


@app.get("/api/v1/funnel", tags=["Panel"])
def get_funnel():
    return {
        "raw": RAW_QUOTES,
        "clean": CLEAN_QUOTES,
        "survivalRate": SURVIVAL_RATE,
        "imputedShare": IMPUTED_SHARE,
        "winsorised": WINSORISED_QUOTES,
        "suppressed": SUPPRESSED_COUNT,
        "meanBandHalfwidth": MEAN_BAND_HALFWIDTH,
        "stages": FUNNEL,
    }


@app.get("/api/v1/collectors", tags=["Scraper"])
def get_collectors():
    return {
        "collectors": [
            {"name": "IndiGo", "type": "Playwright", "status": "Active",
             "lastRun": "2026-09-11T01:42:00+05:30", "quotes": 312, "successRate": 0.94,
             "avgLatency": 4200, "notes": "JS-rendered fare matrix"},
            {"name": "Air India", "type": "Playwright", "status": "Active",
             "lastRun": "2026-09-11T01:38:00+05:30", "quotes": 288, "successRate": 0.91,
             "avgLatency": 5100, "notes": "Booking widget with session tokens"},
            {"name": "SpiceJet", "type": "Playwright", "status": "Standby",
             "lastRun": "2026-09-10T01:45:00+05:30", "quotes": 0, "successRate": 0,
             "avgLatency": 0, "notes": "Awaiting robots.txt review"},
            {"name": "Cleartrip", "type": "Scrapy", "status": "Active",
             "lastRun": "2026-09-11T01:40:00+05:30", "quotes": 256, "successRate": 0.97,
             "avgLatency": 1800, "notes": "Structured HTML, fast through Scrapy"},
            {"name": "MakeMyTrip", "type": "Scrapy", "status": "Active",
             "lastRun": "2026-09-11T01:44:00+05:30", "quotes": 248, "successRate": 0.89,
             "avgLatency": 2400, "notes": "Dynamic URL scheme"},
            {"name": "Yatra", "type": "Scrapy", "status": "Disabled",
             "lastRun": "2026-09-05T01:50:00+05:30", "quotes": 0, "successRate": 0,
             "avgLatency": 0, "notes": "Kill-switch: 4 consecutive 429s"},
            {"name": "Amadeus", "type": "API", "status": "Active",
             "lastRun": "2026-09-11T01:30:00+05:30", "quotes": 180, "successRate": 0.99,
             "avgLatency": 800, "notes": "Self-Service API, licensed agreement"},
            {"name": "Duffel", "type": "API", "status": "Active",
             "lastRun": "2026-09-11T01:31:00+05:30", "quotes": 156, "successRate": 0.98,
             "avgLatency": 950, "notes": "Live pricing endpoint, 120 carriers"},
            {"name": "DGCA Feed", "type": "Feed", "status": "Active",
             "lastRun": "2026-09-11T00:15:00+05:30", "quotes": 120, "successRate": 1.0,
             "avgLatency": 300, "notes": "SFTP drop, twice-daily, scheduled under MoU"},
        ]
    }


# ===========================================================================
# PROXY POOL — IP rotation management
# ===========================================================================

from compliance.proxy_pool import ProxyPool, ProxyEndpoint, ProxyStatus, RotationStrategy

# Global proxy pool (thread-safe, in-memory with seeded demo data)
_pool = ProxyPool(strategy=RotationStrategy.ROUND_ROBIN)
_seeded = False


def _ensure_seeded():
    global _seeded
    if _seeded:
        return
    _seeded = True
    demo_proxies = [
        {"address": "103.45.67.89:8080", "provider": "datacenter", "country": "IN", "type": "datacenter"},
        {"address": "103.45.67.91:8080", "provider": "datacenter", "country": "IN", "type": "datacenter"},
        {"address": "103.45.67.93:8080", "provider": "datacenter", "country": "IN", "type": "datacenter"},
        {"address": "45.112.34.56:8000", "provider": "residential", "country": "IN", "type": "residential"},
        {"address": "45.112.34.78:8000", "provider": "residential", "country": "IN", "type": "residential"},
        {"address": "45.112.35.12:8000", "provider": "residential", "country": "IN", "type": "residential"},
        {"address": "geo.oxylabs.io:30000", "provider": "oxylabs", "country": "IN", "type": "residential"},
        {"address": "geo.luminati.io:22225", "provider": "luminati", "country": "IN", "type": "residential"},
    ]
    _pool.add_from_config(demo_proxies)

    # Simulate some usage history
    import random as _rnd
    rng = _make_rng(_hash_seed("proxy-demo"))
    for pid, p in _pool._proxies.items():
        if pid == "direct":
            continue
        p.status = ProxyStatus.ACTIVE
        p.success_count = rng.int(40, 320)
        p.failure_count = rng.int(0, 18)
        p.block_count = rng.int(0, 4)
        p.total_requests = p.success_count + p.failure_count
        p.avg_latency_ms = round(rng.range(800, 4500), 1)
        p.last_used_at = time.time() - rng.range(30, 3600)
        p.last_used_domain = rng.choice(["cleartrip.com", "makemytrip.com", "goindigo.in",
                                          "airindia.com", "akasaair.com"])


@app.get("/api/v1/proxy/pool", tags=["Proxy Pool"])
def get_proxy_pool():
    _ensure_seeded()
    return _pool.get_stats()


@app.get("/api/v1/proxy/pool/proxies", tags=["Proxy Pool"])
def list_proxies():
    _ensure_seeded()
    return {"proxies": _pool.get_all_proxies()}


@app.get("/api/v1/proxy/pool/domains", tags=["Proxy Pool"])
def list_domain_bindings():
    _ensure_seeded()
    return {"bindings": _pool.get_domain_bindings()}


@app.post("/api/v1/proxy/pool/add", tags=["Proxy Pool"])
def add_proxy(payload: dict, user=Depends(_require_role("admin"))):
    _ensure_seeded()
    pid = payload.get("id") or f"px-{int(time.time())}"
    p = ProxyEndpoint(
        id=pid,
        address=payload["address"],
        provider=payload.get("provider", "datacenter"),
        country=payload.get("country", "IN"),
        type=payload.get("type", "datacenter"),
        lease_duration_s=payload.get("leaseDurationS", 3600),
        expires_at=time.time() + payload.get("leaseDurationS", 3600),
    )
    _pool.add(p)
    return {"status": "added", "proxy": p.to_dict()}


@app.post("/api/v1/proxy/pool/bulk-add", tags=["Proxy Pool"])
def bulk_add_proxies(payload: dict, user=Depends(_require_role("admin"))):
    _ensure_seeded()
    configs = payload.get("proxies", [])
    added = _pool.add_from_config(configs)
    return {"status": "ok", "added": added, "count": len(added)}


@app.post("/api/v1/proxy/pool/remove/{proxy_id}", tags=["Proxy Pool"])
def remove_proxy(proxy_id: str, user=Depends(_require_role("admin"))):
    _ensure_seeded()
    ok = _pool.remove(proxy_id)
    return {"status": "removed" if ok else "not_found", "proxyId": proxy_id}


@app.post("/api/v1/proxy/pool/disable/{proxy_id}", tags=["Proxy Pool"])
def disable_proxy(proxy_id: str, payload: dict, user=Depends(_require_role("admin"))):
    _ensure_seeded()
    reason = payload.get("reason", "manually disabled")
    _pool.disable(proxy_id, reason)
    return {"status": "disabled", "proxyId": proxy_id, "reason": reason}


@app.post("/api/v1/proxy/pool/enable/{proxy_id}", tags=["Proxy Pool"])
def enable_proxy(proxy_id: str, user=Depends(_require_role("admin"))):
    _ensure_seeded()
    _pool.enable(proxy_id)
    return {"status": "enabled", "proxyId": proxy_id}


@app.post("/api/v1/proxy/pool/rotate", tags=["Proxy Pool"])
def rotate_proxies(payload: dict, user=Depends(_require_role("admin"))):
    _ensure_seeded()
    reason = payload.get("reason", "manual rotation")
    changed = _pool.rotate(reason)
    return {"status": "rotated", "changed": changed, "count": len(changed), "reason": reason}


@app.post("/api/v1/proxy/pool/assign", tags=["Proxy Pool"])
def assign_proxy(payload: dict):
    _ensure_seeded()
    domain = payload.get("domain", "")
    p = _pool.assign(domain)
    if p is None:
        return {"assigned": None, "via": "direct", "domain": domain}
    return {"assigned": p.to_dict(), "via": "proxy", "domain": domain}


@app.post("/api/v1/proxy/pool/record", tags=["Proxy Pool"])
def record_result(payload: dict, user=Depends(_require_role("admin"))):
    _ensure_seeded()
    pid = payload.get("proxyId", "")
    success = payload.get("success", True)
    latency = payload.get("latencyMs", 0)
    if payload.get("blocked"):
        reason = payload.get("reason", "")
        code = payload.get("statusCode", 0)
        _pool.record_block(pid, reason=reason, status_code=code)
    else:
        _pool.record_result(pid, success=success, latency_ms=latency)
    return {"status": "recorded"}


@app.post("/api/v1/proxy/pool/strategy", tags=["Proxy Pool"])
def set_strategy(payload: dict, user=Depends(_require_role("admin"))):
    _ensure_seeded()
    s = payload.get("strategy", "round_robin")
    try:
        strat = RotationStrategy(s)
        _pool.set_strategy(strat)
        return {"status": "ok", "strategy": strat.value}
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid strategy: {s}")


# ===========================================================================
# PIPELINE SCHEDULER — nightly 22:00 IST trigger + run history
# ===========================================================================

from collections import deque
from datetime import datetime, timezone

# In-memory run history (last 50 runs)
_pipeline_history: deque = deque(maxlen=50)
_pipeline_running = False
_pipeline_lock = None  # replaced with threading.Lock at runtime


import threading
_pipeline_lock = threading.Lock()


# ---------------------------------------------------------------------------
# Pipeline run simulation (fires the orchestrator or runs a synthetic cycle)
# ---------------------------------------------------------------------------

@app.post("/api/v1/pipeline/run-now", tags=["Pipeline"])
def run_pipeline_now(payload: dict | None = None, user=Depends(_require_role("admin"))):
    """
    Trigger an immediate pipeline run.
    In production this calls main.run_pipeline(); here we simulate it.
    """
    global _pipeline_running
    with _pipeline_lock:
        if _pipeline_running:
            return {"status": "already_running", "message": "A pipeline run is already in progress"}
        _pipeline_running = True

    import threading
    import time as _time

    mode = (payload or {}).get("mode", "simulated")  # simulated | full
    run_id = f"run-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    started = datetime.now(timezone.utc)
    started_ist = started.astimezone(timezone(timedelta(hours=5, minutes=30)))

    # Background thread so the request returns immediately
    def _background_run():
        nonlocal run_id
        global _pipeline_running
        t0 = _time.monotonic()
        steps = [
            {"name": "Pre-flight checks", "duration_s": 3.2},
            {"name": "Collect", "duration_s": 12.5},
            {"name": "Clean", "duration_s": 8.1},
            {"name": "Index", "duration_s": 5.4},
            {"name": "Store", "duration_s": 4.0},
            {"name": "Gate check", "duration_s": 0.8},
            {"name": "Publish", "duration_s": 2.3},
        ]
        status = "OK"
        error = None
        try:
            for step in steps:
                _time.sleep(step["duration_s"])
                logger.info("[%s] %s completed (%.1fs)", run_id, step["name"], step["duration_s"])
        except Exception as exc:
            status = "ERROR"
            error = str(exc)

        runtime = _time.monotonic() - t0
        finished = datetime.now(timezone.utc)
        record = {
            "runId": run_id,
            "status": status,
            "mode": mode,
            "startedAt": started.isoformat(),
            "startedAtIST": started_ist.isoformat(),
            "finishedAt": finished.isoformat(),
            "runtime_s": round(runtime, 1),
            "runtimeMin": round(runtime / 60, 1),
            "steps": steps,
            "quotesCollected": rng.int(4200, 8700) if status == "OK" else 0,
            "quotesClean": rng.int(3500, 7800) if status == "OK" else 0,
            "gatePassed": rng.chance(0.85) if status == "OK" else False,
            "indexValue": round(rng.range(108.0, 118.5), 2) if status == "OK" else None,
            "yoyChange": round(rng.gauss(0.035, 0.04), 3) if status == "OK" else None,
            "momChange": round(rng.gauss(-0.008, 0.02), 3) if status == "OK" else None,
            "error": error,
        }
        _pipeline_history.append(record)
        _pipeline_running = False
        logger.info("[%s] Pipeline %s in %.1fs", run_id, status, runtime)

    thread = threading.Thread(target=_background_run, daemon=True)
    thread.start()

    return {
        "status": "started",
        "runId": run_id,
        "mode": mode,
        "startedAt": started.isoformat(),
        "startedAtIST": started_ist.isoformat(),
        "message": "Pipeline running in background. Poll /api/v1/pipeline/status for updates.",
    }


@app.get("/api/v1/pipeline/status", tags=["Pipeline"])
def get_pipeline_status():
    """Get current pipeline schedule and run state."""
    now_utc = datetime.now(timezone.utc)
    now_ist = now_utc.astimezone(timezone(timedelta(hours=5, minutes=30)))

    # Compute next 22:00 IST occurrence
    target_ist = now_ist.replace(hour=22, minute=0, second=0, microsecond=0)
    if now_ist >= target_ist:
        from datetime import timedelta as td
        target_ist += td(days=1)

    next_run_utc = target_ist.astimezone(timezone.utc)

    latest = _pipeline_history[-1] if _pipeline_history else None

    return {
        "isRunning": _pipeline_running,
        "schedule": {
            "dailyCollection": "22:00 IST (16:30 UTC)",
            "weeklyAggregation": "06:00 IST Monday (00:30 UTC)",
            "monthlyRelease": "08:00 IST on the 5th (02:30 UTC)",
            "backtestRun": "04:00 IST daily (22:30 UTC previous day)",
        },
        "nextRunAt": next_run_utc.isoformat(),
        "nextRunAtIST": target_ist.isoformat(),
        "latestRun": latest,
        "historyCount": len(_pipeline_history),
    }


@app.get("/api/v1/pipeline/history", tags=["Pipeline"])
def get_pipeline_history(limit: int = 20):
    """Get recent pipeline run history."""
    items = list(_pipeline_history)[-limit:]
    return {
        "runs": items,
        "total": len(_pipeline_history),
        "returned": len(items),
    }


@app.post("/api/v1/pipeline/scheduler/register", tags=["Pipeline"])
def register_scheduled_job(payload: dict, user=Depends(_require_role("admin"))):
    """
    Register a new scheduled job.
    Payload: { name, hour, minute, cadence, daysOfWeek?, dayOfMonth?, callback? }
    """
    try:
        from scheduler import PipelineScheduler, PipelineRun, RunWindow, PipelineCadence

        cadence_map = {
            "daily": PipelineCadence.DAILY,
            "weekly": PipelineCadence.WEEKLY,
            "monthly": PipelineCadence.MONTHLY,
            "backtest": PipelineCadence.BACKTEST,
            "on_demand": PipelineCadence.ON_DEMAND,
        }
        cadence = cadence_map.get(payload.get("cadence", "on_demand"), PipelineCadence.ON_DEMAND)

        window = RunWindow(
            cadence=cadence,
            hour_utc=payload.get("hour", 16),
            minute_utc=payload.get("minute", 30),
            days_of_week=tuple(payload.get("daysOfWeek", [])),
            day_of_month=payload.get("dayOfMonth", 0),
            timezone_label=payload.get("timezone", "IST"),
        )

        async def _noop():
            logger.info("Scheduled job '%s' fired", payload.get("name"))

        job = PipelineRun(
            name=payload["name"],
            window=window,
            fn=_noop,
            timeout_s=payload.get("timeout_s", 7200),
            retries=payload.get("retries", 1),
        )

        # Store in a global registry
        if "_scheduler_jobs" not in globals():
            globals()["_scheduler_jobs"] = []
            globals()["_scheduler"] = PipelineScheduler()
        globals()["_scheduler"].register(job)
        globals()["_scheduler_jobs"].append(job)

        return {
            "status": "registered",
            "job": {
                "name": job.name,
                "cadence": job.window.cadence.value,
                "schedule": f"{job.window.hour_utc:02d}:{job.window.minute_utc:02d} {job.window.timezone_label}",
                "timeout_s": job.timeout_s,
                "retries": job.retries,
            }
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/v1/pipeline/scheduler/jobs", tags=["Pipeline"])
def list_scheduled_jobs():
    """List all registered scheduled jobs."""
    jobs = globals().get("_scheduler_jobs", [])
    scheduler = globals().get("_scheduler")
    if scheduler:
        return {"jobs": scheduler.list_all(), "count": len(jobs)}
    return {"jobs": [], "count": 0}


# ===========================================================================
# LIVE SCRAPE — on-demand fare collection via Playwright
# ===========================================================================

@app.post("/api/v1/scraper/live-scrape", tags=["Scraper"])
def live_scrape(payload: dict | None = None, user=Depends(_get_current_user)):
    """
    Trigger an on-demand live scrape of real airline fares.

    Body (all optional):
    {
      "sector": "DEL-BOM",      // default: first trunk sector
      "leadDays": 15,           // default: 15
      "sources": ["cleartrip", "makemytrip"],  // default: both
      "maxQuotes": 5            // per source, default: 5
    }

    Returns live fare quotes with full provenance metadata.
    """
    sector = (payload or {}).get("sector", "DEL-BOM")
    lead_days = int((payload or {}).get("leadDays", 15))
    requested_sources = (payload or {}).get("sources", ["cleartrip", "makemytrip"])
    max_quotes = int((payload or {}).get("maxQuotes", 5))
    started = datetime.now(timezone.utc)

    results = []
    errors = []
    sources_used = []

    # ---- Cleartrip ----
    if "cleartrip" in requested_sources:
        try:
            from collectors.scrapy_collectors import CleartripCollector
            col = CleartripCollector()
            quotes = col._fetch(None, sector, lead_days)
            for q in quotes[:max_quotes]:
                results.append({
                    "source": q.source,
                    "sector": q.sector,
                    "carrier": q.carrier,
                    "flightNo": q.flight_no,
                    "leadDays": q.lead_days,
                    "cabin": q.cabin,
                    "baseFare": q.base_fare,
                    "taxes": q.taxes,
                    "udf": q.udf,
                    "convenienceFee": q.convenience_fee,
                    "totalFare": q.total_fare,
                    "departureDate": q.departure_date,
                    "scrapedAt": q.scraped_at,
                    "method": "response-interception",
                    "stealth": HAS_STEALTH,
                })
            sources_used.append({"name": "Cleartrip", "type": "OTA", "quotes": len(quotes)})
        except Exception as exc:
            errors.append({"source": "Cleartrip", "error": str(exc)})

    # ---- MakeMyTrip ----
    if "makemytrip" in requested_sources:
        try:
            from collectors.scrapy_collectors import MakeMyTripCollector
            col = MakeMyTripCollector()
            quotes = col._fetch(None, sector, lead_days)
            for q in quotes[:max_quotes]:
                results.append({
                    "source": q.source,
                    "sector": q.sector,
                    "carrier": q.carrier,
                    "flightNo": q.flight_no,
                    "leadDays": q.lead_days,
                    "cabin": q.cabin,
                    "baseFare": q.base_fare,
                    "taxes": q.taxes,
                    "udf": q.udf,
                    "convenienceFee": q.convenience_fee,
                    "totalFare": q.total_fare,
                    "departureDate": q.departure_date,
                    "scrapedAt": q.scraped_at,
                    "method": "dom-scraping",
                    "stealth": HAS_STEALTH,
                })
            sources_used.append({"name": "MakeMyTrip", "type": "OTA", "quotes": len(quotes)})
        except Exception as exc:
            errors.append({"source": "MakeMyTrip", "error": str(exc)})

    finished = datetime.now(timezone.utc)
    return {
        "status": "ok" if results else "no_data",
        "requestedBy": user["sub"],
        "parameters": {
            "sector": sector,
            "leadDays": lead_days,
            "sourcesRequested": requested_sources,
            "maxQuotes": max_quotes,
        },
        "compliance": {
            "stealthActive": HAS_STEALTH,
            "robotsChecked": True,
            "rateLimitDelayS": 4.0,
            "killSwitch": "ARMED",
            "note": "All requests run through Playwright with fingerprint masking, robots.txt verification, and per-domain rate limiting. Playwright-stealth patches 20+ automation fingerprints (webdriver, user-agent data, webgl vendor, chrome runtime, plugins, languages). No CAPTCHA-bypass service is used.",
        },
        "sourcesUsed": sources_used,
        "results": results,
        "errors": errors,
        "timing": {
            "startedAt": started.isoformat(),
            "finishedAt": finished.isoformat(),
            "elapsedMs": int((finished - started).total_seconds() * 1000),
        },
    }


@app.get("/api/v1/scraper/live-scrape/test", tags=["Scraper"])
def test_live_scrape():
    """Quick smoke test — returns 1-2 quotes from Cleartrip without auth."""
    try:
        from collectors.scrapy_collectors import CleartripCollector
        col = CleartripCollector()
        quotes = col._fetch(None, "DEL-BOM", 15)
        return {
            "status": "ok",
            "stealthActive": HAS_STEALTH,
            "quotesReturned": len(quotes),
            "sample": [
                {
                    "source": q.source, "carrier": q.carrier,
                    "flightNo": q.flight_no, "totalFare": q.total_fare,
                    "baseFare": q.base_fare, "leadDays": q.lead_days,
                }
                for q in quotes[:2]
            ],
        }
    except Exception as exc:
        return {"status": "error", "error": str(exc), "stealthActive": HAS_STEALTH}


# ===========================================================================
# Run
# ===========================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
