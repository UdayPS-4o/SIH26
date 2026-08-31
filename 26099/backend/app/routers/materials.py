"""Materials router."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database import get_db
from app.models.material import Material, CPSEOrganization
from app.models.matching import MatchProposal
from app.schemas import MaterialCreate, MaterialResponse, MaterialListResponse
from app.routers.auth import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/families")
async def get_families(db: Session = Depends(get_db)):
    families = db.query(Material.family, func.count(Material.id).label("count")).group_by(Material.family).order_by(desc("count")).all()
    return [{"family": f[0], "count": c} for f, c in families]


@router.get("/", response_model=MaterialListResponse)
async def list_materials(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    family: str | None = None,
    organization: str | None = None,
    is_duplicate: bool | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Material).join(CPSEOrganization, Material.cpse_organization_id == CPSEOrganization.id, isouter=True)
    if family:
        q = q.filter(Material.family == family)
    if organization:
        q = q.filter(CPSEOrganization.short_code == organization)
    if is_duplicate is not None:
        q = q.filter(Material.is_duplicate == is_duplicate)
    if search:
        q = q.filter(Material.description.ilike(f"%{search}%") | Material.cpse_material_code.ilike(f"%{search}%"))
    total = q.count()
    materials = q.offset(skip).limit(limit).all()
    return {"materials": materials, "total": total, "page": skip // limit + 1, "page_size": limit}


@router.get("/{material_id}", response_model=MaterialResponse)
async def get_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(Material).get(material_id)
    if not material:
        raise HTTPException(404, "Material not found")
    return material


@router.post("/")
async def create_material(data: MaterialCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    material = Material(**data.model_dump())
    db.add(material)
    db.commit()
    db.refresh(material)
    return material
