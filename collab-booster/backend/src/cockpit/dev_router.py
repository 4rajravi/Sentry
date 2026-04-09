"""Developer cockpit API endpoints."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.agents.service import (
    run_code_qa,
    run_implementation_guidance,
    run_onboarding,
    run_vacation_catchup,
)
from src.auth.dependencies import require_role
from src.auth.models import User, UserRole
from src.common.database import get_db
from src.jira.service import get_ticket, list_tickets

router = APIRouter(prefix="/api/dev", tags=["dev-cockpit"])
_require_dev = require_role(UserRole.DEVELOPER)


class ChatRequest(BaseModel):
    question: str
    ticket_id: str | None = None


class CatchupRequest(BaseModel):
    from_date: str
    to_date: str


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
    guidance = await run_implementation_guidance(ticket_dict, user_id=current_user.id)
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
):
    """Summarize what happened in the project during a date range."""
    result = await run_vacation_catchup(
        from_date=body.from_date,
        to_date=body.to_date,
        user_id=current_user.id,
    )
    return result


@router.post("/onboard")
async def onboarding(current_user: User = Depends(_require_dev)):
    """Generate a personalized onboarding guide for a new developer."""
    result = await run_onboarding(user_id=current_user.id)
    return result


@router.post("/chat")
async def dev_chat(
    body: ChatRequest,
    current_user: User = Depends(_require_dev),
):
    """Chat with the codebase as a developer."""
    question = body.question
    if body.ticket_id:
        question = f"[Context: Working on ticket {body.ticket_id}] {question}"
    answer = await run_code_qa(
        question=question,
        user_role="developer",
        user_id=current_user.id,
    )
    return {"answer": answer}
