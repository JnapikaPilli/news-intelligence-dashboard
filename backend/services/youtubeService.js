const axios = require('axios');

exports.fetchVideos = async (topic) => {
    // Placeholder for actual YouTube API call
    return [
        {
            id: 'mockVideo1',
            title: `Understanding ${topic} News`,
            url: `https://youtube.com/watch?v=mockVideo1`
        },
        {
            id: 'mockVideo2',
            title: `Latest Updates on ${topic}`,
            url: `https://youtube.com/watch?v=mockVideo2`
        }
    ];
};
