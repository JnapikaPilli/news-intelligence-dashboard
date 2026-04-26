import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BACKEND_URL,
});

export const newsService = {
  getNews: () => api.get('/news').then(res => res.data),
  getTrending: () => api.get('/news/trending').then(res => res.data),
  getByCategory: (category) => api.get(`/news/category/${category}`).then(res => res.data),
  search: (query, language = 'en') => api.post('/search', { query, language }).then(res => res.data),
};

export const ragService = {
  uploadPdf: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/rag/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    }).then(res => res.data);
  },
  query: (query, documentId, language = 'en') => api.post('/rag/query', { query, documentId, language }).then(res => res.data),
  generateTTS: (text) => api.post('/rag/tts', { text }).then(res => res.data),
  summarize: (section, language = 'en') => api.post('/rag/summarize-section', { section, language }).then(res => res.data),
  translate: (text, target_language) => api.post('/rag/translate', { text, target_language }).then(res => res.data),
};
