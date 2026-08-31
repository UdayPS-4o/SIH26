"""Document API routes for the Samdarshi backend.

Provides CRUD-style endpoints for querying archival documents.
Full CRUD write operations are included for completeness but the
prototype dataset is read-only (seeded at startup).
"""

from fastapi import APIRouter, Depends, HTTPException, Query

from database import get_db
from models import Document
from schemas import DocumentResponse, DocumentList


router = APIRouter(prefix="/documents", tags=["documents"])


def _document_to_response(doc: Document) -> DocumentResponse:
    """Convert a SQLAlchemy Document to a Pydantic DocumentResponse."""
    return DocumentResponse(
        id=doc.id,
        title=doc.title,
        author=doc.author,
        date=doc.date or "",
        source=doc.source or "",
        language=doc.language,
        type=doc.type or "",
        description=doc.description or "",
        excerpt=doc.excerpt or "",
    )


@router.get("", response_model=DocumentList)
def list_documents(
    skip: int = Query(0, ge=0, description="Number of records to skip for pagination."),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return."),
    db=Depends(get_db),
) -> DocumentList:
    """List all documents with optional pagination."""
    total: int = db.query(Document).count()
    docs = (
        db.query(Document).order_by(Document.id).offset(skip).limit(limit).all()
    )
    document_responses = [_document_to_response(d) for d in docs]
    return DocumentList(documents=document_responses, total=total, limit=limit)


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db=Depends(get_db)) -> DocumentResponse:
    """Retrieve a single document by its ID."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=404,
            detail=f"Document with id={document_id} not found.",
        )
    return _document_to_response(doc)


@router.get("/search", response_model=dict)
def search_documents(
    q: str = Query(..., min_length=1, description="Search query string."),
    limit: int = Query(20, ge=1, le=100, description="Max results to return."),
    db=Depends(get_db),
) -> dict:
    """Search documents by keyword matching against title, description, and content."""
    query_lower: str = f"%{q.lower()}%"
    docs = (
        db.query(Document)
        .filter(
            (Document.title.ilike(query_lower))
            | (Document.description.ilike(query_lower))
            | (Document.content.ilike(query_lower))
        )
        .order_by(Document.id)
        .limit(limit)
        .all()
    )
    document_responses = [_document_to_response(d) for d in docs]
    return {
        "documents": [d.model_dump() for d in document_responses],
        "total": len(document_responses),
        "query": q,
    }


@router.post("", response_model=dict, status_code=201)
def create_document(doc_data: dict, db=Depends(get_db)) -> dict:
    """Create a new document record (prototype — write support included).

    Args:
        doc_data: JSON body with document fields.
        db: Database session (injected by FastAPI dependency).

    Returns:
        The newly created document as a dict.

    Raises:
        HTTPException 400: If a document with the same ID already exists.
    """
    existing: Optional[Document] = db.query(Document).filter(
        Document.id == doc_data.get("id")
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Document with id={doc_data.get('id')} already exists.",
        )
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
    db.refresh(doc)
    return _document_to_response(doc).to_dict()
