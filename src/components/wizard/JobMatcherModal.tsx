'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResumeStore } from '@/store/useResumeStore';
import {
  Briefcase,
  Sparkles,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Compass,
  ShieldAlert,
  FileCheck2,
  Info,
  Scale,
} from 'lucide-react';

interface JobMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MatchResult {
  matchScore: number;
  domainMismatch?: boolean;
  domainMismatchDetails?: string | null;
  licenseRequired?: boolean;
  licenseWarning?: string | null;
  seniorityMismatch?: boolean;
  seniorityWarning?: string | null;
  disclaimerPoints?: string[];
  matchingSkills: string[];
  missingSkills: string[];
  tailoredSummary: string;
  fresherBridgeStrategy?: string[];
  actionableTips?: string[];
}

export const JobMatcherModal: React.FC<JobMatcherModalProps> = ({ isOpen, onClose }) => {
  const { resumeData, updatePersonalInfo, addSkill } = useResumeStore();
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Disclaimer & Permission Modal states
  const [showDisclaimerGate, setShowDisclaimerGate] = useState(false);
  const [userAcknowledgedTerms, setUserAcknowledgedTerms] = useState(false);
  const [forceAnywayMode, setForceAnywayMode] = useState(false);

  // Resume completeness check
  const isCandidateResumeEmpty =
    !resumeData.personalInfo.fullName.trim() &&
    resumeData.skills.length === 0 &&
    resumeData.experiences.length === 0;

  const handleAnalyze = async (force: boolean = false) => {
    if (!jobDescription.trim()) return;

    if (jobDescription.trim().length < 45) {
      setError('Job description is too brief. Please paste the full job posting or requirements list.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'match-jd',
          payload: {
            resumeData,
            jobDescription,
            forceAnyway: force,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to match job description');
      setResult(data.result);

      // If extreme mismatch occurs and user hasn't explicitly acknowledged yet
      if ((data.result.domainMismatch || data.result.licenseRequired) && !force) {
        setUserAcknowledgedTerms(false);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong while auditing the job posting');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySummary = () => {
    // If critical mismatch exists, demand disclaimer acceptance first
    if ((result?.domainMismatch || result?.licenseRequired) && !userAcknowledgedTerms) {
      setShowDisclaimerGate(true);
      return;
    }

    if (result?.tailoredSummary) {
      updatePersonalInfo('summary', result.tailoredSummary);
    }
  };

  const handleConfirmForceTailor = () => {
    setUserAcknowledgedTerms(true);
    setShowDisclaimerGate(false);
    setForceAnywayMode(true);
    if (result?.tailoredSummary) {
      updatePersonalInfo('summary', result.tailoredSummary);
    }
  };

  const handleAddMissingSkill = (skill: string) => {
    addSkill({
      id: Date.now().toString(),
      name: skill,
      level: 'Intermediate',
    });
    if (result) {
      setResult({
        ...result,
        missingSkills: result.missingSkills.filter((s) => s !== skill),
        matchingSkills: [...result.matchingSkills, skill],
      });
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
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    ATS Job Description Matcher
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Audits domain fit, experience tiers, and ATS keyword gaps
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

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 touch-pan-y">
              {/* Edge Case Alert: Empty Candidate Profile */}
              {isCandidateResumeEmpty && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-blue-900 text-xs">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Your resume is currently blank:</span> We recommend adding your target title and top skills first, or loading a sample profile from the top bar for meaningful analysis.
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Paste Input Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Paste Target Job Posting / Description:
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste responsibilities, key requirements, or complete job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full text-base sm:text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 bg-slate-50/50"
                />
              </div>

              {/* Action Button */}
              <div className="flex justify-between items-center gap-2">
                <span className="text-[11px] text-slate-400">
                  {jobDescription.trim().length} characters
                </span>
                <button
                  type="button"
                  onClick={() => handleAnalyze(false)}
                  disabled={loading || !jobDescription.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Auditing Fit & Keywords...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>Analyze Alignment</span>
                    </>
                  )}
                </button>
              </div>

              {/* Results Breakdown */}
              {result && (
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  {/* CRITICAL DOMAIN MISMATCH WARNING BANNER */}
                  {result.domainMismatch && (
                    <div className="p-4 bg-rose-50 border border-rose-300/80 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Critical Career Domain Mismatch Detected</span>
                      </div>
                      <p className="text-xs text-rose-700 leading-relaxed">
                        {result.domainMismatchDetails ||
                          'Your academic background and profile do not match the core requirements of this role. Applying directly may result in automated ATS disqualification.'}
                      </p>
                      <div className="pt-1 flex items-center justify-between text-[11px] text-rose-800">
                        <span className="font-semibold">Tailoring requires explicit disclaimer consent.</span>
                        <button
                          type="button"
                          onClick={() => setShowDisclaimerGate(true)}
                          className="underline font-bold text-rose-900 hover:text-rose-950 cursor-pointer"
                        >
                          Review Disclaimer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STATUTORY / LICENSE REQUIREMENT BANNER */}
                  {result.licenseRequired && (
                    <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-2.5 text-purple-900">
                      <Scale className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold">Statutory Accreditation / License Required</div>
                        <p className="text-[11px] text-purple-800 mt-0.5 leading-relaxed">
                          {result.licenseWarning ||
                            'This profession legally mandates specific government-regulated licenses (e.g. Bar Registration, Medical License, CA accreditation).'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SENIORITY GAP BANNER */}
                  {result.seniorityMismatch && result.seniorityWarning && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold">Experience Tier Gap</div>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                          {result.seniorityWarning}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Score Card */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Keyword & Skill Overlap
                      </div>
                      <div className="text-2xl font-black text-slate-900 mt-0.5">
                        {result.matchScore}%
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        result.domainMismatch
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : result.seniorityMismatch
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : result.matchScore >= 75
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {result.domainMismatch
                        ? 'Domain Pivot Required'
                        : result.seniorityMismatch
                        ? 'Stretch Role'
                        : result.matchScore >= 75
                        ? 'High Alignment'
                        : 'Low Match'}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  {result.missingSkills.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Missing Tech & Domain Keywords (Click to add):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.missingSkills.map((skill, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAddMissingSkill(skill)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{skill}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fresher "Bridge The Gap" Project Strategy */}
                  {result.fresherBridgeStrategy && result.fresherBridgeStrategy.length > 0 && (
                    <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                      <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-indigo-600" />
                        How to Prove These Skills Without Traditional Experience:
                      </div>
                      <ul className="text-xs text-indigo-800 space-y-1.5 list-disc pl-4">
                        {result.fresherBridgeStrategy.map((strat, idx) => (
                          <li key={idx} className="leading-relaxed">{strat}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Matching Skills */}
                  {result.matchingSkills.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Covered Competencies:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.matchingSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tailored Summary Proposal */}
                  {result.tailoredSummary && (
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          {forceAnywayMode ? 'Pivot-Oriented Summary Proposal' : 'Grounded Summary Proposal'}
                        </span>
                        <button
                          type="button"
                          onClick={handleApplySummary}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>Apply to Resume</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed italic">
                        "{result.tailoredSummary}"
                      </p>
                    </div>
                  )}

                  {/* Actionable Tips */}
                  {result.actionableTips && result.actionableTips.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-xs font-bold text-slate-700">Recruiter Feedback:</div>
                      <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                        {result.actionableTips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* TERMS & ACKNOWLEDGEMENT POPUP MODAL (When domain mismatch exists) */}
          {showDisclaimerGate && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-200 p-5 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      Candidate Understanding & Consent
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Acknowledging risks before tailoring across unrelated domains
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
                  <div className="font-semibold text-slate-900">Notice to Candidate:</div>
                  <ul className="space-y-1.5 list-disc pl-4 text-[11px] text-slate-600 leading-relaxed">
                    {result?.disclaimerPoints && result.disclaimerPoints.length > 0 ? (
                      result.disclaimerPoints.map((point, idx) => <li key={idx}>{point}</li>)
                    ) : (
                      <>
                        <li>Your academic and practical record has no direct basis in the posted discipline.</li>
                        <li>Automated ATS screening parsers will flag this application with high disqualification probability.</li>
                        <li>The generator will only craft a career-transition summary; you agree not to fabricate verifiable credentials.</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="consent-checkbox"
                    checked={userAcknowledgedTerms}
                    onChange={(e) => setUserAcknowledgedTerms(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <label htmlFor="consent-checkbox" className="text-xs text-slate-700 font-medium cursor-pointer">
                    I understand the mismatch risks, and wish to proceed anyway.
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDisclaimerGate(false)}
                    className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Go Back & Re-evaluate
                  </button>
                  <button
                    type="button"
                    disabled={!userAcknowledgedTerms}
                    onClick={handleConfirmForceTailor}
                    className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Apply Anyway</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};