import React from 'react';
import UploadPDF from '../components/UploadPDF';
import ChatBox from '../components/ChatBox';
import { Target, Search, CheckCircle } from 'lucide-react';

export default function DocumentQA() {
  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col pb-4">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Document Intelligence</h1>
        <p className="text-foreground/60 max-w-2xl">Upload complex reports, articles, or PDFs and instantly query the AI to extract bullet-point summaries and verify data points.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        <div className="lg:w-1/3 flex flex-col gap-6 shrink-0">
          <UploadPDF />
          
          <div className="glass-panel p-6 flex-1 hidden lg:block overflow-y-auto">
            <h3 className="font-bold mb-5 text-xs uppercase tracking-wider text-foreground/50 border-b border-border/50 pb-2">Platform Capabilities</h3>
            <ul className="space-y-6 text-sm">
              <li className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mr-3">
                  <Target size={16} />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Argument Extraction</h4>
                  <p className="text-foreground/60 leading-relaxed">Extracts key arguments and bullet points from lengthy documents automatically.</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0 mr-3">
                  <Search size={16} />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Precision Search</h4>
                  <p className="text-foreground/60 leading-relaxed">Locates precise data points within hundreds of pages instantly.</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0 mr-3">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Source Verification</h4>
                  <p className="text-foreground/60 leading-relaxed">Cites the original source context to prevent hallucinations and ensure accuracy.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="lg:w-2/3 flex-1 min-h-0">
          <ChatBox />
        </div>
      </div>
    </div>
  );
}
