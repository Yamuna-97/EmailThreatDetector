from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: Optional[str] = "Security Analyst"

class SignInRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: Literal["user", "investigator", "admin"] = "user"
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: Optional[int] = 3600
    user: UserResponse

class MessageResponse(BaseModel):
    message: str
    success: bool = True
