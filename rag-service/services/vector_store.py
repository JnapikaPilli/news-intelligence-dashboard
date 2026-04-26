import logging
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

import torch

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self, model_name="BAAI/bge-small-en-v1.5", model=None):
        device = "cuda" if torch.cuda.is_available() else "cpu"
        if model:
            self.model = model
        else:
            logger.info(f"Loading High-Accuracy Embeddings ({model_name}) on {device}...")
            self.model = SentenceTransformer(model_name, device=device)
        
        # BGE models work best with this prefix for queries
        self.query_instruction = "Represent this sentence for searching relevant passages: "
        
        # Rename fix for newer sentence-transformers
        if hasattr(self.model, "get_embedding_dimension"):
            self.dimension = self.model.get_embedding_dimension()
        else:
            self.dimension = self.model.get_sentence_embedding_dimension()
            
        self.index = faiss.IndexFlatL2(self.dimension)
        self.chunks = []
        self.metadata = []

    def clear(self):
        """Resets the vector store index and chunks."""
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
        """Returns top k chunks matching the query with BGE instruction."""
        if self.index.ntotal == 0:
            return []
        
        # Add instruction prefix for BGE
        full_query = self.query_instruction + query
        query_vector = self.model.encode([full_query], convert_to_numpy=True)
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
