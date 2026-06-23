from app.ingestion.processors.base import BaseProcessor
from app.ingestion.processors.faq_processor import FaqProcessor
from app.ingestion.processors.text_processor import TextProcessor
from app.ingestion.processors.upload_processor import UploadProcessor


def get_processor(source_type: str) -> BaseProcessor:
    match source_type:
        case "text":
            return TextProcessor()
        case "faq":
            return FaqProcessor()
        case "upload":
            return UploadProcessor()
        case "crawl":
            from app.ingestion.processors.crawl_processor import CrawlProcessor
            return CrawlProcessor()
        case _:
            raise ValueError(f"No processor for source type: {source_type}")
