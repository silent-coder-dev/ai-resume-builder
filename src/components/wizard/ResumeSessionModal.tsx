'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResumeStore } from '@/store/useResumeStore';
import { History, PlusCircle, ArrowRight, UserCheck } from 'lucide-react';

export const ResumeSessionModal: React.FC = () => {
  const { resumeData, resetToBlank } = useResumeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionRole, setSessionRole] = useState('');

  useEffect(() => {
    // Check if the user has an existing saved draft that has actual content
    const rawStorage = localStorage.getItem('ai-resume-builder-store');
    const hasPrompted = sessionStorage.getItem('resume-session-checked');

    if (rawStorage && !hasPrompted) {
      try {
        const parsed = JSON.parse(rawStorage);
        const savedData = parsed.state?.resumeData;
        const name = savedData?.personalInfo?.fullName?.trim();
        const role = savedData?.personalInfo?.targetRole?.trim();
        const hasContent = name || role || savedData?.experiences?.length > 0 || savedData?.skills?.length > 0;

        if (hasContent) {
          setSessionName(name || 'Unnamed Candidate');
          setSessionRole(role || 'Draft in progress');
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Session detection error:', err);
      }
    }
  }, []);

  const handleContinue = () => {
    sessionStorage.setItem('resume-session-checked', 'true');
    setIsOpen(false);
  };

  const handleStartFresh = () => {
    sessionStorage.setItem('resume-session-checked', 'true');
    resetToBlank();
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Welcome Back!</h3>
                <p className="text-xs text-slate-500">We found an unfinished resume draft from your last session.</p>
              </div>
            </div>

            {/* Saved Profile Snapshot Preview */}
            <div className="p-5 bg-slate-50/50">
              <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 truncate">{sessionName}</div>
                  <div className="text-[11px] text-slate-500 truncate">{sessionRole}</div>
                </div>
              </div>
            </div>

            {/* Choice Buttons */}
            <div className="p-5 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleStartFresh}
                className="flex-1 py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-slate-400" />
                <span>Start Fresh</span>
              </button>

              <button
                type="button"
                onClick={handleContinue}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <span>Continue Draft</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};