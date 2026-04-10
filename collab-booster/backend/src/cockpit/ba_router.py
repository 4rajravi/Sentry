"""Business Analyst cockpit API endpoints."""
from pathlib import Path
from datetime import datetime, timedelta, timezone
import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.agents.service import (
    run_code_qa,
    run_code_to_bizdoc,
    run_commit_explainer,
    run_req_to_jira,
)
from src.auth.dependencies import require_role
from src.auth.models import User, UserRole
from src.common.database import get_db
from src.common.redis import get_redis
from src.config import settings
from src.jira.models import JiraTicket, JiraCommit, TicketStatus
from src.jira.schemas import TicketCreate
from src.jira.service import create_ticket, list_tickets
from src.repo.context_service import (
    resolve_runtime_repo_for_user,
    get_or_create_repo_config,
)

router = APIRouter(prefix="/api/ba", tags=["ba-cockpit"])
_require_ba = require_role(UserRole.BUSINESS_ANALYST)


class ChatRequest(BaseModel):
    question: str


class DocGenRequest(BaseModel):
    file_paths: list[str]
    doc_type: str = "feature_summary"
    code_content: str | None = None  # optional snippet
    document_brief: str | None = None  # what to generate and why


class DocToTicketsRequest(BaseModel):
    requirement_doc: str


class BulkCreateRequest(BaseModel):
    tickets: list[dict]
    reporter_id: str | None = None


class ExplainCommitsRequest(BaseModel):
    ticket_id: str


class GoogleStatusResponse(BaseModel):
    connected: bool
    email: str | None = None


class GoogleAuthUrlResponse(BaseModel):
    auth_url: str


class GoogleImportRequest(BaseModel):
    title: str
    content: str


MAX_SELECTED_FILES = 20
MAX_FILE_CHARS = 12000
MAX_TOTAL_CHARS = 60000
GOOGLE_OAUTH_STATE_PREFIX = "ba_google_oauth_state:"
GOOGLE_OAUTH_STATE_TTL_SECONDS = 600


async def _google_refresh_access_token(config) -> str | None:
    if not config.google_refresh_token:
        return None
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "grant_type": "refresh_token",
                "refresh_token": config.google_refresh_token,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if resp.status_code >= 400:
        return None
    payload = resp.json()
    access_token = payload.get("access_token")
    if not access_token:
        return None
    expires_in = int(payload.get("expires_in", 3600))
    config.google_access_token = access_token
    config.google_token_expires_at = datetime.now(timezone.utc) + timedelta(
        seconds=max(expires_in - 30, 60)
    )
    return access_token


async def _google_valid_access_token(config) -> str | None:
    if not settings.google_client_id or not settings.google_client_secret:
        return None
    token = config.google_access_token
    expires = config.google_token_expires_at
    now = datetime.now(timezone.utc)
    if token and (expires is None or expires > now):
        return token
    return await _google_refresh_access_token(config)


