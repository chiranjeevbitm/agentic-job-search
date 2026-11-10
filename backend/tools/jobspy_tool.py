"""
Free Job Scraping Tool — powered by python-jobspy (open-source, MIT)

USAGE:
------
Scrapes job listings from multiple platforms with ZERO cost, no API key.

Supported Platforms:
- linkedin: LinkedIn Jobs
- indeed: Indeed
- glassdoor: Glassdoor
- google: Google Jobs
- glassdoor: Glassdoor.com
- zip_recruiter: ZipRecruiter (US)

Environment Variables (Optional):
- MAX_JOBS: Maximum jobs to scrape per platform (default: 10)

Example Usage:
    jobs = await scrape_jobs_free(job_title="Python Developer", location="Bangalore")
    jobs = await scrape_jobs_free(
        job_title="Python Developer",
        location="Remote",
        platforms=["linkedin", "naukri"]
    )
"""

import os
import asyncio
import logging
import re
from typing import List, Optional, Dict, Any
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

MAX_JOBS = int(os.getenv("MAX_JOBS", "10"))


def _extract_job_level(description: str) -> str:
    """
    Extract job level from job description using keyword matching.
    Returns one of: Entry, Junior, Mid, Senior, Lead, Manager, Director, VP, Executive, or empty string.
    """
    if not description:
        return ""
    
    desc_lower = description.lower()
    
    # Define job level patterns with priority (checked in order)
    level_patterns = [
        (r'\b(vice president|vp)\b', "VP"),
        (r'\b(chief|cto|ceo|cfo|coo|cio|cmo)\b', "Executive"),
        (r'\b(director|head of)\b', "Director"),
        (r'\b(manager|management)\b', "Manager"),
        (r'\b(lead|principal|staff)\b', "Lead"),
        (r'\b(senior|sr\.?|sr )\b', "Senior"),
        (r'\b(mid[- ]?level|intermediate)\b', "Mid"),
        (r'\b(junior|jr\.?|jr )\b', "Junior"),
        (r'\b(entry[- ]?level|fresher|graduate|intern|internship|trainee)\b', "Entry"),
    ]
    
    for pattern, level in level_patterns:
        if re.search(pattern, desc_lower):
            return level
    
    return ""


