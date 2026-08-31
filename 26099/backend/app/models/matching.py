"""MatchProposal model."""

from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Column, DateTime, Enum as SAEnum, Float, ForeignKey, Integer, Text, func,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


class MatchType(str, PyEnum):
    PENDING = "pending"
    EXACT = "exact"
    PARTIAL = "partial"
    NEAR_DUPLICATE = "near_duplicate"
    EQUIVALENT = "equivalent"


class MatchStatus(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    MERGED = "merged"


class ConfidenceLevel(str, PyEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class MatchProposal(Base):
    __tablename__ = "match_proposals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_material_id = Column(
        Integer, ForeignKey("materials.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    target_material_id = Column(
        Integer, ForeignKey("materials.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    semantic_score = Column(Float, nullable=True)
    lexical_score = Column(Float, nullable=True)
    numeric_score = Column(Float, nullable=True)
    reranker_score = Column(Float, nullable=True)
    overall_score = Column(Float, nullable=False, index=True)

    match_type = Column(
        SAEnum(MatchType, name="match_type", native_enum=False, length=20),
        nullable=False,
    )
    confidence_level = Column(
        SAEnum(ConfidenceLevel, name="confidence_level", native_enum=False, length=20),
        nullable=False,
    )
    status = Column(
        SAEnum(MatchStatus, name="match_status", native_enum=False, length=20),
        default=MatchStatus.PENDING, nullable=False, index=True,
    )

    explanation = Column(Text, nullable=True)
    differences = Column(Text, nullable=True)
    review_comment = Column(Text, nullable=True)
    reviewed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    # Relationships
    source_material = relationship("Material", foreign_keys=[source_material_id])
    target_material = relationship("Material", foreign_keys=[target_material_id])
