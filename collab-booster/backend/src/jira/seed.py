"""Seed the database with Jira-like demo data from a fixed sheet."""
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import User, UserRole
from src.auth.service import hash_password
from src.jira.models import JiraCommit, JiraTicket, TicketPriority, TicketStatus, TicketType


TRS_DOC_LINK = "https://docs.google.com/document/d/10uBYL5MLkUvjHnA8DsRA-fW5SGudp1Sz4xuINywsGOo/edit?tab=t.0"

USERS = [
    {
        "id": "ba-tom-002",
        "username": "ba_tom",
        "email": "tom@example.com",
        "full_name": "Tom Weber",
        "password": "demo1234",
        "role": UserRole.BUSINESS_ANALYST,
    },
    {
        "id": "dev-alice-003",
        "username": "dev_alice",
        "email": "alice@example.com",
        "full_name": "Alice Schneider",
        "password": "demo1234",
        "role": UserRole.DEVELOPER,
    },
    {
        "id": "dev-peter-004",
        "username": "dev_peter",
        "email": "peter@example.com",
        "full_name": "Peter Dund",
        "password": "demo1234",
        "role": UserRole.DEVELOPER,
    },
    {
        "id": "dev-skleinke-005",
        "username": "skleinke",
        "email": "skleinke@example.com",
        "full_name": "S. Kleinke",
        "password": "demo1234",
        "role": UserRole.DEVELOPER,
    },
]

TICKETS = [
    {
        "id": "JIRA-101",
        "title": "Testing flow cleanup and comment removal",
        "description": (
            "Task description: improve calculator test quality and remove unnecessary comments. "
            "This mirrors the TRS testing section and cleanup acceptance."
        ),
        "status": TicketStatus.DONE,
        "ticket_type": TicketType.TASK,
        "priority": TicketPriority.HIGH,
        "story_points": 5,
        "sprint": "Sprint 1",
        "assignee_id": "dev-skleinke-005",
        "reporter_id": "ba-tom-002",
        "technical_doc_link": TRS_DOC_LINK,
        "acceptance_criteria": (
            "- Tests pass for core calculator flows\n"
            "- Unnecessary comments are removed\n"
            "- Repo baseline files are cleaned"
        ),
        "affected_files": ["tests/test_calculator.py", ".gitignore"],
    },
    {
        "id": "JIRA-102",
        "title": "Calculator logic update and baseline docs sync",
        "description": (
            "Task description: update calculator implementation and align baseline docs/files. "
            "Last two legacy commits are grouped here instead of separate tasks."
        ),
        "status": TicketStatus.DONE,
        "ticket_type": TicketType.STORY,
        "priority": TicketPriority.HIGH,
        "story_points": 8,
        "sprint": "Sprint 1",
        "assignee_id": "dev-peter-004",
        "reporter_id": "ba-tom-002",
        "technical_doc_link": TRS_DOC_LINK,
        "acceptance_criteria": (
            "- Calculator implementation updated\n"
            "- README and base calculator file changes linked to same task\n"
            "- Change log traceable to commit IDs"
        ),
        "affected_files": ["calculator.py", "README.md"],
    },
    {
        "id": "JIRA-103",
        "title": "Add loan term calculation feature",
        "description": (
            "As a borrower, I want to enter my target monthly payment and get the "
            "estimated repayment duration so I can plan my finances."
        ),
        "status": TicketStatus.TODO,
        "ticket_type": TicketType.STORY,
        "priority": TicketPriority.HIGH,
        "story_points": 5,
        "sprint": "Sprint 2",
        "assignee_id": "dev-alice-003",
        "reporter_id": "ba-tom-002",
        "technical_doc_link": TRS_DOC_LINK,
        "acceptance_criteria": (
            "- Add loan term calculation based on principal, interest rate, and target monthly payment\n"
            "- Validate target payment is greater than monthly interest portion\n"
            "- Return estimated months and total repayment amount\n"
            "- Add tests for normal case and invalid payment edge case"
        ),
        "affected_files": ["calculator.py", "tests/test_calculator.py", "README.md"],
    },
]

