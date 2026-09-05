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

class SendOtpRequest(BaseModel):
    email: EmailStr
    password: Optional[str] = Field(None, min_length=6)
    full_name: Optional[str] = "Security Analyst"

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit verification OTP code")

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit reset OTP code")
    new_password: str = Field(..., min_length=6, description="New password must be at least 6 characters")

class ResendOtpRequest(BaseModel):
    email: EmailStr
    purpose: Literal["signup", "forgot_password"] = "signup"

class OtpResponse(BaseModel):
    message: str
    success: bool = True
    email: str
    dev_otp: Optional[str] = None

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
