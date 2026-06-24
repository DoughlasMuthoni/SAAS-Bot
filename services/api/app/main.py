from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.core.logging import configure_logging, get_logger
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_id import RequestIDMiddleware

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    settings = get_settings()
    logger.info("Starting Chatbot Platform API", env=settings.APP_ENV)

    # Verify DB connectivity
    from app.core.database import engine
    async with engine.connect() as conn:
        await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
    logger.info("Database connection verified")

    yield

    logger.info("Shutting down")
    await engine.dispose()


def create_app() -> FastAPI:
    configure_logging()
    settings = get_settings()

    app = FastAPI(
        title="Chatbot Platform API",
        version="1.0.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # CORS — intentional origins only
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(RequestIDMiddleware)

    # Global exception handler
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error("Unhandled exception", exc_info=exc)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    # API routers
    from app.api.v1 import auth, bots, sources, widget, conversations, analytics, leads, workspaces, admin, plans, public, team
    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(workspaces.router, prefix="/api/v1")
    app.include_router(bots.router, prefix="/api/v1")
    app.include_router(sources.router, prefix="/api/v1")
    app.include_router(widget.router, prefix="/api/v1")
    app.include_router(conversations.router, prefix="/api/v1")
    app.include_router(analytics.router, prefix="/api/v1")
    app.include_router(leads.router, prefix="/api/v1")
    app.include_router(admin.router, prefix="/api/v1")
    app.include_router(plans.router, prefix="/api/v1")
    app.include_router(public.router, prefix="/api/v1")
    app.include_router(team.router, prefix="/api/v1")

    # Serve widget bundle — widget.js gets no-cache so browsers always fetch the latest
    static_dir = Path(__file__).parent / "static"
    static_dir.mkdir(exist_ok=True)

    @app.get("/static/widget.js", include_in_schema=False)
    async def serve_widget():
        widget_path = static_dir / "widget.js"
        return FileResponse(
            str(widget_path),
            media_type="application/javascript",
            headers={
                "Cache-Control": "no-cache, must-revalidate",
                "Pragma": "no-cache",
            },
        )

    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    return app


app = create_app()
