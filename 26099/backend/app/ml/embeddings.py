"""ML embeddings for semantic matching."""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


class EmbeddingEngine:
    """Compute semantic similarity between material descriptions using embeddings."""

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model = None
        self.model_name = model_name

    def _load_model(self):
        if self.model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer(self.model_name)
            except ImportError:
                logger.warning("sentence-transformers not available, using TF-IDF fallback")
                self.model = None

    def embed(self, text: str) -> list[float]:
        self._load_model()
        if self.model is not None:
            return self.model.encode(text).tolist()
        return self._tfidf_embed(text)

    def similarity(self, text_a: str, text_b: str) -> float:
        emb_a = self.embed(text_a)
        emb_b = self.embed(text_b)
        return self._cosine_similarity(emb_a, emb_b)

    def batch_embed(self, texts: list[str]) -> list[list[float]]:
        self._load_model()
        if self.model is not None:
            return self.model.encode(texts).tolist()
        return [self._tfidf_embed(t) for t in texts]

    def batch_similarity(self, query: str, candidates: list[str]) -> list[float]:
        q_emb = self.embed(query)
        return [self._cosine_similarity(q_emb, self.embed(c)) for c in candidates]

    @staticmethod
    def _cosine_similarity(a: list[float], b: list[float]) -> float:
        if not a or not b or len(a) != len(b):
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        mag_a = sum(x * x for x in a) ** 0.5
        mag_b = sum(y * y for y in b) ** 0.5
        if mag_a == 0 or mag_b == 0:
            return 0.0
        return dot / (mag_a * mag_b)

    @staticmethod
    def _tfidf_embed(text: str) -> list[float]:
        """Fallback: simple bag-of-words embedding."""
        words = set(text.lower().split())
        vocab = {w: i for i, w in enumerate(sorted(words))}
        vec = [0.0] * max(len(vocab), 1)
        for w in words:
            if w in vocab:
                vec[vocab[w]] = 1.0
        return vec
