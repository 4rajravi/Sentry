# AI Collaboration Booster

AI Collaboration Booster is a role-based AI platform for Business Analysts and Developers working on real software projects.

It connects requirements, tickets, commits, repository context, and business documentation into one workflow, so teams can move faster without losing technical or business understanding during handoffs.

The platform is built around a simple idea: business users and developers need different interfaces, but they should work from the same grounded source of truth. AI Collaboration Booster gives both roles access to the same repository-aware intelligence layer while tailoring outputs to what each person actually needs.

## Overview

In many teams, business context and engineering context drift apart quickly.

A requirement document gets written in business language, then translated into tickets. Developers implement changes through commits and code. Stakeholders want to understand progress, but they cannot easily read diffs or browse code. New developers need time to understand architecture, patterns, and assigned work. Meanwhile, critical project knowledge is spread across repositories, tickets, commits, notes, and people’s memory.

AI Collaboration Booster is designed to close that gap.

It allows Business Analysts to ask questions about a codebase in business language, generate documentation from code context, explain commits without technical jargon, and convert requirement documents into structured ticket proposals. It also allows Developers to chat with the codebase, receive ticket-specific implementation guidance, generate onboarding guides, review commit history, and create timeline-based catch-up summaries after time away from the project.

The system uses hybrid retrieval over the active repository so that responses are grounded in actual files, code chunks, and commit history instead of generic LLM guesses.

## Key Goals

- Reduce business-to-engineering handoff friction
- Ground AI outputs in real repository context
- Convert requirements into implementation-ready work items
- Convert commits and code changes into stakeholder-friendly explanations
- Improve onboarding speed for developers
- Help both roles operate on the same project context without using the same language or interface

## Main User Roles

### Business Analyst

The Business Analyst workspace is designed for non-technical or semi-technical users who need to understand software delivery from a product or process perspective.

A Business Analyst can:

- connect and ingest a project repository
- ask business-language questions about the codebase
- generate ticket drafts from requirement documents
- review and bulk-create ticket proposals
- monitor sprint and ticket progress
- generate business documents from code and selected files
- explain commits in business-friendly language
- export generated documents to Google Docs

### Developer

The Developer workspace is designed for engineers who need actionable, code-aware support while working in the repository.

A Developer can:

- connect and work against the active repository
- chat with the codebase using technical questions
- receive ticket-specific implementation guidance
- browse assigned tickets
- inspect commits and full diffs
- explain commits with AI
- generate personalized onboarding summaries
- generate catch-up summaries for a selected time range

## Feature Set

## Repository Ingestion and Context

The platform supports repository-aware workflows as the foundation of the product.

Features include:

- ingesting a repository from a local path
- ingesting a repository from a GitHub URL
- optional support for private repositories via GitHub OAuth
- per-user active repository context
- repository tree browsing
- repository chunking for search and retrieval
- cleanup of cloned repository state during logout or shutdown flows

Repository context is scoped by user and repository, so outputs are not generated from a shared global index.

## Hybrid Retrieval

The retrieval system combines semantic and keyword retrieval to improve grounding.

Implemented retrieval components include:

- vector search with Qdrant
- keyword search with BM25
- Reciprocal Rank Fusion to combine dense and sparse results
- repository-aware chunking for code, commits, and markdown
- search over active repo context only

This allows the platform to answer both high-level and file-level questions with stronger grounding than a pure keyword or pure embedding approach.

## Business Analyst Features

### 1. Codebase Q&A in Business Language

Business Analysts can ask questions about the active repository without needing to read implementation details directly.

Examples of supported use cases:

- understanding what a feature does
- understanding business rules from code behavior
- translating technical behavior into stakeholder language
- summarizing the purpose of a module or service

The BA chat flow is specifically tuned to:

- avoid raw code in outputs
- avoid technical jargon where possible
- explain behavior in plain business language
- ground explanations in repository evidence

### 2. Requirement Document to Ticket Generation

A Business Analyst can submit a requirement document and have the system generate structured ticket proposals.

Generated ticket proposals include:

- title
- description
- acceptance criteria
- story points
- ticket type
- priority
- suggested assignee
- affected files

The flow uses codebase search while generating proposals, so tickets are not just based on text decomposition. They are linked to likely affected areas in the repository.

