import os
import secrets
from pathlib import Path
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from openai import AuthenticationError, RateLimitError
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.common.database import get_db
from src.common.redis import get_redis
from src.config import settings
from src.repo.cleanup import cleanup_repo_for_user
from src.repo.cloner import clone_repo
from src.repo.context_service import build_repo_id, get_or_create_repo_config
from src.repo.schemas import (
    FileTreeNode,
    GitHubAuthUrlResponse,
    IngestRequest,
    IngestResponse,
    RepoContextResponse,
)
from src.repo.service import ingest_repo
from src.search.service import rebuild_bm25_from_qdrant

router = APIRouter(prefix="/repo", tags=["repo"])

OAUTH_STATE_PREFIX = "repo_github_oauth_state:"
OAUTH_STATE_TTL_SECONDS = 600


async def _fetch_github_username(access_token: str | None) -> str | None:
    if not access_token:
        return None
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            user_resp = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            )
            if user_resp.status_code >= 400:
                return None
            return user_resp.json().get("login")
    except Exception:
        return None


@router.get("/current", response_model=RepoContextResponse)
async def get_repo_context(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    config = await get_or_create_repo_config(db, current_user.id)
    github_username = await _fetch_github_username(config.github_access_token)
    return RepoContextResponse(
        github_connected=bool(config.github_access_token),
        github_username=github_username,
        active_repo_id=config.active_repo_id,
        active_repo_url=config.active_repo_url,
        active_repo_path=config.active_repo_path,
    )


@router.get("/github/login", response_model=GitHubAuthUrlResponse)
async def github_login(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    if not settings.github_client_id or not settings.github_client_secret:
        raise HTTPException(
            status_code=400,
            detail="GitHub OAuth is not configured on the server",
        )

    state = secrets.token_urlsafe(24)
    redis = await get_redis()
    await redis.setex(f"{OAUTH_STATE_PREFIX}{state}", OAUTH_STATE_TTL_SECONDS, current_user.id)

    redirect_uri = str(request.url_for("github_callback"))
    query = urlencode(
        {
            "client_id": settings.github_client_id,
            "redirect_uri": redirect_uri,
            "scope": settings.github_oauth_scope,
            "state": state,
        }
    )
    auth_url = f"https://github.com/login/oauth/authorize?{query}"
    return GitHubAuthUrlResponse(auth_url=auth_url)


@router.get("/github/callback", name="github_callback")
async def github_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    if not code or not state:
        return HTMLResponse("<h3>GitHub connection failed: missing code/state.</h3>", status_code=400)

    redis = await get_redis()
    state_key = f"{OAUTH_STATE_PREFIX}{state}"
    user_id = await redis.get(state_key)
    if not user_id:
        return HTMLResponse("<h3>GitHub connection failed: state expired.</h3>", status_code=400)
    await redis.delete(state_key)

    redirect_uri = str(request.url_for("github_callback"))

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
                "state": state,
            },
            headers={"Accept": "application/json"},
        )

    if resp.status_code >= 400:
        return HTMLResponse("<h3>GitHub connection failed while exchanging code.</h3>", status_code=400)

    payload = resp.json()
    access_token = payload.get("access_token")
    if not access_token:
        return HTMLResponse("<h3>GitHub connection failed: no access token returned.</h3>", status_code=400)

    config = await get_or_create_repo_config(db, user_id)
    config.github_access_token = access_token
    await db.flush()

    return HTMLResponse(
        """
        <html>
          <body style=\"font-family: sans-serif; padding: 24px;\">
            <h3>GitHub connected successfully.</h3>
            <p>You can close this window and return to the app.</p>
            <script>window.close();</script>
          </body>
        </html>
        """
    )


@router.post("/github/logout")
async def github_logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    had_active_repo = await cleanup_repo_for_user(
        db,
        user_id=current_user.id,
        clear_github_token=True,
    )
    if had_active_repo:
        await rebuild_bm25_from_qdrant()
    return {"ok": True}


@router.post("/session/logout")
async def session_logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    had_active_repo = await cleanup_repo_for_user(
        db,
        user_id=current_user.id,
        clear_github_token=True,
    )
    if had_active_repo:
        await rebuild_bm25_from_qdrant()
    return {"ok": True}


@router.post("/ingest", response_model=IngestResponse)
async def ingest(
    body: IngestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    config = await get_or_create_repo_config(db, current_user.id)

    resolved_repo_url: str | None = None

    if body.repo_path:
        path = body.repo_path
        if not Path(path).exists():
            raise HTTPException(status_code=400, detail=f"repo_path does not exist: {path}")
        repo_source = body.repo_path
    elif body.repo_url:
        if body.private_repo and not config.github_access_token:
            raise HTTPException(
                status_code=400,
                detail="Private repo requested. Connect GitHub first.",
            )
        try:
            path = clone_repo(body.repo_url, access_token=config.github_access_token)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to clone repo: {e}")
        resolved_repo_url = body.repo_url
        repo_source = body.repo_url
    elif config.active_repo_path and Path(config.active_repo_path).exists():
        path = config.active_repo_path
        resolved_repo_url = config.active_repo_url
        repo_source = config.active_repo_url or config.active_repo_path
    else:
        raise HTTPException(
            status_code=412,
            detail="No active repository. Provide repo_url/repo_path to ingest.",
        )

    repo_id = build_repo_id(repo_source)

    try:
        result = await ingest_repo(
            path,
            user_id=current_user.id,
            repo_id=repo_id,
            repo_url=resolved_repo_url,
        )
    except AuthenticationError:
        raise HTTPException(
            status_code=400,
            detail="OpenAI API key is invalid. Update OPENAI_API_KEY in backend env.",
        )
    except RateLimitError as e:
        raise HTTPException(
            status_code=429,
            detail=f"OpenAI rate limit reached during ingestion: {e}",
        )

    config.active_repo_id = repo_id
    config.active_repo_url = resolved_repo_url
    config.active_repo_path = path
    await db.flush()

    return IngestResponse(
        **result,
        active_repo_id=repo_id,
        active_repo_url=resolved_repo_url,
    )


@router.get("/tree", response_model=list[FileTreeNode])
async def get_file_tree(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    config = await get_or_create_repo_config(db, current_user.id)
    if not config.active_repo_path or not Path(config.active_repo_path).exists():
        raise HTTPException(
            status_code=412,
            detail="No active repository. Add and ingest a Git repository first.",
        )
    root = config.active_repo_path
    return _build_tree(root, root)


def _build_tree(base: str, path: str) -> list[FileTreeNode]:
    ignored = {".git", "node_modules", "__pycache__", ".venv", "venv"}
    nodes = []
    try:
        entries = sorted(os.listdir(path))
    except Exception:
        return []

    for entry in entries:
        if entry.startswith(".") or entry in ignored:
            continue
        full = os.path.join(path, entry)
        rel = os.path.relpath(full, base)
        if os.path.isdir(full):
            nodes.append(
                FileTreeNode(
                    name=entry,
                    path=rel,
                    type="dir",
                    children=_build_tree(base, full),
                )
            )
        else:
            nodes.append(FileTreeNode(name=entry, path=rel, type="file"))
    return nodes
