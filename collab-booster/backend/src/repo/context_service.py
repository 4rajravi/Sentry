import hashlib
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.common.exceptions import PreconditionRequiredError
from src.repo.models import UserRepoConfig


def build_repo_id(source: str) -> str:
    return hashlib.sha1(source.encode("utf-8")).hexdigest()[:16]


async def get_or_create_repo_config(db: AsyncSession, user_id: str) -> UserRepoConfig:
    result = await db.execute(select(UserRepoConfig).where(UserRepoConfig.user_id == user_id))
    config = result.scalar_one_or_none()
    if config is not None:
        return config

    config = UserRepoConfig(user_id=user_id)
    db.add(config)
    await db.flush()
    return config


async def resolve_runtime_repo_for_user(db: AsyncSession, user_id: str) -> tuple[str, str]:
    config = await get_or_create_repo_config(db, user_id)

    active_path = config.active_repo_path
    active_repo_id = config.active_repo_id

    if active_path and Path(active_path).exists() and active_repo_id:
        return active_path, active_repo_id

    raise PreconditionRequiredError(
        "No active repository. Add and ingest a Git repository first."
    )
