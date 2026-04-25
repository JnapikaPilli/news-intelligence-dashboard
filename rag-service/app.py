from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sys
import os
import logging

# Add root folder to sys path to import ml
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ml.models import summarize_text
from services.vector_store import vector_store
from services.pdf_extractor import extract_text_from_pdf, chunk_text

logger = logging.getLogger(__name__)

app = FastAPI(title="RAG Service MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    documentId: Optional[str] = None

class SummarizeRequest(BaseModel):
    section: str
    documentId: Optional[str] = None

class ArticleItem(BaseModel):
    id: str
    text: str

class BatchSummarizeRequest(BaseModel):
    articles: List[ArticleItem]

@app.post("/summarize-articles")
async def summarize_articles(request: BatchSummarizeRequest):
    summaries = []
    for article in request.articles:
        try:
            bullet_points = summarize_text(article.text)
            if not bullet_points:
                bullet_points = ["Summary not available"]
            summaries.append({
                "id": article.id,
                "bullet_summary": bullet_points
            })
        except Exception as e:
            logger.error(f"Failed to summarize article {article.id}: {str(e)}")
            summaries.append({
                "id": article.id,
                "bullet_summary": ["Summary not available"]
            })
    return {"summaries": summaries}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    print(f"File received: {file.filename}")
    
    file_bytes = await file.read()
    pages_data = extract_text_from_pdf(file_bytes)
    
    if not pages_data:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
        
    # Print extracted text sample as requested
    full_text = " ".join([p["text"] for p in pages_data])
    print("\n--- EXTRACTED TEXT (First 500 chars) ---")
    print(full_text[:500] + "...")
        
    chunks_with_meta = chunk_text(pages_data, chunk_size=400)
    
    chunks = [c["chunk"] for c in chunks_with_meta]
    metadata = [{"source": file.filename, "type": "pdf", "page": c["page"]} for c in chunks_with_meta]
    
    print(f"--- NUMBER OF CHUNKS: {len(chunks)} ---\n")
    
    vector_store.add_texts(chunks, metadata)
    
    return {"message": "Document processed and stored successfully", "chunks": len(chunks)}


@app.post("/query")
async def query_document(request: QueryRequest):
    results = vector_store.search(request.query, k=3)
    
    if not results:
        return {"answer": ["No relevant context found."], "source_chunks": [], "page_numbers": []}
        
    print("\n--- SIMILARITY SCORES ---")
    for r in results:
        print(f"Score (L2 dist): {r['distance']:.4f} | Chunk: {r['chunk'][:60]}...")
    print("-------------------------\n")
    
    context_text = " ".join([r['chunk'] for r in results])
    bullet_points = summarize_text(context_text, max_length=150, min_length=40)
    
    source_chunks = [r['chunk'] for r in results]
    sources = [r['metadata'].get('source', 'Unknown') for r in results]
    page_numbers = [r['metadata'].get('page', 1) for r in results]
    
    return {
        "answer": bullet_points,
        "source_chunks": source_chunks,
        "page_numbers": page_numbers,
        "source_titles": list(set(sources))
    }

@app.post("/summarize-section")
async def summarize_section(request: SummarizeRequest):
    # Retrieve relevant texts for the specified section
    results = vector_store.search(request.section, k=5)
    if not results:
         raise HTTPException(status_code=404, detail="Section not found in documents.")
         
    context_text = " ".join([r['chunk'] for r in results])
    bullet_points = summarize_text(context_text, max_length=100, min_length=30)
    
    return {"summary": bullet_points}

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "RAG Python API"}

@app.get("/test")
def test_connection():
    return {"message": "FastAPI working"}
