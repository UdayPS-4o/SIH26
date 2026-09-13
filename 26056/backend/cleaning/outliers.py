"""
VIMAAN — outlier removal using Hidiroglou-Berthelot fence.
Applied within each elementary cell (sector × carrier × lead-days × cabin).
"""

import math
from dataclasses import dataclass
from typing import Optional

# Avoid circular import — fare quote lives in collectors.base
try:
    from collectors.base import FareQuote  # type: ignore
except ImportError:
    pass  # when running standalone


@dataclass
class CleanConfig:
    k: float = 2.2
    min_quotes_per_cell: int = 3
    impute_missing: bool = True


def _ln_relative(fare: float, cell_median: float) -> float:
    if cell_median <= 0:
        return 0.0
    return math.log(fare / cell_median)


def apply_hb_fence(
    cell_quotes: list,
    config: CleanConfig = CleanConfig(),
) -> tuple[list, list]:
    if len(cell_quotes) < config.min_quotes_per_cell:
        return cell_quotes, []

    fares = [q.total_fare for q in cell_quotes]
    median = sorted(fares)[len(fares) // 2]
    log_vals = [_ln_relative(q.total_fare, median) for q in cell_quotes]
    log_vals_sorted = sorted(log_vals)
    n = len(log_vals_sorted)

    q1 = log_vals_sorted[n // 4]
    q3 = log_vals_sorted[(3 * n) // 4]
    iqr = q3 - q1
    lower = q1 - config.k * iqr
    upper = q3 + config.k * iqr

    kept: list = []
    removed: list = []
    for q in cell_quotes:
        lr = _ln_relative(q.total_fare, median)
        if lower <= lr <= upper:
            kept.append(q)
        else:
            removed.append(q)
    return kept, removed
