import httpx
import json
import re
import os
import asyncio
from datetime import date


async def _call_groq(prompt: str, api_key: str, max_tokens: int = 1000) -> str:
    payload = {
        "model":       "llama-3.3-70b-versatile",
        "messages":    [{"role": "user", "content": prompt}],
        "temperature": 0.2,
        "max_tokens":  max_tokens,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Content-Type":  "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()


async def generate_with_rag(query: str, rag_context: str, headlines_context: str) -> dict:
    today    = date.today().isoformat()
    api_key  = os.getenv("GROQ_API_KEY", "")
    context  = f"{rag_context}\n\n{headlines_context}".strip()

    # ── Call 1: summary ──────────────────────────────────────────────────────
    summary_prompt = f"""You are a news journalist. Today is {today}. Topic: "{query}"

Context:
{context}

Write a 4-5 paragraph news summary about "{query}" based on the context above.
Use plain text only. No bullet points. No headers. No quotes. No special characters.
Just flowing paragraphs."""

    summary = await _call_groq(summary_prompt, api_key, max_tokens=1500)
    await asyncio.sleep(0.5)

    # ── Call 2: structured metadata ──────────────────────────────────────────
    meta_prompt = f"""Based on this news topic: "{query}"

Return exactly this — replace values only, keep exact format:
POSITIVE=60
NEGATIVE=15
NEUTRAL=25
TREND=Rising
EMOJI=📈
H1=[Source Name] Headline one here
H2=[Source Name] Headline two here
H3=[Source Name] Headline three here
H4=[Source Name] Headline four here

Rules:
- POSITIVE+NEGATIVE+NEUTRAL must equal 100
- TREND must be one of: Rising, Falling, Stable, Volatile
- Use headlines from this context if available:
{headlines_context}"""

    meta = await _call_groq(meta_prompt, api_key, max_tokens=300)

    # ── Parse metadata ────────────────────────────────────────────────────────
    def extract(pattern, text, default):
        m = re.search(pattern, text)
        return m.group(1).strip() if m else default

    pos  = int(extract(r'POSITIVE=(\d+)', meta, '50'))
    neg  = int(extract(r'NEGATIVE=(\d+)', meta, '20'))
    neu  = int(extract(r'NEUTRAL=(\d+)',  meta, '30'))
    trend      = extract(r'TREND=(\w+)',  meta, 'Stable')
    trend_emoji= extract(r'EMOJI=(\S+)',  meta, '📊')

    headlines = []
    for i in range(1, 5):
        h = extract(rf'H{i}=(.+)', meta, '')
        if h:
            headlines.append(h)

    # Normalise sentiment
    total = pos + neg + neu
    if total != 100:
        scale = 100 / (total or 1)
        pos   = round(pos * scale)
        neg   = round(neg * scale)
        neu   = 100 - pos - neg

    # Clean summary
    summary = re.sub(r"<[^>]+>", "", summary)
    summary = re.sub(r"\s{2,}", " ", summary).strip()

    return {
        "summary":    summary,
        "sentiment":  {"positive": pos, "negative": neg, "neutral": neu},
        "headlines":  headlines,
        "trend":      trend,
        "trend_emoji": trend_emoji,
    }
