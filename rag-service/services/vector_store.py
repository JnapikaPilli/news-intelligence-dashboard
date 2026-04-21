import logging
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()
        self.index = faiss.IndexFlatL2(self.dimension)
        self.chunks = []
        self.metadata = []

    def add_texts(self, texts: list, meta: list = None):
        """Generates embeddings and adds to FAISS index."""
        logger.info(f"Adding {len(texts)} chunks to vector store.")
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        self.index.add(embeddings)
        self.chunks.extend(texts)
        if meta:
            self.metadata.extend(meta)
        else:
            self.metadata.extend([{} for _ in texts])

    def search(self, query: str, k: int = 3):
        """Returns top k chunks matching the query."""
        if self.index.ntotal == 0:
            return []
        
        query_vector = self.model.encode([query], convert_to_numpy=True)
        distances, indices = self.index.search(query_vector, k)
        
        results = []
        for i in range(len(indices[0])):
            idx = indices[0][i]
            if idx != -1:
                results.append({
                    "chunk": self.chunks[idx],
                    "metadata": self.metadata[idx],
                    "distance": float(distances[0][i])
                })
        return results

# Singleton instance for simplicity
vector_store = VectorStore()
