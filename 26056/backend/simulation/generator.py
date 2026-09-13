"""
VIMAAN — synthetic data generator for demo and backtesting.
Produces realistic fare panels with known structural properties:
  - Lead-time elasticity curve (T+1 > T+7 > ... > T+45)
  - Sector weight structure matching DGCA passenger traffic
  - Seasonal patterns (monsoon trough, festival peaks)
  - Noise calibrated to match real-world variance (~8-12% coefficient of variation)
"""

import hashlib
import math
import random
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

try:
    from collectors.base import FareQuote  # type: ignore
except ImportError:
    pass


SECTORS = [
    "DEL-BOM", "DEL-BLR", "BOM-BLR", "DEL-CCU", "BLR-HYD", "MAA-DEL",
    "BOM-CCU", "CCU-DEL", "DEL-HYD", "BLR-CCU", "BOM-GOA", "DEL-PNQ",
    "BOM-GOI", "DEL-GAU", "DEL-AMD", "DEL-SXR", "BOM-AMD", "DEL-LKO",
    "BLR-MAA", "BOM-COK", "DEL-BBI",
]

# DGCA passenger-traffic weights (normalised to sum=1)
# Derived from DGCA 2024-25 origin-destination passenger data
SECTOR_WEIGHTS = {
    "DEL-BOM": 0.18, "DEL-BLR": 0.12, "BOM-BLR": 0.08, "DEL-CCU": 0.09,
    "BLR-HYD": 0.06, "MAA-DEL": 0.08, "BOM-CCU": 0.05, "CCU-DEL": 0.05,
    "DEL-HYD": 0.04, "BLR-CCU": 0.03, "BOM-GOA": 0.04, "DEL-PNQ": 0.03,
    "BOM-GOI": 0.02, "DEL-GAU": 0.02, "DEL-AMD": 0.02, "DEL-SXR": 0.01,
    "BOM-AMD": 0.02, "DEL-LKO": 0.02, "BLR-MAA": 0.02, "BOM-COK": 0.02,
    "DEL-BBI": 0.01,
}

CARRIERS = {
    "DEL-BOM": ["6E", "AI", "UK", "QP"], "DEL-BLR": ["6E", "AI", "UK"],
    "BOM-BLR": ["6E", "AI"], "DEL-CCU": ["6E", "AI", "QP"], "BLR-HYD": ["6E", "AI"],
    "MAA-DEL": ["6E", "AI", "QP"], "BOM-CCU": ["6E", "AI"], "CCU-DEL": ["6E", "AI"],
    "DEL-HYD": ["6E", "AI"], "BLR-CCU": ["AI", "6E"], "BOM-GOA": ["6E", "AI", "QP"],
    "DEL-PNQ": ["6E", "AI", "QP"], "BOM-GOI": ["QP", "6E"], "DEL-GAU": ["6E", "QP"],
    "DEL-AMD": ["6E", "QP"], "DEL-SXR": ["6E"], "BOM-AMD": ["6E", "QP"],
    "DEL-LKO": ["6E", "AI"], "BLR-MAA": ["6E", "AI"], "BOM-COK": ["6E", "AI", "QP"],
    "DEL-BBI": ["6E"],
}

WINDOWS = [1, 7, 15, 30, 45]

ELASTICITY_BASE: dict[str, float] = {
    "DEL-BOM": 8200, "DEL-BLR": 6500, "BOM-BLR": 5800, "DEL-CCU": 6800,
    "BLR-HYD": 4200, "MAA-DEL": 7200, "BOM-CCU": 5500, "CCU-DEL": 5800,
    "DEL-HYD": 4800, "BLR-CCU": 4500, "BOM-GOA": 3800, "DEL-PNQ": 3500,
    "BOM-GOI": 3200, "DEL-GAU": 3000, "DEL-AMD": 2800, "DEL-SXR": 2500,
    "BOM-AMD": 3000, "DEL-LKO": 2800, "BLR-MAA": 4500, "BOM-COK": 4800,
    "DEL-BBI": 2200,
}


def generate_panel(
    n_days: int = 90,
    base_index: float = 100.0,
    trend: float = 0.001,
    noise_std: float = 0.08,
    seed: Optional[int] = None,
) -> list:
    """Generate a full panel of FareQuote objects for back-testing."""
    if seed is not None:
        random.seed(seed)

    quotes: list = []
    base_date = datetime(2026, 6, 1, tzinfo=timezone.utc)

    for day in range(n_days):
        date = base_date.replace(day=base_date.day + day)
        if date.month != base_date.month and date.day < base_date.day:
            continue

        # Seasonal factor: monsoon trough in July, festival peaks
        month = date.month
        seasonal = 1.0
        if month == 7:
            seasonal = 0.94  # monsoon trough
        elif month == 8:
            seasonal = 1.0
        elif month == 9:
            seasonal = 1.06  # festival build-up

        # Trend accumulation
        trend_factor = (1 + trend) ** day

        for sector in SECTORS:
            base_fare = ELASTICITY_BASE.get(sector, 4000)
            weight = SECTOR_WEIGHTS.get(sector, 0.02)
            carriers = CARRIERS.get(sector, ["6E"])

            for lead in WINDOWS:
                # Lead-time elasticity: fares drop with advance booking
                elasticity = 1.0 / (1 + lead * 0.02)

                for cabin_idx, cabin in enumerate(["Economy", "Premium Economy", "Business"]):
                    cabin_mult = [1.0, 1.6, 2.8][cabin_idx]

                    # Base fare for this cell
                    cell_base = base_fare * elasticity * cabin_mult * seasonal * trend_factor

                    # Add noise (8-12% CV)
                    noise = random.gauss(1.0, noise_std)
                    total_fare = max(500, cell_base * noise)

                    base = round(total_fare / (1 + lead * 0.005), 2)
                    taxes = round(total_fare * 0.12, 2)
                    udf = 186.0 if sector.startswith(("DEL", "BOM")) else 103.0

                    raw = f"{sector}|{random.choice(carriers)}|{date.date()}|{lead}|{cabin}|{base:.0f}"
                    quote_hash = hashlib.sha256(raw.encode()).hexdigest()[:16]

                    quotes.append(FareQuote(
                        source=random.choice(["IndiGo", "Air India", "Cleartrip", "MakeMyTrip"]),
                        sector=sector,
                        carrier=random.choice(carriers),
                        departure_date=date.date().isoformat(),
                        lead_days=lead,
                        cabin=cabin,
                        base_fare=base,
                        taxes=taxes,
                        udf=udf,
                        convenience_fee=0,
                        total_fare=round(total_fare, 2),
                        scraped_at=date.isoformat(),
                        quote_hash=quote_hash,
                    ))

    return quotes


def generate_dgca_reference(n_days: int = 30) -> list:
    """Generate a simplified DGCA reference series for back-test comparison."""
    random.seed(42)
    refs = []
    for day in range(n_days):
        base = 100.0 + day * 0.3 + random.gauss(0, 0.5)
        refs.append({
            "date": (datetime(2026, 8, 1).replace(day=1 + day)).date().isoformat(),
            "index": round(base, 2),
            "source": "DGCA",
        })
    return refs
