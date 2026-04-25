import React from 'react';
import { Search, Bell, Menu, Moon, Sun } from 'lucide-react';
import { useStore } from '../store/useStore';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  const { theme, toggleTheme } = useStore();

  return (
    <header className="h-20 glass-panel mx-4 mt-4 px-6 flex items-center justify-between relative z-20">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 text-foreground/70 hover:text-foreground rounded-lg hover:bg-foreground/5 transition-colors">
          <Menu size={24} />
        </button>
        
        <div className="hidden md:flex items-center glass-card px-4 py-2 rounded-full border border-border/50 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all w-80">
          <Search size={18} className="text-foreground/50 mr-3" />
          <input 
            type="text" 
            placeholder="Search news, topics, companies..." 
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-foreground/40 text-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSelector />
        
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-full hover:bg-foreground/5 text-foreground/70 hover:text-foreground transition-all duration-300"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <button className="p-2.5 rounded-full hover:bg-foreground/5 text-foreground/70 hover:text-foreground transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>
        
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-background shadow-md overflow-hidden cursor-pointer">
          {/* Avatar placeholder */}
        </div>
      </div>
    </header>
  );
}