async def _google_get_email(access_token: str) -> str | None:
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(
                "https://openidconnect.googleapis.com/v1/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code >= 400:
            return None
        return resp.json().get("email")
    except Exception:
        return None


async def _google_create_doc(access_token: str, title: str, content: str) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        create_resp = await client.post(
            "https://docs.googleapis.com/v1/documents",
            json={"title": title},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if create_resp.status_code >= 400:
            raise HTTPException(
                status_code=400,
                detail=f"Google doc creation failed: {create_resp.text}",
            )
        document_id = create_resp.json().get("documentId")
        if not document_id:
            raise HTTPException(status_code=400, detail="Google doc creation failed: missing documentId")

        update_resp = await client.post(
            f"https://docs.googleapis.com/v1/documents/{document_id}:batchUpdate",
            json={
                "requests": [
                    {
                        "insertText": {
                            "location": {"index": 1},
                            "text": content,
                        }
                    }
                ]
            },
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if update_resp.status_code >= 400:
            raise HTTPException(
                status_code=400,
                detail=f"Google doc update failed: {update_resp.text}",
            )

    return f"https://docs.google.com/document/d/{document_id}/edit"


def _build_doc_input_from_files(repo_path: str, file_paths: list[str]) -> str:
    base = Path(repo_path).resolve()
    selected = file_paths[:MAX_SELECTED_FILES]
    if not selected:
        return ""

    sections: list[str] = []
    total_chars = 0

    for rel in selected:
        clean_rel = (rel or "").strip().replace("\\", "/")
        if not clean_rel:
            continue
        target = (base / clean_rel).resolve()
        if not str(target).startswith(str(base)):
            continue
        if not target.exists() or not target.is_file():
            continue
        try:
            content = target.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        clipped = content[:MAX_FILE_CHARS]
        header = f"### FILE: {clean_rel}\n"
        section = f"{header}```\n{clipped}\n```\n"
        if total_chars + len(section) > MAX_TOTAL_CHARS:
            break
        sections.append(section)
        total_chars += len(section)

    return "\n".join(sections)


@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(_require_ba),
    db: AsyncSession = Depends(get_db),
):
    """Aggregated sprint progress for BA's tickets."""
    tickets = await list_tickets(db, reporter_id=current_user.id)
    status_counts = {s.value: 0 for s in TicketStatus}
    total_points = 0
    done_points = 0

    for t in tickets:
        status_counts[t.status.value] += 1
        pts = t.story_points or 0
        total_points += pts
        if t.status == TicketStatus.DONE:
            done_points += pts

    pct = round(done_points / total_points * 100, 1) if total_points else 0
    return {
        "total_tickets": len(tickets),
        "status_counts": status_counts,
        "total_story_points": total_points,
        "done_story_points": done_points,
        "completion_percentage": pct,
    }


@router.get("/tickets")
async def get_ba_tickets(
    sprint: str | None = None,
    current_user: User = Depends(_require_ba),
    db: AsyncSession = Depends(get_db),
):
    return await list_tickets(db, reporter_id=current_user.id, sprint=sprint)


@router.post("/tickets/{ticket_id}/explain-commits")
async def explain_ticket_commits(
    ticket_id: str,
    current_user: User = Depends(_require_ba),
    db: AsyncSession = Depends(get_db),
):
    """AI explains all commits linked to a ticket in business language."""
    result = await db.execute(
        select(JiraCommit).where(JiraCommit.ticket_id == ticket_id)
    )
    commits = result.scalars().all()

    explanations = []
    for commit in commits:
        explanation = await run_commit_explainer(
            commit_sha=commit.commit_sha,
            commit_message=commit.commit_message,
            files_changed=commit.files_changed or [],
            diff_summary=commit.diff_summary or "",
        )
        explanations.append(explanation)

    return {"ticket_id": ticket_id, "commit_explanations": explanations}


@router.post("/generate-doc")
async def generate_business_doc(
    body: DocGenRequest,
    current_user: User = Depends(_require_ba),
    db: AsyncSession = Depends(get_db),
):
    """Generate a business document from code files."""
    repo_path, _ = await resolve_runtime_repo_for_user(db, current_user.id)
    file_context = _build_doc_input_from_files(repo_path, body.file_paths)
    snippet = (body.code_content or "").strip()
    brief = (body.document_brief or "").strip()

    parts: list[str] = []
    if brief:
        parts.append(f"[Document Brief]\n{brief}")
    if file_context:
        parts.append(f"[Selected Repo Files]\n{file_context}")
    if snippet:
        parts.append(f"[Optional Snippet]\n```\n{snippet}\n```")

    code_content = "\n\n".join(parts).strip()
    if not code_content:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one source: selected file(s), snippet, or document brief.",
        )

    result = await run_code_to_bizdoc(
        code_content=code_content,
        doc_type=body.doc_type,
        user_id=current_user.id,
    )
    return result


@router.get("/google/status", response_model=GoogleStatusResponse)
async def google_status(
    current_user: User = Depends(_require_ba),
    db: AsyncSession = Depends(get_db),
):
    config = await get_or_create_repo_config(db, current_user.id)
    token = await _google_valid_access_token(config)
    if token and not config.google_email:
        config.google_email = await _google_get_email(token)
        await db.flush()
    return GoogleStatusResponse(connected=bool(token), email=config.google_email)


@router.get("/google/login", response_model=GoogleAuthUrlResponse)
async def google_login(
    request: Request,
    current_user: User = Depends(_require_ba),
):
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=400, detail="Google OAuth is not configured on the server")

    state = secrets.token_urlsafe(24)
    redis = await get_redis()
    await redis.setex(
        f"{GOOGLE_OAUTH_STATE_PREFIX}{state}",
        GOOGLE_OAUTH_STATE_TTL_SECONDS,
        current_user.id,
    )

    redirect_uri = str(request.url_for("ba_google_callback"))
    query = urlencode(
        {
            "client_id": settings.google_client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": settings.google_oauth_scope,
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }
    )
    return GoogleAuthUrlResponse(auth_url=f"https://accounts.google.com/o/oauth2/v2/auth?{query}")


