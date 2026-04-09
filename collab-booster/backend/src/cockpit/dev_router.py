"""Developer cockpit API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.agents.service import (
    run_commit_explainer,
    run_code_qa,
    run_implementation_guidance,
    run_onboarding,
    run_vacation_catchup,
)
from src.auth.dependencies import require_role
from src.auth.models import User, UserRole
from src.common.database import get_db
from src.jira.models import JiraCommit
from src.jira.service import get_ticket, list_tickets
from src.repo.cloner import get_commit_details, list_repo_commits
from src.repo.context_service import resolve_runtime_repo_for_user

router = APIRouter(prefix="/api/dev", tags=["dev-cockpit"])
_require_dev = require_role(UserRole.DEVELOPER)


class ChatRequest(BaseModel):
    question: str
    ticket_id: str | None = None


class CatchupRequest(BaseModel):
    from_date: str
    to_date: str


class CommitListItem(BaseModel):
    sha: str
    short_sha: str
    message: str
    author: str
    date: str | None = None
    files_changed: list[str]
    files_changed_count: int
    jira_ticket_id: str = "--"


class CommitDetailResponse(BaseModel):
    sha: str
    short_sha: str
    message: str
    author: str
    date: str | None = None
    parent_sha: str | None = None
    files_changed: list[str]
    files_changed_count: int
    patch: str
    jira_ticket_id: str = "--"


@router.get("/tickets")
async def get_dev_tickets(
    sprint: str | None = None,
    current_user: User = Depends(_require_dev),
    db: AsyncSession = Depends(get_db),
):
    """Tickets assigned to this developer."""
    return await list_tickets(db, assignee_id=current_user.id, sprint=sprint)


@router.get("/tickets/{ticket_id}/context")
async def get_ticket_implementation_context(
    ticket_id: str,
    current_user: User = Depends(_require_dev),
    db: AsyncSession = Depends(get_db),
):
    """AI-generated implementation guidance for a ticket."""
    ticket = await get_ticket(db, ticket_id)
    if not ticket:
        return {"error": f"Ticket {ticket_id} not found"}

    ticket_dict = {
        "id": ticket.id,
        "title": ticket.title,
        "description": ticket.description,
        "acceptance_criteria": ticket.acceptance_criteria,
        "affected_files": ticket.affected_files,
    }
    repo_path, repo_id = await resolve_runtime_repo_for_user(db, current_user.id)
    guidance = await run_implementation_guidance(
        ticket_dict,
        user_id=current_user.id,
        repo_path=repo_path,
        repo_id=repo_id,
    )
    return {"ticket_id": ticket_id, "guidance": guidance}


@router.get("/tickets/{ticket_id}/commits")
async def get_ticket_commits(
    ticket_id: str,
    current_user: User = Depends(_require_dev),
    db: AsyncSession = Depends(get_db),
):
    ticket = await get_ticket(db, ticket_id)
    if not ticket:
        return {"commits": []}
    return {"ticket_id": ticket_id, "commits": ticket.commits}


@router.post("/catchup")
async def vacation_catchup(
    body: CatchupRequest,
    current_user: User = Depends(_require_dev),
    db: AsyncSession = Depends(get_db),
):
    """Summarize what happened in the project during a date range."""
    repo_path, repo_id = await resolve_runtime_repo_for_user(db, current_user.id)
    result = await run_vacation_catchup(
        from_date=body.from_date,
        to_date=body.to_date,
        user_id=current_user.id,
        repo_path=repo_path,
        repo_id=repo_id,
    )
    return result


@router.post("/onboard")
async def onboarding(
    current_user: User = Depends(_require_dev),
    db: AsyncSession = Depends(get_db),
):
    """Generate a personalized onboarding guide for a new developer."""
    repo_path, repo_id = await resolve_runtime_repo_for_user(db, current_user.id)
    result = await run_onboarding(user_id=current_user.id, repo_path=repo_path, repo_id=repo_id)
    return result


@router.get("/commits", response_model=list[CommitListItem])
async def list_developer_commits(
    q: str | None = None,
    file_path: str | None = None,
    limit: int = 200,
    current_user: User = Depends(_require_dev),
    db: AsyncSession = Depends(get_db),
):
    repo_path, _ = await resolve_runtime_repo_for_user(db, current_user.id)
    safe_limit = min(max(limit, 1), 500)
    try:
        commits = list_repo_commits(
            repo_path,
            max_count=safe_limit,
            query=q,
            file_path=file_path,
        )
        shas = [c["sha"] for c in commits]
        mapping: dict[str, str] = {}
        if shas:
            rows = await db.execute(
                select(JiraCommit.commit_sha, JiraCommit.ticket_id).where(JiraCommit.commit_sha.in_(shas))
            )
            mapping = {sha: ticket_id for sha, ticket_id in rows.all()}

        for c in commits:
            c["jira_ticket_id"] = mapping.get(c["sha"], "--")
        return commits
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to load commits: {e}")


@router.get("/commits/{commit_sha}", response_model=CommitDetailResponse)
async def get_developer_commit_detail(
    commit_sha: str,
    current_user: User = Depends(_require_dev),
    db: AsyncSession = Depends(get_db),
):
    repo_path, _ = await resolve_runtime_repo_for_user(db, current_user.id)
    try:
        commit = get_commit_details(repo_path, commit_sha)
        row = await db.execute(
            select(JiraCommit.ticket_id).where(JiraCommit.commit_sha == commit["sha"])
        )
        commit["jira_ticket_id"] = row.scalar_one_or_none() or "--"
        return commit
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Commit not found: {e}")


@router.post("/commits/{commit_sha}/explain")
async def explain_developer_commit(
    commit_sha: str,
    current_user: User = Depends(_require_dev),
    db: AsyncSession = Depends(get_db),
):
    repo_path, _ = await resolve_runtime_repo_for_user(db, current_user.id)
    try:
        commit = get_commit_details(repo_path, commit_sha)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Commit not found: {e}")

    explanation = await run_commit_explainer(
        commit_sha=commit["sha"],
        commit_message=commit["message"],
        files_changed=commit["files_changed"],
        diff_summary=(commit["patch"] or "")[:4000],
    )
    row = await db.execute(
        select(JiraCommit.ticket_id).where(JiraCommit.commit_sha == commit["sha"])
    )
    commit["jira_ticket_id"] = row.scalar_one_or_none() or "--"
    return {"commit": commit, "explanation": explanation}


@router.post("/chat")
async def dev_chat(
    body: ChatRequest,
    current_user: User = Depends(_require_dev),
    db: AsyncSession = Depends(get_db),
):
    """Chat with the codebase as a developer."""
    question = body.question
    if body.ticket_id:
        question = f"[Context: Working on ticket {body.ticket_id}] {question}"
    repo_path, repo_id = await resolve_runtime_repo_for_user(db, current_user.id)
    answer = await run_code_qa(
        question=question,
        user_role="developer",
        user_id=current_user.id,
        repo_path=repo_path,
        repo_id=repo_id,
    )
    return {"answer": answer}
