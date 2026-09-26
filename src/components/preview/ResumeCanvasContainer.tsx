'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ResumeCanvasContainerProps {
  activeTemplate: string;
  children: React.ReactNode;
}

const BASE_WIDTH = 794; // Standard A4 pixel width at 96 DPI

export const ResumeCanvasContainer: React.FC<ResumeCanvasContainerProps> = ({
  activeTemplate,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [autoScale, setAutoScale] = useState<number>(1);
  const [manualOffset, setManualOffset] = useState<number>(0);
  const [contentHeight, setContentHeight] = useState<number>(1120);

  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const parentWidth = containerRef.current.getBoundingClientRect().width;
    const availableWidth = Math.max(parentWidth - 16, 280);

    if (availableWidth < BASE_WIDTH) {
      setAutoScale(availableWidth / BASE_WIDTH);
    } else {
      setAutoScale(1);
    }

    if (contentRef.current) {
      setContentHeight(contentRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (contentRef.current) resizeObserver.observe(contentRef.current);

    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, [updateDimensions]);

  const effectiveScale = Math.max(0.35, Math.min(1.4, autoScale + manualOffset));

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center select-none">
      {/* Dynamic Sizing Wrapper to prevent height cut-offs on mobile */}
      <div
        className="w-full flex justify-center overflow-x-hidden overflow-y-visible"
        style={{
          height: `${Math.ceil(contentHeight * effectiveScale) + 32}px`,
        }}
      >
        <div
          style={{
            width: `${BASE_WIDTH}px`,
            transform: `scale(${effectiveScale})`,
            transformOrigin: 'top center',
          }}
          className="shrink-0 transition-transform duration-100 ease-out"
        >
          <div className="relative rounded-xl p-[1px] bg-gradient-to-b from-slate-200/80 to-slate-200/30 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] print:shadow-none print:p-0 print:border-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTemplate}
                ref={contentRef}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="w-full bg-white rounded-lg overflow-hidden print:rounded-none select-text"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating Canvas Controls */}
      <aside className="no-print fixed bottom-20 lg:bottom-6 right-4 sm:right-8 z-30 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1 border border-slate-200/90 rounded-full shadow-lg text-slate-700 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setManualOffset((m) => Math.max(-0.4, m - 0.08))}
          title="Zoom Out"
          className="p-1 hover:bg-slate-100 rounded-full transition cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="px-1 font-mono text-[11px] text-slate-500 w-11 text-center">
          {Math.round(effectiveScale * 100)}%
        </span>

        <button
          type="button"
          onClick={() => setManualOffset((m) => Math.min(0.4, m + 0.08))}
          title="Zoom In"
          className="p-1 hover:bg-slate-100 rounded-full transition cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setManualOffset(0)}
          title="Fit to Screen"
          className="ml-1 pl-1.5 border-l border-slate-200 p-1 hover:bg-slate-100 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-700"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </aside>
    </div>
  );
};