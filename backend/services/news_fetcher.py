import httpx
import os
from api.schemas import ArticleOut

NEWS_API_KEY  = os.getenv("NEWS_API_KEY", "YOUR_NEWSDATA_KEY")
NEWS_API_BASE = "https://newsdata.io/api/1/news"


async def fetch_headlines(topic: str, page_size: int = 8) -> list[ArticleOut]:
    params = {
        "q":        topic,
        "language": "en",
        "apikey":   NEWS_API_KEY,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(NEWS_API_BASE, params=params)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            print(f"[news_fetcher] request failed: {e}")
            return []

    if data.get("status") != "success" or not data.get("results"):
        print(f"[news_fetcher] bad response: {data.get('status')} — {data.get('message', '')}")
        return []

    articles = []
    for a in data["results"][:page_size]:
        articles.append(ArticleOut(
            title        = a.get("title")       or "",
            source       = a.get("source_name") or a.get("source_id") or "NewsData",
            description  = a.get("description") or "",
            url          = a.get("link")         or "",
            published_at = a.get("pubDate")      or "",
        ))

    return articles