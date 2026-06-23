from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class ProcessedDocument:
    title: str
    raw_content: str
    normalized_content: str
    doc_type: str = "text"
    source_url: str | None = None
    page_number: int | None = None


class BaseProcessor(ABC):
    @abstractmethod
    async def process(self, metadata_json: dict, file_path: str | None = None) -> list[ProcessedDocument]:
        ...
