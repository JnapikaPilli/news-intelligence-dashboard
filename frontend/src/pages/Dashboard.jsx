import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { newsService } from '../services/api';
import NewsCard from '../components/NewsCard';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { news, setNews, isLoadingNews, setIsLoadingNews } = useStore();

  const fetchNews = async () => {
    setIsLoadingNews(true);
    try {
      const data = await newsService.getNews();
      setNews(data);
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setIsLoadingNews(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Real-Time Intelligence</h1>
          <p className="text-foreground/60 flex items-center">
            <TrendingUp size={18} className="mr-2 text-green-500" />
            AI-curated insights from global sources
          </p>
        </div>
        <button 
          onClick={fetchNews}
          disabled={isLoadingNews}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover hover:shadow-xl transition-all disabled:opacity-50 active:scale-95"
        >
          <RefreshCw size={18} className={isLoadingNews ? "animate-spin" : ""} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {isLoadingNews ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-5 h-80 animate-pulse flex flex-col">
              <div className="flex justify-between mb-4">
                <div className="w-20 h-5 bg-foreground/10 rounded-full"></div>
                <div className="w-16 h-4 bg-foreground/10 rounded"></div>
              </div>
              <div className="w-full h-6 bg-foreground/10 rounded mb-2"></div>
              <div className="w-3/4 h-6 bg-foreground/10 rounded mb-6"></div>
              <div className="w-1/3 h-4 bg-foreground/10 rounded mb-4"></div>
              <div className="space-y-3 flex-1">
                <div className="w-full h-4 bg-foreground/10 rounded"></div>
                <div className="w-full h-4 bg-foreground/10 rounded"></div>
                <div className="w-5/6 h-4 bg-foreground/10 rounded"></div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50 flex justify-between">
                <div className="w-24 h-4 bg-foreground/10 rounded"></div>
                <div className="w-6 h-6 bg-foreground/10 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {news.map((item, index) => (
            <NewsCard key={item.id} article={item} delay={index * 0.05} />
          ))}
        </div>
      )}
    </div>
  );
}
