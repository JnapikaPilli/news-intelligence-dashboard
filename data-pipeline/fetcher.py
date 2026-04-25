import os
import sys
import sqlite3
import json
import logging
from datetime import datetime

# Add root folder to sys path to import ml
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
try:
    from ml.models import classify_text
except ImportError:
    logging.warning("Could not import ml.models. Classification will be disabled.")
    classify_text = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = 'news.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            summary TEXT,
            source TEXT,
            url TEXT,
            published_at TEXT,
            category TEXT,
            language TEXT
        )
    ''')
    conn.commit()
    conn.close()

def fetch_mock_news():
    """Simulates fetching real-time news from an API like NewsData.io or NewsAPI"""
    return [
        {
            "title": "Global Markets Rally Amid Positive Tech Earnings",
            "summary": "Stock markets around the world saw significant gains today as major tech companies reported better-than-expected earnings for the third quarter.",
            "source": "Financial Times",
            "url": "https://example.com/markets-rally",
            "published_at": datetime.now().isoformat(),
            "language": "en"
        },
        {
            "title": "Local Team Wins Championship After 20 Years",
            "summary": "In a stunning upset, the home team secured the league championship trophy last night, ending a two-decade drought and sparking city-wide celebrations.",
            "source": "Local Daily",
            "url": "https://example.com/local-sports-championship",
            "published_at": datetime.now().isoformat(),
            "language": "en"
        }
    ]

def process_and_store_news():
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    news_items = fetch_mock_news()
    labels = ["business", "politics", "sports", "technology", "entertainment", "health"]
    
    for item in news_items:
        category = "general"
        if classify_text:
            try:
                # Classify based on the summary combining title
                text_to_classify = item['title'] + " " + item['summary']
                category = classify_text(text_to_classify, labels)
            except Exception as e:
                logger.error(f"Classification failed: {e}")
        
        cursor.execute('''
            INSERT INTO news (title, summary, source, url, published_at, category, language)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (item['title'], item['summary'], item['source'], item['url'], item['published_at'], category, item['language']))
    
    conn.commit()
    conn.close()
    logger.info("Successfully fetched, classified, and stored news.")

if __name__ == "__main__":
    init_db() # Ensure DB exists before anything else
    process_and_store_news()
