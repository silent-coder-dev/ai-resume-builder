'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ChevronDown, Check, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AtsScoreMeterProps {
  score: number;
  tips: string[];
}

export const AtsScoreMeter: React.FC<AtsScoreMeterProps> = ({ score, tips }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prevScore, setPrevScore] = useState(score);

  // Trigger celebration confetti when hitting 100%
  useEffect(() => {
    if (score === 100 && prevScore < 100) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.1, x: 0.7 },
      });
    }
    setPrevScore(score);
  }, [score, prevScore]);

  // Radius for the mini circular progress
  const radius = 13;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const colorClass =
    score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-rose-500';

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer backdrop-blur-xs"
      >
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r={radius}
              stroke="currentColor"
              strokeWidth="3"
              className="text-slate-100"
              fill="transparent"
            />
            <motion.circle
              cx="18"
              cy="18"
              r={radius}
              stroke="currentColor"
              strokeWidth="3.2"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              strokeLinecap="round"
              className={colorClass}
              fill="transparent"
            />
          </svg>
          <span className="absolute text-[10px] font-black tracking-tight text-slate-800">
            {score}
          </span>
        </div>

        <div className="text-left hidden sm:block">
          <div className="text-[11px] font-bold text-slate-800 leading-none flex items-center gap-1">
            ATS Score
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            {score >= 80 ? 'Optimized' : 'Needs Polish'}
          </div>
        </div>
      </motion.button>

      {/* Breakdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl p-4 z-40"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${colorClass}`} />
                  <span className="text-xs font-bold text-slate-800">Resume Optimization</span>
                </div>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {score}%
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {tips.length === 0 ? (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Your resume meets all core ATS benchmarks for keyword and structure density.</span>
                  </div>
                ) : (
                  tips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-700 leading-snug"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};