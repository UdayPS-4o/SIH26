"""CNMC Code schemas."""

from pydantic import BaseModel
from typing import Optional


class CNMCCodeBase(BaseModel):
    code: str
    segment: str
    family: str
    description: str


class CNMCCodeCreate(CNMCCodeBase):
    pass


class CNMCCodeResponse(CNMCCodeBase):
    id: int
    sequence: int
    status: str
    material_count: int = 0
    created_at: str

    class Config:
        from_attributes = True


class CNMCGenerationLogCreate(BaseModel):
    material_id: int
    cnmc_code_id: int
    generation_method: str
    generation_params: dict


class CNMCGenerationLogResponse(BaseModel):
    id: int
    material_id: int
    cnmc_code_id: int
    generation_method: str
    created_at: str

    class Config:
        from_attributes = True
