from src.jira.models import JiraTicket, JiraCommit, TicketStatus, TicketType, TicketPriority


def test_ticket_status_enum():
    assert set(TicketStatus) == {
        TicketStatus.TODO, TicketStatus.IN_PROGRESS,
        TicketStatus.IN_REVIEW, TicketStatus.DONE,
    }


def test_ticket_model_fields():
    fields = {c.name for c in JiraTicket.__table__.columns}
    assert "assignee_id" in fields
    assert "reporter_id" in fields
    assert "story_points" in fields
    assert "acceptance_criteria" in fields
    assert "affected_files" in fields


def test_commit_model_fields():
    fields = {c.name for c in JiraCommit.__table__.columns}
    assert "ticket_id" in fields
    assert "commit_sha" in fields
    assert "author" in fields


def test_ticket_type_values():
    assert TicketType.STORY.value == "story"
    assert TicketType.TASK.value == "task"
    assert TicketType.BUG.value == "bug"


def test_priority_values():
    assert TicketPriority.LOW.value == "low"
    assert TicketPriority.CRITICAL.value == "critical"
