import React, { useState } from 'react';
import { Clock, ExternalLink, ChevronRight, Loader2, Volume2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ragService } from '../services/api';
import clsx from 'clsx';

function ListenButton({ text }) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleListen = async () => {
    if (!text || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await ragService.generateTTS(text);
      if (res.audio) {
        const audio = new Audio(`data:audio/wav;base64,${res.audio}`);
        audio.play();
      }
    } catch (err) {
      console.error("TTS Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button 
      onClick={handleListen}
      disabled={isGenerating}
      title="Listen to summary"
      className={clsx(
        "flex items-center justify-center p-1.5 rounded-full transition-all",
        isGenerating 
          ? "bg-primary/20 text-primary animate-pulse cursor-wait" 
          : "bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20"
      )}
    >
      {isGenerating ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Volume2 size={12} />
      )}
    </button>
  );
}

export default function NewsCard({ article, delay = 0 }) {
  const [dynamicBullets, setDynamicBullets] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Use array if provided, otherwise fallback to splitting by periods for AI bullet simulation
  const rawSummary = article.bullet_summary || article.summary;
  const initialBullets = Array.isArray(rawSummary) 
    ? rawSummary 
    : rawSummary ? rawSummary.split('. ').filter(s => s.length > 5).slice(0, 3) : ["No summary available."];

  const bullets = dynamicBullets || initialBullets;
  const hasNoSummary = bullets.length === 0 || 
                       (bullets[0].toLowerCase().includes('summary') && 
                        bullets[0].toLowerCase().includes('not available'));

  const handleSummarize = async () => {
    if (isSummarizing) return;
    setIsSummarizing(true);
    try {
      // We use the generalize summarize-section endpoint for this
      const res = await ragService.summarize(article.text || article.title);
      if (res.summary && Array.isArray(res.summary)) {
        setDynamicBullets(res.summary.slice(0, 3));
      }
    } catch (err) {
      console.error("Manual Summarize Error:", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card p-5 group flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider border border-primary/20">
            {article.category || 'General'}
          </span>
          <ListenButton text={`${article.title}. ${bullets.join(' ')}`} />
        </div>
        <div className="flex items-center text-foreground/50 text-xs font-medium">
          <Clock size={12} className="mr-1" />
          {new Date(article.published_at).toLocaleDateString()}
        </div>
      </div>
      
      <h3 className="font-bold text-lg mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-2">
        {article.title}
      </h3>
      
      <div className="text-xs font-semibold text-foreground/50 mb-4 uppercase tracking-wide">{article.source}</div>
      
      <div className="flex-1">
        {hasNoSummary && !isSummarizing ? (
          <div className="flex flex-col items-center justify-center py-6 bg-foreground/5 rounded-xl border border-dashed border-border/50 mb-4">
            <p className="text-xs text-foreground/40 mb-3 font-medium">Detailed insights pending...</p>
            <button 
              onClick={handleSummarize}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm border border-primary/20"
            >
              <Sparkles size={14} /> Regenerate Insight
            </button>
          </div>
        ) : isSummarizing ? (
          <div className="flex flex-col items-center justify-center py-8 mb-4">
            <Loader2 className="animate-spin text-primary mb-2" size={20} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary animate-pulse">Analyzing Story...</p>
          </div>
        ) : (
          <ul className="space-y-2 mb-4">
            {bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start text-sm text-foreground/80 leading-relaxed">
                <span className="text-primary mr-2 mt-1">•</span>
                <span>{bullet}{bullet.endsWith('.') ? '' : '.'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="mt-auto pt-4 border-t border-border/50 flex justify-between items-center">
        <button className="text-sm text-primary font-medium flex items-center group-hover:underline">
          Read Analysis <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
        </button>
        {article.url && (
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-foreground/40 hover:text-foreground transition-colors p-2 hover:bg-foreground/5 rounded-full">
            <ExternalLink size={16} />
          </a>
        )}
      </div>
    </motion.div>
  );
}
