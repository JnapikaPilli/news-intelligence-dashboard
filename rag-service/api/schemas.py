from pydantic import BaseModel, Field
from typing import Optional


# ── Request models ────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=300)
    page_size: int = Field(default=8, ge=1, le=20)
    use_rag: bool = Field(default=True)


class IngestRequest(BaseModel):
    topic: str
    page_size: int = Field(default=10, ge=1, le=50)


# ── Response models ───────────────────────────────────────────────────────────

class ArticleOut(BaseModel):
    title: str
    source: str
    description: Optional[str] = None
    url: Optional[str] = None
    published_at: Optional[str] = None


class SentimentOut(BaseModel):
    positive: int
    negative: int
    neutral: int


class SearchResponse(BaseModel):
    query: str
    summary: str
    sentiment: SentimentOut
    headlines: list[str]
    trend: str
    trend_emoji: str
    fetched_at: str
    source_articles: list[ArticleOut]


# ── Auth models ───────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str
