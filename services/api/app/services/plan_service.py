from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.plan_limits import PlanLimits, get_limits, is_unlimited
from app.models import Bot, Conversation, KnowledgeSource, Organization, User
from app.models.plan import Plan


async def _get_plan_limits(db: AsyncSession, plan_slug: str) -> PlanLimits:
    """Load plan limits from DB; fall back to hardcoded defaults if plan row not found."""
    result = await db.execute(select(Plan).where(Plan.slug == plan_slug, Plan.is_active.is_(True)))
    plan_row = result.scalar_one_or_none()
    if plan_row:
        return PlanLimits(
            max_bots=plan_row.max_bots,
            max_sources=plan_row.max_sources,
            max_conversations_per_month=plan_row.max_conversations_per_month,
            max_team_members=plan_row.max_team_members,
            max_pages_per_crawl=plan_row.max_pages_per_crawl,
            allow_crawl=plan_row.allow_crawl,
            allow_file_upload=plan_row.allow_file_upload,
        )
    return get_limits(plan_slug)


class PlanService:

    @staticmethod
    async def get_org_plan(db: AsyncSession, org_id: str) -> str:
        result = await db.execute(
            select(Organization.plan).where(Organization.id == org_id)
        )
        return result.scalar_one_or_none() or "free"

    @staticmethod
    async def get_limits_for_org(db: AsyncSession, org_id: str) -> PlanLimits:
        plan = await PlanService.get_org_plan(db, org_id)
        return await _get_plan_limits(db, plan)

    # ── Bot limit ────────────────────────────────────────────────
    @staticmethod
    async def check_bot_limit(db: AsyncSession, org_id: str) -> None:
        limits = await PlanService.get_limits_for_org(db, org_id)
        if is_unlimited(limits.max_bots):
            return
        count = (await db.execute(
            select(func.count()).select_from(Bot)
            .where(Bot.org_id == org_id, Bot.deleted_at.is_(None))
        )).scalar() or 0
        if count >= limits.max_bots:
            raise HTTPException(
                status_code=402,
                detail=f"Bot limit reached ({limits.max_bots} on your plan). Upgrade to add more bots.",
            )

    # ── Source limit ─────────────────────────────────────────────
    @staticmethod
    async def check_source_limit(db: AsyncSession, org_id: str, workspace_id: str) -> None:
        limits = await PlanService.get_limits_for_org(db, org_id)
        if is_unlimited(limits.max_sources):
            return
        count = (await db.execute(
            select(func.count()).select_from(KnowledgeSource)
            .where(
                KnowledgeSource.workspace_id == workspace_id,
                KnowledgeSource.deleted_at.is_(None),
            )
        )).scalar() or 0
        if count >= limits.max_sources:
            raise HTTPException(
                status_code=402,
                detail=f"Knowledge source limit reached ({limits.max_sources} on your plan). Upgrade to add more sources.",
            )

    # ── Conversation limit (monthly) ─────────────────────────────
    @staticmethod
    async def check_conversation_limit(db: AsyncSession, org_id: str, workspace_id: str) -> None:
        limits = await PlanService.get_limits_for_org(db, org_id)
        if is_unlimited(limits.max_conversations_per_month):
            return
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        count = (await db.execute(
            select(func.count()).select_from(Conversation)
            .where(
                Conversation.workspace_id == workspace_id,
                Conversation.started_at >= month_start,
                Conversation.deleted_at.is_(None),
            )
        )).scalar() or 0
        if count >= limits.max_conversations_per_month:
            raise HTTPException(
                status_code=402,
                detail=f"Monthly conversation limit reached ({limits.max_conversations_per_month} on your plan). Upgrade for more.",
            )

    # ── Crawl permission ─────────────────────────────────────────
    @staticmethod
    async def check_crawl_permission(db: AsyncSession, org_id: str) -> None:
        limits = await PlanService.get_limits_for_org(db, org_id)
        if not limits.allow_crawl:
            raise HTTPException(
                status_code=402,
                detail="Web crawler ingestion is not available on your plan. Upgrade to Pro or higher.",
            )

    # ── File upload permission ───────────────────────────────────
    @staticmethod
    async def check_file_upload_permission(db: AsyncSession, org_id: str) -> None:
        limits = await PlanService.get_limits_for_org(db, org_id)
        if not limits.allow_file_upload:
            raise HTTPException(
                status_code=402,
                detail="File upload ingestion is not available on your plan. Upgrade to access this feature.",
            )

    # ── Team member limit ────────────────────────────────────────
    @staticmethod
    async def check_team_member_limit(db: AsyncSession, org_id: str) -> None:
        limits = await PlanService.get_limits_for_org(db, org_id)
        if is_unlimited(limits.max_team_members):
            return
        count = (await db.execute(
            select(func.count()).select_from(User)
            .where(User.org_id == org_id, User.deleted_at.is_(None))
        )).scalar() or 0
        if count >= limits.max_team_members:
            raise HTTPException(
                status_code=402,
                detail=f"Team member limit reached ({limits.max_team_members} on your plan). Upgrade to add more members.",
            )

    # ── Usage summary ─────────────────────────────────────────────
    @staticmethod
    async def get_usage(db: AsyncSession, org_id: str, workspace_id: str) -> dict:
        plan = await PlanService.get_org_plan(db, org_id)
        limits = await _get_plan_limits(db, plan)

        bot_count = (await db.execute(
            select(func.count()).select_from(Bot)
            .where(Bot.org_id == org_id, Bot.deleted_at.is_(None))
        )).scalar() or 0

        source_count = (await db.execute(
            select(func.count()).select_from(KnowledgeSource)
            .where(KnowledgeSource.workspace_id == workspace_id, KnowledgeSource.deleted_at.is_(None))
        )).scalar() or 0

        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        conv_count = (await db.execute(
            select(func.count()).select_from(Conversation)
            .where(
                Conversation.workspace_id == workspace_id,
                Conversation.started_at >= month_start,
                Conversation.deleted_at.is_(None),
            )
        )).scalar() or 0

        member_count = (await db.execute(
            select(func.count()).select_from(User)
            .where(User.org_id == org_id, User.deleted_at.is_(None))
        )).scalar() or 0

        return {
            "plan": plan,
            "bots":          {"used": bot_count,    "limit": limits.max_bots},
            "sources":       {"used": source_count,  "limit": limits.max_sources},
            "conversations": {"used": conv_count,    "limit": limits.max_conversations_per_month},
            "team_members":  {"used": member_count,  "limit": limits.max_team_members},
            "allow_crawl":        limits.allow_crawl,
            "allow_file_upload":  limits.allow_file_upload,
        }
