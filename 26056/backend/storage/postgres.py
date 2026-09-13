"""
VIMAAN — SQLAlchemy models for PostgreSQL persistence layer.
In production: asyncpg pool, COPY for bulk insert, monthly partitioning.
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Float, Integer, DateTime, Boolean, Text, Index,
)
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class QuoteStore(Base):
    """One row per cleaned quote. Partitioned by month on scraped_at."""
    __tablename__ = "quotes"

    id = Column(String(16), primary_key=True)
    source = Column(String(32), nullable=False)
    sector = Column(String(8), nullable=False)
    carrier = Column(String(4), nullable=False)
    departure_date = Column(String(10), nullable=False)
    lead_days = Column(Integer, nullable=False)
    cabin = Column(String(20), nullable=False)
    base_fare = Column(Float, nullable=False)
    taxes = Column(Float, nullable=False)
    udf = Column(Float, nullable=False)
    convenience_fee = Column(Float, default=0)
    total_fare = Column(Float, nullable=False)
    flight_no = Column(String(10))
    elementary_cell = Column(String(64), nullable=False)
    scraped_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    quote_hash = Column(String(16), unique=True, nullable=False)
    is_imputed = Column(Boolean, default=False)
    is_suppressed = Column(Boolean, default=False)

    __table_args__ = (
        Index("idx_quotes_cell_date", "elementary_cell", "departure_date"),
    )


class IndexStore(Base):
    """Daily APIx value with confidence band."""
    __tablename__ = "index_values"

    date = Column(String(10), primary_key=True)
    frequency = Column(String(10), nullable=False)
    index_value = Column(Float, nullable=False)
    band_low = Column(Float, nullable=False)
    band_high = Column(Float, nullable=False)
    formula = Column(String(20), default="Jevons")
    n_quotes = Column(Integer)
    n_cells = Column(Integer)
    survival_rate = Column(Float)
    yoy_change = Column(Float)
    mom_change = Column(Float)
    status = Column(String(16), default="PROVISIONAL")
    published_at = Column(DateTime(timezone=True))


class AnomalyStore(Base):
    """Detected anomalies awaiting analyst review."""
    __tablename__ = "anomalies"

    id = Column(String(16), primary_key=True)
    date = Column(String(10), nullable=False)
    sector = Column(String(8), nullable=False)
    lead_days = Column(Integer, nullable=False)
    severity = Column(String(10), nullable=False)
    score = Column(Float, nullable=False)
    cause = Column(String(32))
    description = Column(Text)
    model = Column(String(32))
    confidence = Column(Float)
    acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))


class AuditLog(Base):
    """One row per outbound HTTP request. Append-only."""
    __tablename__ = "audit_log"

    id = Column(String(16), primary_key=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    source = Column(String(32), nullable=False)
    sector = Column(String(8))
    path = Column(String(256))
    status = Column(Integer)
    latency_ms = Column(Float)
    robots = Column(String(16))
    throttled = Column(Boolean, default=False)
