from api.schemas import ArticleOut
from rag.embedder  import embed_and_store
from rag.retriever import get_relevant_context
from rag.generator import generate_with_rag


async def run_rag_pipeline(
    query: str,
    articles: list[ArticleOut],
    use_rag: bool = True,
) -> dict:
    # Only embed if we have articles
    if articles:
        await embed_and_store(topic=query, articles=articles)

    # Retrieve relevant context if available
    rag_context = await get_relevant_context(query, top_k=5) if use_rag else ""

    # Format headlines context
    headlines_context = _format_headlines(articles) if articles else ""

    # Generate — works even with no articles, Groq uses its own knowledge
    result = await generate_with_rag(
        query=query,
        rag_context=rag_context,
        headlines_context=headlines_context,
    )

    # Override headlines with real NewsAPI titles if available
    if len(articles) >= 4:
        result["headlines"] = [f"[{a.source}] {a.title}" for a in articles[:4]]
    elif articles:
        real = [f"[{a.source}] {a.title}" for a in articles]
        result["headlines"] = (real + result.get("headlines", []))[:4]

    return result


def _format_headlines(articles: list[ArticleOut]) -> str:
    if not articles:
        return ""
    lines = [
        f"{i+1}. [{a.source}] {a.title} — {a.description or ''}"
        for i, a in enumerate(articles)
    ]
    return "\n\nREAL HEADLINES FROM NEWSAPI:\n" + "\n".join(lines)
