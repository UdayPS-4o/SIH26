"""Cross-encoder reranker for matching."""

import logging
from typing import Any

logger = logging.getLogger(__name__)


class MatchReranker:
    """Re-rank candidate matches using a cross-encoder for higher accuracy."""

    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.model = None
        self.model_name = model_name

    def _load_model(self):
        if self.model is None:
            try:
                from sentence_transformers import CrossEncoder
                self.model = CrossEncoder(self.model_name)
            except ImportError:
                logger.warning("sentence-transformers cross-encoder not available")
                self.model = None

    def rerank(self, query: str, candidates: list[str], top_k: int = 5) -> list[dict]:
        if not candidates:
            return []
        self._load_model()
        if self.model is not None:
            scores = self.model.predict([(query, c) for c in candidates])
            scored = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)[:top_k]
            return [{"candidate_idx": idx, "score": float(s)} for idx, s in scored]
        return self._heuristic_rerank(query, candidates, top_k)

    def _heuristic_rerank(self, query: str, candidates: list[str], top_k: int = 5) -> list[dict]:
        from rapidfuzz import fuzz
        scores = []
        for i, c in enumerate(candidates):
            s = fuzz.token_sort_ratio(query.lower(), c.lower()) / 100.0
            scores.append({"candidate_idx": i, "score": s})
        return sorted(scores, key=lambda x: x["score"], reverse=True)[:top_k]
