"""Timeline API routes for the Samdarshi backend.

Provides endpoints to query the chronological timeline of events.
"""

from fastapi import APIRouter, Depends, HTTPException, Query

from database import get_db
from models import TimelineEvent


router = APIRouter(prefix="/timeline", tags=["timeline"])


def _event_to_response(event: TimelineEvent) -> dict:
    """Convert a TimelineEvent ORM instance to a response dict."""
    return {
        "id": event.id,
        "date": event.date or "",
        "year": event.year or 0,
        "title": event.title,
        "description": event.description or "",
        "category": event.category or "",
        "source": event.source or "",
        "image": event.image or "",
    }


@router.get("", response_model=dict)
def list_events(
    year: int | None = Query(None, ge=1800, le=2100, description="Filter by year."),
    category: str | None = Query(None, min_length=1, description="Filter by category."),
    db=Depends(get_db),
) -> dict:
    """List timeline events with optional filtering."""
    query = db.query(TimelineEvent).order_by(TimelineEvent.year)
    if year is not None:
        query = query.filter(TimelineEvent.year == year)
    if category is not None:
        query = query.filter(TimelineEvent.category == category)
    events = query.all()
    return {"events": [_event_to_response(e) for e in events], "total": len(events)}


@router.get("/{event_id}", response_model=dict)
def get_event(event_id: int, db=Depends(get_db)) -> dict:
    """Retrieve a single timeline event by its ID."""
    event = db.query(TimelineEvent).filter(TimelineEvent.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=404,
            detail=f"Timeline event with id={event_id} not found.",
        )
    return _event_to_response(event)


@router.get("/categories/list", response_model=dict)
def list_categories(db=Depends(get_db)) -> dict:
    """Return a list of all unique categories present in the timeline."""
    categories = [
        row[0] for row in db.query(TimelineEvent.category).distinct().all() if row[0]
    ]
    return {"categories": sorted(categories), "total": len(categories)}
