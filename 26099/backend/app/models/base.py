"""Re-export the SQLAlchemy declarative Base for model modules."""

from app.database import Base  # noqa: F401

__all__ = ["Base"]
