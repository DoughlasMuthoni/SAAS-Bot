from app.ingestion.processors.base import BaseProcessor, ProcessedDocument


class FaqProcessor(BaseProcessor):
    async def process(self, metadata_json: dict, file_path: str | None = None) -> list[ProcessedDocument]:
        faqs = (metadata_json or {}).get("faqs", [])
        docs = []
        for item in faqs:
            q = item.get("question", "").strip()
            a = item.get("answer", "").strip()
            if q and a:
                content = f"Q: {q}\nA: {a}"
                docs.append(ProcessedDocument(
                    title=q[:100],
                    raw_content=content,
                    normalized_content=content,
                    doc_type="faq",
                ))
        return docs
