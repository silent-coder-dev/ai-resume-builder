'use client';

import React from 'react';
import { Heart, Terminal, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="no-print mt-auto border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-4 px-6">
      <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center">
            <Terminal className="w-3 h-3" />
          </div>
          <span className="font-semibold text-slate-700">AI Resume Studio</span>
          <span className="text-slate-300">•</span>
          <span>ATS Optimized</span>
        </div>

        <div className="flex items-center gap-1.5 font-medium">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
          <span>by</span>
          <a
            href="https://github.com/silent-coder-dev"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-slate-800 hover:text-blue-600 transition flex items-center gap-1 bg-slate-100 hover:bg-blue-50 px-2 py-0.5 rounded-md border border-slate-200"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            silent_coder
          </a>
        </div>

        <div className="text-[11px] text-slate-400">
          Powered by Next.js & Google Gemini / OpenRouter
        </div>
      </div>
    </footer>
  );
};