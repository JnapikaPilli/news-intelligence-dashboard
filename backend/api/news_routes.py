from fastapi import APIRouter, HTTPException, BackgroundTasks
from datetime import datetime

from api.schemas import SearchRequest, SearchResponse, IngestRequest
from services.news_fetcher import fetch_headlines
from rag.pipeline import run_rag_pipeline
from rag.embedder import embed_and_store

router = APIRouter()


@router.post("/search", response_model=SearchResponse)
async def search_news(body: SearchRequest):
    # Try to fetch articles — but don't fail if none found
    articles = await fetch_headlines(body.query, page_size=body.page_size)

    try:
        result = await run_rag_pipeline(
            query=body.query,
            articles=articles,   # can be empty list — pipeline handles it
            use_rag=body.use_rag,
        )
    except Exception as e:
        msg = str(e)
        print(f"[search] pipeline error: {msg}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {msg}")

    return SearchResponse(
        query=body.query,
        summary=result["summary"],
        sentiment=result["sentiment"],
        headlines=result["headlines"],
        trend=result["trend"],
        trend_emoji=result["trend_emoji"],
        fetched_at=datetime.now().strftime("%I:%M %p"),
        source_articles=articles,
    )


@router.post("/ingest")
async def ingest_topic(body: IngestRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(_ingest_background, body.topic, body.page_size)
    return {"message": f"Ingestion started for '{body.topic}'", "status": "queued"}


async def _ingest_background(topic: str, page_size: int):
    articles = await fetch_headlines(topic, page_size=page_size)
    if articles:
        await embed_and_store(topic=topic, articles=articles)


@router.get("/trending")
async def get_trending():
    return {
        "topics": ["AI", "Climate Change", "Stock Market", "Cricket", "Elections", "SpaceX"]
    }
