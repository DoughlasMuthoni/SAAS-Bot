from pathlib import Path

from app.models import Bot
from app.retrieval.retrieval_service import RetrievedChunk

_SYSTEM_PROMPT_PATH = Path(__file__).parent / "system_prompt_v1.txt"
_SYSTEM_PROMPT_TEMPLATE = _SYSTEM_PROMPT_PATH.read_text()


class PromptBuilder:
    @staticmethod
    def build_system_prompt(bot: Bot) -> str:
        fallback_parts = []
        if bot.fallback_email:
            fallback_parts.append(f"Email: {bot.fallback_email}")
        if bot.fallback_phone:
            fallback_parts.append(f"Phone: {bot.fallback_phone}")
        if bot.fallback_whatsapp:
            fallback_parts.append(f"WhatsApp: {bot.fallback_whatsapp}")

        fallback = ", ".join(fallback_parts) if fallback_parts else "Not provided"
        custom = bot.system_prompt_override or ""

        return _SYSTEM_PROMPT_TEMPLATE.format(
            bot_name=bot.name,
            fallback_contact=fallback,
            custom_instructions=custom,
        ).strip()

    @staticmethod
    def build_messages(
        query: str,
        chunks: list[RetrievedChunk],
        history: list[dict],
        bot: Bot,
        was_empty: bool,
    ) -> tuple[list[dict], str]:
        system_text = PromptBuilder.build_system_prompt(bot)

        if chunks:
            context_text = PromptBuilder.format_context_block(chunks)
        else:
            context_text = PromptBuilder.format_empty_context_message()

        # Build messages with prompt caching:
        # 1. System prompt (cached — stable per bot config)
        # 2. Knowledge context block (cached — stable per conversation turn)
        # 3. History messages
        # 4. Current user message

        messages = []

        # Inject context as the first user turn (before history)
        context_user_message = {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": f"<knowledge_context>\n{context_text}\n</knowledge_context>\n\nPlease use only the above knowledge to answer my questions.",
                    "cache_control": {"type": "ephemeral"},
                }
            ],
        }
        context_assistant_ack = {
            "role": "assistant",
            "content": "Understood. I will answer only from the provided knowledge context.",
        }
        messages.append(context_user_message)
        messages.append(context_assistant_ack)

        # Add conversation history (last 10 exchanges)
        for msg in history[-20:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

        # Current user message
        messages.append({"role": "user", "content": query})

        return messages, system_text

    @staticmethod
    def format_context_block(chunks: list[RetrievedChunk]) -> str:
        parts = []
        for i, chunk in enumerate(chunks, start=1):
            parts.append(f"[{i}]\n{chunk.content}")
        return "\n\n---\n\n".join(parts)

    @staticmethod
    def format_empty_context_message() -> str:
        return "No relevant knowledge was found for this query."
