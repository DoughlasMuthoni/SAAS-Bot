import uuid
from contextvars import ContextVar

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

request_id_var: ContextVar[str] = ContextVar("request_id", default="")


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())
        request_id_var.set(request_id)
        structlog.contextvars.bind_contextvars(request_id=request_id)
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        structlog.contextvars.clear_contextvars()
        return response
