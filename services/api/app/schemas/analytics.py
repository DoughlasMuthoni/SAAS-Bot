from pydantic import BaseModel


class QueryFrequency(BaseModel):
    query: str
    count: int


class DailyUsage(BaseModel):
    date: str
    conversations: int
    messages: int


class AnalyticsOverview(BaseModel):
    total_conversations: int
    total_messages: int
    unresolved_count: int
    lead_count: int
    top_queries: list[QueryFrequency]
    usage_by_day: list[DailyUsage]