This makes the output useful for real engineering planning instead of generic requirement splitting.

### 3. Bulk Ticket Creation

Once proposals are reviewed, the BA can bulk-create tickets directly from approved drafts.

The ticket creation flow supports structured fields such as:

- ticket ID
- title
- description
- status
- ticket type
- priority
- sprint
- assignee
- acceptance criteria
- affected files
- due date
- technical document link
- story points

This means the workflow supports going from requirement text to actual ticket objects inside the platform.

### 4. Sprint Dashboard

The BA workspace includes a sprint dashboard with progress and delivery visibility.

Tracked metrics include:

- total ticket count
- status distribution
- total story points
- completed story points
- remaining story points
- completion percentage

Tickets are also displayed in workflow-style columns:

- To Do
- In Progress
- In Review
- Done

This makes the BA dashboard useful not just for creation but also for project monitoring.

### 5. Ticket Browsing

The BA can browse all tickets reported by them and inspect details such as:

- title
- description
- status
- priority
- story points
- sprint
- technical document link
- linked commits

This helps connect planning artifacts to actual implementation activity.

### 6. Business Document Generation from Code

The BA workspace includes a document generation flow that transforms repository context into business-facing documents.

A user can generate documents from:

- selected files from the repository tree
- pasted code or content snippets
- a custom document brief
- a chosen document type

Supported document types include:

- Feature Summary
- Business Requirements Document
- Process Flow Description
- Stakeholder Update

Generated output includes structured fields such as:

- title
- document type
- generated content
- key business rules
- stakeholder summary

This is useful for turning implementation context into readable artifacts for non-engineering audiences.

### 7. Google Docs Export

The document generation flow supports publishing generated content into Google Docs.

This includes:

- Google OAuth connection
- connection status checks
- document creation in Google Docs
- pushing generated document content to a newly created Google document
- surfacing the resulting Google Docs URL to the user

This is particularly useful for BA workflows where documentation needs to move beyond the application and into a collaborative document environment.

### 8. Technical Document / TRS Attachment During Ticket Creation

The BA ticket creation flow also supports generating and attaching a technical or business document to a ticket workflow.

The frontend explicitly supports generating a document draft from affected files and linking it back as a document reference for tickets.

This gives the platform an additional layer of traceability between:

- requirement
- ticket
- technical/business supporting document
- implementation

### 9. Commit Explanation in Business Language

The BA can ask for ticket-linked commits to be explained in non-technical language.

The platform translates commit context into outputs focused on:

- what changed from a product perspective
- why it matters to the business
- what a stakeholder needs to know

The commit explainer avoids code and technical jargon and is optimized for stakeholder readability.

## Developer Features

### 1. Codebase Q&A in Technical Mode

Developers can chat with the repository using a technically oriented assistant.

The developer chat flow supports:

- technical implementation questions
- code path discovery
- architecture explanations
- file-level references
- ticket-aware questioning
- commit and history-related answers

The system is configured to use repository evidence and, where relevant, git evidence. When a developer opens generic chat, the platform can automatically anchor the conversation to their active assigned ticket.

### 2. Ticket-Specific Implementation Guidance

Developers can request implementation guidance for a ticket.

The implementation guidance flow produces structured outputs that include:

- what needs to be implemented
- relevant files to inspect
- technical hints
- formulas or algorithms when relevant
- a checklist of subtasks

The system uses ticket metadata plus repository evidence plus any linked technical document excerpt to generate focused guidance.

This is one of the most useful features for reducing ambiguity in engineering work.

### 3. My Tickets View

Developers can view tickets assigned to them.

Displayed information includes:

- ticket ID
- title
- description
- status
- priority
- story points
- sprint
- technical document link
- linked commit count

This gives developers a role-specific view over the active work queue.

### 4. Onboarding Guide Generation

The onboarding feature generates a personalized project briefing for a developer using real repository context, recent commits, and assigned tickets.

Generated onboarding output includes:

- project overview
- architecture summary
- key files
- recent commits
- getting started steps
- assigned ticket guidance
- recommended reading order

This is especially useful for:

- new developers joining a project
- developers switching teams
- fast context loading for unfamiliar repositories

### 5. Timeline Brief / Catch-Up Summary

Developers can generate a catch-up summary for a selected date range.

