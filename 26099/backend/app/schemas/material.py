"""Pydantic schemas for material-related endpoints."""

from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel


class CPSEOrganizationCreate(BaseModel):
    name: str
    short_code: str
    sector: Optional[str] = None
    sap_client: Optional[str] = None


class CPSEOrganizationResponse(BaseModel):
    id: int
    name: str
    short_code: str
    sector: Optional[str]
    material_count: int = 0

    class Config:
        from_attributes = True


class MaterialCreate(BaseModel):
    cpse_organization_id: int
    cpse_material_code: str
    description: str
    family: str
    sub_family: Optional[str] = None
    material_type: Optional[str] = None
    grade: Optional[str] = None
    standard_code: Optional[str] = None
    dimensions: Optional[str] = None
    unit_of_measure: Optional[str] = None
    unspsc_code: Optional[str] = None
    bis_code: Optional[str] = None
    specifications: Optional[dict] = None


class MaterialResponse(BaseModel):
    id: int
    cpse_organization_id: int
    cpse_material_code: str
    description: str
    description_normalized: Optional[str]
    family: str
    sub_family: Optional[str]
    material_type: Optional[str]
    grade: Optional[str]
    standard_code: Optional[str]
    dimensions: Optional[str]
    unit_of_measure: Optional[str]
    cnmc_code: Optional[str] = None
    confidence_score: Optional[float]
    is_duplicate: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MaterialDetail(MaterialResponse):
    attributes: List[Dict] = []
    organization_name: Optional[str] = None


class MaterialAttributeCreate(BaseModel):
    material_id: int
    attribute_name: str
    attribute_value: str
    attribute_unit: Optional[str] = None
    source: str = "cpse"


class MaterialAttributeResponse(BaseModel):
    id: int
    attribute_name: str
    attribute_value: str
    attribute_unit: Optional[str]
    source: str

    class Config:
        from_attributes = True


class BatchImportRequest(BaseModel):
    cpse_organization_id: int
    materials: List[MaterialCreate]


class BatchImportResponse(BaseModel):
    total_submitted: int
    total_imported: int
    total_skipped: int
    errors: List[str] = []


class MaterialListResponse(BaseModel):
    materials: List["MaterialResponse"]
    total: int
    page: int
    page_size: int


class CNMCCodeCreate(BaseModel):
    code: str
    segment: str
    sequence: int
    family: str
    description: str


class CNMCCodeResponse(BaseModel):
    id: int
    code: str
    segment: str
    sequence: int
    family: str
    description: str
    status: str
    material_count: int = 0

    class Config:
        from_attributes = True
