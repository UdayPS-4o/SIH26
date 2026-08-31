"""Core matching engine - multi-stage AI pipeline for material matching."""

import logging
from typing import Any

from rapidfuzz import fuzz
from app.services.normalizer import DescriptionNormalizer
from app.ml.embeddings import EmbeddingEngine
from app.ml.reranker import MatchReranker

logger = logging.getLogger(__name__)


class MatchingEngine:
    """Multi-stage matching: lexical -> semantic -> numeric -> reranker."""

    def __init__(self):
        self.normalizer = DescriptionNormalizer()
        self.embeddings = EmbeddingEngine()
        self.reranker = MatchReranker()

    def run_pipeline(self, source_materials: list[Any], target_materials: list[Any], threshold: float = 0.65, top_k: int = 5) -> list[dict]:
        logger.info(f"Starting match pipeline: {len(source_materials)} x {len(target_materials)}")
        results = []
        for source in source_materials:
            candidates = self._candidate_selection(source, target_materials, threshold, top_k * 2)
            if not candidates:
                continue
            reranked = self.reranker.rerank(source.description or "", [c['description'] for c in candidates], top_k=top_k)
            for rank in reranked:
                original = candidates[rank['candidate_idx']]
                raw = rank['score']
                # Cross-encoder raw scores are unbounded logits (-10..10).
                # Normalize to 0..1 via sigmoid for human-friendly confidence.
                norm = self._sigmoid(raw)
                # Blend with the candidate's blended score (lex+sem+num) so
                # short-circuit heuristics still apply when cross-encoder is
                # uncertain.
                overall = 0.6 * norm + 0.4 * original['overall']
                results.append({
                    'source_material_id': source.id,
                    'target_material_id': original['id'],
                    'semantic_score': original.get('semantic_score', 0),
                    'lexical_score': original.get('lexical_score', 0),
                    'numeric_score': original.get('numeric_score', 0),
                    'reranker_score': raw,
                    'overall_score': overall,
                    'match_type': self._classify_match_type(overall),
                    'confidence_level': self._classify_confidence(overall),
                    'explanation': f"AI matched with {overall:.0%} confidence (cross-encoder: {raw:.2f})",
                    'differences': original.get('differences', []),
                })
        return sorted(results, key=lambda x: x['overall_score'], reverse=True)

    @staticmethod
    def _sigmoid(x: float) -> float:
        import math
        try:
            return 1.0 / (1.0 + math.exp(-x))
        except OverflowError:
            return 0.0 if x < 0 else 1.0

    def _candidate_selection(self, source: Any, targets: list[Any], threshold: float, top_k: int) -> list[dict]:
        norm_source = self.normalizer.normalize(source.description or "")
        candidates = []
        for i, t in enumerate(targets):
            norm_target = self.normalizer.normalize(t.description or "")
            lex = fuzz.token_sort_ratio(norm_source, norm_target) / 100.0
            sem = self.embeddings.similarity(source.description or "", t.description or "")
            num = self._numeric_compatibility(source, t)
            overall = 0.3 * lex + 0.4 * sem + 0.3 * num
            if overall >= threshold:
                candidates.append({
                    'idx': i, 'id': t.id, 'description': t.description or "",
                    'lexical_score': lex, 'semantic_score': sem, 'numeric_score': num,
                    'overall': overall,
                    'differences': self._compute_differences(source, t),
                })
        return sorted(candidates, key=lambda c: c['overall'], reverse=True)[:top_k * 2]

    def _numeric_compatibility(self, a: Any, b: Any) -> float:
        score = 0.5
        if a.family == b.family: score += 0.3
        if a.material_type and b.material_type and a.material_type == b.material_type: score += 0.1
        if a.unit_of_measure and b.unit_of_measure and a.unit_of_measure == b.unit_of_measure: score += 0.1
        return min(score, 1.0)

    def _classify_match_type(self, score: float) -> str:
        if score >= 0.85: return "exact"
        if score >= 0.78: return "near_duplicate"
        if score >= 0.65: return "equivalent"
        return "partial"

    def _classify_confidence(self, score: float) -> str:
        if score >= 0.85: return "high"
        if score >= 0.75: return "medium"
        return "low"

    def _compute_differences(self, a: Any, b: Any) -> list[str]:
        diffs = []
        if a.material_type != b.material_type and a.material_type and b.material_type:
            diffs.append(f"Material type: {a.material_type} vs {b.material_type}")
        if a.grade != b.grade and a.grade and b.grade:
            diffs.append(f"Grade: {a.grade} vs {b.grade}")
        if a.unit_of_measure != b.unit_of_measure and a.unit_of_measure and b.unit_of_measure:
            diffs.append(f"UOM: {a.unit_of_measure} vs {b.unit_of_measure}")
        if a.family != b.family:
            diffs.append(f"Family: {a.family} vs {b.family}")
        return diffs

    def detect_duplicates(self, materials: list[Any], threshold: float = 0.75) -> list[dict]:
        logger.info(f"Detecting duplicates among {len(materials)} materials")
        results = self.run_pipeline(materials, materials, threshold=threshold, top_k=3)
        duplicate_pairs = [r for r in results if r['source_material_id'] != r['target_material_id']]
        return duplicate_pairs
