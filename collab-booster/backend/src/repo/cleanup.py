import logging
import os
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.repo.indexer import clear_repo_chunks
from src.repo.models import UserRepoConfig

logger = logging.getLogger(__name__)

CLONE_PREFIX = "collab_booster_repo_"
CLONE_BASE_DIR = Path(os.environ.get("REPO_CLONE_BASE", "/tmp/collab_booster_repos")).resolve()


def _is_managed_clone_path(path: str | None) -> bool:
    if not path:
        return False
    try:
        resolved = Path(path).resolve()
    except Exception:
        return False
    return (
        resolved.exists()
        and resolved.is_dir()
        and resolved.name.startswith(CLONE_PREFIX)
        and CLONE_BASE_DIR in resolved.parents
    )


def _delete_clone_dir(path: str | None) -> None:
    if not _is_managed_clone_path(path):
        return
    try:
        target = Path(path).resolve()
        for item in sorted(target.rglob("*"), reverse=True):
            if item.is_file() or item.is_symlink():
                item.unlink(missing_ok=True)
            elif item.is_dir():
                item.rmdir()
        target.rmdir()
    except Exception as e:
        logger.warning("Failed to delete cloned repo path %s: %s", path, e)


async def cleanup_repo_for_user(
    db: AsyncSession,
    *,
    user_id: str,
    clear_github_token: bool = False,
) -> bool:
    result = await db.execute(select(UserRepoConfig).where(UserRepoConfig.user_id == user_id))
    config = result.scalar_one_or_none()
    if config is None:
        return False

    had_active_repo = bool(config.active_repo_id)
    if config.active_repo_id:
        await clear_repo_chunks(user_id=user_id, repo_id=config.active_repo_id)

    _delete_clone_dir(config.active_repo_path)

    config.active_repo_id = None
    config.active_repo_url = None
    config.active_repo_path = None
    if clear_github_token:
        config.github_access_token = None
    await db.flush()
    return had_active_repo


async def cleanup_all_repo_state(db: AsyncSession) -> bool:
    result = await db.execute(select(UserRepoConfig))
    configs = result.scalars().all()
    had_active_repo = False

    for config in configs:
        if config.active_repo_id:
            had_active_repo = True
            await clear_repo_chunks(user_id=config.user_id, repo_id=config.active_repo_id)
        _delete_clone_dir(config.active_repo_path)
        config.active_repo_id = None
        config.active_repo_url = None
        config.active_repo_path = None
        config.github_access_token = None

    await db.flush()
    return had_active_repo
