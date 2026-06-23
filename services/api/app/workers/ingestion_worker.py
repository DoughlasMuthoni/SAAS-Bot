from app.core.database import AsyncSessionLocal
from app.core.logging import get_logger
from app.services.ingestion_service import IngestionService

logger = get_logger(__name__)


async def ingest_source_task(source_id: str, job_id: str) -> None:
    async with AsyncSessionLocal() as db:
        try:
            await IngestionService.run_ingestion_job(db, job_id)
            await db.commit()
        except Exception as e:
            await db.rollback()
            logger.error("Background ingestion task failed", job_id=job_id, error=str(e))
