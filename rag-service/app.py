from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sys
import os
import logging

# Add root folder to sys path to import ml
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ml.models import summarize_text, answer_question, generate_speech, translate_text, clean_news_content, warm_up
from services.vector_store import vector_store, VectorStore
from services.pdf_extractor import extract_text_from_pdf, chunk_text

class TTSRequest(BaseModel):
    text: str

logger = logging.getLogger(__name__)

app = FastAPI(title="RAG Service MVP")

@app.on_event("startup")
async def startup_event():
    # Warm up models on startup to avoid first-request lag
    warm_up()

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
    language: str = "en"

class SummarizeRequest(BaseModel):
    section: str
    documentId: Optional[str] = None
    language: str = "en"

class ArticleItem(BaseModel):
    id: str
    text: str

class SearchRAGRequest(BaseModel):
    query: str
    articles: List[ArticleItem]
    language: str = "en"

class BatchSummarizeRequest(BaseModel):
    articles: List[ArticleItem]
    language: str = "en"

class TranslateRequest(BaseModel):
    text: List[str]
    target_language: str
    use_premium: bool = False

@app.post("/translate")
async def translate_endpoint(request: TranslateRequest):
    try:
        translated_texts = []
        for s in request.text:
            translated_texts.append(translate_text(s, request.target_language))
        return {"translated_text": translated_texts}
    except Exception as e:
        logger.error(f"Batch Translation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize-articles")
async def summarize_articles(request: BatchSummarizeRequest):
    summaries = []
    for article in request.articles:
        try:
            bullet_points = summarize_text(article.text)
            
            # Translate each bullet point if needed
            if request.language != "en":
                bullet_points = [translate_text(b, request.language) for b in bullet_points]
                
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

