"""
Enhanced Job Search Agent - Multi-Platform Support

USAGE:
------
This agent coordinates job scraping across multiple platforms using the enhanced Apify tool.

Configuration Options (in JobSearchState):
- platforms: List of platforms to search (default: all available)
- job_title: Job search query (required)
- location: Location filter (default: "Remote")

Supported Platforms:
- linkedin: LinkedIn Jobs
- indeed: Indeed
- glassdoor: Glassdoor
- google: Google Jobs
- glassdoor: Glassdoor.com
- zip_recruiter: ZipRecruiter (US)

State Schema:
    {
        "search_id": "unique-id",
        "job_title": "Python Developer",
        "location": "Remote",
        "platforms": ["linkedin", "upwork"],  # Optional, defaults to all
        "raw_jobs": [],  # Output: scraped jobs
        "events": [],    # Output: tracking events
        "error": None    # Output: error message if any
    }

Example Usage in Graph:
    from graph.state import JobSearchState
    from agents.job_search_agent import job_search_node
    
    state = JobSearchState(
        search_id="search-123",
        job_title="Senior Python Developer",
        location="San Francisco, CA",
        platforms=["linkedin", "glassdoor"]  # Optional
    )
    
    result = await job_search_node(state)
    # result["raw_jobs"] contains normalized jobs from all platforms

Event Tracking:
- Agent emits events for each platform attempt
- Events include success/failure status and job counts
- Useful for debugging and monitoring agent execution

Platform Selection Strategy:
- If no platforms specified: scrapes all available platforms
- For traditional employment: ["linkedin", "indeed", "glassdoor"]
- For remote-first: ["linkedin", "indeed", "google"]
- For Indian market: ["glassdoor", "linkedin", "indeed"]
"""

import logging
from typing import Dict, List, Optional, Any
from graph.state import JobSearchState
from tools.jobspy_tool import scrape_jobs, scrape_linkedin_jobs
from agents.utils import _event

logger = logging.getLogger(__name__)


def _get_platform_selection(state: JobSearchState) -> Optional[List[str]]:
    """
    Determine which platforms to scrape based on state configuration.
    
    Returns None to scrape all platforms, or a filtered list.
    """
    # Check if platforms are explicitly specified in state
    platforms = state.get("platforms")
    
    if platforms and isinstance(platforms, list) and len(platforms) > 0:
        logger.info(f"Using explicitly configured platforms: {platforms}")
        return platforms
    
    # Default to all platforms (None = all)
    logger.info("No platforms specified, will scrape all available platforms")
    return None


async def job_search_node(state: JobSearchState) -> Dict[str, Any]:
    """
    Scrape jobs from multiple platforms via Apify.
    
    This node coordinates job scraping across LinkedIn, Upwork, WeWorkRemotely,
    and Naukri platforms based on configuration.
    
    Args:
        state: JobSearchState containing job_title, location, and optional platforms
        
    Returns:
        Dictionary with:
        - raw_jobs: List of normalized job dictionaries
        - events: List of tracking events
        - error: Error message if scraping failed
    """
    search_id = state.get('search_id', 'unknown')
    job_title = state.get('job_title', '')
    location = state.get('location', 'Remote')
    
    logger.info(
        f"[{search_id}] Job Search Agent started | "
        f"Title: '{job_title}' | Location: '{location}'"
    )
    
    # Skip if upstream error exists
    if state.get("error"):
        logger.warning(f"[{search_id}] Job Search Agent skipped due to upstream error")
        return {
            "raw_jobs": [],
            "events": [_event("job_search_agent", "skipped", "Skipped due to upstream error")]
        }
    
    # Validate required fields
    if not job_title:
        error_msg = "job_title is required"
        logger.error(f"[{search_id}] {error_msg}")
        return {
            "raw_jobs": [],
            "error": error_msg,
            "events": [_event("job_search_agent", "error", error_msg)]
        }
    
    try:
        # Determine platform selection
        platforms = _get_platform_selection(state)
        
        # Log scraping attempt
        platform_info = platforms if platforms else "all available platforms"
        logger.info(f"[{search_id}] Scraping from: {platform_info}")
        
        # Scrape jobs from configured platforms
        search_query = f"{state.get('job_level', '')} {job_title}".strip()
        job_count = state.get("job_count")
        if not job_count or job_count < 1:
            job_count = 10  # Safety fallback only if not provided
        logger.info(f"[{search_id}] Scraping {job_count} jobs")
        jobs = await scrape_jobs.ainvoke({
            "job_title": search_query,
            "location": location,
            "platforms": platforms,
            "results_wanted": job_count,
        })
        
        # Analyze results by platform
        platform_stats = {}
        for job in jobs:
            platform = job.get("platform", "unknown")
            platform_stats[platform] = platform_stats.get(platform, 0) + 1
        
        # Log results
        total_jobs = len(jobs)
        logger.info(
            f"[{search_id}] Scraping complete | "
            f"Total jobs: {total_jobs} | "
            f"By platform: {platform_stats}"
        )
        
        # Build success events
        events = []
        for platform, count in platform_stats.items():
            events.append(_event(
                "job_search_agent",
                "platform_success",
                f"Scraped {count} jobs from {platform}",
                {"platform": platform, "job_count": count}
            ))
        
        # Add summary event
        events.append(_event(
            "job_search_agent",
            "done",
            f"Successfully scraped {total_jobs} jobs across {len(platform_stats)} platforms",
            {
                "total_jobs": total_jobs,
                "platforms": list(platform_stats.keys()),
                "platform_stats": platform_stats
            }
        ))
        
        return {
            "raw_jobs": jobs,
            "events": events,
        }
        
    except Exception as exc:
        error_msg = f"Scraping failed: {exc}"
        logger.error(f"[{search_id}] Job Search Agent error: {exc}", exc_info=True)
        
        return {
            "raw_jobs": [],
            "error": str(exc),
            "events": [_event(
                "job_search_agent",
                "error",
                error_msg,
                {"exception_type": type(exc).__name__}
            )],
        }


async def job_search_linkedin_only_node(state: JobSearchState) -> Dict[str, Any]:
    """
    Legacy node for LinkedIn-only scraping (backward compatibility).
    
    Use job_search_node with platforms=["linkedin"] for new implementations.
    """
    search_id = state.get('search_id', 'unknown')
    logger.info(f"[{search_id}] LinkedIn-only Job Search Agent started")
    
    if state.get("error"):
        logger.warning(f"[{search_id}] Skipped due to upstream error")
        return {
            "raw_jobs": [],
            "events": [_event("job_search_agent", "skipped", "Skipped due to upstream error")]
        }
    
    try:
        jobs = await scrape_linkedin_jobs.ainvoke({
            "job_title": state["job_title"],
            "location": state["location"],
        })
        
        logger.info(f"[{search_id}] Scraped {len(jobs)} jobs from LinkedIn")
        
        return {
            "raw_jobs": jobs,
            "events": [_event(
                "job_search_agent",
                "done",
                f"Scraped {len(jobs)} jobs from LinkedIn",
                {"job_count": len(jobs), "platform": "linkedin"}
            )],
        }
        
    except Exception as exc:
        logger.error(f"[{search_id}] LinkedIn scraping error: {exc}", exc_info=True)
        return {
            "raw_jobs": [],
            "error": str(exc),
            "events": [_event("job_search_agent", "error", f"LinkedIn scraping failed: {exc}")],
        }