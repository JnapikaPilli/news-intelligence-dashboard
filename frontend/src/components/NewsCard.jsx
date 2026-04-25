import React from 'react';
import { Clock, ExternalLink, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NewsCard({ article, delay = 0 }) {
  // Use array if provided, otherwise fallback to splitting by periods for AI bullet simulation
  const rawSummary = article.bullet_summary || article.summary;
  const bullets = Array.isArray(rawSummary) 
    ? rawSummary 
    : rawSummary ? rawSummary.split('. ').filter(s => s.length > 5).slice(0, 3) : ["No summary available."];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card p-5 group flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider border border-primary/20">
          {article.category || 'General'}
        </span>
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
        <ul className="space-y-2 mb-4">
          {bullets.map((bullet, idx) => (
            <li key={idx} className="flex items-start text-sm text-foreground/80 leading-relaxed">
              <span className="text-primary mr-2 mt-1">•</span>
              <span>{bullet}{bullet.endsWith('.') ? '' : '.'}</span>
            </li>
          ))}
        </ul>
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
