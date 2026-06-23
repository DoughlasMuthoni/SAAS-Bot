import re

from app.ingestion.processors.base import BaseProcessor, ProcessedDocument


class TextProcessor(BaseProcessor):
    async def process(self, metadata_json: dict, file_path: str | None = None) -> list[ProcessedDocument]:
        content = (metadata_json or {}).get("content", "")
        if not content:
            return []
        normalized = re.sub(r"\s+", " ", content).strip()
        return [ProcessedDocument(
            title=metadata_json.get("name", "Text Source"),
            raw_content=content,
            normalized_content=normalized,
            doc_type="text",
        )]
