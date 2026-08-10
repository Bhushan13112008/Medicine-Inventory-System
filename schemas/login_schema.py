from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)

    id: UUID
    name: str
    email: EmailStr
    password: str

class CreateAccount(BaseModel):
    name: str
    email: EmailStr
    password: str

class RequestOTP(BaseModel):
    email: EmailStr

class ReturnPasswordRequest(BaseModel):
    email: EmailStr
    otp: str    
    new_password: str

class Updatepassword(BaseModel):
    email: EmailStr
    current_password: str
    new_password: str

class DeleteAccount(BaseModel):
    email: EmailStr
    otp: str

class DeleteOTPRequest(BaseModel):
    email: EmailStr

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"