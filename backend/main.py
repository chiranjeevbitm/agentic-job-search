"""
FastAPI application entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.database import create_tables
from routers import jobs, history, agents
from logger import setup_logging

# Initialize Logging
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup."""
    await create_tables()
    yield


app = FastAPI(
    title="Job Search AI — LangGraph Multi-Agent",
    description="Automated job search with AI scoring and cover letter generation.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router)
app.include_router(history.router)
app.include_router(agents.router)


@app.get("/")
async def root():
    return {"message": "Job Search AI API — LangGraph Multi-Agent v1.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
