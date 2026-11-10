"""
Jobs router — the main API surface:
  POST /api/jobs/search         → start pipeline, returns search_id
  GET  /api/jobs/stream/{sid}   → SSE stream of node events
  GET  /api/jobs/results/{sid}  → final results JSON
  GET  /api/jobs/download       → stream the XLSX file
"""
import asyncio
import json
import logging
import uuid
from pathlib import Path
from typing import AsyncGenerator

from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from sse_starlette.sse import EventSourceResponse

from graph.graph_builder import compiled_graph
from graph.state import JobSearchState
from db.database import AsyncSessionLocal
from db.models import JobResult

router = APIRouter(prefix="/api/jobs", tags=["jobs"])
logger = logging.getLogger(__name__)

# In-memory store of completed states keyed by search_id
_results_store: dict[str, list[dict]] = {}
# In-memory event queues keyed by search_id (for SSE)
_event_queues: dict[str, asyncio.Queue] = {}

EXCEL_FILE = Path(__file__).parent.parent / "output" / "job_results.xlsx"


@router.post("/search")
async def start_search(
    job_title: str = Form(...),
    location: str = Form(...),
    yoe: int = Form(5),
    job_level: str = Form("Senior"),
    job_count: int = Form(10),
    resume: UploadFile = File(...),
):
    """
    Accepts the job search form, starts LangGraph pipeline in background.
    Returns search_id immediately so the client can open the SSE stream.
    """
    search_id = str(uuid.uuid4())
    logger.info(f"New search started: {search_id} | Job: {job_title} | Level: {job_level} | YOE: {yoe} | Loc: {location} | Job Count: {job_count}")
    resume_bytes = await resume.read()

    # Create SSE queue before starting task
    _event_queues[search_id] = asyncio.Queue()

    initial_state: JobSearchState = {
        "search_id": search_id,
        "job_title": job_title,
        "location": location,
        "yoe": yoe,
        "job_level": job_level,
        "job_count": job_count,
        "resume_bytes": resume_bytes,
        "resume_text": "",
        "raw_jobs": [],
        "scored_jobs": [],
        "final_jobs": [],
        "events": [],
        "error": None,
    }

    # Emit a "start" event to the queue and kick off background task
    asyncio.create_task(_run_pipeline(search_id, initial_state))
    return {"search_id": search_id, "status": "started"}


async def _run_pipeline(search_id: str, initial_state: JobSearchState):
    """Run the compiled LangGraph pipeline and push events to the SSE queue."""
    queue = _event_queues.get(search_id)

    try:
        async for chunk in compiled_graph.astream(initial_state, stream_mode="updates"):
            for node_name, node_output in chunk.items():
                # Push all events emitted by this node (agents emit their own events)
                if queue and isinstance(node_output, dict):
                    for event in node_output.get("events", []):
                        await queue.put(event)

                    # Cache final results when storage_node is done
                    if node_name == "storage_agent":
                        final_jobs = node_output.get("final_jobs", [])
                        # Pull final jobs from the full state
                        pass

        # After pipeline finishes, wait a moment for DB transaction to commit
        # This prevents race condition where __done__ is sent before results are in DB
        logger.info(f"[{search_id}] Pipeline finished, waiting 1 second before sending __done__")
        await asyncio.sleep(1)
        
        if queue:
            logger.info(f"[{search_id}] Sending __done__ event to frontend")
            await queue.put({"node": "__done__", "status": "done", "message": "Pipeline complete"})
            logger.info(f"[{search_id}] __done__ event sent successfully")

    except Exception as exc:
        logger.error(f"Pipeline error for search {search_id}: {exc}", exc_info=True)
        if queue:
            await queue.put({"node": "__error__", "status": "error", "message": str(exc)})
    finally:
        if queue:
            await queue.put(None)  # Sentinel to close SSE stream


async def _sse_generator(search_id: str) -> AsyncGenerator[str, None]:
    """Pull events from the queue and yield as SSE data strings."""
    queue = _event_queues.get(search_id)
    if not queue:
        yield f"data: {json.dumps({'error': 'Invalid search_id'})}\n\n"
        return

    while True:
        event = await queue.get()
        if event is None:
            break
        yield f"data: {json.dumps(event)}\n\n"

    # Cleanup
    _event_queues.pop(search_id, None)


@router.get("/stream/{search_id}")
async def stream_events(search_id: str):
    """SSE endpoint — streams LangGraph node events to the browser."""
    return EventSourceResponse(_sse_generator(search_id))


@router.get("/results/{search_id}")
async def get_results(search_id: str):
    """Return all job results for a given search from PostgreSQL."""
    from sqlalchemy import select
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(JobResult).where(JobResult.search_id == search_id)
        )
        rows = result.scalars().all()

    # Return empty array if no results found (instead of 404)
    return [
        {
            "id": r.id,
            "search_id": r.search_id,
            "job_title": r.job_title,
            "title": r.job_title,
            "company": r.company,
            "location": r.location,
            "job_url": r.job_url,
            "url": r.job_url,
            "job_description": r.job_description,
            "score": r.score,
            "match_reason": r.match_reason,
            "cover_letter": r.cover_letter,
            "is_suitable": r.is_suitable,
            "job_level": r.job_level,
            "yoe": r.yoe,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


@router.get("/download")
async def download_excel():
    """Download the latest job_results.xlsx file."""
    if not EXCEL_FILE.exists():
        raise HTTPException(status_code=404, detail="No Excel file generated yet")
    return FileResponse(
        str(EXCEL_FILE),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename="job_results.xlsx",
    )
