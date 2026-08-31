"""Seed script for the Samdarshi prototype database.

On application startup, this module checks whether the documents and
timeline_events tables are empty.  If they are, it reads the JSON
dataset files from the prototype datasets directory and inserts the
records.  If the tables already contain data the script is a no-op,
making it safe to run on every startup.
"""

import json
import os
from pathlib import Path
from typing import Any, Dict, List

from database import SessionLocal, engine
from models import Base, Document, TimelineEvent


BASE_DIR: Path = Path(__file__).resolve().parent.parent  # prototype/
DATASETS_DIR: Path = BASE_DIR / "datasets"


def _load_json(filename: str) -> Any:
    """Read and parse a JSON file from the datasets directory.

    Args:
        filename: Name of the JSON file (e.g., 'documents.json').

    Returns:
        Parsed Python object from the JSON file.

    Raises:
        FileNotFoundError: If the file does not exist.
        RuntimeError: If the file contains invalid JSON.
    """
    filepath: Path = DATASETS_DIR / filename
    if not filepath.exists():
        raise FileNotFoundError(
            f"Dataset file not found: {filepath}. "
            "Ensure you are running from the backend/ directory."
        )
    try:
        with open(filepath, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"Failed to parse {filename}: {exc}"
        ) from exc


def _seed_documents(db: Any) -> None:
    """Load documents from documents.json into the database.

    Args:
        db: An active SQLAlchemy session.
    """
    data: Dict = _load_json("documents.json")
    docs: List[Dict] = data.get("documents", [])

    for doc_data in docs:
        doc = Document(
            id=doc_data.get("id"),
            title=doc_data.get("title", ""),
            author=doc_data.get("author", ""),
            date=doc_data.get("date", ""),
            source=doc_data.get("source", ""),
            language=doc_data.get("language", "en"),
            type=doc_data.get("type", ""),
            description=doc_data.get("description", ""),
            content=doc_data.get("content"),
            excerpt=doc_data.get("excerpt", ""),
        )
        db.add(doc)

    db.commit()
    print(f"[seed_data] Inserted {len(docs)} documents.")


def _seed_timeline(db: Any) -> None:
    """Load timeline events from timeline.json into the database.

    Args:
        db: An active SQLAlchemy session.
    """
    data: List[Dict] = _load_json("timeline.json")

    for event_data in data:
        event = TimelineEvent(
            id=event_data.get("id"),
            date=event_data.get("date", ""),
            year=event_data.get("year"),
            title=event_data.get("title", ""),
            description=event_data.get("description", ""),
            category=event_data.get("category", ""),
            source=event_data.get("source", ""),
            image=event_data.get("image"),
        )
        db.add(event)

    db.commit()
    print(f"[seed_data] Inserted {len(data)} timeline events.")


def run_seed() -> None:
    """Run the seeding process.

    Creates database tables if they do not exist, then populates them
    from JSON files — but only if the tables are currently empty.
    """
    # Ensure tables exist.
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if tables already have data.
        doc_count: int = db.query(Document).count()
        event_count: int = db.query(TimelineEvent).count()

        if doc_count > 0 and event_count > 0:
            print(
                "[seed_data] Tables already populated "
                f"(documents={doc_count}, events={event_count}). Skipping."
            )
            return

        # Clear existing partial data for a clean re-seed.
        if doc_count > 0:
            print("[seed_data] Clearing partial document data for re-seed.")
            db.query(Document).delete()
        if event_count > 0:
            print("[seed_data] Clearing partial timeline data for re-seed.")
            db.query(TimelineEvent).delete()

        db.commit()

        _seed_documents(db)
        _seed_timeline(db)

    except Exception as exc:
        db.rollback()
        raise RuntimeError(f"Seeding failed: {exc}") from exc
    finally:
        db.close()
