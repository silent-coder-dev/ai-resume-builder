'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, Sparkles } from 'lucide-react';

interface ResumeCanvasContainerProps {
  activeTemplate: string;
  children: React.ReactNode;
}

export const ResumeCanvasContainer: React.FC<ResumeCanvasContainerProps> = ({
  activeTemplate,
  children,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(130, z + 10));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(70, z - 10));
  const handleResetZoom = () => setZoomLevel(100);

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Floating Canvas Sheet with Realistic Paper Shadow & Scale */}
      <div className="w-full flex justify-center py-2 transition-transform duration-200 ease-out">
        <motion.div
          animate={{ scale: zoomLevel / 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-[820px] origin-top"
        >
          {/* Subtle Ambient Glow and Elevating Layer */}
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-slate-200/60 to-slate-200/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.03)] print:shadow-none print:p-0 print:border-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTemplate}
                initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(3px)' }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="w-full bg-white rounded-xl overflow-hidden print:rounded-none"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Floating Canvas Zoom Pill Toolbar (Hidden in Print) */}
      <aside className="no-print fixed bottom-6 right-8 z-30 flex items-center gap-1 bg-white/90 backdrop-blur-md px-3 py-1.5 border border-slate-200/80 rounded-full shadow-lg shadow-slate-900/5 text-slate-700 text-xs font-semibold">
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1 hover:bg-slate-100 rounded-full transition cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="px-2 font-mono text-[11px] text-slate-500 w-12 text-center">
          {zoomLevel}%
        </span>
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1 hover:bg-slate-100 rounded-full transition cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleResetZoom}
          title="Fit View"
          className="ml-1 pl-1.5 border-l border-slate-200 p-1 hover:bg-slate-100 rounded-full transition cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
        </button>
      </aside>
    </div>
  );
};