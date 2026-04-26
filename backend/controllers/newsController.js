const axios = require('axios');
const Parser = require('rss-parser');
const parser = new Parser();

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:8000';

// Smart Cache to prevent lag and variety fatigue
let newsCache = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minutes

const FEEDS = [
    { url: 'https://feeds.bbci.co.uk/news/rss.xml', source: 'BBC News', category: 'World' },
    { url: 'https://techcrunch.com/feed/', source: 'TechCrunch', category: 'Technology' },
    { url: 'https://www.reutersagency.com/feed/?best-topics=top-news&post_type=best', source: 'Reuters', category: 'Business' },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera', category: 'World' },
    { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge', category: 'Technology' }
];

exports.getNews = async (req, res, next) => {
    try {
        const now = Date.now();
        
        // Return from cache if it's fresh (under 5 mins)
        if (newsCache.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
            // Even from cache, we shuffle a bit to keep it fresh
            return res.status(200).json([...newsCache].sort(() => Math.random() - 0.5));
        }

        console.log("Fetching global intelligence from 5+ sources...");
        const feedPromises = FEEDS.map(f => parser.parseURL(f.url).catch(e => {
            console.error(`Feed Error (${f.source}):`, e.message);
            return { items: [] };
        }));

        const results = await Promise.all(feedPromises);
        let allArticles = [];
        const seenTitles = new Set();

        results.forEach((feed, index) => {
            const sourceInfo = FEEDS[index];
            feed.items.slice(0, 10).forEach(item => {
                const title = item.title?.trim();
                // Deduplicate by title
                if (title && !seenTitles.has(title.toLowerCase())) {
                    seenTitles.add(title.toLowerCase());
                    allArticles.push({
                        id: item.guid || Math.random().toString(36).substr(2, 9),
                        title: title,
                        text: item.contentSnippet || item.content || item.title,
                        source: sourceInfo.source,
                        category: sourceInfo.category,
                        url: item.link,
                        published_at: item.pubDate,
                        bullet_summary: ["Summary not available"]
                    });
                }
            });
        });

        // Shuffle and limit to top 20
        allArticles = allArticles.sort(() => Math.random() - 0.5).slice(0, 20);

        // Update Cache
        newsCache = allArticles;
        lastFetchTime = now;

        res.status(200).json(allArticles);
    } catch (error) {
        console.error("News Aggregator Error:", error.message);
        res.status(200).json(newsCache.length > 0 ? newsCache : [{
            id: "fallback",
            title: "Intelligence Feed Refreshing",
            text: "The real-time feed is currently updating. Please wait a moment.",
            source: "System",
            category: "General",
            published_at: new Date().toISOString()
        }]);
    }
};

exports.getNewsById = (req, res, next) => {
    try {
        const { id } = req.params;
        const item = MOCK_NEWS.find(n => n.id === id);
        
        if (!item) {
            const error = new Error("News article not found");
            error.status = 404;
            throw error;
        }
        
        const responseData = {
            id: item.id,
            title: item.title,
            bullet_summary: ["Summary generated on feed view. See full text for details."],
            text: item.text,
            source: item.source,
            category: item.category,
            published_at: item.published_at
        };
        
        res.status(200).json(responseData);
    } catch (error) {
        next(error);
    }
};

exports.searchNews = async (req, res, next) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: "Query is required" });
        }

        const NEWS_API_KEY = process.env.NEWS_API_KEY;
        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

        let rawArticles = [];
        let finalVideos = [];

        // 1. Fetch News from NewsData.io (using pub_ key)
        try {
            if (NEWS_API_KEY) {
                const newsResponse = await axios.get('https://newsdata.io/api/1/news', {
                    params: {
                        q: query,
                        language: 'en',
                        apikey: NEWS_API_KEY
                    }
                });
                
                // NewsData.io returns 'results' instead of 'articles'
                const results = newsResponse.data.results || [];
                
                // De-duplicate by title
                const seenTitles = new Set();
                rawArticles = results.filter(article => {
                    if (seenTitles.has(article.title)) return false;
                    seenTitles.add(article.title);
                    return true;
                }).map(article => ({
                    title: article.title,
                    description: article.description || article.content?.substring(0, 200),
                    content: article.content || article.description,
                    source: { name: article.source_id || "Global News" },
                    url: article.link,
                    published_at: article.pubDate || new Date().toISOString()
                }));
            }
        } catch (err) {
            console.error("NewsData.io Error:", err.response?.data?.message || err.message);
        }

        // 2. Fallback to Mock Data if no results found from API
        if (rawArticles.length === 0) {
            console.log("No API results, falling back to mock data for query:", query);
            const q = query.toLowerCase();
            rawArticles = MOCK_NEWS.filter(article => 
                article.title.toLowerCase().includes(q) || 
                article.text.toLowerCase().includes(q) ||
                article.category.toLowerCase().includes(q)
            ).map((article, idx) => ({
                id: `mock-${idx}`,
                title: article.title,
                description: article.text.substring(0, 200),
                content: article.text,
                source: { name: article.source },
                url: "#",
                published_at: article.published_at
            }));
        } else {
            // Assign stable IDs for RAG tracking
            rawArticles = rawArticles.map((a, i) => ({ ...a, id: i.toString() }));
        }

        // 3. Process with RAG (Selection + Synthesis)
        let finalArticles = [];
        let globalSummary = ["Gathering insights from across multiple sources..."];
        
        if (rawArticles.length > 0) {
            try {
                const { language } = req.body;
                const ragResponse = await axios.post(`${RAG_SERVICE_URL}/search-rag`, {
                    query: query,
                    articles: rawArticles.map(a => ({ id: a.id, text: `${a.title}. ${a.content || a.description}` })),
                    language: language || 'en'
                }, { timeout: 60000 });
                
                if (ragResponse.data) {
                    globalSummary = ragResponse.data.summary;
                    const topIds = ragResponse.data.top_ids || [];
                    
                    // Filter and map only the articles selected by RAG
                    finalArticles = rawArticles
                        .filter(a => topIds.includes(a.id))
                        .map(a => ({
                            title: a.title,
                            bullet_summary: ["Selected as primary source for this intelligence report."],
                            source: a.source?.name || "Global Intelligence",
                            url: a.url,
                            published_at: a.published_at
                        }));
                    
                    // Limit to 5 as requested
                    finalArticles = finalArticles.slice(0, 5);
                }
            } catch (err) {
                console.error("RAG Search Error:", err.message);
                // Fallback: just show first 5 if RAG fails
                finalArticles = rawArticles.slice(0, 5).map(a => ({
                    title: a.title,
                    bullet_summary: ["Direct extraction."],
                    source: a.source?.name || "Global Intelligence",
                    url: a.url,
                    published_at: a.published_at
                }));
            }
        }

        // 4. Fetch YouTube Videos
        try {
            if (YOUTUBE_API_KEY) {
                const ytResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                    params: {
                        part: 'snippet',
                        q: query,
                        maxResults: 3,
                        type: 'video',
                        key: YOUTUBE_API_KEY
                    }
                });
                
                if (ytResponse.data && ytResponse.data.items) {
                    finalVideos = ytResponse.data.items.map(item => ({
                        title: item.snippet.title,
                        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
                        url: `https://www.youtube.com/watch?v=${item.id.videoId}`
                    }));
                }
            }
        } catch (ytErr) {
            console.error("YouTube API Error:", ytErr.message);
        }

        // 5. Return Final Response
        res.status(200).json({
            query: query,
            global_summary: globalSummary,
            articles: finalArticles,
            videos: finalVideos
        });
    } catch (error) {
        console.error("Search Handler Error:", error.message);
        next(error);
    }
};
