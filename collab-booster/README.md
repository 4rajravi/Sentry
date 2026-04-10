# AI Collaboration Booster

AI Collaboration Booster is a role-based platform that helps Business Analysts and Developers collaborate on real codebases using AI.

It connects requirements, tickets, commits, repository context, and documentation in one workflow.

## What It Does

- Role-based workspaces for:
  - Business Analyst
  - Developer
- Repository ingestion from GitHub (public/private with OAuth)
- Hybrid RAG (`Qdrant` + `BM25`) for code-aware answers
- AI-assisted flows:
  - Chat with codebase
  - Requirements -> ticket drafts
  - Ticket implementation guidance
  - Commit explanation
  - Onboarding and timeline brief
  - Code-to-business document generation
- Google Docs import for generated documents / TRS

## Architecture

- Frontend: `Next.js`, `React`, `TypeScript`, `Tailwind`
- Backend: `Python`, `FastAPI`, `Pydantic`, `SQLAlchemy`
- AI Orchestration: `LangChain`, `LangGraph`
- Retrieval:
  - Dense vectors: `Qdrant`
  - Sparse keywords: `BM25`
  - Fusion: `RRF`
- Data stores:
  - `PostgreSQL` for users, tickets, commit mappings, user repo config
  - `Redis` for OAuth state and short-lived flow context

## Quick Start

### 1) Configure environment

Create/update `.env` in project root:

```env
OPENAI_API_KEY=your_openai_key

JWT_SECRET=dev-secret-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=480

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_SCOPE=openid email https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file
```

### 2) Run with Docker

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

### 3) Login / Signup

- Use demo login cards on the login page, or
- Create a new account from **Sign up**.

## OAuth Setup

### GitHub OAuth (private repos)

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:8000/repo/github/callback`

### Google OAuth (Docs import)

- Authorized JavaScript origin: `http://localhost:3000`
- Authorized redirect URI: `http://localhost:8000/api/ba/google/callback`

## Core User Flows

1. Login/signup and choose role workspace
2. Add and ingest repository
3. Query or run workflows (chat, tickets, onboarding, docs, commit explain)
4. Retrieve grounded context with hybrid search
5. Generate actionable outputs and optionally publish docs to Google Docs

## Notes

- Active repo context is per user.
- Indexed content is scoped by `user_id` + `repo_id`.
- Cloned repositories and index state are cleaned up on logout/shutdown flows configured in backend.

## License

MIT (or your preferred license)
