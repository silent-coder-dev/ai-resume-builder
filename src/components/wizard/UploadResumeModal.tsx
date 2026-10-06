'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResumeStore } from '@/store/useResumeStore';
import { normalizeResumeData } from '@/utils/normalizeResumeData';
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
  const { setResumeData } = useResumeStore();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidPdfFile = (selectedFile: File) => {
    const isPdfMime =
      selectedFile.type === 'application/pdf' ||
      selectedFile.type === 'application/x-pdf' ||
      selectedFile.type === '';
    const hasPdfExtension = selectedFile.name.toLowerCase().endsWith('.pdf');
    return isPdfMime || hasPdfExtension;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(false);
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (!isValidPdfFile(selectedFile)) {
      setError('Please upload a valid PDF document (.pdf).');
      return;
    }

    if (selectedFile.size > 8 * 1024 * 1024) {
      setError('File size must be less than 8MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    if (!isValidPdfFile(droppedFile)) {
      setError('Please upload a valid PDF document (.pdf).');
      return;
    }

    if (droppedFile.size > 8 * 1024 * 1024) {
      setError('File size must be less than 8MB.');
      return;
    }

    setFile(droppedFile);
  };

  const handleUploadAndParse = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(base64);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'parse-resume-pdf',
          payload: {
            base64Pdf: base64Data,
            fileName: file.name,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.result) {
        throw new Error(data.error || 'Failed to parse resume. Please try a different PDF.');
      }

      setResumeData(normalizeResumeData(data.result));
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

  const resetModal = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
    setLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={!loading ? resetModal : undefined} />

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
                  <FileUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    Upload Existing Resume
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Upload a PDF and AI will extract fields automatically
                  </p>
                </div>
              </div>
              {!loading && (
                <button
                  type="button"
                  onClick={resetModal}
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
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => !loading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center ${
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

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Resume parsed successfully. Loading into canvas...</span>
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
                disabled={!file || loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Parsing Resume with AI...</span>
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