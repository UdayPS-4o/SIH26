"""
VIMAAN — elementary index formulas and block-bootstrap confidence band.

Formulas
--------
  Jevons (geometric mean of within-cell price relatives):
    I_c = (Π_i=1^n (p_i,t / p_i,t-1)) ^ (1/n)

  Dutot (arithmetic mean of relatives):
    I_c = (Σ_i=1^n (p_i,t / p_i,t-1)) / n

  Carli (arithmetic mean — known upward bias):
    I_c = (Σ_i=1^n (p_i,t / p_i,t-1)) / n
    *same form as Dutot at elementary level; bias emerges at aggregation*

Chain-level aggregation (modified Laspeyres, consistent with CPI 2024):
    APIx_t = Σ_s w_s · (I_s,t / I_s,t-1) · APIx_t-1
"""

import math
import random
from dataclasses import dataclass
from typing import Optional

try:
    from cleaning.pipeline import FareQuote  # type: ignore
except ImportError:
    pass


@dataclass
class CellIndex:
    cell: str
    jevons: float
    dutot: float
    carli: float
    n_quotes: int


def jevons(relatives: list[float]) -> float:
    if not relatives or any(r <= 0 for r in relatives):
        return 1.0
    log_sum = sum(math.log(r) for r in relatives)
    return math.exp(log_sum / len(relatives))


def dutot(relatives: list[float]) -> float:
    if not relatives:
        return 1.0
    return sum(relatives) / len(relatives)


def carli(relatives: list[float]) -> float:
    return dutot(relatives)


def compute_cell_indexes(quotes, previous_quotes) -> list:
    prev_map: dict[str, float] = {}
    for q in previous_quotes:
        prev_map[q.elementary_cell] = q.total_fare

    cell_quotes: dict[str, list[float]] = {}
    for q in quotes:
        cell = q.elementary_cell
        if cell not in prev_map or prev_map[cell] <= 0:
            continue
        rel = q.total_fare / prev_map[cell]
        cell_quotes.setdefault(cell, []).append(rel)

    results: list = []
    for cell, rels in cell_quotes.items():
        results.append(CellIndex(
            cell=cell,
            jevons=jevons(rels),
            dutot=dutot(rels),
            carli=carli(rels),
            n_quotes=len(rels),
        ))
    return results


def block_bootstrap_band(cells: list, n_resamples: int = 10_000, confidence: float = 0.95, base_index: float = 100.0) -> tuple:
    if not cells:
        return base_index, base_index, base_index

    jevons_rels = [c.jevons for c in cells]
    point = base_index * jevons(jevons_rels)

    estimates: list[float] = []
    for _ in range(n_resamples):
        sample = [random.choice(jevons_rels) for _ in jevons_rels]
        estimates.append(base_index * jevons(sample))

    estimates.sort()
    alpha = 1 - confidence
    lo_idx = int(alpha / 2 * len(estimates))
    hi_idx = int((1 - alpha / 2) * len(estimates))
    return point, estimates[lo_idx], estimates[hi_idx]