This feature is designed for people returning to a project after some time away.

The output can include:

- period summary
- completed work
- in-progress work
- newly assigned tickets
- key code changes
- narrative summary
- commits during the selected period

This gives a quick “what changed while I was away” view without requiring manual commit or ticket review.

### 6. Commit Explorer

The developer workspace includes a commit explorer with filtering and inspection support.

Supported capabilities include:

- browsing recent commits
- searching by SHA, message, author, or file
- filtering by file path
- selecting a commit to inspect
- viewing full commit details
- viewing file change counts
- mapping commits back to ticket IDs
- running AI explanation on a commit

This helps developers quickly understand repository history and change impact.

### 7. Commit Explanation for Developers

In the developer workspace, commit explanation is available as a code-aware helper.

Compared to BA mode, developer-oriented explanation can help with:

- understanding intent behind a change
- relating commits to tickets
- understanding change scope
- speeding up code review or self-review

### 8. Ticket-Aware Chat Context

The developer chat automatically enriches questions with ticket context when available.

That means the assistant can use:

- ticket ID
- title
- description
- acceptance criteria
- affected files
- linked technical document
- document excerpts

This reduces the need for the developer to restate the task every time they ask a question.

## Shared Product Capabilities

Beyond role-specific screens, the project includes several shared capabilities.

### Authentication and Access

The application supports:

- login
- signup
- role-based routing
- access-token based auth
- protected workspaces for BA and Developer roles

The login flow also exposes demo accounts for local exploration.

### Demo Accounts

The backend exposes demo users, and the frontend includes quick-login options for these demo personas.

Current demo access includes:

- `ba_tom` / `demo1234`
- `dev_alice` / `demo1234`

This makes local testing easier without needing to create accounts for every run.

### Role-Based UI Navigation

The frontend routes users into the correct workspace based on their role:

- `business_analyst`
- `developer`

Each role has a dedicated cockpit and task-specific flows.

### File Selection for Grounded Document Generation

The BA document generation flow includes repository file selection and file search so users can choose which files should inform generated documentation.

This matters because it keeps the AI task grounded and controllable instead of requiring the user to trust a full-repo black box summarization.

## AI Workflows Implemented

The backend contains explicit graph-based AI workflows for the following tasks:

- code Q&A
- code to business document generation
- commit explanation
- ticket implementation guidance
- developer onboarding guide generation
- requirements to Jira ticket proposals
- vacation/timeline catch-up summaries

These are not just prompt templates. They are structured workflows implemented with LangGraph and domain-specific tools.

## AI Tooling and Grounding

The AI layer uses tool-backed execution to gather repository evidence before responding.

Available tool patterns include:

- repository-aware search
- file reads
- file listing
- git log
- git show
- Jira-style ticket queries

The assistant behavior is different depending on the role:

- BA responses focus on business interpretation and avoid code
- Developer responses focus on technical precision and can include file-level references

## Ticket Model Features

The ticket model supports rich task metadata, including:

- ID
- title
- description
- status
- ticket type
- priority
- story points
- sprint
- assignee
- reporter
- acceptance criteria
- technical document link
- affected files
- due date
- linked commits
- timestamps

This means the platform is not limited to chat. It maintains structured project artifacts that AI workflows can reference.

## Commit Model Features

Commit-linked data includes:

- commit SHA
- commit message
- author
- files changed
- diff summary
- created timestamp
- optional AI explanation

This enables the product to connect delivery artifacts back to actual source control activity.

## Technology Stack

### Frontend

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Radix UI components

### Backend

- FastAPI
- SQLAlchemy
- Pydantic
- Async PostgreSQL with `asyncpg`
- Redis
- Qdrant

### AI and Retrieval

- OpenAI
- LangChain
- LangGraph
- BM25
- Qdrant vector search
- Reciprocal Rank Fusion
- Tree-sitter based chunking

## Prerequisites

To run the project locally, you should have:

- Docker
- Docker Compose
- an OpenAI API key

Optional, depending on which features you want to use:

- GitHub OAuth credentials for private repository access
- Google OAuth credentials for Google Docs publishing

## Environment Setup

Create a `.env` file in the project root.

Example:

```env
OPENAI_API_KEY=your_openai_api_key

JWT_SECRET=dev-secret-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=480

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_SCOPE=
