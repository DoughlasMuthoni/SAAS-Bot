from collections.abc import AsyncIterator
from dataclasses import dataclass
from functools import lru_cache

import anthropic

from app.core.config import get_settings
from app.core.exceptions import ProviderError
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class StreamUsage:
    input_tokens: int
    output_tokens: int
    cache_creation_input_tokens: int = 0
    cache_read_input_tokens: int = 0


class AnthropicProvider:
    def __init__(self):
        settings = get_settings()
        self._client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self._usage: StreamUsage | None = None

    async def stream_chat(
        self,
        messages: list[dict],
        model: str,
        max_tokens: int = 1024,
        system: str | None = None,
    ) -> AsyncIterator[str]:
        self._usage = None
        kwargs: dict = dict(model=model, max_tokens=max_tokens, messages=messages)
        if system:
            # Cache the system prompt: it is identical on every request for a given
            # bot, so this is the highest-value cache breakpoint available.
            kwargs["system"] = [
                {"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}
            ]
        try:
            with self._client.messages.stream(**kwargs) as stream:
                for text in stream.text_stream:
                    yield text
                final = stream.get_final_message()
                self._usage = StreamUsage(
                    input_tokens=final.usage.input_tokens,
                    output_tokens=final.usage.output_tokens,
                    cache_creation_input_tokens=getattr(
                        final.usage, "cache_creation_input_tokens", 0
                    ) or 0,
                    cache_read_input_tokens=getattr(
                        final.usage, "cache_read_input_tokens", 0
                    ) or 0,
                )
        except anthropic.APIError as e:
            logger.error("Anthropic API error", error=str(e))
            raise ProviderError(f"LLM provider error: {e}") from e

    def get_last_usage(self) -> StreamUsage | None:
        return self._usage


@lru_cache
def get_anthropic_provider() -> AnthropicProvider:
    return AnthropicProvider()
