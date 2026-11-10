import operator
from typing import Annotated, Optional
from typing_extensions import TypedDict


class JobSearchState(TypedDict):
    """Shared state passed through all LangGraph nodes."""
    search_id: str
    job_title: str
    location: str
    yoe: int
    job_level: str
    job_count: int
    resume_bytes: bytes
    resume_text: str
    raw_jobs: list[dict]
    scored_jobs: list[dict]
    final_jobs: list[dict]
    # append-only list of SSE progress events emitted by nodes
    events: Annotated[list[dict], operator.add]
    error: Optional[str]
