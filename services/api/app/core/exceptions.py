class AppException(Exception):
    status_code: int = 500
    detail: str = "Internal server error"

    def __init__(self, detail: str | None = None):
        self.detail = detail or self.__class__.detail
        super().__init__(self.detail)


class NotFoundError(AppException):
    status_code = 404
    detail = "Resource not found"


class ForbiddenError(AppException):
    status_code = 403
    detail = "Access forbidden"


class ConflictError(AppException):
    status_code = 409
    detail = "Resource conflict"


class ValidationError(AppException):
    status_code = 422
    detail = "Validation error"


class ProviderError(AppException):
    status_code = 502
    detail = "Upstream provider error"


class TenantIsolationError(AppException):
    status_code = 403
    detail = "Tenant isolation violation"


class RateLimitError(AppException):
    status_code = 429
    detail = "Rate limit exceeded"


class AuthenticationError(AppException):
    status_code = 401
    detail = "Authentication required"
