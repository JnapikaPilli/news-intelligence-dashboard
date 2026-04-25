const axios = require('axios');

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

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
            }, { timeout: 15000 }); // 15 second timeout for batch processing
            
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

exports.searchNews = (req, res, next) => {
    try {
        const { query } = req.body;
        
        const mappedNews = MOCK_NEWS.map(article => ({
            id: article.id,
            title: article.title,
            bullet_summary: ["Summary not available in search view"], // Save API calls during rapid search typing
            source: article.source,
            category: article.category,
            published_at: article.published_at
        }));

        if (!query) {
            return res.status(200).json(mappedNews);
        }
        
        const q = query.toLowerCase();
        const results = mappedNews.filter(item => 
            item.title.toLowerCase().includes(q) || 
            item.category.toLowerCase().includes(q)
        );
        
        res.status(200).json(results);
    } catch (error) {
        next(error);
    }
};
