import os
import logging
from dotenv import load_dotenv
from graph.state import JobSearchState
from tools.openai_tool import generate_cover_letters_parallel
from agents.utils import _event

logger = logging.getLogger(__name__)

load_dotenv()
SCORE_THRESHOLD = int(os.getenv("SCORE_THRESHOLD", "60"))

async def cover_letter_node(state: JobSearchState) -> dict:
    """Generate cover letters IN PARALLEL for all suitable jobs (score >= threshold)."""
    logger.info(f"[{state.get('search_id')}] Cover Letter Agent started")
    scored_jobs = state.get("scored_jobs", [])
    suitable = [j for j in scored_jobs if j.get("score", 0) >= SCORE_THRESHOLD]
    unsuitable = [j for j in scored_jobs if j.get("score", 0) < SCORE_THRESHOLD]
    
    events = [
        _event("cover_letter_agent", "running", 
            f"Checking {len(scored_jobs)} scored jobs (threshold: {SCORE_THRESHOLD})..."),
    ]

    if not suitable:
        final = [{**j, "is_suitable": "No", "cover_letter": ""} for j in unsuitable]
        logger.info(f"[{state.get('search_id')}] No suitable jobs found, skipping cover letters")
        return {
            "final_jobs": final,
            "events": events + [_event("cover_letter_agent", "done",
                              f"No suitable jobs found (0/{len(scored_jobs)} above threshold {SCORE_THRESHOLD})",
                              {"suitable": 0, "unsuitable": len(unsuitable), "threshold": SCORE_THRESHOLD})],
        }

    try:
        suitable_titles = [j.get("title", "Unknown") for j in suitable[:5]]
        events.append(_event("cover_letter_agent", "running", 
            f"Generating cover letters for {len(suitable)} suitable jobs: {', '.join(suitable_titles[:3])}{'...' if len(suitable_titles) > 3 else ''}"))
        
        with_letters = await generate_cover_letters_parallel(state["resume_text"], suitable)
        final = (
            [{**j, "is_suitable": "Yes"} for j in with_letters]
            + [{**j, "is_suitable": "No", "cover_letter": ""} for j in unsuitable]
        )
        
        logger.info(f"[{state.get('search_id')}] Generated {len(suitable)} cover letters")
        
        events.append(_event("cover_letter_agent", "done",
                       f"Generated {len(suitable)} cover letters in parallel",
                       {
                           "letters_generated": len(suitable),
                           "suitable_jobs": suitable_titles,
                           "unsuitable_count": len(unsuitable),
                       }))
        
        return {
            "final_jobs": final,
            "events": events,
        }
    except Exception as exc:
        logger.error(f"[{state.get('search_id')}] Cover Letter Agent error: {exc}", exc_info=True)
        return {
            "final_jobs": scored_jobs,
            "error": str(exc),
            "events": events + [_event("cover_letter_agent", "error", f"Cover letter generation failed: {exc}")],
        }