@router.get("/google/callback", name="ba_google_callback")
async def ba_google_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    if not code or not state:
        return HTMLResponse("<h3>Google connection failed: missing code/state.</h3>", status_code=400)

    redis = await get_redis()
    state_key = f"{GOOGLE_OAUTH_STATE_PREFIX}{state}"
    user_id = await redis.get(state_key)
    if not user_id:
        return HTMLResponse("<h3>Google connection failed: state expired.</h3>", status_code=400)
    await redis.delete(state_key)

    redirect_uri = str(request.url_for("ba_google_callback"))
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if resp.status_code >= 400:
        return HTMLResponse("<h3>Google connection failed while exchanging code.</h3>", status_code=400)

    payload = resp.json()
    access_token = payload.get("access_token")
    if not access_token:
        return HTMLResponse("<h3>Google connection failed: no access token returned.</h3>", status_code=400)

    config = await get_or_create_repo_config(db, user_id)
    config.google_access_token = access_token
    refresh_token = payload.get("refresh_token")
    if refresh_token:
        config.google_refresh_token = refresh_token
    expires_in = int(payload.get("expires_in", 3600))
    config.google_token_expires_at = datetime.now(timezone.utc) + timedelta(
        seconds=max(expires_in - 30, 60)
    )
    config.google_email = await _google_get_email(access_token)
    await db.flush()

    return HTMLResponse(
        """
        <html>
          <body style=\"font-family: sans-serif; padding: 24px;\">
            <h3>Google connected successfully.</h3>
            <p>You can close this window and return to the app.</p>
            <script>window.close();</script>
          </body>
        </html>
        """
    )


@router.post("/google/import-doc")
async def import_doc_to_google(
    body: GoogleImportRequest,
    current_user: User = Depends(_require_ba),
    db: AsyncSession = Depends(get_db),
):
    title = (body.title or "").strip()
    content = (body.content or "").strip()
    if not title or not content:
        raise HTTPException(status_code=400, detail="Both title and content are required.")

    config = await get_or_create_repo_config(db, current_user.id)
    token = await _google_valid_access_token(config)
    if not token:
        raise HTTPException(status_code=401, detail="Google is not connected. Please connect Google first.")

    doc_url = await _google_create_doc(token, title=title, content=content)
    await db.flush()
    return {"doc_url": doc_url}


@router.post("/doc-to-tickets")
async def doc_to_tickets(
    body: DocToTicketsRequest,
    current_user: User = Depends(_require_ba),
    db: AsyncSession = Depends(get_db),
):
    """Convert a requirement document to Jira ticket proposals."""
    repo_path, repo_id = await resolve_runtime_repo_for_user(db, current_user.id)
    result = await run_req_to_jira(
        requirement_doc=body.requirement_doc,
        user_id=current_user.id,
        repo_path=repo_path,
        repo_id=repo_id,
    )
    return result


@router.post("/tickets/bulk-create")
async def bulk_create_tickets(
    body: BulkCreateRequest,
    current_user: User = Depends(_require_ba),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple approved ticket proposals."""
    created = []
    for t in body.tickets:
        ticket_data = TicketCreate(
            title=t.get("title", ""),
            description=t.get("description", ""),
            ticket_type=t.get("ticket_type", "story"),
            priority=t.get("priority", "medium"),
            story_points=t.get("story_points"),
            reporter_id=body.reporter_id or current_user.id,
            assignee_id=t.get("suggested_assignee"),
            acceptance_criteria="\n".join(t.get("acceptance_criteria", [])),
            affected_files=t.get("affected_files", []),
        )
        ticket = await create_ticket(db, ticket_data)
        created.append({"id": ticket.id, "title": ticket.title})
    return {"created": created}


@router.post("/chat")
async def ba_chat(
    body: ChatRequest,
    current_user: User = Depends(_require_ba),
    db: AsyncSession = Depends(get_db),
):
    """Chat with the codebase in business language."""
    repo_path, repo_id = await resolve_runtime_repo_for_user(db, current_user.id)
    answer = await run_code_qa(
        question=body.question,
        user_role="business_analyst",
        user_id=current_user.id,
        repo_path=repo_path,
        repo_id=repo_id,
    )
    return {"answer": answer}
