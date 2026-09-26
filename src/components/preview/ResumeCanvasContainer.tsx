'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

interface ResumeCanvasContainerProps {
  activeTemplate: string;
  children: React.ReactNode;
}

const BASE_WIDTH = 800; // Fixed width representing standard desktop/A4 preview

export const ResumeCanvasContainer: React.FC<ResumeCanvasContainerProps> = ({
  activeTemplate,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState<number>(1);
  const [manualScaleOffset, setManualScaleOffset] = useState<number>(0);
  const [measuredHeight, setMeasuredHeight] = useState<number>(1050);
  const contentRef = useRef<HTMLDivElement>(null);

  // Measure container and auto-fit to current viewport width
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      const availableWidth = containerRef.current.clientWidth - 24; // 24px padding margin
      if (availableWidth <= 0) return;

      if (availableWidth < BASE_WIDTH) {
        // Automatically shrink to fit mobile / tablet screens exactly
        const factor = availableWidth / BASE_WIDTH;
        setAutoScale(Math.min(factor, 1));
      } else {
        setAutoScale(1);
      }
    };

    calculateScale();

    const resizeObserver = new ResizeObserver(() => {
      calculateScale();
      if (contentRef.current) {
        setMeasuredHeight(contentRef.current.offsetHeight);
      }
    });

    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (contentRef.current) resizeObserver.observe(contentRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const currentScale = Math.max(0.3, Math.min(1.5, autoScale + manualScaleOffset));

  const handleZoomIn = () => setManualScaleOffset((prev) => prev + 0.08);
  const handleZoomOut = () => setManualScaleOffset((prev) => prev - 0.08);
  const handleReset = () => setManualScaleOffset(0);

  return (
    <div ref={containerRef} className="relative w-full flex flex-col items-center">
      {/* Outer wrapper maintaining true layout space so nothing clips or overlaps */}
      <div
        className="w-full flex justify-center overflow-hidden transition-all duration-150 ease-out"
        style={{
          height: `${measuredHeight * currentScale + 24}px`,
        }}
      >
        <div
          style={{
            transform: `scale(${currentScale})`,
            transformOrigin: 'top center',
            width: `${BASE_WIDTH}px`,
          }}
          className="shrink-0 transition-transform duration-100 ease-out"
        >
          {/* Elevation Paper Wrap */}
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-slate-200/60 to-slate-200/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.03)] print:shadow-none print:p-0 print:border-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTemplate}
                ref={contentRef}
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
        </div>
      </div>

      {/* Floating Toolbar with Auto-Scale Indicator */}
      <aside className="no-print fixed bottom-6 right-6 sm:right-8 z-30 flex items-center gap-1 bg-white/90 backdrop-blur-md px-3 py-1.5 border border-slate-200/80 rounded-full shadow-lg shadow-slate-900/5 text-slate-700 text-xs font-semibold">
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1 hover:bg-slate-100 rounded-full transition cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="px-1.5 font-mono text-[11px] text-slate-600 w-12 text-center">
          {Math.round(currentScale * 100)}%
        </span>

        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1 hover:bg-slate-100 rounded-full transition cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleReset}
          title="Reset to Screen Width (Fit)"
          className="ml-1 pl-1.5 border-l border-slate-200 p-1 hover:bg-slate-100 rounded-full transition cursor-pointer text-slate-500 hover:text-slate-800"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </aside>
    </div>
  );
};