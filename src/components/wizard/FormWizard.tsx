'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useResumeStore } from '@/store/useResumeStore';
import { callAi } from '@/utils/aiClient';
import { createId, hasText, isFilledEducation, isFilledExperience, isFilledProject, isFilledSkill } from '@/utils/resumeContent';
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
  AlertCircle,
} from 'lucide-react';

// Splits a comma-separated field without trimming the end of the text being
// typed, so multi-word entries like "Spring Boot" keep their spaces.
const splitCommaList = (value: string) => value.split(',').map((part) => part.trimStart());

const EmptyStepHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-4 text-center text-[11px] text-slate-500">
    {children}
  </p>
);

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
  const [enhancingId, setEnhancingId] = useState<string | null>(null);
  const [enhanceErrors, setEnhanceErrors] = useState<Record<string, string>>({});
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
  const stepBodyRef = useRef<HTMLDivElement>(null);
  const stepButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const {
    resumeData,
    updatePersonalInfo,
    addLink,
    removeLink,
    updateLink,
    addSkill,
    removeSkill,
    updateSkill,
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
    updateCertification,
    addAchievement,
    removeAchievement,
    updateAchievement,
  } = useResumeStore();

  // Keep the active tab visible and start each step at the top
  useEffect(() => {
    stepButtonRefs.current[activeStep]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
    stepBodyRef.current?.scrollTo({ top: 0 });
  }, [activeStep]);

  const scrollNav = (direction: 'left' | 'right') => {
    if (navScrollRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      navScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const hasSummaryEvidence =
    resumeData.skills.some(isFilledSkill) ||
    resumeData.experiences.some(isFilledExperience) ||
    resumeData.projects.some(isFilledProject) ||
    resumeData.education.some(isFilledEducation);
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
      const summary = await callAi<unknown>('generate-summary', {
        targetRole: resumeData.personalInfo.targetRole,
        experienceField: resumeData.personalInfo.experienceField,
        candidateType: summaryCandidateType,
        fresherEducationStatus:
          summaryCandidateType === 'fresher' ? fresherEducationStatus : undefined,
        passingYear: summaryCandidateType === 'fresher' ? summaryPassingYear : undefined,
        yearsOfExperience:
          summaryCandidateType === 'experienced' ? summaryYearsOfExperience : 'Fresher',
        skills: resumeData.skills.filter(isFilledSkill),
        education: resumeData.education.filter(isFilledEducation),
        experiences: resumeData.experiences.filter(isFilledExperience),
        projects: resumeData.projects.filter(isFilledProject),
        achievements: resumeData.achievements,
      });
      if (!hasText(summary)) {
        throw new Error('Summary generation failed. Please try again.');
      }
      updatePersonalInfo('summary', summary.trim());
    } catch (err) {
      console.error('Summary generation failed:', err);
      setSummaryError(
        err instanceof Error ? err.message : 'Summary generation failed. Please try again.'
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleEnhanceExperience = async (experienceId: string) => {
    const exp = resumeData.experiences.find((item) => item.id === experienceId);
    if (!exp || !exp.rawDetails.trim()) return;

    setEnhancingId(experienceId);
    setEnhanceErrors((current) => {
      const next = { ...current };
      delete next[experienceId];
      return next;
    });
    try {
      const bullets = await callAi<unknown>('enhance-experience', {
        company: exp.company,
        role: exp.role,
        rawDetails: exp.rawDetails,
        targetRole: resumeData.personalInfo.targetRole,
      });
      const cleanBullets = Array.isArray(bullets) ? bullets.filter(hasText) : [];
      if (cleanBullets.length === 0) {
        throw new Error('AI did not return any bullet points. Please try again.');
      }
      updateExperience(experienceId, { enhancedBullets: cleanBullets });
    } catch (err) {
      console.error('Experience enhancement failed:', err);
      setEnhanceErrors((current) => ({
        ...current,
        [experienceId]: err instanceof Error ? err.message : 'Enhancement failed. Please try again.',
      }));
    } finally {
      setEnhancingId(null);
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
                ref={(node) => {
                  stepButtonRefs.current[idx] = node;
                }}
                type="button"
                aria-current={isActive ? 'step' : undefined}
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
      <div ref={stepBodyRef} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
        {/* 1. PERSONAL INFO & CLICKABLE LINKS */}
        {activeStep === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="resume-full-name" className="block text-[11px] font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  id="resume-full-name"
                  type="text"
                  autoComplete="name"
                  value={resumeData.personalInfo.fullName}
                  onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                  placeholder="e.g. Satyam Singh"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="resume-target-role" className="block text-[11px] font-bold text-slate-700 mb-1">
                  Target Role / Job Title
                </label>
                <input
                  id="resume-target-role"
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
                <label htmlFor="resume-email" className="block text-[11px] font-bold text-slate-700 mb-1">Email</label>
                <input
                  id="resume-email"
                  type="email"
                  autoComplete="email"
                  value={resumeData.personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="resume-phone" className="block text-[11px] font-bold text-slate-700 mb-1">Phone</label>
                <input
                  id="resume-phone"
                  type="tel"
                  autoComplete="tel"
                  value={resumeData.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="resume-location" className="block text-[11px] font-bold text-slate-700 mb-1">Location</label>
                <input
                  id="resume-location"
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
                      id: createId(),
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
                      aria-label="Link label"
                      placeholder="Label (e.g. GitHub, LinkedIn)"
                      value={link.platform}
                      onChange={(e) => updateLink(link.id, { platform: e.target.value })}
                      className="w-28 text-xs p-2 border border-slate-200 rounded-xl bg-white outline-none font-semibold shrink-0"
                    />
                    <input
                      type="url"
                      inputMode="url"
                      aria-label="Link URL"
                      placeholder="URL (e.g. https://github.com/username)"
                      value={link.url}
                      onChange={(e) => updateLink(link.id, { url: e.target.value })}
                      className="min-w-0 flex-1 text-xs p-2 border border-slate-200 rounded-xl bg-white outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(link.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                      title="Remove Link"
                      aria-label="Remove link"
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
                aria-label="Professional summary"
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
                onClick={() => addSkill({ id: createId(), name: '', level: 'Professional' })}
                className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill</span>
              </button>
            </div>

            {resumeData.skills.length === 0 && (
              <EmptyStepHint>
                No skills yet. Click &quot;Add Skill&quot; and add one skill per row (aim for 5 or more).
              </EmptyStepHint>
            )}

            <div className="space-y-2">
              {resumeData.skills.map((skill) => (
                <div key={skill.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    aria-label="Skill name"
                    value={skill.name}
                    placeholder="e.g. Java 21, Spring Boot, Docker, PostgreSQL"
                    onChange={(e) => updateSkill(skill.id, { name: e.target.value })}
                    className="flex-1 text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeSkill(skill.id)}
                    aria-label={`Remove skill ${skill.name}`.trim()}
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
                    id: createId(),
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

            {resumeData.experiences.length === 0 && (
              <EmptyStepHint>
                No work experience yet. Freshers can skip this step and focus on Projects and Education.
              </EmptyStepHint>
            )}

            {resumeData.experiences.map((exp) => (
              <div key={exp.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex justify-between items-start">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      aria-label="Company name"
                      placeholder="Company Name"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                      className="text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none font-bold"
                    />
                    <input
                      type="text"
                      aria-label="Job title"
                      placeholder="Job Title / Role"
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                      className="text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none font-semibold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExperience(exp.id)}
                    aria-label="Remove this position"
                    className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    aria-label="Start date"
                    placeholder="Start (e.g. 2022)"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                    className="p-2 border border-slate-200 rounded-lg bg-white outline-none text-xs"
                  />
                  <input
                    type="text"
                    aria-label="End date"
                    placeholder="End (e.g. 2024)"
                    value={exp.isCurrent ? 'Present' : exp.endDate}
                    disabled={exp.isCurrent}
                    onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                    className="p-2 border border-slate-200 rounded-lg bg-white outline-none text-xs disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
                <label className="flex w-fit items-center gap-2 text-[11px] font-semibold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exp.isCurrent}
                    onChange={(e) => updateExperience(exp.id, { isCurrent: e.target.checked })}
                    className="h-3.5 w-3.5 accent-blue-600"
                  />
                  I currently work here
                </label>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold text-slate-600">Your Rough Notes:</span>
                    <button
                      type="button"
                      onClick={() => handleEnhanceExperience(exp.id)}
                      disabled={enhancingId === exp.id || !exp.rawDetails.trim()}
                      title={!exp.rawDetails.trim() ? 'Write a few notes first' : undefined}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {enhancingId === exp.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-yellow-500" />
                      )}
                      <span>{enhancingId === exp.id ? 'Writing bullets…' : 'AI Enhance (Google X-Y-Z)'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    aria-label="Rough notes about this role"
                    value={exp.rawDetails}
                    placeholder="Describe what you built, architecture, technologies used..."
                    onChange={(e) => updateExperience(exp.id, { rawDetails: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none"
                  />
                  {enhanceErrors[exp.id] && (
                    <p role="alert" className="mt-1 flex items-start gap-1 text-[11px] text-rose-700">
                      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                      {enhanceErrors[exp.id]}
                    </p>
                  )}
                </div>

                {exp.enhancedBullets && exp.enhancedBullets.length > 0 && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resume Bullets (one per line)
                      </span>
                      <button
                        type="button"
                        onClick={() => updateExperience(exp.id, { enhancedBullets: [] })}
                        className="text-[10px] font-bold text-emerald-800 hover:text-rose-700 cursor-pointer"
                      >
                        Use my notes instead
                      </button>
                    </div>
                    <textarea
                      rows={Math.max(3, exp.enhancedBullets.length + 1)}
                      aria-label="Resume bullet points, one per line"
                      value={exp.enhancedBullets.join('\n')}
                      onChange={(e) =>
                        updateExperience(exp.id, { enhancedBullets: e.target.value.split('\n') })
                      }
                      className="w-full rounded-lg border border-emerald-200 bg-white p-2 text-xs leading-relaxed text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <p className="text-[10px] text-emerald-800/80">
                      These bullets appear on your resume. Edit them freely and check every fact.
                    </p>
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
                    id: createId(),
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

            {resumeData.projects.length === 0 && (
              <EmptyStepHint>
                No projects yet. College, personal, or work projects all count as real evidence.
              </EmptyStepHint>
            )}

            {resumeData.projects.map((proj) => (
              <div key={proj.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    aria-label="Project title"
                    placeholder="Project Title"
                    value={proj.title}
                    onChange={(e) => updateProject(proj.id, { title: e.target.value })}
                    className="text-xs p-2 border border-slate-200 rounded-lg bg-white flex-1 mr-2 outline-none font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => removeProject(proj.id)}
                    aria-label="Remove this project"
                    className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  aria-label="Tech stack, comma separated"
                  placeholder="Tech Stack (comma separated: Java 21, Spring Boot, Docker)"
                  value={(proj.techStack || []).join(', ')}
                  onChange={(e) =>
                    updateProject(proj.id, { techStack: splitCommaList(e.target.value) })
                  }
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none"
                />

                <textarea
                  rows={2}
                  aria-label="Project description"
                  placeholder="What problem did it solve? What did you build, and what was the result?"
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
                        id: createId(),
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
                      id: createId(),
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

            {resumeData.education.length === 0 && (
              <EmptyStepHint>
                No education added yet. Use the buttons above to add a degree, Class 10, or Class 12.
              </EmptyStepHint>
            )}

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
                    aria-label="Remove this qualification"
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
                    id: createId(),
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
            {(resumeData.certifications || []).length === 0 && (
              <EmptyStepHint>
                Optional. Add licenses or certificates you actually hold. Empty sections stay hidden on the resume.
              </EmptyStepHint>
            )}
            {(resumeData.certifications || []).map((cert) => (
              <div key={cert.id} className="flex gap-2 items-center">
                <input
                  type="text"
                  aria-label="Certification name"
                  placeholder="Certification Name"
                  value={cert.name}
                  onChange={(e) => updateCertification(cert.id, { name: e.target.value })}
                  className="min-w-0 flex-1 text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                />
                <input
                  type="text"
                  aria-label="Issuer"
                  placeholder="Issuer"
                  value={cert.issuer}
                  onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
                  className="w-28 sm:w-36 text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeCertification(cert.id)}
                  aria-label="Remove this certification"
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
                    id: createId(),
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
            {(resumeData.achievements || []).length === 0 && (
              <EmptyStepHint>
                Optional. Add awards, ranks, or milestones. Empty sections stay hidden on the resume.
              </EmptyStepHint>
            )}
            {(resumeData.achievements || []).map((ach) => (
              <div key={ach.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    aria-label="Achievement title"
                    placeholder="Achievement Title"
                    value={ach.title}
                    onChange={(e) => updateAchievement(ach.id, { title: e.target.value })}
                    className="text-xs p-2 border border-slate-200 rounded-lg bg-white flex-1 mr-2 outline-none font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => removeAchievement(ach.id)}
                    aria-label="Remove this achievement"
                    className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  aria-label="Achievement details"
                  placeholder="Details / Description"
                  value={ach.description}
                  onChange={(e) => updateAchievement(ach.id, { description: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none"
                />
              </div>
            ))}

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-[11px] leading-5 text-blue-900">
              <strong>Last step done.</strong> Check the live preview, try a few templates, then use
              &quot;Download PDF&quot; at the top of the page.
              {onSwitchToPreview && (
                <button
                  type="button"
                  onClick={onSwitchToPreview}
                  className="lg:hidden ml-1 font-bold underline underline-offset-2 cursor-pointer"
                >
                  Open preview
                </button>
              )}
            </div>
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