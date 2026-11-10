import os
import logging
from dotenv import load_dotenv
from graph.state import JobSearchState
from tools.openai_tool import score_jobs_parallel
from agents.utils import _event

logger = logging.getLogger(__name__)

load_dotenv()
SCORE_THRESHOLD = int(os.getenv("SCORE_THRESHOLD", "60"))

async def scoring_node(state: JobSearchState) -> dict:
    """Score each scraped job using gpt-4o-mini."""
    raw_jobs = state.get("raw_jobs", [])
    logger.info(f"[{state.get('search_id')}] Scoring Agent started for {len(raw_jobs)} jobs")
    
    events = [
        _event("scoring_agent", "running", f"Starting AI scoring for {len(raw_jobs)} jobs..."),
    ]
    
    if state.get("error") or not raw_jobs:
        logger.warning(f"[{state.get('search_id')}] Scoring Agent skipped")
        return {"scored_jobs": [], "events": events + [_event("scoring_agent", "skipped", "No jobs to score")]}
    
    try:
        events.append(_event("scoring_agent", "running", 
            f"Analyzing resume against {len(raw_jobs)} jobs using gpt-4o-mini..."))
        
        scored = await score_jobs_parallel(
            state["resume_text"], 
            raw_jobs,
            state.get("yoe", 5),
            state.get("job_level", "Senior")
        )
        
        avg_score = sum(j["score"] for j in scored) / len(scored) if scored else 0
        suitable_count = sum(1 for j in scored if j["score"] >= SCORE_THRESHOLD)
        top_scores = sorted(scored, key=lambda x: x.get("score", 0), reverse=True)[:3]
        
        logger.info(f"[{state.get('search_id')}] Scoring complete: {suitable_count}/{len(scored)} suitable")
        
        events.append(_event("scoring_agent", "done",
                       f"Scored {len(scored)} jobs — avg: {avg_score:.1f}, "
                       f"suitable: {suitable_count}/{len(scored)}",
                       {
                           "avg_score": round(avg_score, 1),
                           "suitable_count": suitable_count,
                           "total_scored": len(scored),
                           "threshold": SCORE_THRESHOLD,
                           "top_jobs": [
                               {"title": j.get("title", ""), "company": j.get("company", ""), "score": j.get("score", 0)}
                               for j in top_scores
                           ],
                       }))
        
        return {
            "scored_jobs": list(scored),
            "events": events,
        }
    except Exception as exc:
        logger.error(f"[{state.get('search_id')}] Scoring Agent error: {exc}", exc_info=True)
        return {
            "scored_jobs": [],
            "error": str(exc),
            "events": events + [_event("scoring_agent", "error", f"Scoring failed: {exc}")],
        }