@app.post("/search-rag")
async def search_rag(request: SearchRAGRequest):
    """
    RAG for Search: 
    1. Indexes the provided articles into a temporary store
    2. Queries the store for the most relevant context
    3. Returns a combined summary and the IDs of top articles
    """
    try:
        logger.info(f"--- Processing Search RAG: {request.language} ---")
        
        if not request.articles:
            logger.warning("No articles provided for search RAG")
            return {"summary": ["No articles provided for analysis."], "top_ids": [], "language": request.language}
        
        # Create temporary store sharing the model
        temp_store = VectorStore(model=vector_store.model)
        
        # Index articles
        texts = [clean_news_content(a.text) for a in request.articles]
        metadata = [{"id": a.id} for a in request.articles]
        logger.info(f"Indexing {len(texts)} articles into temporary store...")
        temp_store.add_texts(texts, metadata)
        
        # Search for top 10 relevant chunks to ensure broad context
        results = temp_store.search(request.query, k=10)
        
        if not results:
            logger.warning("No relevant insights found in articles.")
            return {"summary": ["No relevant insights found in articles."], "top_ids": [], "language": request.language}
            
        context_text = " ".join([r['chunk'] for r in results])
        logger.info(f"Synthesizing high-density intelligence for query...")
        bullet_points = summarize_text(
            context_text, 
            max_length=450, 
            min_length=200,
            prompt_prefix=f"Synthesize a detailed strategic intelligence report on '{request.query}' with AT LEAST 5 bullet points. Focus on facts, trends, and business impact from these news sources: "
        )
        
        # Translation Step
        if request.language != "en":
            bullet_points = [translate_text(b, request.language) for b in bullet_points]
        
        # Collect unique article IDs that were most relevant
        top_ids = list(dict.fromkeys([r['metadata']['id'] for r in results]))
        logger.info("Search RAG complete successfully.")
        
        return {
            "summary": bullet_points,
            "top_ids": top_ids[:5], # Return top 5 unique articles
            "language": request.language
        }
    except Exception as e:
        import traceback
        print(f"ERROR in search_rag: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        logger.info(f"--- Processing Upload: {file.filename} ---")
        
        file_bytes = await file.read()
        pages_data = extract_text_from_pdf(file_bytes)
        
        if not pages_data:
            logger.error("No text extracted from PDF")
            raise HTTPException(status_code=400, detail="No searchable text found in this PDF. It appears to be a scanned document or image-based file.")
            
        full_text = " ".join([p["text"] for p in pages_data])
        logger.info(f"Extracted {len(full_text)} chars across {len(pages_data)} pages")
            
        chunks_with_meta = chunk_text(pages_data, chunk_size=400)
        chunks = [c["chunk"] for c in chunks_with_meta]
        metadata = [{"source": file.filename, "type": "pdf", "page": c["page"]} for c in chunks_with_meta]
        
        logger.info(f"Generated {len(chunks)} text chunks")
        
        if not chunks:
            logger.warning("No valid chunks generated from extraction")
            return {"message": "Document received but no valid text chunks were found.", "chunks": 0}
            
        vector_store.add_texts(chunks, metadata)
        logger.info("Vector store updated successfully")
        
        return {
            "message": "Document processed and stored successfully", 
            "chunks": len(chunks),
            "filename": file.filename
        }
    except HTTPException as he:
        # Re-raise HTTPExceptions (like the 400 for bad PDFs) so they aren't masked as 500s
        raise he
    except Exception as e:
        import traceback
        logger.error(f"Critical processing error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query")
async def query_document(request: QueryRequest):
    # Use k=10 for broader context for the smarter Flan-T5 model
    results = vector_store.search(request.query, k=10)
    
    if not results:
        return {"answer": ["No relevant context found."], "source_chunks": [], "page_numbers": []}
        
    # Removed debug print to avoid Windows encoding issues with special characters (e.g. ₹)
    # print("\n--- RAG RETRIEVAL SCORES ---")
    # for r in results:
    #     print(f"Score: {r['distance']:.4f} | Chunk: {r['chunk'][:60]}...")
    # print("-------------------------\n")
    
    context_text = " ".join([r['chunk'] for r in results])
    
    # Use dedicated QA logic instead of generic summarization
    answer_bullets = answer_question(request.query, context_text)
    
    # Translation Step
    if request.language != "en":
        answer_bullets = [translate_text(b, request.language) for b in answer_bullets]
    
    source_chunks = [r['chunk'] for r in results]
    sources = [r['metadata'].get('source', 'Unknown') for r in results]
    page_numbers = [r['metadata'].get('page', 1) for r in results]
    
    return {
        "answer": answer_bullets,
        "source_chunks": source_chunks,
        "page_numbers": page_numbers,
        "source_titles": list(set(sources)),
        "language": request.language
    }

@app.post("/summarize-text")
async def summarize_text_direct(request: SummarizeRequest):
    try:
        # Directly summarize the provided text (for news)
        bullet_points = summarize_text(request.section)
        
        # Translation Step
        if request.language != "en":
            bullet_points = [translate_text(b, request.language) for b in bullet_points]
            
        return {"summary": bullet_points, "language": request.language}
    except Exception as e:
        logger.error(f"Summarize Text Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize-section")
async def summarize_section(request: SummarizeRequest):
    # Retrieve relevant texts for the specified section (for RAG)
    results = vector_store.search(request.section, k=5)
    if not results:
         raise HTTPException(status_code=404, detail="Section not found in documents.")
         
    context_text = " ".join([r['chunk'] for r in results])
    bullet_points = summarize_text(context_text, max_length=100, min_length=30)
    
    # Translation Step
    if request.language != "en":
        bullet_points = [translate_text(b, request.language) for b in bullet_points]
        
    return {"summary": bullet_points, "language": request.language}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    from fastapi.responses import JSONResponse
    
    # Check if it has status_code (like HTTPException)
    status_code = getattr(exc, "status_code", 500)
    detail = getattr(exc, "detail", str(exc))
    
    if status_code != 500:
        return JSONResponse(
            status_code=status_code,
            content={"success": False, "error": detail},
        )
    
    print(f"GLOBAL ERROR: {type(exc).__name__}: {str(exc)}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": f"Internal Server Error: {str(exc)}"},
    )

@app.post("/tts")
async def text_to_speech_endpoint(request: TTSRequest):
    try:
        audio_base64 = generate_speech(request.text)
        if not audio_base64:
            raise HTTPException(status_code=500, detail="Failed to generate audio")
        return {"audio": audio_base64}
    except Exception as e:
        logger.error(f"TTS Endpoint Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "RAG Python API"}

@app.get("/test")
def test_connection():
    return {"message": "FastAPI working"}

