"""Audit trail and governance models."""

from datetime import datetime
from sqlalchemy import Column, Float, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class AuditLog(Base):
    """Complete audit trail for all material master changes."""

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(Integer, nullable=False, index=True)
    action = Column(String(50), nullable=False)
    old_values = Column(Text, nullable=True)
    new_values = Column(Text, nullable=True)
    change_summary = Column(Text, nullable=True)
    user_id = Column(String(50), nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class CNMCGenerationLog(Base):
    """Log of CNMC code generation events."""

    __tablename__ = "cnmc_generation_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cnmc_id = Column(Integer, ForeignKey("cnmc_codes.id"), nullable=False)
    material_ids = Column(Text, nullable=False)
    algorithm = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=True)
    generated_by = Column(String(50), default="ai_system")
    approved_by = Column(String(100), nullable=True)
    status = Column(String(20), default="generated")
    created_at = Column(DateTime, default=datetime.utcnow)
