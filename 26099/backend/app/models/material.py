"""Material, organization, and CNMC models."""
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base


class CPSEOrganization(Base):
    """CPSE (Central Public Sector Enterprises) organization model."""

    __tablename__ = "cpse_organizations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), unique=True, nullable=False)
    short_code = Column(String(20), unique=True, index=True, nullable=False)
    sector = Column(String(100), nullable=True)
    sap_client = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    materials = relationship(
        "Material", back_populates="organization", cascade="all, delete-orphan"
    )
    users = relationship("User", back_populates="organization")

    def __repr__(self) -> str:
        return f"<CPSEOrganization(id={self.id}, short_code={self.short_code})>"


class CNMCCode(Base):
    """Common National Material Code (CNMC) model."""

    __tablename__ = "cnmc_codes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    segment = Column(String(10), nullable=False)
    sequence = Column(Integer, nullable=False)
    family = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="proposed", nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    materials = relationship("Material", back_populates="cnmc")

    def __repr__(self) -> str:
        return f"<CNMCCode(id={self.id}, code={self.code})>"


class Material(Base):
    """Material master data model."""

    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cpse_organization_id = Column(
        Integer,
        ForeignKey("cpse_organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    cpse_material_code = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    description_normalized = Column(Text, nullable=True)
    family = Column(String(50), nullable=False, index=True)
    sub_family = Column(String(50), nullable=True)
    material_type = Column(String(100), nullable=True)
    grade = Column(String(50), nullable=True)
    standard_code = Column(String(100), nullable=True)
    dimensions = Column(String(100), nullable=True)
    unit_of_measure = Column(String(20), nullable=True)
    cnmc_id = Column(Integer, ForeignKey("cnmc_codes.id"), nullable=True)
    is_duplicate = Column(Boolean, default=False, nullable=False)
    duplicate_of_id = Column(
        Integer, ForeignKey("materials.id", ondelete="SET NULL"), nullable=True
    )
    is_obsolete = Column(Boolean, default=False, nullable=False)
    confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    organization = relationship("CPSEOrganization", back_populates="materials")
    cnmc = relationship("CNMCCode", back_populates="materials")
    attributes = relationship(
        "MaterialAttribute",
        back_populates="material",
        cascade="all, delete-orphan",
    )
    duplicate_of = relationship(
        "Material", remote_side=[id], backref="duplicates"
    )

    def __repr__(self) -> str:
        return (
            f"<Material(id={self.id}, cpse_material_code={self.cpse_material_code})>"
        )


class MaterialAttribute(Base):
    """Material attribute (extended properties) model."""

    __tablename__ = "material_attributes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    material_id = Column(
        Integer,
        ForeignKey("materials.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    attribute_name = Column(String(100), nullable=False)
    attribute_value = Column(String(255), nullable=False)
    attribute_unit = Column(String(50), nullable=True)
    source = Column(String(20), default="cpse", nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    material = relationship("Material", back_populates="attributes")

    def __repr__(self) -> str:
        return (
            f"<MaterialAttribute(id={self.id}, name={self.attribute_name}, "
            f"value={self.attribute_value})>"
        )
