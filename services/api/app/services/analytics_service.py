from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Conversation, ConversationMessage, Lead, UnresolvedQuery
from app.schemas.analytics import AnalyticsOverview, DailyUsage, LeadDaily, QueryFrequency


class AnalyticsService:
    @staticmethod
    async def get_overview(
        db: AsyncSession, workspace_id: str, bot_id: str | None = None, days: int = 30
    ) -> AnalyticsOverview:
        filters = [Conversation.workspace_id == workspace_id, Conversation.deleted_at.is_(None)]
        if bot_id:
            filters.append(Conversation.bot_id == bot_id)

        total_conversations = (await db.execute(
            select(func.count()).select_from(Conversation).where(*filters)
        )).scalar() or 0

        msg_filters = [ConversationMessage.workspace_id == workspace_id]
        if bot_id:
            msg_filters.append(
                ConversationMessage.conversation_id.in_(
                    select(Conversation.id).where(*filters)
                )
            )
        total_messages = (await db.execute(
            select(func.count()).select_from(ConversationMessage).where(*msg_filters)
        )).scalar() or 0

        unresolved_filters = [UnresolvedQuery.workspace_id == workspace_id]
        if bot_id:
            unresolved_filters.append(UnresolvedQuery.bot_id == bot_id)
        unresolved_count = (await db.execute(
            select(func.count()).select_from(UnresolvedQuery).where(*unresolved_filters)
        )).scalar() or 0

        lead_filters = [Lead.workspace_id == workspace_id]
        if bot_id:
            lead_filters.append(Lead.bot_id == bot_id)
        lead_count = (await db.execute(
            select(func.count()).select_from(Lead).where(*lead_filters)
        )).scalar() or 0

        top_queries_result = await db.execute(
            select(UnresolvedQuery.query_text, func.count().label("cnt"))
            .where(*unresolved_filters)
            .group_by(UnresolvedQuery.query_text)
            .order_by(text("cnt DESC"))
            .limit(10)
        )
        top_queries = [QueryFrequency(query=row[0], count=row[1]) for row in top_queries_result]

        # Conversations per day
        daily_result = await db.execute(
            select(
                func.date(Conversation.started_at).label("date"),
                func.count(Conversation.id).label("conversations"),
            )
            .where(*filters)
            .group_by(func.date(Conversation.started_at))
            .order_by(func.date(Conversation.started_at).desc())
            .limit(days)
        )
        daily_rows = list(daily_result)

        # Messages per day (grouped by message created_at date)
        msg_daily_q = (
            select(
                func.date(ConversationMessage.created_at).label("date"),
                func.count(ConversationMessage.id).label("messages"),
            )
            .where(*msg_filters)
            .group_by(func.date(ConversationMessage.created_at))
        )
        msg_daily_result = await db.execute(msg_daily_q)
        msgs_by_date: dict[str, int] = {str(row[0]): row[1] for row in msg_daily_result}

        usage_by_day = [
            DailyUsage(
                date=str(row[0]),
                conversations=row[1],
                messages=msgs_by_date.get(str(row[0]), 0),
            )
            for row in daily_rows
        ]

        # Leads per day
        leads_daily_result = await db.execute(
            select(
                func.date(Lead.created_at).label("date"),
                func.count(Lead.id).label("count"),
            )
            .where(*lead_filters)
            .group_by(func.date(Lead.created_at))
            .order_by(func.date(Lead.created_at).desc())
            .limit(days)
        )
        leads_by_day = [LeadDaily(date=str(row[0]), count=row[1]) for row in leads_daily_result]

        return AnalyticsOverview(
            total_conversations=total_conversations,
            total_messages=total_messages,
            unresolved_count=unresolved_count,
            lead_count=lead_count,
            top_queries=top_queries,
            usage_by_day=usage_by_day,
            leads_by_day=leads_by_day,
        )