COMMITS = [
    {
        "ticket_id": "JIRA-101",
        "commit_sha": "503622062f6cab824397d7aa01bb04f8127ee1c6",
        "commit_message": "Merge pull request #3 from skleinke/Delete_Comments Update test_calculator.py by deleting unnecessary comments",
        "author": "skleinke",
        "files_changed": ["tests/test_calculator.py"],
        "diff_summary": "Merged cleanup changes removing unnecessary comments in test_calculator.py",
    },
    {
        "ticket_id": "JIRA-101",
        "commit_sha": "842f7b516daee453aa180c56bd0d1498683cab00",
        "commit_message": "Update test_calculator.py",
        "author": "skleinke",
        "files_changed": ["tests/test_calculator.py"],
        "diff_summary": "Updated calculator tests.",
    },
    {
        "ticket_id": "JIRA-101",
        "commit_sha": "dd35bec856508c92b616d4a6631013d3b97d7c37",
        "commit_message": "Merge pull request #2 from skleinke/testing-feature Added feature for testing the calculator",
        "author": "skleinke",
        "files_changed": ["tests/test_calculator.py"],
        "diff_summary": "Merged testing feature branch.",
    },
    {
        "ticket_id": "JIRA-101",
        "commit_sha": "db28722821159f8cbbac3754ba0f86106b8238f1",
        "commit_message": "Added gitignore file",
        "author": "skleinke",
        "files_changed": [".gitignore"],
        "diff_summary": "Added ignore rules.",
    },
    {
        "ticket_id": "JIRA-101",
        "commit_sha": "f9b7b68095aa6ade5c6e255693f95f4751383b4d",
        "commit_message": "Added feature for testing the calculator",
        "author": "skleinke",
        "files_changed": ["tests/test_calculator.py"],
        "diff_summary": "Introduced testing feature changes.",
    },
    {
        "ticket_id": "JIRA-101",
        "commit_sha": "6c423f9080b8ac49e461602aedb77a87ee0c6ab0",
        "commit_message": "Initial commit",
        "author": "skleinke",
        "files_changed": ["README.md", "calculator.py"],
        "diff_summary": "Initial repository setup.",
    },
    {
        "ticket_id": "JIRA-102",
        "commit_sha": "ed702f9d08943e32d689ba9b1c1a1de76c4ca377",
        "commit_message": "Update calculator.py",
        "author": "peterdund",
        "files_changed": ["calculator.py"],
        "diff_summary": "Updated calculator logic.",
    },
    {
        "ticket_id": "JIRA-102",
        "commit_sha": "5ebb8b265d1f38507ede13c167ea6f11b3ce66fb",
        "commit_message": "Update README.md",
        "author": "peterdund",
        "files_changed": ["README.md"],
        "diff_summary": "README updates grouped under same task.",
    },
    {
        "ticket_id": "JIRA-102",
        "commit_sha": "87b038bfa655c0d2c5b455c29e2d1139d603a669",
        "commit_message": "Create calculator.py creates the initial calculator",
        "author": "peterdund",
        "files_changed": ["calculator.py"],
        "diff_summary": "Initial calculator creation grouped under same task.",
    },
]


async def seed_database(db: AsyncSession):
    """Deterministic seed based on a fixed Jira-mimic sheet."""
    # Upsert users.
    for u in USERS:
        existing = await db.execute(select(User).where(User.id == u["id"]))
        user = existing.scalar_one_or_none()
        if user is None:
            user = User(
                id=u["id"],
                username=u["username"],
                email=u["email"],
                full_name=u["full_name"],
                hashed_password=hash_password(u["password"]),
                role=u["role"],
            )
            db.add(user)
        else:
            user.username = u["username"]
            user.email = u["email"]
            user.full_name = u["full_name"]
            user.role = u["role"]

    await db.flush()

    # Replace Jira tickets/commits with sheet values.
    await db.execute(delete(JiraCommit))
    await db.execute(delete(JiraTicket))
    await db.flush()

    for t in TICKETS:
        ticket = JiraTicket(
            id=t["id"],
            title=t["title"],
            description=t["description"],
            status=t["status"],
            ticket_type=t["ticket_type"],
            priority=t["priority"],
            story_points=t.get("story_points"),
            sprint=t.get("sprint"),
            assignee_id=t.get("assignee_id"),
            reporter_id=t["reporter_id"],
            acceptance_criteria=t.get("acceptance_criteria"),
            technical_doc_link=t.get("technical_doc_link"),
            affected_files=t.get("affected_files", []),
        )
        db.add(ticket)

    await db.flush()

    for c in COMMITS:
        commit = JiraCommit(
            ticket_id=c["ticket_id"],
            commit_sha=c["commit_sha"],
            commit_message=c["commit_message"],
            author=c["author"],
            files_changed=c.get("files_changed", []),
            diff_summary=c.get("diff_summary"),
        )
        db.add(commit)

    await db.flush()
