from pydantic import BaseModel


class QueryFrequency(BaseModel):
    query: str
    count: int


class DailyUsage(BaseModel):
    date: str
    conversations: int
    messages: int


class LeadDaily(BaseModel):
    date: str
    count: int


class AnalyticsOverview(BaseModel):
    total_conversations: int
    total_messages: int
    unresolved_count: int
    lead_count: int
    total_cost_usd: float
    top_queries: list[QueryFrequency]
    usage_by_day: list[DailyUsage]
    leads_by_day: list[LeadDaily]
