'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResumeStore } from '@/store/useResumeStore';
import { hasResumeContent } from '@/utils/resumeContent';
import { parseResumePdf, validateResumePdf } from '@/utils/resumeImport';
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileUp,
} from 'lucide-react';

interface UploadResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadResumeModal: React.FC<UploadResumeModalProps> = ({ isOpen, onClose }) => {
  const resumeData = useResumeStore((state) => state.resumeData);
  const setResumeData = useResumeStore((state) => state.setResumeData);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const willReplaceDraft = hasResumeContent(resumeData);

  const resetModal = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
    setLoading(false);
    onClose();
  };

  useEffect(() => {
    if (!isOpen || loading) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setFile(null);
      setError(null);
      setSuccess(false);
      onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, loading, onClose]);

  const selectFile = async (selectedFile: File | undefined) => {
    setError(null);
    setSuccess(false);
    if (!selectedFile) return;
    try {
      await validateResumePdf(selectedFile);
      setFile(selectedFile);
    } catch (validationError) {
      setFile(null);
      setError(validationError instanceof Error ? validationError.message : 'Please choose a PDF file.');
    }
  };

  const handleUploadAndParse = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const parsed = await parseResumePdf(file);
      setResumeData(parsed);
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setFile(null);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      console.error('PDF parsing error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to read file. Please ensure the PDF is not password protected.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={!loading ? resetModal : undefined} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-resume-title"
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
                  <FileUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="upload-resume-title" className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    Import a Resume PDF
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    AI copies only what is written in your PDF into the editor
                  </p>
                </div>
              </div>
              {!loading && (
                <button
                  type="button"
                  onClick={resetModal}
                  aria-label="Close import"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 bg-white border border-slate-200 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) => {
                  void selectFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
                className="hidden"
              />

              <div
                role="button"
                tabIndex={0}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!loading) void selectFile(e.dataTransfer.files?.[0]);
                }}
                onClick={() => !loading && fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !loading) {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  file
                    ? 'border-blue-500 bg-blue-50/30'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                }`}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-2 text-slate-700">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold truncate max-w-[250px]">{file.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <span className="text-[11px] font-semibold text-blue-600 underline mt-1">
                      Click to choose a different file
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-600">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Drop your PDF here, or browse files
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Supported format: PDF up to 8MB
                    </span>
                  </div>
                )}
              </div>

              {willReplaceDraft && !success && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-900">
                  Importing replaces the resume that is open in the editor now.
                </p>
              )}

              {error && (
                <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Resume imported. Please check every section for accuracy.</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button
                type="button"
                onClick={resetModal}
                disabled={loading}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadAndParse}
                disabled={!file || loading || success}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Reading your PDF…</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Extract & Fill</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
