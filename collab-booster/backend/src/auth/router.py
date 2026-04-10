from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_user
from src.auth.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from src.auth.service import authenticate_user, create_access_token, create_user
from src.common.database import get_db
from src.common.exceptions import UnauthorizedError

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, body.username, body.password)
    if not user:
        raise UnauthorizedError("Invalid credentials")
    token = create_access_token(user)
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
    )


@router.get("/me", response_model=UserResponse)
async def me(current_user=Depends(get_current_user)):
    return current_user


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    first_name = (body.first_name or "").strip()
    last_name = (body.last_name or "").strip()
    email = (body.email or "").strip()
    password = body.password or ""
    confirm = body.confirm_password or ""

    if not first_name or not last_name:
        raise HTTPException(status_code=400, detail="First name and last name are required")
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Enter a valid email address")
    if password != confirm:
        raise HTTPException(status_code=400, detail="Password and confirm password must match")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not any(ch.isdigit() for ch in password):
        raise HTTPException(status_code=400, detail="Password must include at least one number")
    if not any(not ch.isalnum() for ch in password):
        raise HTTPException(status_code=400, detail="Password must include at least one special character")

    user = await create_user(
        db,
        first_name=first_name,
        last_name=last_name,
        email=email,
        password=password,
        role=body.role,
    )
    token = create_access_token(user)
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
    )
