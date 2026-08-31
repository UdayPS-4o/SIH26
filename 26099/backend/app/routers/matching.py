"""AI Matching and Duplicate Detection router."""

import logging
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.material import Material, CPSEOrganization
from app.models.matching import MatchProposal, MatchStatus, MatchType, ConfidenceLevel
from app.schemas.matching import (
    MatchProposalResponse, MatchReviewRequest, MatchSummary,
    DedupRequest, DedupResponse,
)
from app.services.matching_engine import MatchingEngine

logger = logging.getLogger(__name__)

router = APIRouter()
_engine: Optional[MatchingEngine] = None


def get_matching_engine() -> MatchingEngine:
    global _engine
    if _engine is None:
        _engine = MatchingEngine()
    return _engine


def _proposal_response(p: MatchProposal) -> MatchProposalResponse:
    return MatchProposalResponse(
        id=p.id,
        source_material_id=p.source_material_id,
        target_material_id=p.target_material_id,
        source_code=p.source_material.cpse_material_code if p.source_material else None,
        source_description=p.source_material.description if p.source_material else None,
        target_code=p.target_material.cpse_material_code if p.target_material else None,
        target_description=p.target_material.description if p.target_material else None,
        overall_score=p.overall_score,
        semantic_score=p.semantic_score,
        lexical_score=p.lexical_score,
        numeric_score=p.numeric_score,
        reranker_score=p.reranker_score,
        match_type=p.match_type.value if hasattr(p.match_type, "value") else p.match_type,
        confidence_level=p.confidence_level.value if hasattr(p.confidence_level, "value") else p.confidence_level,
        explanation=p.explanation,
        differences=p.differences.split("|") if p.differences else None,
        status=p.status.value if hasattr(p.status, "value") else p.status,
        review_comment=p.review_comment,
        created_at=p.created_at,
    )


# ---------------------------------------------------------------------------
# Request schema for the run-pipeline endpoint
# ---------------------------------------------------------------------------

class MatchRunRequest(BaseModel):
    source_organization_id: int
    target_organization_id: Optional[int] = None
    threshold: float = 0.65
    top_k: int = 5


# ---------------------------------------------------------------------------
# 1. POST /  –  Run full matching pipeline
# ---------------------------------------------------------------------------

@router.post("/", response_model=List[MatchProposalResponse])
async def run_matching_pipeline(
    req: MatchRunRequest,
    db: Session = Depends(get_db),
):
    """Run the full AI matching pipeline between two organizations (or all materials)."""
    source_query = db.query(Material).filter(
        Material.cpse_organization_id == req.source_organization_id,
        Material.is_obsolete == False,
    )
    source_materials = source_query.all()
    if not source_materials:
        raise HTTPException(
            status_code=404,
            detail=f"No active materials found for source organization {req.source_organization_id}",
        )

    if req.target_organization_id is not None:
        target_materials = (
            db.query(Material)
            .filter(
                Material.cpse_organization_id == req.target_organization_id,
                Material.is_obsolete == False,
            )
            .all()
        )
    else:
        target_materials = db.query(Material).filter(Material.is_obsolete == False).all()

    if not target_materials:
        raise HTTPException(
            status_code=404,
            detail="No active target materials found for matching",
        )

    engine = get_matching_engine()
    results = engine.run_pipeline(
        source_materials, target_materials,
        threshold=req.threshold, top_k=req.top_k,
    )

    saved_proposals: List[MatchProposal] = []
    for r in results:
        proposal = MatchProposal(
            source_material_id=r["source_material_id"],
            target_material_id=r["target_material_id"],
            semantic_score=r.get("semantic_score"),
            lexical_score=r.get("lexical_score"),
            numeric_score=r.get("numeric_score"),
            reranker_score=r.get("reranker_score"),
            overall_score=r["overall_score"],
            match_type=MatchType(r.get("match_type", "partial")),
            confidence_level=ConfidenceLevel(r.get("confidence_level", "low")),
            explanation=r.get("explanation"),
            differences="|".join(r["differences"]) if r.get("differences") else None,
            status=MatchStatus.PENDING,
        )
        db.add(proposal)
        saved_proposals.append(proposal)

    db.commit()
    for p in saved_proposals:
        db.refresh(p)

    return [_proposal_response(p) for p in saved_proposals]


# ---------------------------------------------------------------------------
# 2. GET /proposals  –  List match proposals
# ---------------------------------------------------------------------------

