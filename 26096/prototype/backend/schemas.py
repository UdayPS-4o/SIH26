"""Pydantic schemas for request/response validation.

Provides type-safe serialization for all API endpoints using
Pydantic v2 BaseModel.
"""

from typing import List, Optional

from pydantic import BaseModel, Field


# ── Document Schemas ────────────────────────────────────────────────────────

class DocumentResponse(BaseModel):
    """Schema for a single document response."""
    id: int
    title: str
    author: str
    date: str = ""
    source: str = ""
    language: str = "en"
    type: str = ""
    description: str = ""
    excerpt: str = ""


class DocumentList(BaseModel):
    """Schema for a paginated list of documents."""
    documents: List[DocumentResponse]
    total: int
    limit: int


# ── Timeline Event Schemas ──────────────────────────────────────────────────

class TimelineEventResponse(BaseModel):
    """Schema for a single timeline event response."""
    id: int
    date: str = ""
    year: int = 0
    title: str
    description: str = ""
    category: str = ""
    source: str = ""
    image: str = ""


class TimelineEventList(BaseModel):
    """Schema for a list of timeline events."""
    events: List[TimelineEventResponse]
    total: int


# ── Chat Schemas ────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    """Schema for incoming chat requests."""
    question: str = Field(..., min_length=1, description="The user's question.")
    language: str = Field(default="en", description="Preferred language code.")


class ChatResponse(BaseModel):
    """Schema for chat API responses."""
    answer: str
    source: str
    confidence: float
    language: str
    suggested_topics: List[str] = []


# ── OCR Schemas ─────────────────────────────────────────────────────────────

class OCRScanRequest(BaseModel):
    """Schema for OCR scan requests."""
    document_id: int = Field(..., description="ID of the document to scan.")
    language: str = Field(default="en", description="Primary document language.")


class OCRScanResponse(BaseModel):
    """Schema for OCR scan results."""
    text: str
    confidence: float
    pages: int
    processing_time: str
    document_id: int
    source: str
