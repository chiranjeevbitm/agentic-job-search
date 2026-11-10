import os
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
logger = logging.getLogger(__name__)

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def create_tables():
    logger.info("Initializing database tables...")
    async with engine.begin() as conn:
        from db.models import JobResult  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
        
        # Add new columns if they don't exist (for backward compatibility)
        from sqlalchemy import text
        try:
            # Check if job_level column exists
            result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'job_results' AND column_name = 'job_level'"))
            if not result.fetchone():
                await conn.execute(text("ALTER TABLE job_results ADD COLUMN job_level VARCHAR(50)"))
                logger.info("Added job_level column to job_results table")
            
            # Check if yoe column exists
            result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'job_results' AND column_name = 'yoe'"))
            if not result.fetchone():
                await conn.execute(text("ALTER TABLE job_results ADD COLUMN yoe INTEGER"))
                logger.info("Added yoe column to job_results table")
                
        except Exception as e:
            logger.warning(f"Could not add new columns to existing table: {e}")
            
    logger.info("Database tables initialized successfully")