def _extract_years_of_experience(description: str) -> str:
    """
    Extract years of experience from job description.
    Looks for patterns like 'X-Y years', 'X+ years', 'X years of experience'.
    Returns the matched string or empty string.
    """
    if not description:
        return ""
    
    # Patterns to match years of experience
    patterns = [
        # "X-Y years" or "X to Y years"
        r'(\d+\s*[-–to]+\s*\d+\s*(?:\+?\s*years?(?:\s+of\s+(?:relevant\s+)?experience)?))',
        # "X+ years"
        r'(\d+\+\s*years?(?:\s+of\s+(?:relevant\s+)?experience)?)',
        # "X years" standalone
        r'(\d+\s*years?(?:\s+of\s+(?:relevant\s+)?experience)?)',
        # "minimum X years"
        r'(minimum\s+\d+\s*years?)',
        # "at least X years"
        r'(at\s+least\s+\d+\s*years?)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, description, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    
    return ""

# Default platforms to scrape
DEFAULT_PLATFORMS = ["linkedin", "indeed", "google", "glassdoor"]

# Map our platform names to jobspy site_name values
PLATFORM_TO_SITE = {
    "linkedin": "linkedin",
    "indeed": "indeed",
    "glassdoor": "glassdoor",
    "google": "google",
    "glassdoor": "glassdoor",
    "zip_recruiter": "zip_recruiter",
}


def _scrape_sync(
    search_term: str,
    location: str,
    site_names: List[str],
    results_wanted: int,
) -> List[Dict[str, Any]]:
    """
    Synchronous wrapper around jobspy.scrape_jobs().
    Returns a list of normalized job dicts.
    """
    from jobspy import scrape_jobs as jobspy_scrape

    logger.info(
        f"[jobspy] Starting scrape | term='{search_term}' | "
        f"location='{location}' | sites={site_names} | max={results_wanted}"
    )

    try:
        df = jobspy_scrape(
            site_name=site_names,
            search_term=search_term,
            location=location,
            results_wanted=results_wanted,
            hours_old=72,
            description_format="markdown",
            verbose=0,  # Only print errors
            country_indeed="india", # or remove depending on preference
        )
    except Exception as e:
        logger.error(f"[jobspy] scrape_jobs() raised: {e}", exc_info=True)
        return []

    if df is None or df.empty:
        logger.warning("[jobspy] No jobs returned from scrape_jobs()")
        return []

    logger.info(f"[jobspy] Raw DataFrame has {len(df)} rows")

    # Convert DataFrame rows to normalized dicts
    jobs: List[Dict[str, Any]] = []
    for _, row in df.iterrows():
        # Build location string
        city = str(row.get("city", "") or "")
        state = str(row.get("state", "") or "")
        loc_parts = [p for p in [city, state] if p]
        loc_str = ", ".join(loc_parts) if loc_parts else location

        # Get description, truncate to 4000 chars
        description = str(row.get("description", "") or "")[:4000]

        # Extract job level and years of experience from description
        job_level = _extract_job_level(description)
        years_of_experience = _extract_years_of_experience(description)

        job = {
            "title": str(row.get("title", "") or "").strip(),
            "company": str(row.get("company", "") or "Unknown").strip(),
            "location": loc_str,
            "description": description,
            "url": str(row.get("job_url", "") or ""),
            "platform": str(row.get("site", "") or "unknown"),
            "job_level": job_level,
            "years_of_experience": years_of_experience,
        }

        # Optional fields
        date_posted = row.get("date_posted")
        if date_posted is not None:
            job["posted_date"] = str(date_posted)

        min_amt = row.get("min_amount")
        max_amt = row.get("max_amount")
        if min_amt is not None or max_amt is not None:
            salary_parts = []
            if min_amt is not None:
                salary_parts.append(str(min_amt))
            if max_amt is not None:
                salary_parts.append(str(max_amt))
            interval = row.get("interval", "")
            job["salary"] = " - ".join(salary_parts) + (f" ({interval})" if interval else "")

        job_type = row.get("job_type")
        if job_type is not None:
            job["job_type"] = str(job_type)

        is_remote = row.get("is_remote")
        if is_remote:
            job["is_remote"] = True

        jobs.append(job)

    # Log per-platform stats
    platform_stats: Dict[str, int] = {}
    for j in jobs:
        p = j.get("platform", "unknown")
        platform_stats[p] = platform_stats.get(p, 0) + 1
    logger.info(f"[jobspy] Normalized {len(jobs)} jobs | By platform: {platform_stats}")

    return jobs


@tool
async def scrape_jobs(
    job_title: str,
    location: str = "Remote",
    platforms: Optional[List[str]] = None,
    results_wanted: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Scrape jobs from multiple platforms using python-jobspy (free, open-source).

    Args:
        job_title: Job title or search keywords
        location: Location filter (default: "Remote")
        platforms: List of platforms to scrape. If None, scrapes defaults.
                  Options: ["linkedin", "indeed", "google", "glassdoor", "naukri", "zip_recruiter"]
        results_wanted: Number of jobs to scrape. If None, uses MAX_JOBS from environment.

    Returns:
        List of normalized job dictionaries with platform information
    """
    # Resolve platforms to jobspy site names
    if platforms is None:
        platforms = DEFAULT_PLATFORMS

    site_names = []
    for p in platforms:
        mapped = PLATFORM_TO_SITE.get(p)
        if mapped:
            site_names.append(mapped)
        else:
            logger.warning(f"[jobspy] Unknown platform '{p}', skipping")

    if not site_names:
        logger.warning(f"[jobspy] No valid platforms. Available: {list(PLATFORM_TO_SITE.keys())}")
        return []

    # Use provided results_wanted or fall back to MAX_JOBS
    max_jobs = results_wanted if results_wanted is not None else MAX_JOBS
    
    logger.info(f"Scraping from platforms: {site_names} | Max jobs: {max_jobs}")

    # Run sync scraper in thread pool to avoid blocking the event loop
    jobs = await asyncio.to_thread(
        _scrape_sync,
        search_term=job_title,
        location=location,
        site_names=site_names,
        results_wanted=max_jobs,
    )

    logger.info(f"Total jobs scraped across all platforms: {len(jobs)}")
    return jobs


@tool
async def scrape_linkedin_jobs(job_title: str, location: str) -> List[Dict[str, Any]]:
    """
    Scrape LinkedIn jobs only (backward compatibility).

    Args:
        job_title: Job title or search keywords
        location: Location filter

    Returns:
        List of normalized job dictionaries from LinkedIn
    """
    return await scrape_jobs.ainvoke({
        "job_title": job_title,
        "location": location,
        "platforms": ["linkedin"],
    })
