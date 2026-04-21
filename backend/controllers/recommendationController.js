const youtubeService = require('../services/youtubeService');

exports.getRelatedArticles = async (req, res) => {
    res.json({ articles: [] });
};

exports.getRelatedVideos = async (req, res) => {
    try {
        const videos = await youtubeService.fetchVideos(req.params.topic);
        res.json({ videos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
