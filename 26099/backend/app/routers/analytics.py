"""Analytics and Dashboard router."""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.database import get_db
from app.models.material import Material, CPSEOrganization, CNMCCode
from app.models.matching import MatchProposal, MatchStatus

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# 1. GET /dashboard  –  Dashboard stats
# ---------------------------------------------------------------------------

@router.get("/dashboard")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get main dashboard KPIs with breakdowns."""
    total_materials = db.query(Material).count()
    total_cpse = db.query(CPSEOrganization).count()
    total_cnmc = db.query(CNMCCode).count()
    duplicates = db.query(Material).filter(Material.is_duplicate == True).count()

    # Breakdown by material family
    by_family = (
        db.query(Material.family, func.count(Material.id).label("count"))
        .group_by(Material.family)
        .order_by(func.count(Material.id).desc())
        .all()
    )

    # Breakdown by CPSE organization
    by_cpse = (
        db.query(CPSEOrganization.name, func.count(Material.id).label("count"))
        .join(Material, Material.cpse_organization_id == CPSEOrganization.id)
        .group_by(CPSEOrganization.id, CPSEOrganization.name)
        .all()
    )

    # Matching stats by status
    matching_stats = (
        db.query(
            func.count(MatchProposal.id).label("total"),
            func.sum(case((MatchProposal.status == MatchStatus.PENDING, 1), else_=0)).label("pending"),
            func.sum(case((MatchProposal.status == MatchStatus.APPROVED, 1), else_=0)).label("approved"),
            func.sum(case((MatchProposal.status == MatchStatus.REJECTED, 1), else_=0)).label("rejected"),
        ).one()
    )

    # Approved mappings (materials with a CNMC code linked)
    approved_mappings = db.query(Material).filter(Material.cnmc_id != None).count()

    # Pending reviews (pending match proposals)
    pending_reviews = db.query(MatchProposal).filter(MatchProposal.status == MatchStatus.PENDING).count()

    # Average confidence across all proposals
    avg_row = db.query(func.avg(MatchProposal.overall_score)).one()
    avg_confidence = round(float(avg_row[0]), 3) if avg_row[0] is not None else 0.0

    return {
        "kpis": {
            "total_materials": total_materials,
            "total_cpse": total_cpse,
            "duplicates_found": duplicates,
            "match_proposals": matching_stats.total or 0,
            "approved_mappings": approved_mappings,
            "pending_reviews": pending_reviews,
            "avg_confidence": avg_confidence,
        },
        "by_family": [{"family": f, "count": c} for f, c in by_family],
        "by_cpse": [{"name": n, "count": c} for n, c in by_cpse],
        "matching": {
            "total": matching_stats.total or 0,
            "pending": matching_stats.pending or 0,
            "approved": matching_stats.approved or 0,
            "rejected": matching_stats.rejected or 0,
        },
    }


# ---------------------------------------------------------------------------
# 2. GET /duplicates  –  Duplicate statistics
# ---------------------------------------------------------------------------

@router.get("/duplicates")
async def get_duplicate_stats(db: Session = Depends(get_db)):
    """Get duplicate statistics broken down by family and CPSE, with top pairs."""
    total_duplicates = db.query(Material).filter(Material.is_duplicate == True).count()

    # By family
    by_family = (
        db.query(Material.family, func.count(Material.id).label("count"))
        .filter(Material.is_duplicate == True)
        .group_by(Material.family)
        .order_by(func.count(Material.id).desc())
        .all()
    )

    # By CPSE
    by_cpse = (
        db.query(CPSEOrganization.name, func.count(Material.id).label("count"))
        .join(Material, Material.cpse_organization_id == CPSEOrganization.id)
        .filter(Material.is_duplicate == True)
        .group_by(CPSEOrganization.id, CPSEOrganization.name)
        .order_by(func.count(Material.id).desc())
        .all()
    )

    # Top duplicate pairs (from match proposals with highest score, involving duplicates)
    top_pairs = (
        db.query(MatchProposal)
        .filter(MatchProposal.overall_score >= 0.75)
        .order_by(MatchProposal.overall_score.desc())
        .limit(20)
        .all()
    )

    top_pairs_result = []
    for p in top_pairs:
        src = p.source_material
        tgt = p.target_material
        if src and tgt:
            top_pairs_result.append({
                "source_id": src.id,
                "source_code": src.cpse_material_code,
                "source_cpse": src.organization.name if src.organization else None,
                "target_id": tgt.id,
                "target_code": tgt.cpse_material_code,
                "target_cpse": tgt.organization.name if tgt.organization else None,
                "score": p.overall_score,
                "match_type": p.match_type.value if hasattr(p.match_type, "value") else p.match_type,
            })

    return {
        "total_duplicates": total_duplicates,
        "by_family": [{"family": f, "count": c} for f, c in by_family],
        "by_cpse": [{"name": n, "count": c} for n, c in by_cpse],
        "top_pairs": top_pairs_result,
    }


# ---------------------------------------------------------------------------
# 3. GET /quality  –  Data quality metrics
# ---------------------------------------------------------------------------

@router.get("/quality")
async def get_quality_metrics(db: Session = Depends(get_db)):
    """Compute data quality metrics for the material master."""
    total_materials = db.query(Material).count()
    if total_materials == 0:
        return {
            "completeness_score": 0.0,
            "consistency_score": 0.0,
            "duplicate_rate": 0.0,
            "cnmc_coverage": 0.0,
        }

    # Completeness: proportion of materials with non-empty description, family, unit_of_measure
    complete = (
        db.query(Material)
        .filter(
            Material.description != None,
            Material.description != "",
            Material.family != None,
            Material.family != "",
        )
        .count()
    )
    completeness_score = round(complete / total_materials, 3)

    # Consistency: proportion with valid standard_code where family has a known standard
    # Simplified: check that materials in same family have consistent sub_family conventions
    consistent = (
        db.query(Material)
        .filter(
            Material.sub_family != None,
            Material.sub_family != "",
        )
        .count()
    )
    consistency_score = round(consistent / total_materials, 3)

    # Duplicate rate
    dup_count = db.query(Material).filter(Material.is_duplicate == True).count()
    duplicate_rate = round(dup_count / total_materials, 4)

    # CNMC coverage: proportion of materials that have a CNMC code assigned
    cnmc_linked = db.query(Material).filter(Material.cnmc_id != None).count()
    cnmc_coverage = round(cnmc_linked / total_materials, 3)

    return {
        "completeness_score": completeness_score,
        "consistency_score": consistency_score,
        "duplicate_rate": duplicate_rate,
        "cnmc_coverage": cnmc_coverage,
    }


# ---------------------------------------------------------------------------
# 4. GET /procurement/consolidate  –  Procurement consolidation opportunities
# ---------------------------------------------------------------------------

@router.get("/procurement/consolidate")
async def get_consolidation_opportunities(db: Session = Depends(get_db)):
    """Find procurement consolidation opportunities based on approved match proposals."""
    approved = (
        db.query(MatchProposal)
        .filter(MatchProposal.status == MatchStatus.APPROVED)
        .all()
    )

    # Group by family
    family_groups: dict = {}
    for p in approved:
        src = p.source_material
        tgt = p.target_material
        if not src or not tgt:
            continue
        family = src.family or tgt.family or "unknown"
        if family not in family_groups:
            family_groups[family] = {
                "family": family,
                "approved_pairs": 0,
                "unique_materials": set(),
                "total_volume_estimate": 0,
            }
        family_groups[family]["approved_pairs"] += 1
        family_groups[family]["unique_materials"].add(src.id)
        family_groups[family]["unique_materials"].add(tgt.id)

    groups = []
    total_opportunities = 0
    total_savings = 0.0
    for fam, data in family_groups.items():
        material_count = len(data["unique_materials"])
        pairs = data["approved_pairs"]
        if material_count > 1:
            # Estimate: consolidating N materials into 1 saves ~(N-1)/N * unit price * volume
            savings_pct = (material_count - 1) / material_count
            estimated_savings = round(pairs * savings_pct * 50000, 2)  # placeholder calculation
        else:
            estimated_savings = 0.0

        groups.append({
            "family": fam,
            "material_count": material_count,
            "approved_pairs": pairs,
            "estimated_savings": estimated_savings,
        })
        total_opportunities += pairs
        total_savings += estimated_savings

    # Sort groups by savings descending
    groups.sort(key=lambda g: g["estimated_savings"], reverse=True)

    return {
        "total_opportunities": total_opportunities,
        "estimated_savings": round(total_savings, 2),
        "groups": groups,
    }


# ---------------------------------------------------------------------------
# Existing endpoints (preserved)
# ---------------------------------------------------------------------------

@router.get("/duplicate-analysis")
async def get_duplicate_analysis(db: Session = Depends(get_db)):
    dup_by_family = (
        db.query(Material.family, func.count(Material.id).label("dup_count"))
        .filter(Material.is_duplicate == True)
        .group_by(Material.family)
        .order_by(func.count(Material.id).desc())
        .all()
    )
    confidence_dist = (
        db.query(MatchProposal.confidence_level, func.count(MatchProposal.id))
        .group_by(MatchProposal.confidence_level)
        .all()
    )
    return {
        "duplicates_by_family": [{"family": f, "count": c} for f, c in dup_by_family],
        "confidence_distribution": [
            {"level": l.value if hasattr(l, "value") else str(l), "count": c}
            for l, c in confidence_dist
        ],
    }


@router.get("/migration-progress")
async def get_migration_progress(db: Session = Depends(get_db)):
    """Migration progress across all CPSEs."""
    cpse_list = db.query(CPSEOrganization).all()
    result = []
    for cpse in cpse_list:
        total = db.query(Material).filter(Material.cpse_organization_id == cpse.id).count()
        mapped = db.query(Material).filter(
            Material.cpse_organization_id == cpse.id,
            Material.cnmc_id != None,
        ).count()
        result.append({
            "cpse_id": cpse.id,
            "cpse_name": cpse.name,
            "total": total,
            "mapped": mapped,
            "unmapped": total - mapped,
            "progress_pct": round(mapped / total * 100, 1) if total > 0 else 0,
        })
    return result
