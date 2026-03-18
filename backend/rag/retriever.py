from rag.embedder import retrieve_similar


async def get_relevant_context(query: str, top_k: int = 5) -> str:
    chunks = await retrieve_similar(query, top_k=top_k)

    if not chunks:
        return ""

    lines = [
        f"[{i+1}] ({chunk.get('source', 'Unknown')}) {chunk.get('title', '')}\n{chunk.get('text', '')}"
        for i, chunk in enumerate(chunks)
    ]

    return "\n\n".join(lines)
