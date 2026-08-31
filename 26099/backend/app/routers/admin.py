"""Admin router for CPSE management, seed data, audit logs, and legacy migration."""

import logging
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.material import CPSEOrganization, Material, MaterialAttribute
from app.models.matching import MatchProposal, MatchStatus
from app.models.audit import AuditLog
from app.schemas.material import (
    CPSEOrganizationCreate,
    CPSEOrganizationResponse,
)
from app.routers.auth import require_admin, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Request/response schemas
# ---------------------------------------------------------------------------

class SeedDemoRequest(BaseModel):
    count: int = 20


class LegacyMigrationRequest(BaseModel):
    source_system: str
    materials: List[dict]


class MigrationReport(BaseModel):
    total_received: int
    valid_count: int
    invalid_count: int
    errors: List[str]
    match_suggestions: List[dict]


# ---------------------------------------------------------------------------
# Helper: write audit log entries
# ---------------------------------------------------------------------------

def _write_audit(
    db: Session,
    entity_type: str,
    entity_id: int,
    action: str,
    user_id: Optional[int],
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    change_summary: str = "",
):
    entry = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        old_values=old_value,
        new_values=new_value,
        change_summary=change_summary or action,
        user_id=str(user_id) if user_id is not None else None,
    )
    db.add(entry)
    db.flush()


def _get_matching_engine():
    """Lazily create a MatchingEngine instance (avoids heavy import at startup)."""
    from app.services.matching_engine import MatchingEngine
    return MatchingEngine()


# ---------------------------------------------------------------------------
# 1. POST /organizations  –  Add CPSE organization
# ---------------------------------------------------------------------------

