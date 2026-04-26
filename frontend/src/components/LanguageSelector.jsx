import React from 'react';
import { Globe } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function LanguageSelector() {
  const { language, setLanguage } = useStore();

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-foreground/5 text-foreground/70 hover:text-foreground transition-colors text-sm font-medium">
        <Globe size={18} />
        <span className="uppercase">{language}</span>
      </button>
      
      <div className="absolute top-full right-0 mt-2 w-32 glass-panel opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 origin-top-right scale-95 group-hover:scale-100">
        <button 
          onClick={() => setLanguage('en')}
          className="w-full text-left px-4 py-2 text-sm hover:bg-foreground/5 hover:text-primary transition-colors"
        >
          English (EN)
        </button>
        <button 
          onClick={() => setLanguage('hi')}
          className="w-full text-left px-4 py-2 text-sm hover:bg-foreground/5 hover:text-primary transition-colors font-medium"
        >
          Hindi (हिन्दी)
        </button>
        <button 
          onClick={() => setLanguage('ta')}
          className="w-full text-left px-4 py-2 text-sm hover:bg-foreground/5 hover:text-primary transition-colors font-medium"
        >
          Tamil (தமிழ்)
        </button>
        <button 
          onClick={() => setLanguage('te')}
          className="w-full text-left px-4 py-2 text-sm hover:bg-foreground/5 hover:text-primary transition-colors font-medium"
        >
          Telugu (తెలుగు)
        </button>
      </div>
    </div>
  );
}
