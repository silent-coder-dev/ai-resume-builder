'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw, FileText } from 'lucide-react';

interface ResumeCanvasContainerProps {
  activeTemplate: string;
  children: React.ReactNode;
}

const BASE_WIDTH = 794; // Standard A4 width in px at 96 DPI
const A4_PAGE_HEIGHT = 1123; // Standard A4 height in px at 96 DPI

export const ResumeCanvasContainer: React.FC<ResumeCanvasContainerProps> = ({
  activeTemplate,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [autoScale, setAutoScale] = useState<number>(1);
  const [manualOffset, setManualOffset] = useState<number>(0);
  const [contentHeight, setContentHeight] = useState<number>(A4_PAGE_HEIGHT);

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
  const totalPages = Math.max(1, Math.ceil(contentHeight / A4_PAGE_HEIGHT));
  const pageBreaks = Array.from({ length: totalPages - 1 }, (_, i) => (i + 1) * A4_PAGE_HEIGHT);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center select-none relative print:w-full print:m-0 print:p-0">
      {/* Top Page Count Status Indicator */}
      <div className="no-print mb-3 flex items-center justify-between w-full max-w-[794px] px-2 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 bg-white/90 border border-slate-200/80 px-2.5 py-1 rounded-full shadow-2xs backdrop-blur-xs">
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <span>
            {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
          </span>
          <span className="text-slate-300">|</span>
          <span className={`text-[11px] font-bold ${totalPages === 1 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {totalPages === 1 ? '1 Page (Optimal for ATS)' : 'Multi-Page (Best for 4+ YoE)'}
          </span>
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Dashed lines show exact A4 print cut-offs
        </span>
      </div>

      {/* Dynamic Sizing Viewport */}
      <div
        className="w-full flex justify-center overflow-x-hidden overflow-y-visible print:overflow-visible print:h-auto! print:block print:w-full"
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
          className="shrink-0 transition-transform duration-100 ease-out relative print:transform-none! print:w-full! print:m-0!"
        >
          {/* Visual Canvas Shadow Wrapper */}
          <div className="relative rounded-xl p-[1px] bg-gradient-to-b from-slate-200/80 to-slate-200/30 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] print:shadow-none! print:p-0! print:bg-transparent!">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTemplate}
                ref={contentRef}
                id="printable-resume-canvas"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="w-full bg-white rounded-lg overflow-hidden select-text relative print:rounded-none! print:overflow-visible!"
                style={{ minHeight: `${A4_PAGE_HEIGHT}px` }}
              >
                {children}

                {/* Visual A4 Page Break Cut Lines */}
                {pageBreaks.map((cutY, idx) => (
                  <div
                    key={idx}
                    className="no-print absolute left-0 right-0 z-20 pointer-events-none flex items-center justify-between"
                    style={{ top: `${cutY}px` }}
                  >
                    <div className="w-full border-b-2 border-dashed border-red-400/70" />
                    <span className="shrink-0 ml-2 mr-2 bg-red-50 border border-red-300 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                      Page {idx + 1} End / Page {idx + 2} Start
                    </span>
                    <div className="w-full border-b-2 border-dashed border-red-400/70" />
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating Canvas Zoom Controls */}
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