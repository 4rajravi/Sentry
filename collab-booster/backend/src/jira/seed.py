"""Seed the database with demo users and Jira tickets for the loan calculator project."""
import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import User, UserRole
from src.auth.service import hash_password
from src.jira.models import JiraCommit, JiraTicket, TicketPriority, TicketStatus, TicketType


USERS = [
    {
        "id": "ba-sarah-001",
        "username": "ba_sarah",
        "email": "sarah@example.com",
        "full_name": "Sarah Mitchell",
        "password": "demo1234",
        "role": UserRole.BUSINESS_ANALYST,
    },
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
        "id": "dev-bob-004",
        "username": "dev_bob",
        "email": "bob@example.com",
        "full_name": "Bob Müller",
        "password": "demo1234",
        "role": UserRole.DEVELOPER,
    },
    {
        "id": "dev-new-005",
        "username": "dev_newbie",
        "email": "newbie@example.com",
        "full_name": "Chris Neumann",
        "password": "demo1234",
        "role": UserRole.DEVELOPER,
    },
]

TICKETS = [
    # Sprint 1 — Done
    {
        "id": "JIRA-1",
        "title": "Basic loan monthly payment calculator",
        "description": "As a borrower, I want to enter principal, interest rate, and loan term to see my monthly payment amount.",
        "status": TicketStatus.DONE,
        "ticket_type": TicketType.STORY,
        "priority": TicketPriority.HIGH,
        "story_points": 5,
        "sprint": "Sprint 1",
        "assignee_id": "dev-alice-003",
        "reporter_id": "ba-sarah-001",
        "acceptance_criteria": "- Monthly payment calculated correctly\n- Input validation for min/max values\n- Error shown for invalid inputs",
        "affected_files": ["src/calculator.py", "src/models.py"],
    },
    {
        "id": "JIRA-2",
        "title": "Add input validation for loan parameters",
        "description": "As the system, I need to validate that loan parameters are within acceptable ranges.",
        "status": TicketStatus.DONE,
        "ticket_type": TicketType.TASK,
        "priority": TicketPriority.HIGH,
        "story_points": 3,
        "sprint": "Sprint 1",
        "assignee_id": "dev-bob-004",
        "reporter_id": "ba-sarah-001",
        "acceptance_criteria": "- Principal between 1000 and 10,000,000\n- Rate between 0.01% and 100%\n- Term between 1 and 360 months",
        "affected_files": ["src/validators.py"],
    },
    {
        "id": "JIRA-3",
        "title": "Add unit tests for payment calculator",
        "description": "As a developer, I want comprehensive tests to ensure calculation accuracy.",
        "status": TicketStatus.DONE,
        "ticket_type": TicketType.TASK,
        "priority": TicketPriority.MEDIUM,
        "story_points": 3,
        "sprint": "Sprint 1",
        "assignee_id": "dev-alice-003",
        "reporter_id": "ba-sarah-001",
        "acceptance_criteria": "- 90%+ test coverage\n- Edge cases tested\n- All tests pass in CI",
        "affected_files": ["tests/test_calculator.py"],
    },
    # Sprint 2 — Mostly done
    {
        "id": "JIRA-4",
        "title": "Create REST API endpoint for loan calculation",
        "description": "As a frontend developer, I want a REST API endpoint to calculate loan payments.",
        "status": TicketStatus.DONE,
        "ticket_type": TicketType.STORY,
        "priority": TicketPriority.HIGH,
        "story_points": 5,
        "sprint": "Sprint 2",
        "assignee_id": "dev-alice-003",
        "reporter_id": "ba-sarah-001",
        "acceptance_criteria": "- POST /api/loan/calculate endpoint\n- Returns monthly_payment, total_payment, total_interest\n- Swagger docs generated",
        "affected_files": ["src/routes.py", "src/schemas.py"],
    },
    {
        "id": "JIRA-5",
        "title": "Add loan term calculation feature",
        "description": "As a borrower, I want to enter my desired monthly payment to see how many months I need to repay the loan.",
        "status": TicketStatus.IN_PROGRESS,
        "ticket_type": TicketType.STORY,
        "priority": TicketPriority.HIGH,
        "story_points": 5,
        "sprint": "Sprint 3",
        "assignee_id": "dev-alice-003",
        "reporter_id": "ba-sarah-001",
        "acceptance_criteria": "- Formula: n = -log(1 - Pr/M) / log(1+r)\n- Validate M > P*r\n- POST /api/loan/term endpoint\n- Returns term_months and total_cost",
        "affected_files": ["src/calculator.py", "src/routes.py", "tests/test_term_calc.py"],
    },
    {
        "id": "JIRA-6",
        "title": "Add amortization schedule generation",
        "description": "As a borrower, I want to see a month-by-month breakdown of principal vs interest payments.",
        "status": TicketStatus.IN_REVIEW,
        "ticket_type": TicketType.STORY,
        "priority": TicketPriority.MEDIUM,
        "story_points": 8,
        "sprint": "Sprint 3",
        "assignee_id": "dev-bob-004",
        "reporter_id": "ba-tom-002",
        "acceptance_criteria": "- Returns array of {month, principal, interest, balance}\n- Handles floating point correctly\n- Exportable to CSV",
        "affected_files": ["src/calculator.py", "src/schemas.py", "src/routes.py"],
    },
    {
        "id": "JIRA-7",
        "title": "Input validation for loan term calculation",
        "description": "As the system, I need to validate that the desired monthly payment exceeds the monthly interest amount.",
        "status": TicketStatus.TODO,
        "ticket_type": TicketType.TASK,
        "priority": TicketPriority.HIGH,
        "story_points": 3,
        "sprint": "Sprint 3",
        "assignee_id": "dev-alice-003",
        "reporter_id": "ba-sarah-001",
        "acceptance_criteria": "- Reject if M <= P*r (payment too low)\n- Clear error message explaining minimum payment\n- Return 422 with validation details",
        "affected_files": ["src/validators.py", "src/routes.py"],
    },
    {
        "id": "JIRA-8",
        "title": "Add integration tests for loan term endpoint",
        "description": "As a developer, I want integration tests for the loan term calculation endpoint.",
        "status": TicketStatus.TODO,
        "ticket_type": TicketType.TASK,
        "priority": TicketPriority.MEDIUM,
        "story_points": 2,
        "sprint": "Sprint 3",
        "assignee_id": "dev-alice-003",
        "reporter_id": "ba-sarah-001",
        "acceptance_criteria": "- Happy path test\n- Edge case: minimum payment\n- Edge case: 0% interest\n- Validation error tests",
        "affected_files": ["tests/test_routes.py"],
    },
    {
        "id": "JIRA-9",
        "title": "Add compound interest calculation option",
        "description": "As a borrower, I want the option to see calculations with compound interest (daily/monthly/annual).",
        "status": TicketStatus.TODO,
        "ticket_type": TicketType.STORY,
        "priority": TicketPriority.MEDIUM,
        "story_points": 5,
        "sprint": "Sprint 4",
        "assignee_id": "dev-new-005",
        "reporter_id": "ba-tom-002",
        "acceptance_criteria": "- Support daily, monthly, annual compounding\n- Default to monthly\n- Show difference vs simple interest\n- Add compound_frequency param to API",
        "affected_files": ["src/calculator.py", "src/schemas.py"],
    },
    {
        "id": "JIRA-10",
        "title": "Add early repayment calculator",
        "description": "As a borrower, I want to see how much I save by making extra monthly payments.",
        "status": TicketStatus.TODO,
        "ticket_type": TicketType.STORY,
        "priority": TicketPriority.LOW,
        "story_points": 8,
        "sprint": "Sprint 4",
        "assignee_id": "dev-new-005",
        "reporter_id": "ba-tom-002",
        "acceptance_criteria": "- Input: extra monthly payment amount\n- Output: months saved, interest saved\n- Compare with/without extra payment schedule",
        "affected_files": ["src/calculator.py", "src/routes.py", "src/schemas.py"],
    },
]

