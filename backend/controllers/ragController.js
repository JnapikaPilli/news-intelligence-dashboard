const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:8000';

exports.uploadFile = async (req, res) => {
    try {
        console.log("Incoming file upload to backend:", req.file);
        
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No file uploaded" });
        }
        
        const form = new FormData();
        form.append('file', fs.createReadStream(req.file.path), req.file.originalname);
        
        console.log(`Forwarding file ${req.file.originalname} to FastAPI at ${RAG_SERVICE_URL}/upload`);

        const response = await axios.post(`${RAG_SERVICE_URL}/upload`, form, {
            headers: form.getHeaders(),
            timeout: 300000 // 5 minutes for heavy AI Vision (Donut) processing on large PDFs
        });
        
        console.log("Response from FastAPI:", response.data);
        
        // Clean up multer temp file safely
        try {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        } catch (cleanupErr) {
            console.warn("Could not delete temp file:", cleanupErr.message);
        }
        
        // Return exactly what FastAPI returned to satisfy test requirement
        return res.status(200).json(response.data);

    } catch (error) {
        try {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        } catch (cleanupErr) {
            console.warn("Could not delete temp file in catch:", cleanupErr.message);
        }
        
        const status = error.response?.status || 500;
        const detail = error.response?.data?.detail || error.message || "An error occurred while uploading to the RAG service.";
        
        console.error(`RAG Upload Error [${status}]:`, detail);
        return res.status(status).json({ 
            success: false, 
            error: detail
        });
    }
};

exports.queryContent = async (req, res) => {
    try {
        const { query, documentId } = req.body;
        
        if (!query) {
            return res.status(400).json({ success: false, error: "Query is required." });
        }

        const response = await axios.post(`${RAG_SERVICE_URL}/query`, { query, documentId });
        
        // Prepare clean response
        return res.status(200).json({
            success: true,
            answer: response.data.answer,
            source_titles: response.data.source_titles || [],
            source_chunks: response.data.source_chunks || [],
            page_numbers: response.data.page_numbers || []
        });

    } catch (error) {
        console.error("RAG Query Error:", error.message);
        return res.status(500).json({ 
            success: false, 
            error: error.response?.data?.detail || "An error occurred while querying the RAG service." 
        });
    }
};

exports.summarizeSection = async (req, res) => {
    try {
        const { section, documentId } = req.body;
        
        if (!section) {
            return res.status(400).json({ success: false, error: "Section text is required." });
        }

        const response = await axios.post(`${RAG_SERVICE_URL}/summarize-section`, { section, documentId });
        
        return res.status(200).json({
            success: true,
            summary: response.data.summary
        });

    } catch (error) {
        console.error("RAG Summarize Error:", error.message);
        return res.status(500).json({ 
            success: false, 
            error: error.response?.data?.detail || "An error occurred while summarizing the section." 
        });
    }
};

exports.generateTTS = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, error: "Text is required for TTS." });
        }

        const response = await axios.post(`${RAG_SERVICE_URL}/tts`, { text });
        return res.status(200).json({
            success: true,
            audio: response.data.audio
        });

    } catch (error) {
        console.error("TTS Gateway Error:", error.message);
        return res.status(500).json({ 
            success: false, 
            error: error.response?.data?.detail || "An error occurred while generating speech." 
        });
    }
};
