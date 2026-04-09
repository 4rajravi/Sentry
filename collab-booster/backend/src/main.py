"""FastAPI application entry point."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.auth.router import router as auth_router
from src.cockpit.ba_router import router as ba_router
from src.cockpit.dev_router import router as dev_router
from src.common.database import engine
from src.common.database import Base
from src.jira.router import router as jira_router
from src.repo.router import router as repo_router
from src.search.router import router as search_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    import src.auth.models  # noqa
    import src.jira.models  # noqa

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")

    from src.common.database import AsyncSessionLocal
    from src.jira.seed import seed_database
    async with AsyncSessionLocal() as db:
        await seed_database(db)
    logger.info("Demo data seeded")

    try:
        from src.search.service import rebuild_bm25_from_qdrant
        await rebuild_bm25_from_qdrant()
        logger.info("BM25 index rebuilt")
    except Exception as e:
        logger.warning(f"BM25 rebuild failed (Qdrant may be empty): {e}")

    yield
    # Shutdown — nothing needed


app = FastAPI(
    title="AI Collaboration Booster",
    lifespan=lifespan,
    description="Bridge between Business Analysts and Developers using AI",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(jira_router)
app.include_router(repo_router)
app.include_router(search_router)
app.include_router(ba_router)
app.include_router(dev_router)



@app.get("/health")
async def health():
    return {"status": "ok", "service": "collab-booster"}


@app.get("/")
async def root():
    return {
        "message": "AI Collaboration Booster API",
        "docs": "/docs",
        "roles": ["business_analyst", "developer"],
        "demo_users": {
            "ba_sarah": "demo1234",
            "ba_tom": "demo1234",
            "dev_alice": "demo1234",
            "dev_bob": "demo1234",
            "dev_newbie": "demo1234",
        },
    }
