'use client';

import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useResumeStore } from '@/store/useResumeStore';
import {
  User,
  Sparkles,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Award,
  Trophy,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Globe,
  ArrowRight,
} from 'lucide-react';

interface FormWizardProps {
  onSwitchToPreview?: () => void;
}

type SummaryCandidateType = 'fresher' | 'experienced';
type FresherEducationStatus = 'graduated' | 'undergraduate';
const CURRENT_YEAR = new Date().getFullYear();

function isValidPassingYear(status: FresherEducationStatus | null, year: string): boolean {
  if (!status || !/^\d{4}$/.test(year)) return false;
  const numericYear = Number(year);
  return status === 'graduated'
    ? numericYear <= CURRENT_YEAR
    : numericYear >= CURRENT_YEAR;
}

const STEPS = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
];

export const FormWizard: React.FC<FormWizardProps> = ({ onSwitchToPreview }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [enhancingIndex, setEnhancingIndex] = useState<number | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showSummaryRequirements, setShowSummaryRequirements] = useState(false);
  const [showSummaryQuestions, setShowSummaryQuestions] = useState(false);
  const [summaryCandidateType, setSummaryCandidateType] = useState<SummaryCandidateType | null>(null);
  const [fresherEducationStatus, setFresherEducationStatus] =
    useState<FresherEducationStatus | null>(null);
  const [summaryPassingYear, setSummaryPassingYear] = useState('');
  const [summaryYearsOfExperience, setSummaryYearsOfExperience] = useState('');

  const navScrollRef = useRef<HTMLDivElement>(null);

  const {
    resumeData,
    updatePersonalInfo,
    addLink,
    removeLink,
    updateLink,
    addSkill,
    removeSkill,
    addExperience,
    removeExperience,
    updateExperience,
    addProject,
    removeProject,
    updateProject,
    addEducation,
    removeEducation,
    updateEducation,
    addCertification,
    removeCertification,
    addAchievement,
    removeAchievement,
  } = useResumeStore();

  const scrollNav = (direction: 'left' | 'right') => {
    if (navScrollRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      navScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const hasSummaryEvidence =
    resumeData.skills.some((skill) => skill.name.trim()) ||
    resumeData.experiences.some((experience) => experience.rawDetails.trim()) ||
    resumeData.projects.some((project) => project.description.trim()) ||
    resumeData.education.some((education) => education.degree.trim() || education.institution.trim());
  const hasTargetRole = Boolean(resumeData.personalInfo.targetRole.trim());
  const hasSummaryContent = hasTargetRole && hasSummaryEvidence;
  const isExperienceDetailsReady =
    summaryCandidateType === 'fresher'
      ? isValidPassingYear(fresherEducationStatus, summaryPassingYear)
      : summaryCandidateType === 'experienced' && Boolean(summaryYearsOfExperience.trim());
  const suggestedPassingYear =
    resumeData.education
      .map((education) => education.graduationYear.match(/\b(?:19|20)\d{2}\b/g)?.at(-1))
      .find(Boolean) || '';
  const isSummaryReady =
    hasSummaryContent && Boolean(summaryCandidateType) && isExperienceDetailsReady;

  const handleGenerateSummary = async () => {
    if (!hasSummaryContent) {
      setShowSummaryRequirements(true);
      setSummaryError(null);
      return;
    }

    setShowSummaryQuestions(true);
    if (!summaryCandidateType || !isExperienceDetailsReady) {
      setSummaryError(null);
      return;
    }

    setIsGeneratingSummary(true);
    setSummaryError(null);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-summary',
          payload: {
            targetRole: resumeData.personalInfo.targetRole,
            experienceField: resumeData.personalInfo.experienceField,
            candidateType: summaryCandidateType,
            fresherEducationStatus:
              summaryCandidateType === 'fresher' ? fresherEducationStatus : undefined,
            passingYear: summaryCandidateType === 'fresher' ? summaryPassingYear : undefined,
            yearsOfExperience:
              summaryCandidateType === 'experienced'
                ? summaryYearsOfExperience
                : 'Fresher',
            skills: resumeData.skills,
            education: resumeData.education,
            experiences: resumeData.experiences,
            projects: resumeData.projects,
            achievements: resumeData.achievements,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || typeof data.result !== 'string' || !data.result.trim()) {
        throw new Error(data.error || 'Summary generation failed. Please try again.');
      }
      updatePersonalInfo('summary', data.result);
    } catch (err) {
      console.error('Summary generation failed:', err);
      setSummaryError(
        err instanceof Error ? err.message : 'Summary generation failed. Please try again.'
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleEnhanceExperience = async (index: number) => {
    const exp = resumeData.experiences[index];
    if (!exp || !exp.rawDetails.trim()) return;

    setEnhancingIndex(index);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enhance-experience',
          payload: {
            company: exp.company,
            role: exp.role,
            rawDetails: exp.rawDetails,
            targetRole: resumeData.personalInfo.targetRole,
          },
        }),
      });
      const data = await res.json();
      if (data.result && Array.isArray(data.result)) {
        updateExperience(exp.id, { enhancedBullets: data.result });
      }
    } catch (err) {
      console.error('Experience enhancement failed:', err);
    } finally {
      setEnhancingIndex(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Sliding Navigation Bar */}
      <div className="p-2 sm:p-2.5 bg-slate-50/90 border-b border-slate-200/90 flex items-center gap-1 relative select-none">
        <button
          type="button"
          onClick={() => scrollNav('left')}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition shrink-0 cursor-pointer hidden sm:flex items-center justify-center"
          title="Scroll Left"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div
          ref={navScrollRef}
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-none px-1 py-0.5 scroll-smooth flex-1"
        >
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === idx;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-wizard-pill"
                    className="absolute inset-0 bg-blue-600 rounded-xl shadow-xs"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{step.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollNav('right')}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition shrink-0 cursor-pointer hidden sm:flex items-center justify-center"
          title="Scroll Right"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <div className="shrink-0 pl-1 border-l border-slate-200 hidden md:block">
          <span className="text-[10px] font-mono font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200">
            {activeStep + 1}/{STEPS.length}
          </span>
        </div>
      </div>

      {/* Form Step Body */}
      <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
        {/* 1. PERSONAL INFO & CLICKABLE LINKS */}
        {activeStep === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={resumeData.personalInfo.fullName}
                  onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                  placeholder="e.g. Satyam Singh"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Target Role / Job Title
                </label>
                <input
                  type="text"
                  value={resumeData.personalInfo.targetRole}
                  onChange={(e) => {
                    updatePersonalInfo('targetRole', e.target.value);
                    setSummaryError(null);
                  }}
                  placeholder="e.g. Java Backend Engineer"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={resumeData.personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={resumeData.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.location}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  placeholder="City, Country"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Clickable Profile Links Section */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Clickable Links (GitHub, LinkedIn, Portfolio, etc.)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    addLink({
                      id: Date.now().toString(),
                      platform: 'GitHub',
                      url: '',
                    })
                  }
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-blue-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Link</span>
                </button>
              </div>

              {(!resumeData.links || resumeData.links.length === 0) && (
                <p className="text-[11px] text-slate-400 italic">
                  No links added yet. Click &quot;Add Link&quot; to show clickable links on your resume.
                </p>
              )}

              <div className="space-y-2">
                {(resumeData.links || []).map((link) => (
                  <div key={link.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Label (e.g. GitHub, LinkedIn)"
                      value={link.platform}
                      onChange={(e) => updateLink(link.id, { platform: e.target.value })}
                      className="w-28 text-xs p-2 border border-slate-200 rounded-xl bg-white outline-none font-semibold shrink-0"
                    />
                    <input
                      type="text"
                      placeholder="URL (e.g. https://github.com/username)"
                      value={link.url}
                      onChange={(e) => updateLink(link.id, { url: e.target.value })}
                      className="flex-1 text-xs p-2 border border-slate-200 rounded-xl bg-white outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(link.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                      title="Remove Link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Professional Summary */}
            <motion.section
              layout
              className="relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-3.5 sm:p-4 shadow-sm"
            >
              <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-violet-200/30 blur-2xl" />
              <div className="relative flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <motion.div
                    animate={{ rotate: isGeneratingSummary ? 360 : 0, scale: isGeneratingSummary ? 1.08 : 1 }}
                    transition={{ duration: 1.8, repeat: isGeneratingSummary ? Infinity : 0, ease: 'linear' }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <label className="text-xs font-extrabold text-slate-900">
                        AI Summary Studio
                      </label>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                          isSummaryReady
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}
                      >
                        {isSummaryReady ? 'READY TO CREATE' : 'ADD YOUR DETAILS'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Tailored to your role and real experience
                    </p>
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary}
                  whileHover={!isGeneratingSummary ? { y: -1, scale: 1.02 } : undefined}
                  whileTap={!isGeneratingSummary ? { scale: 0.97 } : undefined}
                  className="group inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-3.5 py-2 text-[11px] font-bold text-white shadow-md shadow-indigo-600/20 transition hover:shadow-lg hover:shadow-indigo-600/30 disabled:cursor-wait disabled:opacity-70"
                >
                  {isGeneratingSummary ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-amber-200 transition-transform group-hover:rotate-12" />
                  )}
                  <span>
                    {isGeneratingSummary
                      ? 'Crafting summary...'
                      : !hasSummaryContent
                        ? 'Generate with AI'
                        : !showSummaryQuestions
                          ? 'Personalize my summary'
                          : !summaryCandidateType
                            ? 'Choose career stage'
                            : !isExperienceDetailsReady
                              ? 'Complete details above'
                              : 'Generate my summary'}
                  </span>
                  {!isGeneratingSummary && <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />}
                </motion.button>
              </div>

              <AnimatePresence>
                {showSummaryQuestions && hasSummaryContent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    className="relative mt-3 overflow-hidden"
                  >
                    <div className="rounded-xl border border-indigo-200 bg-white/85 p-3">
                      <p className="text-[11px] font-bold text-slate-800">
                        First, tell us where you are in your career:
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        We’ll use the resume details you entered and won’t make up experience or results.
                      </p>
                      <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {([
                          { type: 'fresher', title: 'I’m a fresher', detail: 'Use my education, projects, and skills' },
                          { type: 'experienced', title: 'I have work experience', detail: 'Use my roles and work details' },
                        ] as const).map((option) => {
                          const selected = summaryCandidateType === option.type;
                          return (
                            <button
                              key={option.type}
                              type="button"
                              onClick={() => {
                                setSummaryCandidateType(option.type);
                                if (option.type === 'fresher' && !summaryPassingYear && suggestedPassingYear) {
                                  setSummaryPassingYear(suggestedPassingYear);
                                }
                                setSummaryError(null);
                              }}
                              aria-pressed={selected}
                              className={`rounded-xl border p-2.5 text-left transition ${
                                selected
                                  ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-500/15'
                                  : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/50'
                              }`}
                            >
                              <span className="block text-[11px] font-bold text-slate-800">
                                {option.title}
                              </span>
                              <span className="mt-0.5 block text-[10px] text-slate-500">
                                {option.detail}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {summaryCandidateType === 'fresher' && (
                        <div className="mt-3">
                          <p className="text-[10px] font-semibold text-slate-700">
                            What best describes your education?
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {([
                              { status: 'graduated', label: 'I have graduated' },
                              { status: 'undergraduate', label: 'I’m still an undergraduate' },
                            ] as const).map((option) => (
                              <button
                                key={option.status}
                                type="button"
                                onClick={() => {
                                  setFresherEducationStatus(option.status);
                                  setSummaryError(null);
                                }}
                                aria-pressed={fresherEducationStatus === option.status}
                                className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition ${
                                  fresherEducationStatus === option.status
                                    ? 'border-indigo-400 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-500/15'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                          <label className="mt-3 block max-w-xs text-[10px] font-semibold text-slate-700">
                            {fresherEducationStatus === 'graduated'
                              ? 'What year did you graduate?'
                              : 'What is your expected graduation year?'}
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={4}
                              value={summaryPassingYear}
                              onChange={(event) =>
                                setSummaryPassingYear(event.target.value.replace(/\D/g, ''))
                              }
                              placeholder={`e.g. ${CURRENT_YEAR}`}
                              min={fresherEducationStatus === 'undergraduate' ? CURRENT_YEAR : undefined}
                              max={fresherEducationStatus === 'graduated' ? CURRENT_YEAR : undefined}
                              aria-invalid={
                                Boolean(summaryPassingYear) &&
                                !isValidPassingYear(fresherEducationStatus, summaryPassingYear)
                              }
                              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-normal outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </label>
                        </div>
                      )}

                      {summaryCandidateType === 'experienced' && (
                        <label className="mt-3 block max-w-xs text-[10px] font-semibold text-slate-700">
                          How many years of relevant work experience do you have?
                          <input
                            type="text"
                            value={summaryYearsOfExperience}
                            onChange={(event) => setSummaryYearsOfExperience(event.target.value)}
                            placeholder="e.g. 4 years"
                            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-normal outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </label>
                      )}

                      {summaryCandidateType && !isExperienceDetailsReady && (
                        <p role="alert" className="mt-2 text-[10px] font-medium text-amber-700">
                          {summaryCandidateType === 'fresher'
                            ? !fresherEducationStatus
                              ? 'Choose whether you have graduated or are still an undergraduate.'
                              : !/^\d{4}$/.test(summaryPassingYear)
                                ? 'Enter a four-digit year to continue.'
                                : fresherEducationStatus === 'graduated'
                                  ? `A graduation year cannot be after ${CURRENT_YEAR}.`
                                  : `An expected graduation year must be ${CURRENT_YEAR} or later.`
                            : 'Enter your years of relevant experience to continue.'}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showSummaryRequirements && !hasSummaryContent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    className="relative mt-3 overflow-hidden"
                  >
                    <div role="alert" className="rounded-xl border border-amber-200 bg-white/80 p-3">
                      <p className="text-[11px] font-bold text-amber-900">
                        Add these details first so your summary stays accurate:
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {!hasTargetRole && (
                          <button
                            type="button"
                            onClick={() => setActiveStep(0)}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800 transition hover:bg-amber-100"
                          >
                            <ArrowRight className="h-3 w-3" /> Add a target role
                          </button>
                        )}
                        {!hasSummaryEvidence && (
                          <>
                            <span className="self-center text-[10px] text-slate-500">
                              At least one skill, experience, project, or education entry
                            </span>
                            {[
                              { label: 'Skills', step: 1 },
                              { label: 'Experience', step: 2 },
                              { label: 'Projects', step: 3 },
                              { label: 'Education', step: 4 },
                            ].map((item) => (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => setActiveStep(item.step)}
                                className="rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700 transition hover:border-indigo-200 hover:bg-indigo-100"
                              >
                                Add {item.label.toLowerCase()}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {summaryError && (
                <p role="alert" className="relative mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] text-rose-700">
                  {summaryError}
                </p>
              )}
              <textarea
                rows={3}
                value={resumeData.personalInfo.summary}
                onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                placeholder="Your polished, ATS-friendly summary will appear here. You can edit it anytime."
                className="relative mt-3 w-full rounded-xl border border-slate-200/90 bg-white/90 p-3 text-xs leading-relaxed outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
              />
              <div className="relative mt-1.5 flex items-center justify-between gap-2 text-[9px] text-slate-400">
                <span>AI uses only the details in this resume. Review before applying.</span>
                <span>{resumeData.personalInfo.summary.trim().split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </motion.section>
          </div>
        )}

        {/* 2. SKILLS */}
        {activeStep === 1 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Technical & Core Skills</span>
              <button
                type="button"
                onClick={() =>
                  addSkill({ id: Date.now().toString(), name: '', level: 'Professional' })
                }
                className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill</span>
              </button>
            </div>

            <div className="space-y-2">
              {resumeData.skills.map((skill) => (
                <div key={skill.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={skill.name}
                    placeholder="e.g. Java 21, Spring Boot, Docker, PostgreSQL"
                    onChange={(e) => {
                      const updated = resumeData.skills.map((s) =>
                        s.id === skill.id ? { ...s, name: e.target.value } : s
                      );
                      useResumeStore.setState({
                        resumeData: { ...resumeData, skills: updated },
                      });
                    }}
                    className="flex-1 text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeSkill(skill.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. WORK EXPERIENCE */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Work Experience</span>
              <button
                type="button"
                onClick={() =>
                  addExperience({
                    id: Date.now().toString(),
                    company: '',
                    role: '',
                    startDate: '',
                    endDate: '',
                    isCurrent: false,
                    rawDetails: '',
                    enhancedBullets: [],
                  })
                }
                className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Position</span>
              </button>
            </div>

            {resumeData.experiences.map((exp, idx) => (
              <div key={exp.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex justify-between items-start">
                  <div className="grid grid-cols-2 gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                      className="text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Job Title / Role"
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                      className="text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none font-semibold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExperience(exp.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Start (e.g. 2022)"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                    className="p-2 border border-slate-200 rounded-lg bg-white outline-none text-xs"
                  />
                  <input
                    type="text"
                    placeholder="End (or 'Present')"
                    value={exp.endDate}
                    onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                    className="p-2 border border-slate-200 rounded-lg bg-white outline-none text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-600">Your Rough Notes:</span>
                    <button
                      type="button"
                      onClick={() => handleEnhanceExperience(idx)}
                      disabled={enhancingIndex === idx || !exp.rawDetails.trim()}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50 cursor-pointer"
                    >
                      {enhancingIndex === idx ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-yellow-500" />
                      )}
                      <span>AI Enhance (Google X-Y-Z)</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={exp.rawDetails}
                    placeholder="Describe what you built, architecture, technologies used..."
                    onChange={(e) => updateExperience(exp.id, { rawDetails: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none"
                  />
                </div>

                {exp.enhancedBullets && exp.enhancedBullets.length > 0 && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> AI Enhanced Bullets
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      {exp.enhancedBullets.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 4. KEY PROJECTS */}
        {activeStep === 3 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Key Projects</span>
              <button
                type="button"
                onClick={() =>
                  addProject({
                    id: Date.now().toString(),
                    title: '',
                    techStack: [],
                    description: '',
                  })
                }
                className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </button>
            </div>

            {resumeData.projects.map((proj) => (
              <div key={proj.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    placeholder="Project Title"
                    value={proj.title}
                    onChange={(e) => updateProject(proj.id, { title: e.target.value })}
                    className="text-xs p-2 border border-slate-200 rounded-lg bg-white flex-1 mr-2 outline-none font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => removeProject(proj.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Tech Stack (comma separated: Java 21, Spring Boot, Docker)"
                  value={(proj.techStack || []).join(', ')}
                  onChange={(e) =>
                    updateProject(proj.id, {
                      techStack: e.target.value.split(',').map((s) => s.trim()),
                    })
                  }
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none"
                />

                <textarea
                  rows={2}
                  placeholder="What problem did it solve? What metrics did you achieve?"
                  value={proj.description}
                  onChange={(e) => updateProject(proj.id, { description: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none"
                />
              </div>
            ))}
          </div>
        )}

        {/* 5. EDUCATION */}
        {activeStep === 4 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-700">Education Details</span>
                <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                  Add each school or qualification separately. Missing details can stay blank.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {['Class 10', 'Class 12'].map((degree) => (
                  <button
                    key={degree}
                    type="button"
                    onClick={() =>
                      addEducation({
                        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
                        institution: '',
                        degree,
                        fieldOfStudy: '',
                        graduationYear: '',
                        scoreOrGpa: '',
                      })
                    }
                    className="rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    + {degree}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    addEducation({
                      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
                      institution: '',
                      degree: '',
                      fieldOfStudy: '',
                      graduationYear: '',
                      scoreOrGpa: '',
                    })
                  }
                  className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add qualification</span>
                </button>
              </div>
            </div>

            {resumeData.education.map((edu) => (
              <div key={edu.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    aria-label="Degree or school qualification"
                    placeholder="Degree / qualification (e.g. B.Tech, M.Sc., Class 10, Class 12)"
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                    className="text-xs p-2 border border-slate-200 rounded-lg bg-white flex-1 mr-2 outline-none font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => removeEducation(edu.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    aria-label="School, college, or university"
                    placeholder="School / College / University"
                    value={edu.institution}
                    onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                    className="text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none"
                  />
                  <input
                    type="text"
                    aria-label="Passing or graduation year"
                    placeholder="Passing / graduation year (e.g. 2024)"
                    value={edu.graduationYear}
                    onChange={(e) => updateEducation(edu.id, { graduationYear: e.target.value })}
                    className="text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none"
                  />
                  <input
                    type="text"
                    aria-label="Field of study or specialization"
                    placeholder="Stream / major / specialization (optional)"
                    value={edu.fieldOfStudy ?? ''}
                    onChange={(e) => updateEducation(edu.id, { fieldOfStudy: e.target.value })}
                    className="text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none"
                  />
                  <input
                    type="text"
                    aria-label="Marks, percentage, or GPA"
                    placeholder="Marks / percentage / CGPA (optional)"
                    value={edu.scoreOrGpa ?? ''}
                    onChange={(e) => updateEducation(edu.id, { scoreOrGpa: e.target.value })}
                    className="text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. CERTIFICATIONS */}
        {activeStep === 5 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Certifications</span>
              <button
                type="button"
                onClick={() =>
                  addCertification({
                    id: Date.now().toString(),
                    name: '',
                    issuer: '',
                  })
                }
                className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Certification</span>
              </button>
            </div>
            {(resumeData.certifications || []).map((cert) => (
              <div key={cert.id} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Certification Name"
                  value={cert.name}
                  onChange={(e) => {
                    const updated = (resumeData.certifications || []).map((c) =>
                      c.id === cert.id ? { ...c, name: e.target.value } : c
                    );
                    useResumeStore.setState({
                      resumeData: { ...resumeData, certifications: updated },
                    });
                  }}
                  className="flex-1 text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                />
                <input
                  type="text"
                  placeholder="Issuer"
                  value={cert.issuer}
                  onChange={(e) => {
                    const updated = (resumeData.certifications || []).map((c) =>
                      c.id === cert.id ? { ...c, issuer: e.target.value } : c
                    );
                    useResumeStore.setState({
                      resumeData: { ...resumeData, certifications: updated },
                    });
                  }}
                  className="w-36 text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeCertification(cert.id)}
                  className="p-2 text-slate-400 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 7. ACHIEVEMENTS */}
        {activeStep === 6 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Key Achievements</span>
              <button
                type="button"
                onClick={() =>
                  addAchievement({
                    id: Date.now().toString(),
                    title: '',
                    description: '',
                  })
                }
                className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Achievement</span>
              </button>
            </div>
            {(resumeData.achievements || []).map((ach) => (
              <div key={ach.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    placeholder="Achievement Title"
                    value={ach.title}
                    onChange={(e) => {
                      const updated = (resumeData.achievements || []).map((a) =>
                        a.id === ach.id ? { ...a, title: e.target.value } : a
                      );
                      useResumeStore.setState({
                        resumeData: { ...resumeData, achievements: updated },
                      });
                    }}
                    className="text-xs p-2 border border-slate-200 rounded-lg bg-white flex-1 mr-2 outline-none font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => removeAchievement(ach.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Details / Description"
                  value={ach.description}
                  onChange={(e) => {
                    const updated = (resumeData.achievements || []).map((a) =>
                      a.id === ach.id ? { ...a, description: e.target.value } : a
                    );
                    useResumeStore.setState({
                      resumeData: { ...resumeData, achievements: updated },
                    });
                  }}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <button
          type="button"
          disabled={activeStep === 0}
          onClick={() => setActiveStep((p) => p - 1)}
          className="px-3 py-1.5 border border-slate-200 text-slate-600 disabled:opacity-30 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        {onSwitchToPreview && (
          <button
            type="button"
            onClick={onSwitchToPreview}
            className="lg:hidden px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Preview Canvas
          </button>
        )}

        <button
          type="button"
          disabled={activeStep === STEPS.length - 1}
          onClick={() => setActiveStep((p) => p + 1)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};