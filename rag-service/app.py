from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sys
import os

# Add root folder to sys path to import ml
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ml.models import summarize_text
from services.vector_store import vector_store
from services.pdf_extractor import extract_text_from_pdf, chunk_text

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

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported currently.")
    
    file_bytes = await file.read()
    text = extract_text_from_pdf(file_bytes)
    
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
        
    chunks = chunk_text(text)
    
    # Store with mock metadata for now
    metadata = [{"source": file.filename, "type": "pdf"} for _ in chunks]
    vector_store.add_texts(chunks, metadata)
    
    return {"message": "Document processed and stored successfully", "chunks": len(chunks)}


@app.post("/query")
async def query_document(request: QueryRequest):
    results = vector_store.search(request.query, k=3)
    
    if not results:
        return {"answer": ["No relevant context found."], "source_chunks": []}
    
    # Simple formatting of answer using context. In full RAG, you'd feed this to a LLM generative model like BART or T5
    # Since we need 4-6 bullet points, we will simulate a bullet generation extracting sentences.
    
    context_text = " ".join([r['chunk'] for r in results])
    bullet_points = summarize_text(context_text, max_length=150, min_length=40)
    
    source_chunks = [r['chunk'] for r in results]
    sources = [r['metadata'].get('source', 'Unknown') for r in results]
    
    return {
        "answer": bullet_points,
        "source_chunks": source_chunks,
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
