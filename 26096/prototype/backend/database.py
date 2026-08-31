"""Database configuration for Samdarshi prototype.

Uses SQLAlchemy with SQLite for the prototype phase.
Production will migrate to PostgreSQL.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./samdarshi.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency that provides a database session per request.

    Yields a SQLAlchemy session and ensures it is closed after use,
    even if an exception occurs during the request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables defined in SQLAlchemy models.

    Called automatically on application startup.
    """
    # Import models here so that SQLAlchemy registers them
    from models import Document, TimelineEvent  # noqa: F401
    Base.metadata.create_all(bind=engine)