COMMITS = [
    {
        "ticket_id": "JIRA-1",
        "commit_sha": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
        "commit_message": "feat(JIRA-1): implement basic monthly payment calculation",
        "author": "dev_alice",
        "files_changed": ["src/calculator.py", "src/models.py"],
        "diff_summary": "Added LoanCalculator class with calculate_monthly_payment method using amortization formula",
    },
    {
        "ticket_id": "JIRA-1",
        "commit_sha": "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
        "commit_message": "feat(JIRA-1): add Pydantic models for loan input/output",
        "author": "dev_alice",
        "files_changed": ["src/models.py", "src/schemas.py"],
        "diff_summary": "Added LoanRequest and LoanResponse Pydantic schemas",
    },
    {
        "ticket_id": "JIRA-2",
        "commit_sha": "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
        "commit_message": "feat(JIRA-2): add input validation for loan parameters",
        "author": "dev_bob",
        "files_changed": ["src/validators.py"],
        "diff_summary": "Added LoanValidator class with range checks for principal, rate, and term",
    },
    {
        "ticket_id": "JIRA-4",
        "commit_sha": "d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5",
        "commit_message": "feat(JIRA-4): add POST /api/loan/calculate endpoint",
        "author": "dev_alice",
        "files_changed": ["src/routes.py", "src/main.py"],
        "diff_summary": "Added FastAPI router with calculate endpoint, integrated with LoanCalculator",
    },
    {
        "ticket_id": "JIRA-5",
        "commit_sha": "e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6",
        "commit_message": "feat(JIRA-5): implement loan term calculation formula",
        "author": "dev_alice",
        "files_changed": ["src/calculator.py"],
        "diff_summary": "Added calculate_loan_term method: n = -log(1 - P*r/M) / log(1+r)",
    },
    {
        "ticket_id": "JIRA-5",
        "commit_sha": "f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1",
        "commit_message": "feat(JIRA-5): add POST /api/loan/term API endpoint",
        "author": "dev_alice",
        "files_changed": ["src/routes.py", "src/schemas.py"],
        "diff_summary": "Added LoanTermRequest/Response schemas and term calculation endpoint",
    },
    {
        "ticket_id": "JIRA-6",
        "commit_sha": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6b2b3",
        "commit_message": "feat(JIRA-6): implement amortization schedule generator",
        "author": "dev_bob",
        "files_changed": ["src/calculator.py", "src/schemas.py"],
        "diff_summary": "Added generate_amortization_schedule method returning monthly breakdown",
    },
]


