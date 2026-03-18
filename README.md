# 📡 NewsLens — AI-Powered News Intelligence Dashboard

> Real-time news aggregation, RAG-based summarisation, and sentiment analysis — built with React, FastAPI, FAISS, and LLaMA 3.3 70B.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python)
![FAISS](https://img.shields.io/badge/FAISS-Vector_Search-FF6F00?style=flat)
![LLaMA](https://img.shields.io/badge/LLaMA_3.3_70B-Groq-F55036?style=flat)
![Deployment](https://img.shields.io/badge/Deployment-In_Progress-yellow?style=flat)

> 🚧 **Deployment in progress** — live demo link will be added soon.

---

## What is NewsLens?

NewsLens is a full-stack AI news intelligence platform that takes any search topic and delivers a comprehensive, journalist-style briefing in under 30 seconds. It aggregates live headlines from NewsData.io, stores them in a FAISS vector index, retrieves the most semantically relevant context via similarity search, and uses LLaMA 3.3 70B to generate a structured summary with sentiment analysis and trend detection.

---

## Architecture

```
User Query
    │
    ▼
React Frontend (Vite)
    │  POST /api/news/search
    ▼
FastAPI Backend
    ├── NewsData.io API       →  Fetch live articles
    ├── Chunker               →  Split articles into overlapping text chunks
    ├── HuggingFace MiniLM    →  Generate 384-dim sentence embeddings
    ├── FAISS Index           →  Store & similarity-search vectors
    ├── Retriever             →  Top-K relevant chunk retrieval
    └── Groq (LLaMA 3.3 70B) →  Generate summary, sentiment, trend
```

---

## Key Features

- **Live News Aggregation** — Fetches real-time articles from NewsData.io across 8+ sources
- **RAG Pipeline** — Retrieval-Augmented Generation using FAISS vector search for grounded, accurate summaries
- **Semantic Embeddings** — `all-MiniLM-L6-v2` (HuggingFace) for fast, accurate sentence-level embeddings
- **Sentiment Analysis** — Positive / Negative / Neutral breakdown with animated pie chart and bar visualisation
- **Trend Detection** — Rising / Falling / Stable / Volatile classification per topic
- **Prompt Injection Guard** — Input sanitisation layer before any LLM call
- **JWT Authentication** — Secure login with `python-jose`
- **Premium UI** — Cormorant Garamond + Syne typography, live news ticker, ambient glow effects, editorial dark theme
- **Modular Codebase** — Clean separation of constants, services, components, pages, and RAG modules

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework and dev server |
| Recharts | Sentiment pie chart visualisation |
| Cormorant Garamond + Syne + JetBrains Mono | Premium editorial typography |
| CSS Animations | Ticker tape, fade-up, ambient orbs, scan line |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | Async REST API framework |
| FAISS (faiss-cpu) | Vector similarity search index |
| sentence-transformers | HuggingFace all-MiniLM-L6-v2 embeddings |
| Groq API (LLaMA 3.3 70B) | LLM for summary and sentiment generation |
| NewsData.io | Live news article fetching |
| python-jose | JWT authentication |
| httpx | Async HTTP client |

---

## Project Structure

```
news-intelligence-dashboard/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── SentimentBar.jsx
│       │   ├── SentimentChart.jsx
│       │   ├── SourceChip.jsx
│       │   └── Spinner.jsx
│       ├── constants/
│       │   ├── colors.js
│       │   └── sources.js
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── LoadingPage.jsx
│       │   └── ResultPage.jsx
│       ├── services/
│       │   └── newsService.js
│       └── utils/
│           └── cleanSummary.js
│
└── backend/
    ├── app.py
    ├── api/
    │   ├── schemas.py
    │   ├── news_routes.py
    │   └── auth_routes.py
    ├── rag/
    │   ├── pipeline.py
    │   ├── chunker.py
    │   ├── embedder.py
    │   ├── retriever.py
    │   ├── generator.py
    │   └── prompt_guard.py
    └── services/
        └── news_fetcher.py
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Free [NewsData.io](https://newsdata.io) API key
- Free [Groq](https://console.groq.com) API key

### 1. Clone the repository
```bash
git clone https://github.com/JnapikaPilli/news-intelligence-dashboard.git
cd news-intelligence-dashboard
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `.env` file:
```env
NEWS_API_KEY=your_newsdata_io_key
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_secret_key_here
DEMO_USER=admin
DEMO_PASS=your_password
EMBED_MODEL=all-MiniLM-L6-v2
```

Start the backend:
```bash
uvicorn app:app --reload --port 8000
```

### 3. Frontend setup
```bash
cd frontend
npm install
```

Create `.env.local`:
```env
VITE_API_URL=http://localhost:8000
```

Start the frontend:
```bash
npm run dev
```

### 4. Open in browser
```
http://localhost:5173
```

---

## How the RAG Pipeline Works

1. **Fetch** — Live articles fetched from NewsData.io for the search query
2. **Chunk** — Each article split into 300-character overlapping chunks (50-char overlap) to preserve context
3. **Embed** — Each chunk embedded using `all-MiniLM-L6-v2`, producing a 384-dimensional vector
4. **Store** — Vectors upserted into a persistent FAISS `IndexFlatL2` on disk
5. **Retrieve** — Query embedded and top-5 most similar chunks retrieved via L2 distance search
6. **Generate** — Retrieved context + live headlines passed to LLaMA 3.3 70B on Groq, producing a structured summary with sentiment scores and trend classification

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/news/search` | Main search — returns full AI briefing |
| POST | `/api/news/ingest` | Pre-warm FAISS index for a topic |
| GET | `/api/news/trending` | Get trending topic suggestions |
| POST | `/api/auth/login` | Login and receive JWT token |
| GET | `/api/auth/me` | Get current authenticated user |

### Example Request
```bash
curl -X POST http://localhost:8000/api/news/search \
  -H "Content-Type: application/json" \
  -d '{"query": "AI", "use_rag": true}'
```

### Example Response
```json
{
  "query": "AI",
  "summary": "Artificial intelligence continues to reshape...",
  "sentiment": { "positive": 62, "negative": 18, "neutral": 20 },
  "headlines": ["[Times of India] Nvidia bets big on AI inference..."],
  "trend": "Rising",
  "trend_emoji": "🚀",
  "fetched_at": "11:54 PM"
}
```

---

## Future Improvements

- [ ] Persistent user accounts with search history
- [ ] Multi-language support
- [ ] Topic comparison — side-by-side analysis
- [ ] Email digest — scheduled daily briefings
- [ ] WebSocket support for live streaming summaries
- [ ] Fine-tuned embedding model for news-specific retrieval

---

## Author

**Jnapika Pilli**
B.Tech Computer Science — RGUKT
[GitHub](https://github.com/JnapikaPilli) | [LinkedIn](https://linkedin.com/in/jnapikapilli) | [LeetCode](https://leetcode.com/u/Yl4LMJHtZJ/)

---

## License

This project is built for educational purposes as part of a mini project submission.
