'use client';

import React, { useState } from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { Upload, FileText, Loader2, X, Sparkles, CheckCircle } from 'lucide-react';

interface UploadResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadResumeModal: React.FC<UploadResumeModalProps> = ({ isOpen, onClose }) => {
  const { setResumeData } = useResumeStore();
  const [selectedFile, setSelectedFile] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result as string;
      // Extract base64 without prefix "data:...;base64,"
      const base64Data = result.split(',')[1];
      setSelectedFile({
        base64: base64Data,
        mimeType: file.type || 'application/pdf',
        name: file.name,
      });
    };

    reader.readAsDataURL(file);
  };

  const handleParseAndPopulate = async () => {
    if (!selectedFile && !pastedText.trim()) {
      setError('Please upload a resume (PDF, Word, TXT) or paste text.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const payload = selectedFile
        ? { fileBase64: selectedFile.base64, mimeType: selectedFile.mimeType }
        : { resumeText: pastedText };

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'parse-resume',
          payload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse resume');

      if (data.result) {
        setResumeData(data.result);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'AI parsing failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 relative border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <Upload className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Upload & Refine Existing Resume</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Upload your existing resume (PDF, DOCX, TXT) or paste its text. Gemini will extract your details into the editor.
        </p>

        {error && (
          <div className="mb-3 p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-3">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 cursor-pointer bg-slate-50 hover:bg-blue-50/30 transition">
            {selectedFile ? (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-xs font-semibold">{selectedFile.name}</span>
              </div>
            ) : (
              <>
                <FileText className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-700">Choose file (.pdf, .docx, .txt)</span>
                <span className="text-[10px] text-slate-400">or paste plain text below</span>
              </>
            )}
            <input
              type="file"
              accept=".pdf,.docx,.txt,.rtf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <textarea
          rows={4}
          placeholder="Or paste your raw resume text here..."
          value={pastedText}
          onChange={(e) => {
            setPastedText(e.target.value);
            if (e.target.value) setSelectedFile(null);
          }}
          className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleParseAndPopulate}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-xs cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            )}
            Parse & Import with AI
          </button>
        </div>
      </div>
    </div>
  );
};