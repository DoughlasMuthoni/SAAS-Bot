from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, require_role
from app.core.database import get_db
from app.core.exceptions import NotFoundError, ValidationError
from app.models import User
from app.repositories.source_repository import SourceRepository
from app.schemas.source import CrawlSourceCreate, FaqSourceCreate, KnowledgeSourceResponse, TextSourceCreate
from app.services.plan_service import PlanService
from app.utils.file_storage import save_upload, validate_upload
from app.workers.ingestion_worker import ingest_source_task

router = APIRouter(prefix="/sources", tags=["sources"])

_viewer  = Depends(get_current_active_user)
_editor  = Depends(require_role("owner", "admin", "editor"))
_manager = Depends(require_role("owner", "admin"))


@router.get("", response_model=list[KnowledgeSourceResponse])
async def list_sources(
    workspace_id: str,
    bot_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = _viewer,
):
    sources = await SourceRepository.list_by_workspace(db, workspace_id, bot_id)
    return [_to_response(s) for s in sources]


@router.post("/text", response_model=KnowledgeSourceResponse, status_code=201)
async def create_text_source(
    body: TextSourceCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = _editor,
):
    await PlanService.check_source_limit(db, user.org_id, body.workspace_id)
    source = await SourceRepository.create(
        db,
        workspace_id=body.workspace_id,
        bot_id=body.bot_id,
        name=body.name,
        source_type="text",
        metadata_json={"content": body.content, "name": body.name},
    )
    job = await SourceRepository.create_job(db, body.workspace_id, source.id, "ingest")
    await db.commit()
    background_tasks.add_task(ingest_source_task, source.id, job.id)
    return _to_response(source)


@router.post("/faq", response_model=KnowledgeSourceResponse, status_code=201)
async def create_faq_source(
    body: FaqSourceCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = _editor,
):
    await PlanService.check_source_limit(db, user.org_id, body.workspace_id)
    source = await SourceRepository.create(
        db,
        workspace_id=body.workspace_id,
        bot_id=body.bot_id,
        name=body.name,
        source_type="faq",
        metadata_json={"faqs": [f.model_dump() for f in body.faqs]},
    )
    job = await SourceRepository.create_job(db, body.workspace_id, source.id, "ingest")
    await db.commit()
    background_tasks.add_task(ingest_source_task, source.id, job.id)
    return _to_response(source)


@router.post("/upload", response_model=KnowledgeSourceResponse, status_code=201)
async def upload_source(
    background_tasks: BackgroundTasks,
    workspace_id: str = Form(...),
    bot_id: str = Form(...),
    name: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = _editor,
):
    await PlanService.check_file_upload_permission(db, user.org_id)
    await PlanService.check_source_limit(db, user.org_id, workspace_id)
    try:
        await validate_upload(file)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))

    relative_path = await save_upload(file, workspace_id)
    source = await SourceRepository.create(
        db,
        workspace_id=workspace_id,
        bot_id=bot_id,
        name=name,
        source_type="upload",
        file_path=relative_path,
        file_mime_type=file.content_type,
        file_size_bytes=file.size,
        metadata_json={"name": name, "mime_type": file.content_type},
    )
    job = await SourceRepository.create_job(db, workspace_id, source.id, "ingest")
    await db.commit()
    background_tasks.add_task(ingest_source_task, source.id, job.id)
    return _to_response(source)


@router.post("/crawl", response_model=KnowledgeSourceResponse, status_code=201)
async def crawl_source(
    body: CrawlSourceCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = _editor,
):
    await PlanService.check_crawl_permission(db, user.org_id)
    await PlanService.check_source_limit(db, user.org_id, body.workspace_id)
    source = await SourceRepository.create(
        db,
        workspace_id=body.workspace_id,
        bot_id=body.bot_id,
        name=body.name,
        source_type="crawl",
        metadata_json={"url": body.url, "max_pages": body.max_pages, "name": body.name},
    )
    job = await SourceRepository.create_job(db, body.workspace_id, source.id, "ingest")
    await db.commit()
    background_tasks.add_task(ingest_source_task, source.id, job.id)
    return _to_response(source)


@router.post("/{source_id}/reindex", response_model=KnowledgeSourceResponse)
async def reindex_source(
    source_id: str,
    workspace_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = _editor,
):
    source = await SourceRepository.get_by_id(db, source_id, workspace_id)
    if source is None:
        raise HTTPException(status_code=404, detail="Source not found")
    await SourceRepository.update_status(db, source_id, "pending")
    job = await SourceRepository.create_job(db, workspace_id, source_id, "reindex")
    await db.commit()
    background_tasks.add_task(ingest_source_task, source_id, job.id)
    await db.refresh(source)
    return _to_response(source)


@router.post("/{source_id}/toggle", response_model=KnowledgeSourceResponse)
async def toggle_source(
    source_id: str,
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = _manager,
):
    source = await SourceRepository.get_by_id(db, source_id, workspace_id)
    if source is None:
        raise HTTPException(status_code=404, detail="Source not found")

    if source.status == "disabled":
        await SourceRepository.update_status(db, source_id, "indexed")
    else:
        await SourceRepository.update_status(db, source_id, "disabled")
        from app.services.ingestion_service import IngestionService
        await IngestionService.delete_source_embeddings(db, source_id, workspace_id)

    await db.refresh(source)
    return _to_response(source)


def _to_response(s) -> KnowledgeSourceResponse:
    return KnowledgeSourceResponse(
        id=s.id,
        workspace_id=s.workspace_id,
        bot_id=s.bot_id,
        name=s.name,
        source_type=s.source_type,
        status=s.status,
        chunk_count=s.chunk_count,
        indexed_at=s.indexed_at.isoformat() if s.indexed_at else None,
        error_message=s.error_message,
        language=s.language,
        created_at=s.created_at.isoformat(),
    )
