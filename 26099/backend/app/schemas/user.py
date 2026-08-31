"""Pydantic schemas for authentication."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[dict] = None

    @classmethod
    def create(cls, access_token: str, user_obj=None):
        user_dict = None
        if user_obj is not None:
            user_dict = user_obj.model_dump() if hasattr(user_obj, 'model_dump') else dict(user_obj)
        return cls(access_token=access_token, user=user_dict)


class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: str = "viewer"
    organization_id: Optional[int] = None


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = ""
    role: str
    is_active: bool

    class Config:
        from_attributes = True
