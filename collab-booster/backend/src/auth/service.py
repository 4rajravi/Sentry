from datetime import datetime, timedelta
import re
import uuid

import bcrypt
from jose import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import User, UserRole
from src.common.exceptions import ConflictError
from src.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user: User) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": user.id,
        "username": user.username,
        "role": user.role.value,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


async def authenticate_user(db: AsyncSession, username: str, password: str) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def _is_valid_password(password: str) -> bool:
    # Minimum 8 chars, at least one number and one special char.
    if len(password or "") < 8:
        return False
    if re.search(r"\d", password) is None:
        return False
    if re.search(r"[^A-Za-z0-9]", password) is None:
        return False
    return True


async def create_user(
    db: AsyncSession,
    *,
    first_name: str,
    last_name: str,
    email: str,
    password: str,
    role: UserRole,
) -> User:
    clean_first = first_name.strip()
    clean_last = last_name.strip()
    clean_email = email.strip().lower()

    existing_email = await db.execute(select(User).where(User.email == clean_email))
    if existing_email.scalar_one_or_none() is not None:
        raise ConflictError("An account with this email already exists")

    base_username = re.sub(r"[^a-z0-9_]+", "_", clean_email.split("@")[0].lower()).strip("_") or "user"
    username = base_username
    suffix = 1
    while True:
        existing_user = await db.execute(select(User).where(User.username == username))
        if existing_user.scalar_one_or_none() is None:
            break
        suffix += 1
        username = f"{base_username}{suffix}"

    user = User(
        id=str(uuid.uuid4()),
        username=username,
        email=clean_email,
        full_name=f"{clean_first} {clean_last}".strip(),
        hashed_password=hash_password(password),
        role=role,
    )
    db.add(user)
    await db.flush()
    return user
