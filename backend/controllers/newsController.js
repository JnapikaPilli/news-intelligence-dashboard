const axios = require('axios');

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:8000';

const MOCK_NEWS = [
    {
        id: "1",
        title: "Global Markets Rally Amid Positive Tech Earnings",
        text: "Stock markets around the world saw significant gains today as major tech companies reported better-than-expected earnings for the third quarter. Apple, Microsoft, and Alphabet all beat analyst expectations, driven by strong cloud growth and hardware sales. European and Asian markets followed Wall Street's lead, pushing global indices to near-record highs. Analysts predict this bullish trend will continue into the holiday season, though inflation concerns remain a potential headwind for some sectors.",
        source: "Financial Times",
        category: "Business",
        published_at: new Date().toISOString()
    },
    {
        id: "2",
        title: "Advancements in Quantum Computing Unveiled",
        text: "Researchers from MIT and Google Quantum AI have hit a new milestone in qubit stability, maintaining coherence for over ten milliseconds. This breakthrough could lead to commercially viable quantum machines in the next 5 years, drastically reducing the timeline from previous estimates. Tech giants are heavily investing in this new hardware, hoping to solve complex cryptography, materials science, and climate modeling problems that are impossible for classical computers.",
        source: "TechCrunch",
        category: "Technology",
        published_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: "3",
        title: "Local Team Wins Championship After 20 Years",
        text: "In a stunning upset, the home team secured the league championship trophy last night, ending a two-decade championship drought. The final score was 3-2, decided by a dramatic penalty shootout after a grueling extra time. City-wide celebrations are expected throughout the weekend, and the mayor has declared Monday a public holiday. Fans gathered in the city center cheering and waving flags until the early hours of the morning.",
        source: "Local Daily",
        category: "Sports",
        published_at: new Date(Date.now() - 172800000).toISOString()
    }
];

exports.getNews = async (req, res, next) => {
    try {
        // Prepare batch request for summarization
        const articlesPayload = MOCK_NEWS.map(n => ({ id: n.id, text: n.text }));
        
        let summariesMap = {};
        
        try {
            console.log("Sending articles:", articlesPayload);

            const response = await axios.post(`${RAG_SERVICE_URL}/summarize-articles`, {
                articles: articlesPayload
            }, { timeout: 30000 }); // Increased timeout for batch processing
            
            console.log("Received from Python:", response.data);
            console.log("Summaries:", response.data?.summaries);
            
            if (response.data && response.data.summaries) {
                response.data.summaries.forEach(s => {
                    summariesMap[s.id] = s.bullet_summary;
                });
            }
        } catch (ragError) {
            console.error("RAG ERROR:", ragError);
        }

        // Map summaries back to articles
        const responseData = MOCK_NEWS.map(article => ({
            id: article.id,
            title: article.title,
            bullet_summary: summariesMap[article.id] || ["Summary not available"],
            source: article.source,
            category: article.category,
            published_at: article.published_at
        }));

        res.status(200).json(responseData);
    } catch (error) {
        next(error);
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
                const ragResponse = await axios.post(`${RAG_SERVICE_URL}/search-rag`, {
                    query: query,
                    articles: rawArticles.map(a => ({ id: a.id, text: `${a.title}. ${a.content || a.description}` }))
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
