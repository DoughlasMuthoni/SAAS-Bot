from dataclasses import dataclass


@dataclass(frozen=True)
class PlanLimits:
    max_bots: int                       # -1 = unlimited
    max_sources: int
    max_conversations_per_month: int
    max_team_members: int               # -1 = unlimited
    max_pages_per_crawl: int            # 0 = not allowed, -1 = unlimited
    allow_crawl: bool
    allow_file_upload: bool
    allow_custom_branding: bool = False


PLAN_LIMITS: dict[str, PlanLimits] = {
    "free": PlanLimits(
        max_bots=1,
        max_sources=5,
        max_conversations_per_month=500,
        max_team_members=1,
        max_pages_per_crawl=0,
        allow_crawl=False,
        allow_file_upload=True,
        allow_custom_branding=False,
    ),
    "pro": PlanLimits(
        max_bots=3,
        max_sources=15,
        max_conversations_per_month=5_000,
        max_team_members=2,
        max_pages_per_crawl=50,
        allow_crawl=True,
        allow_file_upload=True,
        allow_custom_branding=True,
    ),
    "enterprise": PlanLimits(
        max_bots=-1,
        max_sources=-1,
        max_conversations_per_month=-1,
        max_team_members=-1,
        max_pages_per_crawl=-1,
        allow_crawl=True,
        allow_file_upload=True,
        allow_custom_branding=True,
    ),
}


def get_limits(plan: str) -> PlanLimits:
    return PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])


def is_unlimited(value: int) -> bool:
    return value == -1
