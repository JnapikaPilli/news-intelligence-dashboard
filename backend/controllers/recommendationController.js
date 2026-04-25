exports.getArticleRecommendations = (req, res, next) => {
    try {
        const { topic } = req.params;
        
        const mockArticles = [
            {
                id: `rec-art-1`,
                title: `Deep Dive into ${topic}`,
                bullet_summary: [`Comprehensive analysis of ${topic}`, `Expert opinions included`, `Future market trends`],
                source: "Analysis Weekly",
                category: topic
            },
            {
                id: `rec-art-2`,
                title: `Future Trends in ${topic}`,
                bullet_summary: [`Predictive modeling outcomes`, `Market shifts expected next year`, `Key players to watch`],
                source: "Future Insights",
                category: topic
            }
        ];
        
        res.status(200).json(mockArticles);
    } catch (error) {
        next(error);
    }
};

exports.getVideoRecommendations = (req, res, next) => {
    try {
        const { topic } = req.params;
        
        const mockVideos = [
            {
                id: `rec-vid-1`,
                title: `Understanding ${topic} in 5 Minutes`,
                url: `https://youtube.com/watch?v=mock1`,
                source: "YouTube",
                duration: "5:30"
            },
            {
                id: `rec-vid-2`,
                title: `${topic} Panel Discussion`,
                url: `https://youtube.com/watch?v=mock2`,
                source: "YouTube",
                duration: "45:00"
            }
        ];
        
        res.status(200).json(mockVideos);
    } catch (error) {
        next(error);
    }
};
