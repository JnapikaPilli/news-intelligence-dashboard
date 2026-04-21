const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const newsRoutes = require('./routes/newsRoutes');
const ragRoutes = require('./routes/ragRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const languageRoutes = require('./routes/languageRoutes');

app.use('/api/news', newsRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/user', languageRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Node API Gateway' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend Node server running on port ${PORT}`);
});
