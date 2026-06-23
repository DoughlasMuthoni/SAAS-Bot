import json
import re
import time
from collections.abc import AsyncIterator
from dataclasses import asdict, dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import ForbiddenError
from app.core.logging import get_logger
from app.models import Bot, UnresolvedQuery, UsageEvent
from app.prompts.prompt_builder import PromptBuilder
from app.providers.anthropic_provider import get_anthropic_provider
from app.repositories.bot_repository import DomainRepository
from app.repositories.conversation_repository import ConversationRepository
from app.retrieval.retrieval_service import RetrievalService
from app.utils.ids import generate_uuid

logger = get_logger(__name__)


@dataclass
class Citation:
    chunk_id: str
    source_name: str
    source_url: str | None
    snippet: str
    score: float


class ChatService:
    @staticmethod
    async def handle_chat(
        db: AsyncSession,
        bot: Bot,
        session_id: str,
        query: str,
        history: list[dict],
        visitor_domain: str,
        visitor_ip: str,
    ) -> AsyncIterator[str]:
        # Validate domain
        is_allowed = await DomainRepository.validate_domain(db, bot.public_key, visitor_domain)
        if not is_allowed:
            error_event = json.dumps({"type": "error", "data": "Domain not authorized"})
            yield f"data: {error_event}\n\n"
            return

        # Get/create conversation
        conv = await ConversationRepository.get_or_create_by_session(
            db,
            bot_id=bot.id,
            workspace_id=bot.workspace_id,
            session_id=session_id,
            visitor_ip=visitor_ip,
            visitor_domain=visitor_domain,
        )

        # Store user message
        await ConversationRepository.add_message(
            db,
            conversation_id=conv.id,
            workspace_id=bot.workspace_id,
            role="user",
            content=query,
        )
        await db.flush()

        # Retrieve context
        retrieval_result = await RetrievalService.retrieve(query, bot, db)

        # Build prompt
        messages, system_prompt = PromptBuilder.build_messages(
            query=query,
            chunks=retrieval_result.chunks,
            history=history,
            bot=bot,
            was_empty=retrieval_result.was_empty,
        )

        # Determine model
        settings = get_settings()
        model = bot.model_name or settings.ANTHROPIC_MODEL_MAIN

        # Cap history to prevent runaway token costs on long conversations
        if len(history) > settings.MAX_HISTORY_MESSAGES:
            history = history[-settings.MAX_HISTORY_MESSAGES:]

        # Stream response
        provider = get_anthropic_provider()
        full_response = ""
        start_time = time.monotonic()

        try:
            async for token in provider.stream_chat(
                messages=messages,
                model=model,
                max_tokens=settings.MAX_TOKENS_PER_RESPONSE,
                system=system_prompt,
            ):
                full_response += token
                event = json.dumps({"type": "token", "data": token})
                yield f"data: {event}\n\n"
        except Exception as e:
            logger.error("Chat stream error", error=str(e))
            error_event = json.dumps({"type": "error", "data": "Generation failed"})
            yield f"data: {error_event}\n\n"
            return

        latency_ms = int((time.monotonic() - start_time) * 1000)
        usage = provider.get_last_usage()

        # Strip source citation lines Claude appends (e.g. "📄 filename.pdf")
        _CITATION_RE = re.compile(r"\n?\s*\U0001F4C4[^\n]*", re.UNICODE)
        cleaned = _CITATION_RE.sub("", full_response).rstrip()
        citation_was_stripped = cleaned != full_response
        full_response = cleaned

        # Detect and strip lead-collection signal (everything from marker onwards)
        LEAD_MARKER = "[REQUEST_CONTACT]"
        show_lead_form = LEAD_MARKER in full_response
        if show_lead_form:
            full_response = full_response[:full_response.index(LEAD_MARKER)].rstrip()

        # Send corrected content to client if anything was stripped from the stream
        if citation_was_stripped or show_lead_form:
            correct_event = json.dumps({"type": "correct", "data": full_response})
            yield f"data: {correct_event}\n\n"

        # Build citations
        citations = [
            Citation(
                chunk_id=c.chunk_id,
                source_name=c.source_name,
                source_url=c.source_url,
                snippet=c.content[:200],
                score=round(c.score, 4),
            )
            for c in retrieval_result.chunks
        ]

        # Store assistant message (marker already stripped from full_response)
        await ConversationRepository.add_message(
            db,
            conversation_id=conv.id,
            workspace_id=bot.workspace_id,
            role="assistant",
            content=full_response,
            retrieved_chunk_ids=[c.chunk_id for c in retrieval_result.chunks],
            retrieval_score_json={c.chunk_id: c.score for c in retrieval_result.chunks},
            model_used=model,
            input_tokens=usage.input_tokens if usage else None,
            output_tokens=usage.output_tokens if usage else None,
            latency_ms=latency_ms,
            was_grounded=not retrieval_result.was_empty,
        )

        # Handle unresolved query
        if retrieval_result.was_empty:
            unresolved = UnresolvedQuery(
                id=generate_uuid(),
                workspace_id=bot.workspace_id,
                bot_id=bot.id,
                conversation_id=conv.id,
                query_text=query,
            )
            db.add(unresolved)
            from sqlalchemy import update
            from app.models import Conversation
            await db.execute(
                update(Conversation).where(Conversation.id == conv.id).values(status="unresolved")
            )

        # Store usage event
        event_record = UsageEvent(
            id=generate_uuid(),
            workspace_id=bot.workspace_id,
            bot_id=bot.id,
            event_type="chat_message",
            tokens_input=usage.input_tokens if usage else 0,
            tokens_output=usage.output_tokens if usage else 0,
            latency_ms=latency_ms,
            model_used=model,
        )
        db.add(event_record)
        await db.flush()

        # Emit metadata event
        metadata = {
            "type": "metadata",
            "data": {
                "conversation_id": conv.id,
                "citations": [asdict(c) for c in citations],
                "was_grounded": not retrieval_result.was_empty,
                "unresolved": retrieval_result.was_empty,
                "show_lead_form": show_lead_form,
            },
        }
        yield f"data: {json.dumps(metadata)}\n\n"
        yield "data: {\"type\": \"done\"}\n\n"
