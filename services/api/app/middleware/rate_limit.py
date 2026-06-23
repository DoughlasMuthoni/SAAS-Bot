import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import get_settings

_windows: dict[str, deque] = defaultdict(deque)


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        settings = get_settings()
        path = request.url.path

        if "/widget/" in path and request.method == "POST":
            client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown").split(",")[0].strip()
            bucket = f"widget:{client_ip}"
            limit = settings.RATE_LIMIT_PER_MINUTE
        else:
            return await call_next(request)

        now = time.monotonic()
        window = _windows[bucket]
        cutoff = now - 60.0
        while window and window[0] < cutoff:
            window.popleft()

        if len(window) >= limit:
            return JSONResponse(
                {"detail": "Rate limit exceeded"},
                status_code=429,
                headers={"Retry-After": "60"},
            )

        window.append(now)
        return await call_next(request)
