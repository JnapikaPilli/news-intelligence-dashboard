from api.schemas import ArticleOut


def articles_to_chunks(
    articles: list[ArticleOut],
    chunk_size: int = 300,
    overlap: int = 50,
) -> list[dict]:
    chunks = []

    for article in articles:
        passage = " ".join(filter(None, [article.title, article.description])).strip()
        if not passage:
            continue

        start       = 0
        chunk_index = 0

        while start < len(passage):
            end  = min(start + chunk_size, len(passage))
            text = passage[start:end].strip()

            if text:
                chunks.append({
                    "text":        text,
                    "title":       article.title,
                    "source":      article.source,
                    "url":         article.url or "",
                    "chunk_index": chunk_index,
                })

            chunk_index += 1
            start += chunk_size - overlap

    return chunks
