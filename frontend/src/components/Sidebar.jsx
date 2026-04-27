import React from 'react';
import { NavLink } from 'react-router-dom';
import { Newspaper, FileText, Settings, BarChart2 } from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 glass-panel m-4 hidden md:flex flex-col overflow-hidden relative z-20 border-r border-border/50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
          N
        </div>
        <h1 className="font-bold text-xl tracking-tight text-gradient">NewsIntel</h1>
      </div>
      
      <div className="flex-1 px-4 py-4 space-y-1">
        <p className="px-4 text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Menu</p>
        
        <NavLink 
          to="/" 
          className={({ isActive }) => clsx(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium",
            isActive 
              ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
              : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
          )}
        >
          <Newspaper size={20} className="group-hover:scale-110 transition-transform" />
          <span>Live Feed</span>
        </NavLink>

        <NavLink 
          to="/qa" 
          className={({ isActive }) => clsx(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium",
            isActive 
              ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
              : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
          )}
        >
          <FileText size={20} className="group-hover:scale-110 transition-transform" />
          <span>Doc Q&A</span>
        </NavLink>
{/*         
        <NavLink 
          to="/analytics" 
          className={({ isActive }) => clsx(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium opacity-50 cursor-not-allowed",
            isActive 
              ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
              : "text-foreground/70"
          )}
          onClick={(e) => e.preventDefault()}
        >
          <BarChart2 size={20} />
          <span>Analytics</span>
        </NavLink> */}
      </div>

      <div className="p-4 mt-auto">
        <div className="glass-card p-4 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-foreground/5 transition-colors">
          <Settings size={20} className="text-foreground/70" />
          <span className="font-medium text-foreground/80">Settings</span>
        </div>
      </div>
    </aside>
  );
}
