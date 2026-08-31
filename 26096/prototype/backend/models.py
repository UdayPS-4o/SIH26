"""SQLAlchemy ORM models for the Samdarshi prototype.

Defines two core entities:
- Document: archival documents, books, speeches, theses
- TimelineEvent: chronological events in Dr. Ambedkar's life
"""

from datetime import date
from typing import Optional
from sqlalchemy import Column, Integer, String, Date, Text, DateTime
from sqlalchemy.sql import func

from database import Base


class Document(Base):
    """Represents an archival document in the Samdarshi knowledge base.

    Attributes:
        id: Primary key, auto-incremented.
        title: Document title.
        author: Author or authoring body.
        date: Publication or event date as an ISO-format string.
        source: Collection or archive where the document originates.
        language: ISO 639-1 language code (e.g., 'en', 'hi').
        type: Document type (book, thesis, constitution, debates, policy, etc.).
        description: Summary of the document.
        content: Full text content if available.
        excerpt: Notable quoted passage from the document.
        created_at: Timestamp of record creation in the database.
    """

    __tablename__ = "documents"

    id: int = Column(Integer, primary_key=True, index=True)
    title: str = Column(String(500), nullable=False)
    author: str = Column(String(500), nullable=False)
    date: str = Column(String(50), nullable=True)
    source: str = Column(String(500), nullable=True)
    language: str = Column(String(10), default="en")
    type: str = Column(String(100), nullable=True)
    description: str = Column(Text, nullable=True)
    content: str = Column(Text, nullable=True)
    excerpt: str = Column(Text, nullable=True)
    created_at: date = Column(DateTime(timezone=True), server_default=func.now())


class TimelineEvent(Base):
    """Represents a chronological event in the Samdarshi timeline.

    Attributes:
        id: Primary key, auto-incremented.
        date: Exact date in ISO-format string (YYYY-MM-DD).
        year: Year as an integer for easy filtering.
        title: Short event title.
        description: Detailed description of the event.
        category: Category label (birth, education, political, career, literary, death).
        source: Reference source for the event.
        image: URL or path to an associated image (optional in prototype).
        created_at: Timestamp of record creation in the database.
    """

    __tablename__ = "timeline_events"

    id: int = Column(Integer, primary_key=True, index=True)
    date: str = Column(String(50), nullable=True)
    year: int = Column(Integer, nullable=True, index=True)
    title: str = Column(String(500), nullable=False)
    description: str = Column(Text, nullable=True)
    category: str = Column(String(100), nullable=True, index=True)
    source: str = Column(String(500), nullable=True)
    image: str = Column(String, nullable=True)
    created_at: date = Column(DateTime(timezone=True), server_default=func.now())
