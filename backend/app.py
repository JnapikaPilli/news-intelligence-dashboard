from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.news_routes import router as news_router
from api.auth_routes import router as auth_router

app = FastAPI(
    title="NewsLens Intelligence API",
    description="RAG-powered news summarisation with vector search",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(news_router, prefix="/api/news", tags=["News"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "NewsLens API"}
