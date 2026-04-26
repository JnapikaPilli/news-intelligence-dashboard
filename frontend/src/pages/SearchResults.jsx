import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { newsService } from '../services/api';
import NewsCard from '../components/NewsCard';
import { Loader2, Play, Search, AlertCircle, Video } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SearchResults() {
  const { searchQuery, searchResults, setSearchResults, isSearching, setIsSearching } = useStore();

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchQuery) return;
      setIsSearching(true);
      try {
        const data = await newsService.search(searchQuery);
        setSearchResults(data);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults({ query: searchQuery, articles: [], videos: [] });
      } finally {
        setIsSearching(false);
      }
    };

    fetchResults();
  }, [searchQuery, setIsSearching, setSearchResults]);

  if (!searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-foreground/50">
        <Search size={48} className="mb-4 opacity-50" />
        <p>Type a query in the search bar to find insights.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-gradient">Search Results</h1>
        <p className="text-foreground/60 flex items-center">
          <Search size={18} className="mr-2 text-primary" />
          Showing intelligence for: <span className="font-semibold text-foreground ml-1">"{searchQuery}"</span>
        </p>
      </div>

      {isSearching ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={40} className="animate-spin text-primary mb-4" />
          <p className="text-foreground/60 animate-pulse">Running RAG algorithms and synthesizing cross-article intelligence...</p>
        </div>
      ) : searchResults ? (
        <>
          {searchResults.global_summary && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 mb-8 border-l-4 border-primary bg-primary/5 rounded-r-2xl"
            >
              <div className="flex items-center mb-4 text-primary">
                <Search className="mr-2" size={18} />
                <h2 className="font-bold uppercase tracking-widest text-[10px]">Synthesized Intelligence Report</h2>
              </div>
              <div className="grid grid-cols-1 gap-y-4">
                {searchResults.global_summary.map((point, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start text-foreground/90 group"
                  >
                    <span className="text-primary mr-3 font-bold mt-0.5">•</span>
                    <span className="text-sm leading-relaxed group-hover:text-foreground transition-colors">{point}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="flex flex-col xl:flex-row gap-8">
          {/* Articles Section */}
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-4 flex items-center border-b border-border/50 pb-2">
              <span className="bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-3">
                <Search size={16} />
              </span>
              Top Articles
            </h2>
            
            {searchResults.articles && searchResults.articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {searchResults.articles.map((item, index) => (
                  <NewsCard key={index} article={item} delay={index * 0.05} />
                ))}
              </div>
            ) : (
              <div className="glass-card p-8 flex flex-col items-center text-center text-foreground/50">
                <AlertCircle size={32} className="mb-3 opacity-50" />
                <p>No articles found for this topic.</p>
              </div>
            )}
          </div>

          {/* Videos Section */}
          <div className="xl:w-[350px] shrink-0">
            <h2 className="text-xl font-bold mb-4 flex items-center border-b border-border/50 pb-2">
              <span className="bg-red-500/20 text-red-500 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                <Video size={16} />
              </span>
              Related Media
            </h2>
            
            {searchResults.videos && searchResults.videos.length > 0 ? (
              <div className="space-y-4">
                {searchResults.videos.map((video, index) => (
                  <motion.a 
                    key={index}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="block glass-card overflow-hidden group hover:border-primary/30 transition-all"
                  >
                    <div className="relative h-40 overflow-hidden bg-black/20">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md flex items-center">
                        <Play size={12} className="mr-1 text-red-500 fill-red-500" /> Watch
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>
                    </div>
                  </motion.a>
                ))}
              </div>
            ) : (
              <div className="glass-card p-6 flex flex-col items-center text-center text-foreground/50">
                <Video size={24} className="mb-2 opacity-30" />
                <p className="text-sm">No related videos found.</p>
              </div>
            )}
          </div>
        </div>
      </>
      ) : null}
    </div>
  );
}
