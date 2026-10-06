'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, LoaderCircle, Sparkles, X } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import type { ResumeData } from '@/types/resume';
import { normalizeResumeData } from '@/utils/normalizeResumeData';

function hasResumeContent(data: ResumeData): boolean {
  return Boolean(
    data.personalInfo.fullName.trim() ||
      data.personalInfo.targetRole.trim() ||
      data.personalInfo.summary.trim() ||
      data.skills.length ||
      data.experiences.some((item) => item.rawDetails.trim() || item.enhancedBullets?.length) ||
      data.projects.some((item) => item.title.trim() || item.description.trim()) ||
      data.education.some((item) => item.degree.trim() || item.institution.trim())
  );
}

interface OptimizationChange {
  id: string;
  section: string;
  before: string;
  after: string;
}

function getOptimizationChanges(
  original: ResumeData,
  optimized: ResumeData
): OptimizationChange[] {
  const changes: OptimizationChange[] = [];
  const addChange = (id: string, section: string, before: string, after: string) => {
    if (before !== after) changes.push({ id, section, before: before || 'Not provided', after: after || 'Not provided' });
  };

  addChange('summary', 'Professional summary', original.personalInfo.summary, optimized.personalInfo.summary);
  original.experiences.forEach((item, index) => {
    const suggestion = optimized.experiences.find((entry) => entry.id === item.id) ?? optimized.experiences[index];
    if (!suggestion) return;
    const label = `${item.role || item.company || 'Experience'}${item.company ? ` · ${item.company}` : ''}`;
    addChange(`${item.id}-details`, `${label} · details`, item.rawDetails, suggestion.rawDetails);
    const oldBullets = (item.enhancedBullets ?? []).join('\n');
    const newBullets = (suggestion.enhancedBullets ?? []).join('\n');
    addChange(`${item.id}-bullets`, `${label} · bullets`, oldBullets, newBullets);
  });
  original.projects.forEach((item, index) => {
    const suggestion = optimized.projects.find((entry) => entry.id === item.id) ?? optimized.projects[index];
    if (suggestion) addChange(item.id, `${item.title || 'Project'} · description`, item.description, suggestion.description);
  });
  (original.achievements ?? []).forEach((item, index) => {
    const suggestion = optimized.achievements?.find((entry) => entry.id === item.id) ?? optimized.achievements?.[index];
    if (suggestion) addChange(item.id, `${item.title || 'Achievement'} · details`, item.description, suggestion.description);
  });
  return changes;
}

export function ResumeOptimizeButton() {
  const { resumeData, setResumeData } = useResumeStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimized, setOptimized] = useState<ResumeData | null>(null);
  const changes = optimized ? getOptimizationChanges(resumeData, optimized) : [];

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'optimize-resume', payload: { resumeData } }),
      });
      const data: { result?: unknown; error?: string } = await response.json();
      if (!response.ok || !data.result) {
        throw new Error(data.error || 'Resume optimization could not be completed.');
      }
      setOptimized(normalizeResumeData(data.result));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Resume optimization failed.');
    } finally {
      setLoading(false);
    }
  };

  const applyOptimizedResume = () => {
    if (!optimized) return;
    setResumeData(optimized);
    setOptimized(null);
  };

  return (
    <>
      <div className="no-print flex flex-wrap items-center justify-end gap-3">
        {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
        <motion.button
          type="button"
          onClick={() => void handleOptimize()}
          disabled={loading || !hasResumeContent(resumeData)}
          title={!hasResumeContent(resumeData) ? 'Add resume content before optimizing.' : undefined}
          whileHover={!loading ? { y: -1 } : undefined}
          whileTap={!loading ? { scale: 0.98 } : undefined}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-3.5 py-2 text-xs font-bold text-violet-800 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Reviewing resume…' : 'Optimize with AI'}
        </motion.button>
      </div>

      <AnimatePresence>
        {optimized && (
          <div className="no-print fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <button
              type="button"
              aria-label="Close optimization review"
              onClick={() => setOptimized(null)}
              className="absolute inset-0 cursor-default"
            />
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="resume-optimization-title"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-violet-700">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">AI review ready</span>
                  </div>
                  <h2 id="resume-optimization-title" className="mt-2 text-xl font-black text-slate-950">
                    Review your polished resume
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    AI may improve wording and consistency. Check the changes below before applying;
                    your original stays unchanged until you choose Apply.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOptimized(null)}
                  aria-label="Discard optimization"
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <section className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[10px] font-extrabold text-slate-800">Every suggested wording change</h3>
                  <span className="rounded-full bg-violet-100 px-2 py-1 text-[9px] font-bold text-violet-800">
                    {changes.length} {changes.length === 1 ? 'change' : 'changes'}
                  </span>
                </div>
                {changes.length > 0 ? (
                  <div className="mt-2 space-y-3">
                    {changes.map((change) => (
                      <article key={change.id} className="rounded-xl border border-slate-200 p-3">
                        <h4 className="mb-2 text-[10px] font-bold text-slate-800">{change.section}</h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Original</p>
                            <p className="mt-1 whitespace-pre-wrap break-words text-[10px] leading-5 text-slate-600">{change.before}</p>
                          </div>
                          <div className="rounded-lg bg-violet-50/70 p-3">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-violet-600">Suggested</p>
                            <p className="mt-1 whitespace-pre-wrap break-words text-[10px] leading-5 text-slate-700">{change.after}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-[10px] leading-5 text-emerald-800">
                    No narrative edits were suggested. Your factual fields and education details were kept unchanged.
                  </p>
                )}
              </section>

              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-[10px] font-extrabold text-emerald-900">Preserved resume sections</p>
                <p className="mt-1 text-[10px] leading-5 text-emerald-800">
                  {optimized.experiences.length} experience entries · {optimized.projects.length} projects ·{' '}
                  {optimized.skills.length} skills · {optimized.education.length} education entries ·{' '}
                  {optimized.certifications?.length ?? 0} certifications
                </p>
                <p className="mt-2 text-[10px] leading-5 text-slate-600">
                  After applying, inspect every section in the editor and correct anything that does
                  not accurately reflect your experience. AI suggestions can be imperfect.
                </p>
              </div>

              <div className="mt-5 flex flex-col-reverse justify-end gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setOptimized(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Keep original
                </button>
                <button
                  type="button"
                  onClick={applyOptimizedResume}
                  className="rounded-xl bg-violet-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-800"
                >
                  Apply optimized resume
                </button>
              </div>
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
