.PHONY: up down backend-test frontend-build ingest seed-git

# Start all services
up:
	docker compose up --build -d

# Stop all services
down:
	docker compose down

# Run backend unit tests
backend-test:
	cd backend && /opt/homebrew/bin/uv run pytest -v

# Build frontend for production
frontend-build:
	cd frontend && npm run build

# Run backend dev server (requires docker for postgres/redis/qdrant)
backend-dev:
	cd backend && /opt/homebrew/bin/uv run uvicorn src.main:app --reload --port 8000

# Run frontend dev server
frontend-dev:
	cd frontend && npm run dev

# Ingest the seed loan calculator repo (requires backend running)
ingest:
	curl -X POST http://localhost:8000/repo/ingest \
	  -H "Content-Type: application/json" \
	  -H "Authorization: Bearer $$(curl -s -X POST http://localhost:8000/auth/login -H 'Content-Type: application/json' -d '{"username":"dev_alice","password":"demo1234"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')" \
	  -d '{"repo_path": "/app/seed-data/loan-calculator"}'

# Seed git history for the loan calculator repo
seed-git:
	cd seed-data/loan-calculator && \
	  git init && \
	  git add . && \
	  git -c user.email="dev_alice@example.com" -c user.name="Alice Schneider" commit -m "feat(JIRA-1): implement basic monthly payment calculation" && \
	  git -c user.email="dev_bob@example.com" -c user.name="Bob Müller" commit --allow-empty -m "feat(JIRA-2): add input validation for loan parameters" && \
	  git -c user.email="dev_alice@example.com" -c user.name="Alice Schneider" commit --allow-empty -m "feat(JIRA-4): add POST /api/loan/calculate endpoint" && \
	  git -c user.email="dev_alice@example.com" -c user.name="Alice Schneider" commit --allow-empty -m "feat(JIRA-5): implement loan term calculation formula" && \
	  git -c user.email="dev_alice@example.com" -c user.name="Alice Schneider" commit --allow-empty -m "feat(JIRA-5): add POST /api/loan/term API endpoint" && \
	  git -c user.email="dev_bob@example.com" -c user.name="Bob Müller" commit --allow-empty -m "feat(JIRA-6): implement amortization schedule generator"
