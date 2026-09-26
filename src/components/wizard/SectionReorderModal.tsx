'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResumeStore, SectionKey } from '@/store/useResumeStore';
import {
  ArrowUpDown,
  X,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface SectionReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SectionReorderModal: React.FC<SectionReorderModalProps> = ({ isOpen, onClose }) => {
  const { sectionOrder, moveSection, toggleSectionVisibility, resetSectionOrder } = useResumeStore();

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    Reorder & Customize Sections
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Prioritize sections for Freshers or Experienced roles
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

            {/* List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-2 flex-1">
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-center justify-between">
                <span>
                  <strong>Tip:</strong> Freshers should place <em>Projects</em> and <em>Education</em> at the top.
                </span>
                <button
                  type="button"
                  onClick={resetSectionOrder}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 ml-2 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              </div>

              {sectionOrder.map((section, index) => (
                <div
                  key={section.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    section.visible
                      ? 'bg-white border-slate-200 shadow-2xs'
                      : 'bg-slate-50/80 border-slate-200/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-500 font-mono text-[11px] font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className={`text-xs font-semibold ${section.visible ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                      {section.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Toggle Visibility */}
                    <button
                      type="button"
                      onClick={() => toggleSectionVisibility(section.id)}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        section.visible
                          ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                      title={section.visible ? 'Hide section from resume' : 'Show section on resume'}
                    >
                      {section.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                      title="Move Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={index === sectionOrder.length - 1}
                      onClick={() => handleMoveDown(index)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                      title="Move Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Arrangement</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};