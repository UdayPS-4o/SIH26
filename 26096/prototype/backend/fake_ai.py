"""Fake AI engine for the Samdarshi prototype.

Implements a keyword-matching retrieval system that finds the best
response from a pre-loaded dataset of Q&A pairs.  No external API
calls are made — all logic runs locally.

Matching strategy:
    1. Lower-case the user question.
    2. Tokenise into words, strip common stop-words.
    3. For each canned response, count how many of its keywords appear
       in the tokenised question.
    4. Return the response with the highest keyword-hit count.
    5. If no keywords match at all, return the generic fallback.
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BASE_DIR: Path = Path(__file__).resolve().parent.parent
FAKE_RESPONSES_PATH: Path = BASE_DIR / "datasets" / "fakeResponses.json"

# Common English stop-words to filter out during keyword matching.
_STOP_WORDS: set[str] = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "shall", "can",
    "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "about", "through", "during", "before", "after",
    "above", "below", "between", "out", "off", "over", "under",
    "again", "further", "then", "once", "here", "there", "when",
    "where", "why", "how", "all", "both", "each", "few", "more",
    "most", "other", "some", "such", "no", "nor", "not", "only",
    "own", "same", "so", "than", "too", "very", "just", "because",
    "but", "and", "or", "if", "while", "that", "this", "it", "its",
    "he", "she", "they", "them", "his", "her", "their", "what",
    "which", "who", "whom", "me", "my", "we", "our", "you", "your",
    "tell", "know", "think", "want", "need", "like", "much", "many",
}


# ---------------------------------------------------------------------------
# Loader
# ---------------------------------------------------------------------------

def _load_fake_responses() -> Dict:
    """Load the canned Q&A dataset from disk.

    Returns:
        The parsed JSON object containing 'responses' and 'fallback'.

    Raises:
        RuntimeError: If the dataset file is missing or unparseable.
    """
    if not FAKE_RESPONSES_PATH.exists():
        raise RuntimeError(
            f"fakeResponses.json not found at {FAKE_RESPONSES_PATH}. "
            "Ensure the datasets directory is populated before starting."
        )
    try:
        with open(FAKE_RESPONSES_PATH, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"Failed to parse fakeResponses.json: {exc}"
        ) from exc


# Load once at module import — the file never changes at runtime.
_FAKE_DATA: Dict = _load_fake_responses()


# ---------------------------------------------------------------------------
# Matching logic
# ---------------------------------------------------------------------------

def _tokenise(text: str) -> List[str]:
    """Lower-case and split a string into meaningful tokens.

    Removes punctuation and filters out common stop-words.

    Args:
        text: Raw input string.

    Returns:
        List of cleaned, lower-case tokens.
    """
    import re
    tokens: List[str] = re.findall(r"\b\w+\b", text.lower())
    return [t for t in tokens if t not in _STOP_WORDS and len(t) > 2]


def find_best_response(question: str) -> Tuple[str, str, float, str]:
    """Find the best canned response for a user question.

    Performs simple keyword-frequency matching against the pre-loaded
    response dataset.  Returns the response whose keywords have the
    highest overlap with the question tokens.

    Args:
        question: The user's natural-language question.

    Returns:
        A 4-tuple of (answer_text, source_title, confidence, language).

        If no keyword match is found, returns the generic fallback
        response with a lower confidence score.
    """
    tokens: List[str] = _tokenise(question)
    if not tokens:
        # Empty or only stop-words — use fallback.
        return _return_fallback()

    responses: Dict = _FAKE_DATA.get("responses", {})
    best_key: Optional[str] = None
    best_hits: int = 0

    for key, entry in responses.items():
        keywords: List[str] = entry.get("keywords", [])
        # Count how many of the entry's keywords appear in the question.
        hits: int = sum(
            1 for kw in keywords if kw.lower() in tokens
        )
        if hits > best_hits:
            best_hits = hits
            best_key = key

    if best_key is None or best_hits == 0:
        return _return_fallback()

    entry = responses[best_key]
    answer: str = entry.get("answer", "")
    language: str = entry.get("language", "en")
    confidence: float = entry.get("confidence", 0.85)

    # Derive a human-readable source title from the key.
    source_title: str = best_key.replace("_", " ").title()

    return answer, source_title, confidence, language


def _return_fallback() -> Tuple[str, str, float, str]:
    """Return the generic fallback response.

    Returns:
        A 4-tuple of (fallback_answer, "Samdarshi AI", 0.5, "en").
    """
    fallback: Dict = _FAKE_DATA.get("fallback", {})
    answer: str = fallback.get(
        "answer",
        "I'm sorry, I don't have information on that topic yet. "
        "Try asking about Dr. Ambedkar's life, the Constitution, "
        "or the Poona Pact.",
    )
    confidence: float = fallback.get("confidence", 0.5)
    return answer, "Samdarshi AI", confidence, "en"


def get_available_topics() -> List[str]:
    """Return a list of topic keys available in the fake responses.

    Useful for building dynamic suggestion chips in the frontend.

    Returns:
        Sorted list of topic key strings (e.g., ['buddha', 'constitution']).
    """
    responses: Dict = _FAKE_DATA.get("responses", {})
    return sorted(responses.keys())
