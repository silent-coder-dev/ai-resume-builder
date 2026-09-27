'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResumeStore } from '@/store/useResumeStore';
import {
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Layers,
  GripVertical,
  RotateCcw,
} from 'lucide-react';

interface SectionReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SectionReorderModal: React.FC<SectionReorderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    sectionOrder,
    moveSection,
    toggleSectionVisibility,
    resetSectionOrder,
  } = useResumeStore();

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      moveSection(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < sectionOrder.length - 1) {
      moveSection(index, index + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  Reorder Resume Sections
                </h3>
                <p className="text-[11px] text-slate-500">
                  Arrange section sequence and toggle visibility
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 bg-white border border-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of Sections */}
          <div className="p-4 sm:p-5 space-y-2 overflow-y-auto max-h-[60vh]">
            <div className="flex items-center justify-between pb-1">
              <p className="text-[11px] text-slate-500 font-medium">
                Top contact info remains anchored:
              </p>
              <button
                type="button"
                onClick={resetSectionOrder}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Default</span>
              </button>
            </div>

            {sectionOrder.map((section, index) => (
              <div
                key={section.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                  section.visible
                    ? 'bg-white border-slate-200 shadow-2xs'
                    : 'bg-slate-50 border-dashed border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-800">
                    {section.label}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Move Up */}
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveUp(index)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    disabled={index === sectionOrder.length - 1}
                    onClick={() => handleMoveDown(index)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Visibility Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleSectionVisibility(section.id)}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      section.visible
                        ? 'text-blue-600 hover:bg-blue-50'
                        : 'text-slate-400 hover:bg-slate-200'
                    }`}
                    title={section.visible ? 'Hide Section' : 'Show Section'}
                  >
                    {section.visible ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button
              type="button"
              onClick={resetSectionOrder}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Reset Default</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};