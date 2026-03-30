import httpx
import os
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from api.schemas import ArticleOut

NEWS_API_KEY  = os.getenv("NEWS_API_KEY", "")
NEWS_API_BASE = "https://newsdata.io/api/1/news"

# ── RSS Feeds — English (national) ───────────────────────────────────────────
ENGLISH_RSS_FEEDS = [
    ("Times of India",  "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms"),
    ("The Hindu",       "https://www.thehindu.com/feeder/default.rss"),
    ("NDTV",            "https://feeds.feedburner.com/ndtvnews-top-stories"),
    ("India Today",     "https://www.indiatoday.in/rss/home"),
]

# ── RSS Feeds — Telugu (regional) ────────────────────────────────────────────
TELUGU_RSS_FEEDS = [
    ("NTV Telugu",        "https://ntvtelugu.com/feed"),
    ("Mana Telangana",    "https://manatelangana.news/feed"),
    ("Nava Telangana",    "https://navatelangana.com/feed"),
    ("Telugu Bulletin",   "https://telugubulletin.com/feed"),
    ("TV5 News",          "https://tv5news.in/feed"),
    ("Oneindia Telugu",   "https://telugu.oneindia.com/rss/telugu-news.xml"),
]


# ── NewsData.io ───────────────────────────────────────────────────────────────

async def _fetch_newsdata(topic: str, page_size: int) -> list[ArticleOut]:
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
            print(f"[newsdata] failed: {e}")
            return []

    if data.get("status") != "success" or not data.get("results"):
        print(f"[newsdata] {data.get('status')} — {data.get('message', '')}")
        return []

    return [
        ArticleOut(
            title        = a.get("title")       or "",
            source       = a.get("source_name") or a.get("source_id") or "NewsData",
            description  = a.get("description") or "",
            url          = a.get("link")         or "",
            published_at = a.get("pubDate")      or "",
        )
        for a in data["results"][:page_size]
    ]


# ── RSS Parser ────────────────────────────────────────────────────────────────

async def _fetch_rss_feeds(topic: str, feeds: list, page_size: int) -> list[ArticleOut]:
    """
    Fetches given RSS feeds, filters by topic keyword,
    returns matched ArticleOut list.
    """
    topic_lower = topic.lower()
    matched: list[ArticleOut] = []

    async with httpx.AsyncClient(timeout=10.0) as client:
        for source_name, feed_url in feeds:
            try:
                resp = await client.get(feed_url)
                resp.raise_for_status()

                # Some feeds return with encoding issues — handle gracefully
                content = resp.text
                root = ET.fromstring(content)
            except Exception as e:
                print(f"[rss] {source_name} failed: {e}")
                continue

            items = root.findall(".//item")
            for item in items:
                title       = item.findtext("title")       or ""
                description = item.findtext("description") or ""
                link        = item.findtext("link")        or ""
                pub_date    = item.findtext("pubDate")     or ""

                combined = (title + " " + description).lower()
                if topic_lower in combined:
                    matched.append(ArticleOut(
                        title        = title.strip(),
                        source       = source_name,
                        description  = description.strip()[:300],
                        url          = link.strip(),
                        published_at = pub_date.strip(),
                    ))

    print(f"[rss] {len(matched)} articles matched '{topic}'")
    return matched[:page_size]


# ── Deduplicator ──────────────────────────────────────────────────────────────

def _deduplicate(articles: list[ArticleOut]) -> list[ArticleOut]:
    seen   = set()
    unique = []
    for a in articles:
        key = a.title.lower().strip()[:60]
        if key and key not in seen:
            seen.add(key)
            unique.append(a)
    return unique


# ── Main fetch function ───────────────────────────────────────────────────────

async def fetch_headlines(topic: str, page_size: int = 8) -> list[ArticleOut]:
    """
    Fetches from 3 sources in priority order:
    1. NewsData.io        — international real-time news
    2. English RSS feeds  — TOI, The Hindu, NDTV, India Today
    3. Telugu RSS feeds   — NTV Telugu, TV5, Mana Telangana, etc.

    Combines all, deduplicates, returns best page_size articles.
    """
    # Source 1 — NewsData.io
    newsdata = await _fetch_newsdata(topic, page_size)

    # Source 2 — English RSS
    english_rss = await _fetch_rss_feeds(topic, ENGLISH_RSS_FEEDS, page_size)

    # Source 3 — Telugu RSS
    telugu_rss = await _fetch_rss_feeds(topic, TELUGU_RSS_FEEDS, page_size)

    # Combine all sources — newsdata first (most reliable), then english, then telugu
    all_articles = newsdata + english_rss + telugu_rss

    # Deduplicate
    unique = _deduplicate(all_articles)

    print(f"[fetch_headlines] '{topic}' — newsdata:{len(newsdata)} english_rss:{len(english_rss)} telugu_rss:{len(telugu_rss)} unique:{len(unique)}")

    return unique[:page_size]