import asyncio
import re
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from app.core.logging import get_logger
from app.ingestion.processors.base import BaseProcessor, ProcessedDocument

logger = get_logger(__name__)

# Extensions we never want to crawl
_SKIP_EXT = {
    ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".ico",
    ".css", ".js", ".zip", ".tar", ".gz", ".mp4", ".mp3",
    ".woff", ".woff2", ".ttf", ".eot", ".xml", ".json",
}

# Path fragments that indicate auth / admin / private pages
_SKIP_PATTERNS = {
    "login", "logout", "signin", "signup", "register",
    "password", "reset", "account", "admin", "wp-admin",
    "wp-login", "cart", "checkout", "order", "payment",
    "api", ".well-known",
}

# Tags to strip before extracting text
_STRIP_TAGS = [
    "script", "style", "nav", "header", "footer", "aside",
    "noscript", "form", "button", "iframe", "figure",
]


class CrawlProcessor(BaseProcessor):
    async def process(
        self, metadata_json: dict, file_path: str | None = None
    ) -> list[ProcessedDocument]:
        start_url: str = (metadata_json or {}).get("url", "").strip()
        max_pages: int = int((metadata_json or {}).get("max_pages", 20))

        if not start_url:
            raise ValueError("Crawl source requires a 'url' in metadata")

        parsed_start = urlparse(start_url)
        allowed_domain: str = parsed_start.netloc

        visited: set[str] = set()
        queue: list[str] = [start_url]
        documents: list[ProcessedDocument] = []

        headers = {
            "User-Agent": "DGChatBot-Crawler/1.0 (+https://github.com/dgtc)",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
        }

        async with httpx.AsyncClient(
            timeout=20,
            follow_redirects=True,
            headers=headers,
        ) as client:
            while queue and len(visited) < max_pages:
                url = queue.pop(0)
                canonical = _normalise_url(url)

                if canonical in visited:
                    continue
                if _should_skip(url):
                    continue

                visited.add(canonical)
                logger.info("Crawling page", url=url, visited=len(visited), max=max_pages)

                try:
                    resp = await client.get(url)
                except (httpx.RequestError, httpx.TimeoutException) as exc:
                    logger.warning("Crawler fetch failed", url=url, error=str(exc))
                    continue

                if resp.status_code != 200:
                    logger.warning("Non-200 response", url=url, status=resp.status_code)
                    continue

                content_type = resp.headers.get("content-type", "")
                if "text/html" not in content_type:
                    continue

                soup = BeautifulSoup(resp.text, "html.parser")

                # Title
                title_tag = soup.find("title")
                title = title_tag.get_text(strip=True) if title_tag else url

                # Strip noisy tags
                for tag in soup(_STRIP_TAGS):
                    tag.decompose()

                # Find main content area — prefer semantic tags
                main = (
                    soup.find("main")
                    or soup.find("article")
                    or soup.find(id="content")
                    or soup.find(id="main")
                    or soup.find("div", class_=re.compile(r"\bcontent\b", re.I))
                    or soup.body
                )
                if not main:
                    continue

                raw_text = main.get_text(separator="\n")
                # Collapse whitespace while preserving paragraph breaks
                normalized = re.sub(r"[ \t]+", " ", raw_text)
                normalized = re.sub(r"\n{3,}", "\n\n", normalized).strip()

                if len(normalized) < 80:
                    # Page had too little extractable text — skip
                    continue

                documents.append(ProcessedDocument(
                    title=title,
                    raw_content=raw_text,
                    normalized_content=normalized,
                    doc_type="crawl",
                    source_url=url,
                ))

                # Discover new links on the same domain
                if len(visited) < max_pages:
                    for a_tag in soup.find_all("a", href=True):
                        href: str = a_tag["href"].strip()
                        if not href or href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
                            continue
                        absolute = urljoin(url, href)
                        parsed_link = urlparse(absolute)

                        if parsed_link.netloc != allowed_domain:
                            continue
                        if parsed_link.scheme not in ("http", "https"):
                            continue

                        link_canonical = _normalise_url(absolute)
                        if link_canonical not in visited and absolute not in queue:
                            queue.append(absolute)

                # Polite crawl delay
                await asyncio.sleep(0.3)

        logger.info(
            "Crawl complete",
            start_url=start_url,
            pages_crawled=len(visited),
            documents=len(documents),
        )
        return documents


def _normalise_url(url: str) -> str:
    """Strip trailing slash and fragment for deduplication."""
    p = urlparse(url)
    return f"{p.scheme}://{p.netloc}{p.path.rstrip('/')}".lower()


def _should_skip(url: str) -> bool:
    path = urlparse(url).path.lower()
    if any(path.endswith(ext) for ext in _SKIP_EXT):
        return True
    parts = set(re.split(r"[/\-_?&=]", path))
    return bool(parts & _SKIP_PATTERNS)
