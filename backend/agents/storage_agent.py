import json
import asyncio
import logging
from graph.state import JobSearchState
from tools.excel_tool import save_to_excel
from agents.utils import _event

logger = logging.getLogger(__name__)

async def storage_node(state: JobSearchState) -> dict:
    """Save all results to XLSX and PostgreSQL IN PARALLEL using asyncio.gather."""
    final_jobs = state.get("final_jobs", [])
    logger.info(f"[{state.get('search_id')}] Storage Agent started for {len(final_jobs)} results")
    
    events = [
        _event("storage_agent", "running", f"Preparing to save {len(final_jobs)} results..."),
    ]
    
    if not final_jobs:
        logger.warning(f"[{state.get('search_id')}] Storage Agent: Nothing to store")
        return {"events": events + [_event("storage_agent", "done", "Nothing to store")]}

    search_id = state["search_id"]
    jobs_with_id = [{**j, "search_id": search_id} for j in final_jobs]
    
    suitable_count = sum(1 for j in final_jobs if j.get("is_suitable") == "Yes")
    events.append(_event("storage_agent", "running", 
        f"Saving {len(final_jobs)} jobs ({suitable_count} suitable) to Excel & PostgreSQL in parallel..."))

    async def _save_excel():
        logger.info(f"[{search_id}] Starting Excel save")
        jobs_json = json.dumps(jobs_with_id)
        res = await save_to_excel.ainvoke({"jobs_json": jobs_json, "search_id": search_id})
        logger.info(f"[{search_id}] Finished Excel save")
        return res

    async def _save_db():
        from db.database import AsyncSessionLocal
        from db.models import JobResult

        logger.info(f"[{search_id}] Starting DB save")
        try:
            async with AsyncSessionLocal() as session:
                async with session.begin():
                    for job in jobs_with_id:
                        # Convert years_of_experience string to integer
                        yoe_str = job.get("years_of_experience", "")
                        yoe_int = None
                        if yoe_str:
                            # Extract first number from string like "3-5 years" or "5+ years"
                            import re
                            match = re.search(r'(\d+)', str(yoe_str))
                            if match:
                                yoe_int = int(match.group(1))
                        
                        row = JobResult(
                            search_id=search_id,
                            job_title=job.get("title", ""),
                            company=job.get("company", ""),
                            location=job.get("location", ""),
                            job_url=job.get("url", ""),
                            job_description=job.get("description", "")[:2000],
                            score=job.get("score", 0),
                            match_reason=job.get("match_reason", ""),
                            cover_letter=job.get("cover_letter", ""),
                            is_suitable=job.get("is_suitable", "No"),
                            job_level=job.get("job_level", ""),
                            yoe=yoe_int,
                        )
                        session.add(row)
            logger.info(f"[{search_id}] Finished DB save")
        except Exception as e:
            logger.error(f"[{search_id}] Error in DB save: {e}", exc_info=True)
            raise

    try:
        logger.info(f"[{search_id}] Gathering parallel saves")
        excel_path, _ = await asyncio.gather(_save_excel(), _save_db())
        logger.info(f"[{search_id}] Gather completed")
        
        events.append(_event("storage_agent", "done",
                       f"Saved {len(final_jobs)} results to XLSX and PostgreSQL in parallel",
                       {
                           "excel_path": excel_path,
                           "saved_count": len(final_jobs),
                           "suitable_count": suitable_count,
                       }))
        
        return {
            "events": events,
        }
    except Exception as exc:
        logger.error(f"[{state.get('search_id')}] Storage Agent error: {exc}", exc_info=True)
        return {
            "events": events + [_event("storage_agent", "error", f"Storage failed: {exc}")],
        }
