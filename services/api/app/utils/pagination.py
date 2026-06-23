from typing import Generic, TypeVar

from fastapi import Query
from pydantic import BaseModel

T = TypeVar("T")


class PaginationParams:
    def __init__(
        self,
        skip: int = Query(default=0, ge=0),
        limit: int = Query(default=20, ge=1, le=100),
    ):
        self.skip = skip
        self.limit = limit


class PagedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    skip: int
    limit: int
