from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.common.database import get_db
from src.common.exceptions import NotFoundError
from src.jira.schemas import TicketCreate, TicketResponse, TicketUpdate
from src.jira.service import create_ticket, get_ticket, list_tickets, update_ticket

router = APIRouter(prefix="/jira", tags=["jira"])


@router.get("/tickets", response_model=list[TicketResponse])
async def get_tickets(
    reporter_id: str | None = None,
    assignee_id: str | None = None,
    sprint: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    return await list_tickets(db, reporter_id=reporter_id, assignee_id=assignee_id, sprint=sprint)


@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
async def get_ticket_detail(ticket_id: str, db: AsyncSession = Depends(get_db)):
    ticket = await get_ticket(db, ticket_id)
    if not ticket:
        raise NotFoundError(f"Ticket {ticket_id} not found")
    return ticket


@router.post("/tickets", response_model=TicketResponse)
async def create_new_ticket(body: TicketCreate, db: AsyncSession = Depends(get_db)):
    return await create_ticket(db, body)


@router.patch("/tickets/{ticket_id}", response_model=TicketResponse)
async def update_ticket_status(
    ticket_id: str, body: TicketUpdate, db: AsyncSession = Depends(get_db)
):
    ticket = await update_ticket(db, ticket_id, body)
    if not ticket:
        raise NotFoundError(f"Ticket {ticket_id} not found")
    return ticket
