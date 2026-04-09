"""Pydantic structured output models for agents."""
from pydantic import BaseModel, Field


class CommitExplanation(BaseModel):
    commit_sha: str
    business_summary: str = Field(description="Plain English explanation for non-technical stakeholders")
    impact: str = Field(description="What business functionality was affected")
    files_changed: list[str] = []


class JiraTicketProposal(BaseModel):
    title: str
    description: str = Field(description="User story format: As a [role], I want [action], so that [benefit]")
    acceptance_criteria: list[str] = Field(description="Concrete, testable acceptance criteria")
    story_points: int = Field(ge=1, le=13)
    ticket_type: str = "story"
    priority: str = "medium"
    suggested_assignee: str | None = None
    affected_files: list[str] = []


class JiraTicketProposalList(BaseModel):
    tickets: list[JiraTicketProposal]


class BusinessDocument(BaseModel):
    title: str
    doc_type: str
    content: str = Field(description="Full document content in Markdown. No code blocks.")
    key_business_rules: list[str]
    stakeholder_summary: str = Field(max_length=500)


class ProgressReport(BaseModel):
    total_tickets: int
    done: int
    in_progress: int
    in_review: int
    todo: int
    completion_percentage: float
    velocity_pts_per_week: float | None = None
    estimated_completion_days: int | None = None
    summary: str


class CatchupSummary(BaseModel):
    period: str
    completed_work: list[str]
    in_progress_work: list[str]
    new_tickets_assigned: list[str]
    key_code_changes: list[str]
    narrative: str


class OnboardingKeyFile(BaseModel):
    path: str
    purpose: str


class OnboardingCommitSummary(BaseModel):
    commit_id: str
    summary: str
    date: str | None = None
    author: str | None = None


class OnboardingGuide(BaseModel):
    project_overview: str
    architecture_summary: str
    key_files: list[OnboardingKeyFile]
    recent_commits: list[OnboardingCommitSummary]
    getting_started_steps: list[str]
    assigned_tickets_guidance: str
    recommended_reading_order: list[str]


class ImplementationGuidance(BaseModel):
    ticket_id: str
    what_to_implement: list[str]
    technical_hints: list[str]
    relevant_files: list[str]
    formula_or_algorithm: str | None = None
    checklist: list[str]