@router.post("/organizations", response_model=CPSEOrganizationResponse)
async def create_organization(
    org_data: CPSEOrganizationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Register a new CPSE organization (admin only)."""
    existing = db.query(CPSEOrganization).filter(
        CPSEOrganization.short_code == org_data.short_code
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Organization with this short_code already exists")

    org = CPSEOrganization(**org_data.model_dump())
    db.add(org)
    db.commit()
    db.refresh(org)

    _write_audit(db, "cpse_organization", org.id, "create", current_user.id,
                 new_value=org.name)
    db.commit()

    return CPSEOrganizationResponse(
        id=org.id, name=org.name, short_code=org.short_code,
        sector=org.sector, material_count=0,
    )


# ---------------------------------------------------------------------------
# 2. GET /organizations  –  List all organizations
# ---------------------------------------------------------------------------

@router.get("/organizations", response_model=List[CPSEOrganizationResponse])
async def list_organizations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List all CPSE organizations."""
    orgs = db.query(CPSEOrganization).all()
    return [
        CPSEOrganizationResponse(
            id=o.id, name=o.name, short_code=o.short_code,
            sector=o.sector, material_count=len(o.materials),
        )
        for o in orgs
    ]


# ---------------------------------------------------------------------------
# 3. PUT /organizations/{org_id}  –  Update organization
# ---------------------------------------------------------------------------

@router.put("/organizations/{org_id}", response_model=CPSEOrganizationResponse)
async def update_organization(
    org_id: int,
    org_data: CPSEOrganizationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Update a CPSE organization (admin only)."""
    org = db.query(CPSEOrganization).filter(CPSEOrganization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    old_snapshot = f"{org.name}|{org.short_code}|{org.sector}|{org.sap_client}|{org.is_active}"

    for field, value in org_data.model_dump().items():
        setattr(org, field, value)

    db.commit()
    db.refresh(org)

    new_snapshot = f"{org.name}|{org.short_code}|{org.sector}|{org.sap_client}|{org.is_active}"
    _write_audit(db, "cpse_organization", org.id, "update", current_user.id,
                 old_value=old_snapshot, new_value=new_snapshot)
    db.commit()

    return CPSEOrganizationResponse(
        id=org.id, name=org.name, short_code=org.short_code,
        sector=org.sector, material_count=len(org.materials),
    )


# ---------------------------------------------------------------------------
# 4. POST /seed-demo  –  Seed demo data for the app
# ---------------------------------------------------------------------------

@router.post("/seed-demo")
async def seed_demo_data(
    req: SeedDemoRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Create demo CPSE organizations and sample materials for demonstration."""
    count = max(1, min(req.count, 100))  # clamp 1..100

    demo_orgs_data = [
        {"name": "Demo CPSE Alpha", "short_code": "DEMO-A", "sector": "Oil & Gas", "sap_client": "DEMO_A"},
        {"name": "Demo CPSE Beta", "short_code": "DEMO-B", "sector": "Power", "sap_client": "DEMO_B"},
        {"name": "Demo CPSE Gamma", "short_code": "DEMO-G", "sector": "Steel", "sap_client": "DEMO_G"},
    ]

    created_orgs: List[CPSEOrganization] = []
    for org_data in demo_orgs_data:
        existing = db.query(CPSEOrganization).filter(
            CPSEOrganization.short_code == org_data["short_code"]
        ).first()
        if existing:
            created_orgs.append(existing)
        else:
            org = CPSEOrganization(**org_data)
            db.add(org)
            db.flush()
            created_orgs.append(org)

    families = [
        "fasteners", "pipes_tubes", "valves_fittings", "hydraulics_lubricants",
        "bearings", "electrical", "instruments", "structural_steel", "welding",
        "safety_ppe", "pumps_comp", "chemicals", "packaging", "miscellaneous",
    ]

    sample_descriptions = [
        "Hex Bolt M10x50 Grade 8.8 Zinc Plated",
        "Carbon Steel Pipe SCH40 100NBx6M",
        "Gate Valve DN150 PN16 Flanged",
        "Hydraulic Oil ISO VG 46 200L Drum",
        "Deep Groove Ball Bearing 6205-2RS",
        "XLPE Power Cable 3Cx70 Sqmm",
        "Pressure Gauge 0-10 Bar 100mm Dial",
        "MS Angle 50x50x6mm 6M",
        "ERW Electrode E6013 3.15mm",
        "Safety Helmet White ISI Marked",
        "Centrifugal Pump 10HP SS316",
        "Grease Lithium EP2 180kg",
        "GI Sheet 22SWG 1x2M",
        "PVC Pipe 25NBx3M",
        "Thermowell Assembly SS304",
        "Anchor Bolt M24x500",
        "Copper Tube 15NBx5M",
        "Butterfly Valve DN200 Wafer Type",
        "Cable Gland 32mm Brass",
        "Gasket Spiral Wound 150NB",
    ]

    materials_created = 0
    for i in range(count):
        org = created_orgs[i % len(created_orgs)]
        desc = sample_descriptions[i % len(sample_descriptions)]
        family = families[i % len(families)]
        material = Material(
            cpse_organization_id=org.id,
            cpse_material_code=f"{org.short_code}-MAT-{i + 1:04d}",
            description=f"{desc} - {org.short_code}",
            description_normalized=desc.lower(),
            family=family,
            sub_family=f"sub_{family}",
            material_type="standard",
            grade="GR-A" if i % 3 == 0 else "GR-B",
            unit_of_measure="NOS" if i % 2 == 0 else "MTR",
            confidence_score=round(0.7 + (i % 30) / 100, 2),
        )
        db.add(material)
        materials_created += 1

    db.commit()

    _write_audit(db, "seed_demo", 0, "seed_demo", current_user.id,
                 change_summary=f"Seeded {len(created_orgs)} orgs, {materials_created} materials")
    db.commit()

    return {
        "message": "Demo data seeded successfully",
        "organizations_created": len(created_orgs),
        "materials_created": materials_created,
    }


# ---------------------------------------------------------------------------
# 5. GET /audit-log  –  View audit logs
# ---------------------------------------------------------------------------

@router.get("/audit-log")
async def get_audit_log(
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    action: Optional[str] = Query(None, description="Filter by action"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """View audit logs with optional filters."""
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": log.id,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "action": log.action,
            "old_values": log.old_values,
            "new_values": log.new_values,
            "change_summary": log.change_summary,
            "user_id": log.user_id,
            "created_at": log.created_at,
        }
        for log in logs
    ]


# ---------------------------------------------------------------------------
# 6. POST /migrate/legacy  –  Simulate legacy migration
# ---------------------------------------------------------------------------

@router.post("/migrate/legacy", response_model=MigrationReport)
async def simulate_legacy_migration(
    req: LegacyMigrationRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Simulate legacy system migration with match suggestions."""
    errors: List[str] = []
    valid_materials = []
    invalid_count = 0

    required_fields = {"description", "family"}
    for idx, mat in enumerate(req.materials):
        missing = required_fields - set(mat.keys())
        if missing:
            errors.append(f"Row {idx + 1}: missing required fields {missing}")
            invalid_count += 1
            continue
        if not mat.get("description"):
            errors.append(f"Row {idx + 1}: description is empty")
            invalid_count += 1
            continue
        valid_materials.append(mat)

    # Match suggestions against existing materials
    all_existing = db.query(Material).filter(Material.is_obsolete == False).all()
    match_suggestions: List[dict] = []
    if all_existing and valid_materials:
        engine = _get_matching_engine()
        for mat in valid_materials:
            class FakeMat:
                pass

            fake = FakeMat()
            fake.id = mat.get("id", 0)
            fake.description = mat.get("description", "")
            fake.family = mat.get("family", "miscellaneous")
            fake.material_type = mat.get("material_type")
            fake.grade = mat.get("grade")
            fake.unit_of_measure = mat.get("unit_of_measure")

            results = engine.run_pipeline([fake], all_existing, threshold=0.6, top_k=3)
            for r in results:
                match_suggestions.append({
                    "legacy_material": mat.get("description"),
                    "suggested_match_id": r["target_material_id"],
                    "score": r["overall_score"],
                    "match_type": r["match_type"],
                    "confidence": r["confidence_level"],
                })

    report = MigrationReport(
        total_received=len(req.materials),
        valid_count=len(valid_materials),
        invalid_count=invalid_count,
        errors=errors,
        match_suggestions=match_suggestions[:50],
    )

    _write_audit(db, "legacy_migration", 0, "migrate", current_user.id,
                 change_summary=f"Migrated {len(req.materials)} records from {req.source_system}")
    db.commit()

    return report
