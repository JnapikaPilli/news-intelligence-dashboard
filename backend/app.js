const express = require('express');
const cors = require('cors');

const newsRoutes = require('./routes/newsRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const ragRoutes = require('./routes/ragRoutes');
const newsController = require('./controllers/newsController'); // For the /api/search route

const app = express();

const axios = require('axios');

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'], // Allowed frontend ports
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
// Jnapika
// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'Node API Gateway' });
});

// Test RAG Connection
app.get('/api/test-rag', async (req, res) => {
    try {
        console.log("Before request to FastAPI /test");
        const response = await axios.get('http://127.0.0.1:8000/test');
        console.log("After response from FastAPI:", response.data);
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Error calling FastAPI /test:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Root level search route as requested
app.post('/api/search', newsController.searchNews);

// Mount Routes
app.use('/api/news', newsRoutes);
app.use('/api/recommendations', recommendationRoutes);

try {
    const languageRoutes = require('./routes/languageRoutes');
    app.use('/api/user', languageRoutes);
} catch (e) {
    // ignore if not present
}

try {
    app.use('/api/rag', ragRoutes);
} catch (e) {
    // ignore if not present
}

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500
        }
    });
});

module.exports = app;
