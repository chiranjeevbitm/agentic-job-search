import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, distinct, func, and_
from typing import Optional
from db.database import get_db
from db.models import JobResult

router = APIRouter(prefix="/api/history", tags=["history"])
logger = logging.getLogger(__name__)


@router.get("")
async def get_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    job_level: Optional[str] = Query(None, description="Filter by job level (Entry, Junior, Mid, Senior, Lead, Manager, Director, VP, Executive)"),
    is_suitable: Optional[str] = Query(None, description="Filter by suitability (Yes/No)"),
    company: Optional[str] = Query(None, description="Filter by company name (partial match)"),
    min_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum score filter"),
    max_score: Optional[float] = Query(None, ge=0, le=100, description="Maximum score filter"),
    search_id: Optional[str] = Query(None, description="Filter by search ID"),
    db: AsyncSession = Depends(get_db),
):
    """Return paginated job results with optional filters."""
    logger.info(f"Fetching history: page={page}, page_size={page_size}, filters: job_level={job_level}, is_suitable={is_suitable}, company={company}")
    offset = (page - 1) * page_size

    # Build query with filters
    query = select(JobResult)
    count_query = select(func.count(JobResult.id))
    
    filters = []
    if job_level:
        filters.append(JobResult.job_level == job_level)
    if is_suitable:
        filters.append(JobResult.is_suitable == is_suitable)
    if company:
        filters.append(JobResult.company.ilike(f"%{company}%"))
    if min_score is not None:
        filters.append(JobResult.score >= min_score)
    if max_score is not None:
        filters.append(JobResult.score <= max_score)
    if search_id:
        filters.append(JobResult.search_id == search_id)
    
    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))

    # Count total with filters
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Fetch page
    result = await db.execute(
        query
        .order_by(JobResult.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    rows = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "results": [
            {
                "id": r.id,
                "search_id": r.search_id,
                "title": r.job_title,
                "company": r.company,
                "location": r.location,
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
        ],
    }


@router.get("/filters")
async def get_filter_options(db: AsyncSession = Depends(get_db)):
    """Get available filter options for the history page."""
    # Get distinct job levels
    job_levels_result = await db.execute(
        select(distinct(JobResult.job_level))
        .where(JobResult.job_level.isnot(None))
        .where(JobResult.job_level != "")
    )
    job_levels = [row[0] for row in job_levels_result.all() if row[0]]
    
    # Get distinct companies
    companies_result = await db.execute(
        select(distinct(JobResult.company))
        .order_by(JobResult.company)
        .limit(100)
    )
    companies = [row[0] for row in companies_result.all() if row[0]]
    
    # Get distinct search IDs
    search_ids_result = await db.execute(
        select(distinct(JobResult.search_id))
        .order_by(JobResult.search_id.desc())
        .limit(50)
    )
    search_ids = [row[0] for row in search_ids_result.all() if row[0]]
    
    return {
        "job_levels": sorted(job_levels),
        "companies": companies,
        "search_ids": search_ids,
    }
