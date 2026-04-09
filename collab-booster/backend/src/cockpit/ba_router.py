"""Business Analyst cockpit API endpoints."""
from fastapi import APIRouter, Depends
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
from src.jira.models import JiraTicket, JiraCommit, TicketStatus
from src.jira.schemas import TicketCreate
from src.jira.service import create_ticket, list_tickets

router = APIRouter(prefix="/api/ba", tags=["ba-cockpit"])
_require_ba = require_role(UserRole.BUSINESS_ANALYST)


class ChatRequest(BaseModel):
    question: str


class DocGenRequest(BaseModel):
    file_paths: list[str]
    doc_type: str = "feature_summary"
    code_content: str | None = None  # caller can pass pre-read content


class DocToTicketsRequest(BaseModel):
    requirement_doc: str


class BulkCreateRequest(BaseModel):
    tickets: list[dict]
    reporter_id: str | None = None


class ExplainCommitsRequest(BaseModel):
    ticket_id: str


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
):
    """Generate a business document from code files."""
    code_content = body.code_content or f"Files requested: {', '.join(body.file_paths)}"
    result = await run_code_to_bizdoc(
        code_content=code_content,
        doc_type=body.doc_type,
        user_id=current_user.id,
    )
    return result


@router.post("/doc-to-tickets")
async def doc_to_tickets(
    body: DocToTicketsRequest,
    current_user: User = Depends(_require_ba),
):
    """Convert a requirement document to Jira ticket proposals."""
    result = await run_req_to_jira(
        requirement_doc=body.requirement_doc,
        user_id=current_user.id,
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
):
    """Chat with the codebase in business language."""
    answer = await run_code_qa(
        question=body.question,
        user_role="business_analyst",
        user_id=current_user.id,
    )
    return {"answer": answer}
