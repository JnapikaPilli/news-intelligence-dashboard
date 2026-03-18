const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── Main search — hits the FastAPI RAG backend ───────────────────────────────

export async function searchNews(topic) {
  const res = await fetch(`${API_BASE}/api/news/search`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ query: topic, use_rag: true }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }

  const data = await res.json();

  // Normalise backend response shape to match what ResultPage expects
  return {
    summary:    data.summary,
    sentiment:  data.sentiment,
    headlines:  data.headlines,
    trend:      data.trend,
    trendEmoji: data.trend_emoji,   // backend uses snake_case
    fetchedAt:  data.fetched_at,
    isRealtime: true,
  };
}

// ─── Trending topics for homepage pills ──────────────────────────────────────

export async function fetchTrendingTopics() {
  try {
    const res  = await fetch(`${API_BASE}/api/news/trending`);
    const data = await res.json();
    return data.topics || [];
  } catch (_) {
    return ["AI", "Climate Change", "Stock Market", "Cricket", "Elections", "SpaceX"];
  }
}
