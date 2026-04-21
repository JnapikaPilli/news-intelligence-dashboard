import os
import json
import faiss
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer

from api.schemas import ArticleOut
from rag.chunker import articles_to_chunks

EMBED_MODEL   = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")
FAISS_DIR     = Path("data/faiss_index")
METADATA_FILE = FAISS_DIR / "metadata.json"
INDEX_FILE    = FAISS_DIR / "index.faiss"

FAISS_DIR.mkdir(parents=True, exist_ok=True)

_model: SentenceTransformer | None = None
_index: faiss.IndexFlatL2 | None   = None
_metadata: list[dict]              = []


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBED_MODEL)
    return _model


def _load_index() -> tuple[faiss.IndexFlatL2, list[dict]]:
    global _index, _metadata

    if _index is not None:
        return _index, _metadata

    if INDEX_FILE.exists() and METADATA_FILE.exists():
        _index    = faiss.read_index(str(INDEX_FILE))
        _metadata = json.loads(METADATA_FILE.read_text())
    else:
        dim       = _get_model().get_sentence_embedding_dimension()
        _index    = faiss.IndexFlatL2(dim)
        _metadata = []

    return _index, _metadata


def _save_index(index: faiss.IndexFlatL2, metadata: list[dict]):
    faiss.write_index(index, str(INDEX_FILE))
    METADATA_FILE.write_text(json.dumps(metadata, ensure_ascii=False))


async def embed_and_store(topic: str, articles: list[ArticleOut]) -> int:
    model           = _get_model()
    index, metadata = _load_index()

    chunks = articles_to_chunks(articles)
    if not chunks:
        return 0

    texts   = [c["text"] for c in chunks]
    vectors = model.encode(texts, batch_size=32, show_progress_bar=False)
    vectors = np.array(vectors, dtype="float32")

    index.add(vectors)
    for chunk in chunks:
        metadata.append({**chunk, "topic": topic})

    _save_index(index, metadata)
    return len(chunks)


async def retrieve_similar(query: str, top_k: int = 5) -> list[dict]:
    model           = _get_model()
    index, metadata = _load_index()

    if index.ntotal == 0:
        return []

    q_vec              = np.array(model.encode([query]), dtype="float32")
    k                  = min(top_k, index.ntotal)
    distances, indices = index.search(q_vec, k)

    return [
        {**metadata[idx], "score": float(dist)}
        for dist, idx in zip(distances[0], indices[0])
        if idx < len(metadata)
    ]
