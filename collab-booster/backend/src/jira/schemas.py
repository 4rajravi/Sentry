from datetime import datetime

from pydantic import BaseModel

from src.jira.models import TicketPriority, TicketStatus, TicketType


class CommitResponse(BaseModel):
    id: int
    ticket_id: str
    commit_sha: str
    commit_message: str
    author: str
    files_changed: list[str] | None = None
    diff_summary: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TicketResponse(BaseModel):
    id: str
    title: str
    description: str
    status: TicketStatus
    ticket_type: TicketType
    priority: TicketPriority
    story_points: int | None = None
    sprint: str | None = None
    assignee_id: str | None = None
    assignee_name: str | None = None
    reporter_id: str
    acceptance_criteria: str | None = None
    technical_doc_link: str | None = None
    affected_files: list[str] | None = None
    due_date: datetime | None = None
    created_at: datetime
    updated_at: datetime
    commits: list[CommitResponse] = []

    model_config = {"from_attributes": True}


class TicketCreate(BaseModel):
    id: str | None = None
    title: str
    description: str
    ticket_type: TicketType = TicketType.STORY
    priority: TicketPriority = TicketPriority.MEDIUM
    story_points: int | None = None
    sprint: str | None = None
    assignee_id: str | None = None
    reporter_id: str
    acceptance_criteria: str | None = None
    technical_doc_link: str | None = None
    affected_files: list[str] | None = None


class TicketUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    story_points: int | None = None
    sprint: str | None = None
    assignee_id: str | None = None
    acceptance_criteria: str | None = None
    technical_doc_link: str | None = None
