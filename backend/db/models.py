from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from db.database import Base


class JobResult(Base):
    __tablename__ = "job_results"

    id = Column(Integer, primary_key=True, index=True)
    search_id = Column(String(64), index=True)
    job_title = Column(String(255))
    company = Column(String(255))
    location = Column(String(255))
    job_url = Column(Text)
    job_description = Column(Text)
    score = Column(Float)
    match_reason = Column(Text)
    cover_letter = Column(Text, nullable=True)
    is_suitable = Column(String(5))   # "Yes" / "No"
    job_level = Column(String(50), nullable=True)  # Job level from search criteria
    yoe = Column(Integer, nullable=True)  # Years of Experience from search criteria
    created_at = Column(DateTime(timezone=True), server_default=func.now())
