import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.auth.models import User
from src.jira.models import JiraCommit, JiraTicket, TicketStatus
from src.jira.schemas import TicketCreate, TicketUpdate

DEFAULT_TRS_DOC_LINK = "https://docs.google.com/document/d/10uBYL5MLkUvjHnA8DsRA-fW5SGudp1Sz4xuINywsGOo/edit?tab=t.0"


async def get_ticket(db: AsyncSession, ticket_id: str) -> JiraTicket | None:
    result = await db.execute(
        select(JiraTicket)
        .options(selectinload(JiraTicket.commits))
        .where(JiraTicket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()
    if ticket and ticket.assignee_id:
        assignee = await db.execute(select(User).where(User.id == ticket.assignee_id))
        user = assignee.scalar_one_or_none()
        setattr(ticket, "assignee_name", user.full_name if user else None)
    else:
        setattr(ticket, "assignee_name", None)
    return ticket


async def list_tickets(
    db: AsyncSession,
    reporter_id: str | None = None,
    assignee_id: str | None = None,
    sprint: str | None = None,
    status: TicketStatus | None = None,
) -> list[JiraTicket]:
    q = select(JiraTicket).options(selectinload(JiraTicket.commits))
    if reporter_id:
        q = q.where(JiraTicket.reporter_id == reporter_id)
    if assignee_id:
        q = q.where(JiraTicket.assignee_id == assignee_id)
    if sprint:
        q = q.where(JiraTicket.sprint == sprint)
    if status:
        q = q.where(JiraTicket.status == status)
    result = await db.execute(q.order_by(JiraTicket.created_at))
    return list(result.scalars().all())


async def create_ticket(db: AsyncSession, data: TicketCreate) -> JiraTicket:
    # Auto-generate ID if not provided
    if not data.id:
        result = await db.execute(select(JiraTicket.id))
        max_num = 0
        for raw_id in result.scalars().all():
            if not raw_id:
                continue
            match = re.match(r"^JIRA-(\d+)$", str(raw_id).strip(), flags=re.IGNORECASE)
            if not match:
                continue
            max_num = max(max_num, int(match.group(1)))
        data.id = f"JIRA-{max_num + 1}"

    ticket = JiraTicket(
        id=data.id,
        title=data.title,
        description=data.description,
        status=data.status,
        ticket_type=data.ticket_type,
        priority=data.priority,
        story_points=data.story_points,
        sprint=data.sprint,
        assignee_id=data.assignee_id,
        reporter_id=data.reporter_id,
        acceptance_criteria=data.acceptance_criteria,
        technical_doc_link=data.technical_doc_link or DEFAULT_TRS_DOC_LINK,
        affected_files=data.affected_files,
        due_date=data.due_date,
    )
    db.add(ticket)
    await db.flush()
    await db.refresh(ticket)
    return ticket


async def update_ticket(db: AsyncSession, ticket_id: str, data: TicketUpdate) -> JiraTicket | None:
    ticket = await get_ticket(db, ticket_id)
    if not ticket:
        return None
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(ticket, field, value)
    await db.flush()
    return ticket


async def add_commit_to_ticket(
    db: AsyncSession,
    ticket_id: str,
    commit_sha: str,
    commit_message: str,
    author: str,
    files_changed: list[str] | None = None,
    diff_summary: str | None = None,
) -> JiraCommit:
    commit = JiraCommit(
        ticket_id=ticket_id,
        commit_sha=commit_sha,
        commit_message=commit_message,
        author=author,
        files_changed=files_changed,
        diff_summary=diff_summary,
    )
    db.add(commit)
    await db.flush()
    return commit
