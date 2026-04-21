import React, { useState } from 'react';
import './Dashboard.css';

export default function Dashboard() {
  const [activeCategory, setActiveCategory] = useState('general');
  const [news, setNews] = useState([
    { id: 1, title: 'Global Markets Rally Amid Positive Tech Earnings', summary: 'Stock markets around the world saw significant gains today as major tech companies reported better-than-expected earnings for the third quarter.', category: 'general', source: 'Financial Times', sentiment: 'positive' },
    { id: 2, title: 'Local Team Wins Championship After 20 Years', summary: 'In a stunning upset, the home team secured the league championship trophy last night, ending a two-decade drought and sparking city-wide celebrations.', category: 'sports', source: 'Local Daily', sentiment: 'neutral' }
  ]);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI News Assistant. Upload a PDF or ask me about the news.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, { role: 'user', content: chatInput }]);
    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'This is a mocked RAG response providing simple bullet points context.' }]);
    }, 1000);
    setChatInput('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      setChatMessages(prev => [...prev, { role: 'system', content: `Uploading ${file.name} for RAG analysis...` }]);
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('http://localhost:5000/api/rag/upload', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        
        if (response.ok) {
           setChatMessages(prev => [...prev, { role: 'system', content: `Success: ${file.name} uploaded to memory.` }]);
        } else {
           setChatMessages(prev => [...prev, { role: 'system', content: `Error uploading ${file.name}: ${data.error || 'Unknown error'}` }]);
        }
      } catch (err) {
         setChatMessages(prev => [...prev, { role: 'system', content: `Connection error: ${err.message}` }]);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="dashboard-container">
      
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <div>
          <h1 className="brand">NewsLens</h1>
          <nav>
            <p className="category-title">Categories</p>
            <ul className="category-list">
              {['General', 'Business', 'Technology', 'Sports', 'Entertainment', 'Health'].map((cat) => (
                <li key={cat}>
                  <button 
                    onClick={() => setActiveCategory(cat.toLowerCase())}
                    className={`category-btn ${activeCategory === cat.toLowerCase() ? 'active' : ''}`}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div>
          <button className="lang-btn">
            English (Language)
          </button>
        </div>
      </aside>

      {/* CENTER PANEL: Live News Feed */}
      <main className="main-feed">
        <header className="feed-header">
          <h2>
            <span className="pulse-dot"></span>
            Real-Time {activeCategory} News
          </h2>
        </header>

        <div className="feed-content">
          <div className="news-card-wrapper">
            {news.map((item, idx) => (
              <div 
                key={item.id} 
                className="news-card"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="news-header">
                  <h3 className="news-title">{item.title}</h3>
                  <span className={`sentiment-badge sentiment-${item.sentiment}`}>
                    {item.sentiment}
                  </span>
                </div>
                <p className="news-summary">{item.summary}</p>
                <div className="news-footer">
                  <span className="news-source">
                    📰 {item.source}
                  </span>
                  <button className="news-link">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* RIGHT PANEL: AI Assistant */}
      <aside className="assistant-panel">
        
        <div className="chat-header">
          <div className="chat-header-title">
            <div className="ai-icon">
              ⭐
            </div>
            <h3>AI Intelligence</h3>
          </div>
          <p className="chat-desc">RAG-powered conversational analytics</p>
          
          <label className={`upload-box ${isUploading ? 'disabled' : ''}`}>
             <span>{isUploading ? 'Processing...' : '📄 Upload PDF Document'}</span>
            <input type="file" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </div>

        <div className="chat-area">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`chat-msg-wrapper ${msg.role}`}>
              <div className={`chat-bubble ${msg.role}`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        <div className="chat-input-area">
          <form onSubmit={handleChatSubmit} className="chat-form">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a question..." 
              className="chat-input"
            />
            <button 
              type="submit" 
              disabled={!chatInput.trim()}
              className={`chat-submit ${chatInput.trim() ? 'active' : 'disabled'}`}
            >
              ↑
            </button>
          </form>
        </div>

      </aside>

    </div>
  );
}
