"""User model for authentication and authorization."""
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base


class Role(str, PyEnum):
    """User role enumeration."""

    ADMIN = "admin"
    APPROVER = "approver"
    REVIEWER = "reviewer"
    VIEWER = "viewer"


class User(Base):
    """User account model."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), nullable=False)
    full_name = Column(String(100), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(
        Enum(Role, name="Role", native_enum=False, length=20),
        default=Role.VIEWER,
        nullable=False,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    organization_id = Column(Integer, ForeignKey("cpse_organizations.id"), nullable=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    organization = relationship("CPSEOrganization", back_populates="users")

    @classmethod
    def hash_password(cls, password: str) -> str:
        """Hash a plaintext password using bcrypt."""
        import bcrypt

        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    @classmethod
    def verify_password(cls, hashed_password: str, plain_password: str) -> bool:
        """Verify a plaintext password against a stored hash."""
        import bcrypt

        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"), hashed_password.encode("utf-8")
            )
        except (ValueError, TypeError):
            return False

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username}, role={self.role})>"
