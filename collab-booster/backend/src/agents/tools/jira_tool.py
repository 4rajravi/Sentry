"""Jira mock tools for LangChain agents."""
from langchain_core.tools import tool
from sqlalchemy import select

from src.common.database import AsyncSessionLocal
from src.jira.models import JiraTicket, TicketStatus


@tool
async def jira_query(
    assignee_id: str | None = None,
    reporter_id: str | None = None,
    sprint: str | None = None,
    status: str | None = None,
) -> str:
    """Query Jira tickets from the mock database.

    Args:
        assignee_id: Filter by assignee user ID
        reporter_id: Filter by reporter user ID
        sprint: Filter by sprint name (e.g. 'Sprint 3')
        status: Filter by status: 'todo', 'in_progress', 'in_review', 'done'
    """
    async with AsyncSessionLocal() as db:
        q = select(JiraTicket)
        if assignee_id:
            q = q.where(JiraTicket.assignee_id == assignee_id)
        if reporter_id:
            q = q.where(JiraTicket.reporter_id == reporter_id)
        if sprint:
            q = q.where(JiraTicket.sprint == sprint)
        if status:
            q = q.where(JiraTicket.status == TicketStatus(status))

        result = await db.execute(q)
        tickets = result.scalars().all()

    if not tickets:
        return "No tickets found matching the criteria."

    lines = []
    for t in tickets:
        lines.append(
            f"{t.id}: [{t.status.value.upper()}] {t.title} "
            f"(assignee={t.assignee_id}, points={t.story_points}, sprint={t.sprint})"
        )
    return "\n".join(lines)


@tool
async def jira_get_ticket(ticket_id: str) -> str:
    """Get full details of a specific Jira ticket.

    Args:
        ticket_id: The ticket ID (e.g. 'JIRA-5')
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(JiraTicket).where(JiraTicket.id == ticket_id))
        ticket = result.scalar_one_or_none()

    if not ticket:
        return f"Ticket {ticket_id} not found."

    return (
        f"ID: {ticket.id}\n"
        f"Title: {ticket.title}\n"
        f"Status: {ticket.status.value}\n"
        f"Type: {ticket.ticket_type.value}\n"
        f"Priority: {ticket.priority.value}\n"
        f"Story Points: {ticket.story_points}\n"
        f"Sprint: {ticket.sprint}\n"
        f"Assignee: {ticket.assignee_id}\n"
        f"Reporter: {ticket.reporter_id}\n"
        f"Description:\n{ticket.description}\n"
        f"Acceptance Criteria:\n{ticket.acceptance_criteria or 'N/A'}\n"
        f"Affected Files: {ticket.affected_files or []}"
    )
