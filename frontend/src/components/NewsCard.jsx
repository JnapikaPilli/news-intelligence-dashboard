import React, { useState, useRef, useEffect } from 'react';
import { Clock, ExternalLink, ChevronRight, Loader2, Volume2, Sparkles, Globe, RefreshCcw, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ragService } from '../services/api';
import clsx from 'clsx';

function ListenButton({ text }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  const handleListen = async (e) => {
    e.stopPropagation(); // Prevent card click

    // If already playing, stop it
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    if (!text || isGenerating) return;
    
    setIsGenerating(true);
    try {
      const res = await ragService.generateTTS(text);
      if (res.audio) {
        const audio = new Audio(`data:audio/wav;base64,${res.audio}`);
        audioRef.current = audio;
        
        audio.onended = () => setIsPlaying(false);
        audio.onpause = () => setIsPlaying(false);
        
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("TTS Error:", err);
      setIsPlaying(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button 
      onClick={handleListen}
      disabled={isGenerating}
      title={isPlaying ? "Stop Listening" : "Listen to summary"}
      className={clsx(
        "flex items-center justify-center p-1.5 rounded-full transition-all border shadow-sm",
        isGenerating 
          ? "bg-primary/20 text-primary animate-pulse cursor-wait" 
          : isPlaying
            ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white"
            : "bg-primary/10 text-primary hover:bg-primary hover:text-white border-primary/20"
      )}
    >
      {isGenerating ? (
        <Loader2 size={12} className="animate-spin" />
      ) : isPlaying ? (
        <Square size={12} className="fill-current" />
      ) : (
        <Volume2 size={12} />
      )}
    </button>
  );
}

export default function NewsCard({ article, delay = 0 }) {
  const [dynamicBullets, setDynamicBullets] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [translatedData, setTranslatedData] = useState(null); // { title, bullets, lang }
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);

  // Use array if provided, otherwise fallback to splitting by periods for AI bullet simulation
  const rawSummary = article.bullet_summary || article.summary;
  const initialBullets = Array.isArray(rawSummary) 
    ? rawSummary 
    : rawSummary ? rawSummary.split('. ').filter(s => s.length > 5).slice(0, 3) : ["No summary available."];

  const bullets = dynamicBullets || initialBullets;
  const hasNoSummary = bullets.length === 0 || 
                       (bullets[0].toLowerCase().includes('summary') && 
                        bullets[0].toLowerCase().includes('not available'));

  const getLanguageName = (code) => {
    const names = { hi: 'Hindi', ta: 'Tamil', te: 'Telugu', en: 'English' };
    return names[code] || code;
  };

  const handleSummarize = async () => {
    if (isSummarizing) return;
    setIsSummarizing(true);
    try {
      const res = await ragService.summarize(article.text || article.title, 'en');
      if (res.summary && Array.isArray(res.summary)) {
        setDynamicBullets(res.summary.slice(0, 3));
      }
    } catch (err) {
      console.error("Manual Summarize Error:", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleTranslate = async (targetLang) => {
    if (isTranslating) return;
    setIsTranslating(true);
    setShowTranslateMenu(false);
    try {
      // Translate title and all bullets
      const textsToTranslate = [article.title, ...bullets];
      const res = await ragService.translate(textsToTranslate, targetLang);
      
      if (res.translated_text) {
        setTranslatedData({
          title: res.translated_text[0],
          bullets: res.translated_text.slice(1),
          lang: targetLang
        });
        setShowOriginal(false);
      }
    } catch (err) {
      console.error("Translation Error:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  const displayTitle = !showOriginal && translatedData ? translatedData.title : article.title;
  const displayBullets = !showOriginal && translatedData ? translatedData.bullets : bullets;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card p-5 group flex flex-col h-full relative"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider border border-primary/20">
            {article.category || 'General'}
          </span>
          <ListenButton text={`${displayTitle}. ${displayBullets.join(' ')}`} />
        </div>
          <div className="flex items-center text-foreground/50 text-xs font-medium">
            <Clock size={12} className="mr-1" />
            {new Date(article.published_at).toLocaleDateString()}
          </div>
      </div>
      
      <h3 className="font-bold text-lg mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-2">
        {displayTitle}
      </h3>
      
      <div className="text-xs font-semibold text-foreground/50 mb-4 uppercase tracking-wide">
        {article.source} {translatedData && !showOriginal && `• Translated to ${getLanguageName(translatedData.lang)}`}
      </div>
      
      <div className="flex-1">
        {hasNoSummary && !isSummarizing ? (
          <div className="flex flex-col items-center justify-center py-6 bg-foreground/5 rounded-xl border border-dashed border-border/50 mb-4">
            <p className="text-xs text-foreground/40 mb-3 font-medium">Detailed insights pending...</p>
            <button 
              onClick={handleSummarize}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm border border-primary/20"
            >
              <Sparkles size={14} /> Generate Insight
            </button>
          </div>
        ) : isSummarizing || isTranslating ? (
          <div className="flex flex-col items-center justify-center py-8 mb-4">
            <Loader2 className="animate-spin text-primary mb-2" size={20} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary animate-pulse">
              {isTranslating ? 'Translating Intelligence...' : 'Analyzing Story...'}
            </p>
          </div>
        ) : (
          <ul className="space-y-2 mb-4">
            {displayBullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start text-sm text-foreground/80 leading-relaxed">
                <span className="text-primary mr-2 mt-1">•</span>
                <span>{bullet}{bullet.endsWith('.') ? '' : '.'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="mt-auto pt-4 border-t border-border/50 flex justify-between items-center relative">
        <button className="text-sm text-primary font-medium flex items-center group-hover:underline">
          Read Analysis <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
        </button>
        
          <div className="relative flex items-center gap-2">
            {translatedData && (
              <button 
                onClick={() => setShowOriginal(!showOriginal)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border",
                  showOriginal 
                    ? "bg-primary/10 text-primary border-primary/20" 
                    : "bg-foreground/5 text-foreground/60 border-border/50"
                )}
              >
                <RefreshCcw size={12} className={clsx(!showOriginal && "animate-spin-slow")} />
                {showOriginal ? 'Translate Back' : 'Show Original'}
              </button>
            )}

            <button 
              onClick={() => setShowTranslateMenu(!showTranslateMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground/5 text-foreground/60 hover:text-primary hover:bg-primary/5 rounded-full text-[10px] font-bold transition-all border border-border/50 hover:border-primary/30"
            >
              <Globe size={12} /> Translate
            </button>
            
            <AnimatePresence>
              {showTranslateMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-full right-0 mb-2 w-32 glass-panel py-1 z-30"
                >
                  {['hi', 'te', 'ta'].map(lang => (
                    <button
                      key={lang}
                      onClick={() => handleTranslate(lang)}
                      className="w-full text-left px-4 py-2 text-[10px] font-bold hover:bg-primary/10 hover:text-primary transition-colors uppercase tracking-widest"
                    >
                      {getLanguageName(lang)}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {article.url && (
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-foreground/40 hover:text-foreground transition-colors p-2 hover:bg-foreground/5 rounded-full">
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </motion.div>
    );
}
