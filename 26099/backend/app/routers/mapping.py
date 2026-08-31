"""CNMC Mapping router."""

import logging
import re
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.material import Material, CNMCCode, CPSEOrganization
from app.schemas.material import CNMCCodeResponse
from app.services.cnmc_generator import CNMCGenerator

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Request/response schemas
# ---------------------------------------------------------------------------

class BatchGenerateRequest(BaseModel):
    material_ids: List[int]


class BatchGenerateResponse(BaseModel):
    total_requested: int
    total_generated: int
    results: List[dict]


class CNMCValidateRequest(BaseModel):
    code: str


# ---------------------------------------------------------------------------
# 1. POST /material/{material_id}/cnmc  –  Generate CNMC for a single material
# ---------------------------------------------------------------------------

@router.post("/material/{material_id}/cnmc", response_model=CNMCCodeResponse)
async def generate_cnmc_for_material(material_id: int, db: Session = Depends(get_db)):
    """Generate a CNMC code for a single material and link it."""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    generator = CNMCGenerator()
    suggested_code = generator.generate_code(material)

    # Check if this code already exists; reuse if present
    existing = db.query(CNMCCode).filter(CNMCCode.code == suggested_code).first()
    if existing:
        cnmc = existing
    else:
        cnmc = CNMCCode(
            code=suggested_code,
            segment=generator.SEGMENT_CODES.get(material.family, "MX"),
            sequence=0,
            family=material.family,
            description=f"Auto-generated CNMC for {material.description[:80]}",
            status="proposed",
        )
        db.add(cnmc)
        db.flush()

    # Link the material to the CNMC code
    material.cnmc_id = cnmc.id
    db.commit()
    db.refresh(cnmc)

    material_count = db.query(Material).filter(Material.cnmc_id == cnmc.id).count()

    return CNMCCodeResponse(
        id=cnmc.id,
        code=cnmc.code,
        segment=cnmc.segment,
        sequence=cnmc.sequence,
        family=cnmc.family,
        description=cnmc.description,
        status=cnmc.status,
        material_count=material_count,
    )


# ---------------------------------------------------------------------------
# 2. POST /cnmc/batch  –  Batch generate CNMC codes
# ---------------------------------------------------------------------------

@router.post("/cnmc/batch", response_model=BatchGenerateResponse)
async def batch_generate_cnmc(req: BatchGenerateRequest, db: Session = Depends(get_db)):
    """Generate CNMC codes for a batch of materials."""
    materials = (
        db.query(Material)
        .filter(Material.id.in_(req.material_ids), Material.is_obsolete == False)
        .all()
    )
    if not materials:
        raise HTTPException(status_code=404, detail="No valid materials found for the given IDs")

    generator = CNMCGenerator()
    batch_results = generator.batch_generate(materials)

    generated_count = 0
    output_results = []
    for i, mat in enumerate(materials):
        suggested_code = batch_results[i]["suggested_cnmc"]
        existing = db.query(CNMCCode).filter(CNMCCode.code == suggested_code).first()
        if existing:
            cnmc = existing
        else:
            cnmc = CNMCCode(
                code=suggested_code,
                segment=generator.SEGMENT_CODES.get(mat.family, "MX"),
                sequence=0,
                family=mat.family,
                description=f"Auto-generated CNMC for {mat.description[:80]}",
                status="proposed",
            )
            db.add(cnmc)
            db.flush()
            generated_count += 1

        # Link material to CNMC
        mat.cnmc_id = cnmc.id
        output_results.append({
            "material_id": mat.id,
            "cpse_material_code": mat.cpse_material_code,
            "cnmc_code": cnmc.code,
        })

    db.commit()

    return BatchGenerateResponse(
        total_requested=len(materials),
        total_generated=generated_count,
        results=output_results,
    )


# ---------------------------------------------------------------------------
# 3. GET /cnmc/{cnmc_code}  –  Lookup CNMC by code
# ---------------------------------------------------------------------------

@router.get("/cnmc/{cnmc_code}", response_model=dict)
async def lookup_cnmc(cnmc_code: str, db: Session = Depends(get_db)):
    """Look up a CNMC code with its linked materials."""
    cnmc = db.query(CNMCCode).filter(CNMCCode.code == cnmc_code).first()
    if not cnmc:
        raise HTTPException(status_code=404, detail="CNMC code not found")

    linked_materials = db.query(Material).filter(Material.cnmc_id == cnmc.id).all()
    return {
        "id": cnmc.id,
        "code": cnmc.code,
        "segment": cnmc.segment,
        "sequence": cnmc.sequence,
        "family": cnmc.family,
        "description": cnmc.description,
        "status": cnmc.status,
        "created_at": cnmc.created_at,
        "materials": [
            {
                "id": m.id,
                "cpse_material_code": m.cpse_material_code,
                "cpse_name": m.organization.name if m.organization else None,
                "description": m.description,
                "family": m.family,
            }
            for m in linked_materials
        ],
    }


# ---------------------------------------------------------------------------
# 4. GET /mapping/cpse/{cpse_code}  –  Get mapping for a CPSE
# ---------------------------------------------------------------------------

@router.get("/mapping/cpse/{cpse_code}", response_model=dict)
async def get_cpse_mapping(cpse_code: str, db: Session = Depends(get_db)):
    """Get materials mapped to CNMC codes for a given CPSE organization."""
    org = db.query(CPSEOrganization).filter(CPSEOrganization.short_code == cpse_code).first()
    if not org:
        raise HTTPException(status_code=404, detail="CPSE organization not found")

    materials = db.query(Material).filter(Material.cpse_organization_id == org.id).all()

    return {
        "cpse_id": org.id,
        "cpse_name": org.name,
        "cpse_code": org.short_code,
        "total_materials": len(materials),
        "mapped_count": sum(1 for m in materials if m.cnmc_id is not None),
        "unmapped_count": sum(1 for m in materials if m.cnmc_id is None),
        "mappings": [
            {
                "material_id": m.id,
                "cpse_material_code": m.cpse_material_code,
                "description": m.description,
                "cnmc_code": m.cnmc.code if m.cnmc else None,
                "cnmc_family": m.cnmc.family if m.cnmc else None,
            }
            for m in materials
        ],
    }


# ---------------------------------------------------------------------------
# 5. POST /cnmc/validate  –  Validate a proposed CNMC code
# ---------------------------------------------------------------------------

@router.post("/cnmc/validate")
async def validate_cnmc(req: CNMCValidateRequest, db: Session = Depends(get_db)):
    """Validate a proposed CNMC code: check format and uniqueness."""
    code = req.code.strip().upper()
    errors: List[str] = []

    # Format check: must match CNMC-{SEGMENT}-{HASH}
    pattern = r"^CNMC-[A-Z]{2,4}-[A-Z0-9]{6,10}$"
    if not re.match(pattern, code):
        errors.append(
            "Invalid format. CNMC code must follow the pattern CNMC-{SEGMENT}-{HASH} "
            "(e.g., CNMC-FA-A1B2C3)"
        )

    # Uniqueness check
    if db.query(CNMCCode).filter(CNMCCode.code == code).first():
        errors.append(f"CNMC code '{code}' already exists.")

    return {
        "code": code,
        "valid": len(errors) == 0,
        "errors": errors,
        "is_unique": len(errors) <= 1,  # only uniqueness error possible if format is OK
    }
