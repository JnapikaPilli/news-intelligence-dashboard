import logging
import faiss
import numpy as np
import os

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

from transformers import AutoTokenizer, AutoModel
import torch

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self, model_name="BAAI/bge-small-en-v1.5", model=None):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Loading High-Accuracy Embeddings ({model_name}) on {self.device} (Bypass Mode)...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name).to(self.device)
        self.model.eval()
        
        self.query_instruction = "Represent this sentence for searching relevant passages: "
        self.dimension = 384 # BGE-Small dimension
        self.index = faiss.IndexFlatL2(self.dimension)
        self.chunks = []
        self.metadata = []

    def _get_embeddings(self, texts):
        """Pure transformer embedding generation to bypass blocked libraries."""
        with torch.no_grad():
            encoded_input = self.tokenizer(texts, padding=True, truncation=True, return_tensors='pt').to(self.device)
            model_output = self.model(**encoded_input)
            # Mean Pooling
            token_embeddings = model_output[0]
            attention_mask = encoded_input['attention_mask']
            input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
            embeddings = torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)
            # Normalize
            embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
            return embeddings.cpu().numpy()

    def clear(self):
        """Resets the vector store index and chunks."""
        self.index = faiss.IndexFlatL2(self.dimension)
        self.chunks = []
        self.metadata = []

    def add_texts(self, texts: list, meta: list = None):
        """Generates embeddings and adds to FAISS index."""
        logger.info(f"Adding {len(texts)} chunks to vector store.")
        embeddings = self._get_embeddings(texts)
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
        query_vector = self._get_embeddings([full_query])
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