@router.get("/proposals", response_model=List[MatchProposalResponse])
async def get_match_proposals(
    status: Optional[str] = Query(None, description="Filter by proposal status"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Get all match proposals with optional status filter."""
    query = db.query(MatchProposal)
    if status:
        query = query.filter(MatchProposal.status == status)
    proposals = query.order_by(MatchProposal.overall_score.desc()).offset(skip).limit(limit).all()
    return [_proposal_response(p) for p in proposals]


# ---------------------------------------------------------------------------
# 3. POST /review  –  Approve or reject a proposal
# ---------------------------------------------------------------------------

@router.post("/review", response_model=MatchProposalResponse)
async def review_match(review: MatchReviewRequest, db: Session = Depends(get_db)):
    """Approve or reject a match proposal."""
    proposal = db.query(MatchProposal).filter(MatchProposal.id == review.match_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Match proposal not found")

    action = review.action.lower()
    if action == "approve":
        proposal.status = MatchStatus.APPROVED
    elif action == "reject":
        proposal.status = MatchStatus.REJECTED
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'reject'.")

    if review.comment:
        proposal.review_comment = review.comment

    from datetime import datetime
    proposal.reviewed_at = datetime.utcnow()

    db.commit()
    db.refresh(proposal)
    return _proposal_response(proposal)


# ---------------------------------------------------------------------------
# 4. POST /detect-duplicates  –  Detect duplicate materials
# ---------------------------------------------------------------------------

@router.post("/detect-duplicates", response_model=DedupResponse)
async def detect_duplicates(req: DedupRequest, db: Session = Depends(get_db)):
    """Run AI duplicate detection across materials."""
    engine = get_matching_engine()
    query = db.query(Material).filter(Material.is_obsolete == False)

    if req.cpse_organization_ids:
        query = query.filter(Material.cpse_organization_id.in_(req.cpse_organization_ids))
    if req.family_filter:
        query = query.filter(Material.family == req.family_filter)

    materials = query.all()
    if not materials:
        return DedupResponse(
            total_materials_scanned=0,
            duplicate_pairs_found=0,
            clusters_formed=0,
            duplicates=[],
        )

    # Build a lookup index for O(1) access by material id
    material_index = {m.id: m for m in materials}

    duplicates_raw = engine.detect_duplicates(materials, threshold=req.threshold)
    result = []
    for dup in duplicates_raw:
        src_id = dup["source_material_id"]
        tgt_id = dup["target_material_id"]
        src_mat = material_index.get(src_id)
        tgt_mat = material_index.get(tgt_id)
        if not src_mat or not tgt_mat:
            continue
        result.append({
            "material_a_id": src_id,
            "material_a_code": src_mat.cpse_material_code,
            "material_a_description": src_mat.description,
            "material_b_id": tgt_id,
            "material_b_code": tgt_mat.cpse_material_code,
            "material_b_description": tgt_mat.description,
            "score": dup["overall_score"],
            "match_type": dup["match_type"],
            "confidence": dup["confidence_level"],
        })

    return DedupResponse(
        total_materials_scanned=len(materials),
        duplicate_pairs_found=len(result),
        clusters_formed=len(result),
        duplicates=result,
    )


# ---------------------------------------------------------------------------
# 5. GET /summary  –  Matching statistics
# ---------------------------------------------------------------------------

@router.get("/summary", response_model=MatchSummary)
async def get_match_summary(db: Session = Depends(get_db)):
    """Get matching statistics summary."""
    from sqlalchemy import func as sa_func
    avg_score_row = db.query(sa_func.avg(MatchProposal.overall_score)).one()
    avg_score = round(float(avg_score_row[0]), 3) if avg_score_row[0] is not None else 0.0
    return MatchSummary(
        total=db.query(MatchProposal).count(),
        pending=db.query(MatchProposal).filter(MatchProposal.status == MatchStatus.PENDING).count(),
        approved=db.query(MatchProposal).filter(MatchProposal.status == MatchStatus.APPROVED).count(),
        rejected=db.query(MatchProposal).filter(MatchProposal.status == MatchStatus.REJECTED).count(),
        avg_score=avg_score,
        high_confidence=db.query(MatchProposal).filter(
            MatchProposal.confidence_level == ConfidenceLevel.HIGH,
        ).count(),
        medium_confidence=db.query(MatchProposal).filter(
            MatchProposal.confidence_level == ConfidenceLevel.MEDIUM,
        ).count(),
        low_confidence=db.query(MatchProposal).filter(
            MatchProposal.confidence_level == ConfidenceLevel.LOW,
        ).count(),
    )
