"""Chat API routes for the Samdarshi backend.

Implements a keyword-matching AI engine for the prototype phase.
Returns pre-authored responses for well-known Ambedkar topics.
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from fake_ai import find_best_response, get_available_topics

logger = logging.getLogger('samdarshi.chat')

router = APIRouter(prefix="/chat", tags=["chat"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    """Incoming chat message from the frontend."""
    question: str = Field(..., min_length=1, description="The user's question.")
    language: str = Field(default="en", description="Preferred language code (en, hi, mr).")


class ChatResponse(BaseModel):
    """Outgoing AI response to the frontend."""
    answer: str
    source: str
    confidence: float
    language: str
    suggested_topics: list[str] = []


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=dict)
def ask(request: ChatRequest) -> dict:
    """Process a user question and return an AI-generated answer.

    In the prototype phase this uses keyword matching against a
    pre-authored dataset.  The real RAG pipeline replaces this
    function body during Phase 2 (Day 2, Hours 6-12).

    Args:
        request: ChatRequest with question and optional language.

    Returns:
        ChatResponse with answer, source, confidence, and suggested topics.
    """
    try:
        answer, source, confidence, language = find_best_response(request.question)

        suggested = [
            t.replace('_', ' ').title()
            for t in get_available_topics()[:4]
        ]

        return ChatResponse(
            answer=answer,
            source=source,
            confidence=confidence,
            language=language,
            suggested_topics=suggested,
        )

    except Exception as exc:  # noqa: BLE001
        logger.error('Chat error for "%s": %s', request.question, exc)
        raise HTTPException(
            status_code=500,
            detail="Something went wrong processing your question. Please try again.",
        )


@router.get('/topics', response_model=dict)
def list_topics() -> dict:
    """Return a list of topics the AI can answer.

    Useful for showing suggestion chips in the frontend.

    Returns:
        Dictionary with 'topics' list (human-readable names).
    """
    raw = get_available_topics()
    topics = [t.replace('_', ' ').title() for t in raw]
    return {"topics": topics, "total": len(topics)}