async def seed_database(db: AsyncSession):
    """Idempotent seed — skips existing records."""
    from sqlalchemy import select

    # Seed users
    for u in USERS:
        existing = await db.execute(select(User).where(User.id == u["id"]))
        if existing.scalar_one_or_none():
            continue
        user = User(
            id=u["id"],
            username=u["username"],
            email=u["email"],
            full_name=u["full_name"],
            hashed_password=hash_password(u["password"]),
            role=u["role"],
        )
        db.add(user)

    await db.flush()

    # Seed tickets
    for t in TICKETS:
        existing = await db.execute(select(JiraTicket).where(JiraTicket.id == t["id"]))
        if existing.scalar_one_or_none():
            continue
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
            affected_files=t.get("affected_files", []),
        )
        db.add(ticket)

    await db.flush()

    # Seed commits
    for c in COMMITS:
        existing = await db.execute(
            select(JiraCommit).where(JiraCommit.commit_sha == c["commit_sha"])
        )
        if existing.scalar_one_or_none():
            continue
        commit = JiraCommit(
            ticket_id=c["ticket_id"],
            commit_sha=c["commit_sha"],
            commit_message=c["commit_message"],
            author=c["author"],
            files_changed=c.get("files_changed", []),
            diff_summary=c.get("diff_summary"),
        )
        db.add(commit)

    await db.commit()
