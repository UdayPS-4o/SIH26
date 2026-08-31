"""Matching schemas."""

from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class MatchProposalResponse(BaseModel):
    id: int
    source_material_id: int
    target_material_id: int
    source_code: Optional[str]
    source_description: Optional[str]
    target_code: Optional[str]
    target_description: Optional[str]
    overall_score: float
    semantic_score: Optional[float]
    lexical_score: Optional[float]
    numeric_score: Optional[float]
    reranker_score: Optional[float]
    match_type: str
    confidence_level: str
    explanation: Optional[str]
    differences: Optional[list[str]]
    status: str
    review_comment: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class MatchReviewRequest(BaseModel):
    match_id: int
    action: str  # "approve" or "reject"
    comment: Optional[str] = None


class MatchSummary(BaseModel):
    total: int
    pending: int
    approved: int
    rejected: int
    avg_score: float
    high_confidence: int
    medium_confidence: int
    low_confidence: int


class DedupRequest(BaseModel):
    threshold: float = 0.75
    family: Optional[str] = None
    organization_ids: Optional[list[int]] = None


class DedupResponse(BaseModel):
    total_duplicates: int
    duplicates: list


class MatchQueryRequest(BaseModel):
    description: str
    top_k: int = 5
    threshold: float = 0.65
