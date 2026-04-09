import enum
from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.common.database import Base


class TicketStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"


class TicketType(str, enum.Enum):
    STORY = "story"
    TASK = "task"
    BUG = "bug"


class TicketPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class JiraTicket(Base):
    __tablename__ = "jira_tickets"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[TicketStatus] = mapped_column(SAEnum(TicketStatus), default=TicketStatus.TODO)
    ticket_type: Mapped[TicketType] = mapped_column(SAEnum(TicketType))
    priority: Mapped[TicketPriority] = mapped_column(SAEnum(TicketPriority))
    story_points: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sprint: Mapped[str | None] = mapped_column(String(50), nullable=True)
    assignee_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    reporter_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    acceptance_criteria: Mapped[str | None] = mapped_column(Text, nullable=True)
    technical_doc_link: Mapped[str | None] = mapped_column(Text, nullable=True)
    affected_files: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    commits: Mapped[list["JiraCommit"]] = relationship(back_populates="ticket")


class JiraCommit(Base):
    __tablename__ = "jira_commits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticket_id: Mapped[str] = mapped_column(ForeignKey("jira_tickets.id"), index=True)
    commit_sha: Mapped[str] = mapped_column(String(40))
    commit_message: Mapped[str] = mapped_column(Text)
    author: Mapped[str] = mapped_column(String(100))
    files_changed: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    diff_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ticket: Mapped["JiraTicket"] = relationship(back_populates="commits")
