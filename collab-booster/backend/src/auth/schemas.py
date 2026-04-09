from pydantic import BaseModel

from src.auth.models import UserRole


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: str
    full_name: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: UserRole

    model_config = {"from_attributes": True}
