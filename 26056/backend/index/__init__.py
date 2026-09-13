"""
VIMAAN — chain-level aggregator with DGCA weights.
"""

from dataclasses import dataclass
from index.formulas import block_bootstrap_band, compute_cell_indexes


@dataclass
class APIndexResult:
    index_value: float
    band_low: float
    band_high: float
    yoy_change: float
    mom_change: float
    n_quotes: int
    n_cells: int
    survival_rate: float
    formula: str = "Jevons"


def aggregate_index(current_quotes, previous_quotes, prev_index: float = 100.0, year_ago_index: float = 100.0) -> APIndexResult:
    cell_indexes = compute_cell_indexes(current_quotes, previous_quotes)
    point, lo, hi = block_bootstrap_band(cell_indexes)

    raw_in = len(current_quotes) + len(previous_quotes)
    clean_out = len(current_quotes)
    survival = clean_out / raw_in if raw_in else 0.0

    return APIndexResult(
        index_value=round(point, 2),
        band_low=round(lo, 2),
        band_high=round(hi, 2),
        yoy_change=round((point / year_ago_index - 1) * 100, 2),
        mom_change=round((point / prev_index - 1) * 100, 2),
        n_quotes=len(current_quotes),
        n_cells=len(cell_indexes),
        survival_rate=survival,
    )
