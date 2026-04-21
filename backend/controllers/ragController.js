const axios = require('axios');
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

const fs = require('fs');
const FormData = require('form-data');

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        
        const form = new FormData();
        form.append('file', fs.createReadStream(req.file.path), req.file.originalname);

        const response = await axios.post(`${RAG_SERVICE_URL}/upload`, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        
        // Clean up multer temp file
        fs.unlinkSync(req.file.path);
        
        res.json(response.data);
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: error.response?.data?.detail || error.message });
    }
};

exports.queryContent = async (req, res) => {
    try {
        const { query, documentId } = req.body;
        // const response = await axios.post(`${RAG_SERVICE_URL}/query`, { query, documentId });
        // res.json(response.data);
        res.json({ answer: ["Simulated short bullet 1", "Simulated bullet 2"] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.summarizeSection = async (req, res) => {
    try {
        const { section, documentId } = req.body;
        // const response = await axios.post(`${RAG_SERVICE_URL}/summarize`, { section, documentId });
        // res.json(response.data);
        res.json({ summary: ["Section summary 1", "Section summary 2"] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
