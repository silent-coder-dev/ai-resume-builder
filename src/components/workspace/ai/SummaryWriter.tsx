'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { CareerStage } from '@/types/resume';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { callAi } from '@/utils/aiClient';
import {
  hasText,
  isFilledEducation,
  isFilledExperience,
  isFilledProject,
  isFilledSkill,
} from '@/utils/resumeContent';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Alert } from '@/components/ui/Primitives';
import { TextField } from '@/components/ui/Field';
import { SuggestionReview } from '@/components/workspace/ai/SuggestionReview';

const CURRENT_YEAR = new Date().getFullYear();

// "Write with AI" for the professional summary. Asks a couple of questions,
// then shows the draft next to the current summary for approval.
export function SummaryWriter({ onNavigate }: { onNavigate: (section: string) => void }) {
  const current = useWorkspaceStore((state) => state.current);
  const updatePersonalInfo = useWorkspaceStore((state) => state.updatePersonalInfo);
  const setCareerStage = useWorkspaceStore((state) => state.setCareerStage);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'questions' | 'review'>('questions');
  const [stage, setStage] = useState<CareerStage | null>(null);
  const [graduated, setGraduated] = useState<boolean | null>(null);
  const [year, setYear] = useState('');
  const [years, setYears] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!current) return null;
  const { data } = current;
  const hasRole = hasText(data.personalInfo.targetRole);
  const hasEvidence =
    data.skills.some(isFilledSkill) ||
    data.experiences.some(isFilledExperience) ||
    (data.internships ?? []).some(isFilledExperience) ||
    data.projects.some(isFilledProject) ||
    data.education.some(isFilledEducation);

  const earlyCareer = stage === 'student' || stage === 'fresher';
  const yearValid =
    /^\d{4}$/.test(year) && (graduated ? Number(year) <= CURRENT_YEAR : Number(year) >= CURRENT_YEAR);
  const ready = stage !== null && (earlyCareer ? graduated !== null && yearValid : years.trim().length > 0);

  const start = () => {
    setStage(current.careerStage);
    setGraduated(current.careerStage === 'student' ? false : current.careerStage === 'fresher' ? true : null);
    const lastYear = data.education
      .map((item) => item.graduationYear.match(/\b(?:19|20)\d{2}\b/g)?.at(-1))
      .find(Boolean);
    setYear(lastYear ?? '');
    setYears(data.personalInfo.yearsOfExperience ? String(data.personalInfo.yearsOfExperience) : '');
    setStep('questions');
    setSuggestion('');
    setError(null);
    setOpen(true);
  };

  const generate = async () => {
    if (!ready || !stage) return;
    setStep('review');
    setLoading(true);
    setError(null);
    try {
      const result = await callAi<string>('generate-summary', {
        targetRole: data.personalInfo.targetRole,
        experienceField: data.personalInfo.experienceField,
        candidateType: earlyCareer ? 'fresher' : 'experienced',
        fresherEducationStatus: earlyCareer ? (graduated ? 'graduated' : 'undergraduate') : undefined,
        passingYear: earlyCareer ? year : undefined,
        yearsOfExperience: earlyCareer ? 'Fresher' : years,
        skills: data.skills.filter(isFilledSkill),
        education: data.education.filter(isFilledEducation),
        experiences: [...data.experiences, ...(data.internships ?? [])].filter(isFilledExperience),
        projects: data.projects.filter(isFilledProject),
        achievements: data.achievements,
      });
      setSuggestion(result.trim());
      if (stage !== current.careerStage) setCareerStage(stage);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The summary could not be written.');
    } finally {
      setLoading(false);
    }
  };

  const stages: Array<{ value: CareerStage; label: string }> = [
    { value: 'student', label: 'Student' },
    { value: 'fresher', label: 'Fresher' },
    { value: 'experienced', label: 'Experienced' },
  ];

  return (
    <>
      <Button variant="subtle" size="sm" onClick={start}>
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Write with AI
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Write your summary with AI"
        description="AI uses only the details already in this resume. It will not invent experience or results."
        size="lg"
        footer={
          step === 'questions' ? (
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => void generate()} disabled={!ready || !hasRole || !hasEvidence}>
                Write summary
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setStep('questions')} disabled={loading} className="sm:mr-auto">
                Back
              </Button>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Reject
              </Button>
              <Button
                variant="primary"
                disabled={loading || Boolean(error) || !suggestion.trim()}
                onClick={() => {
                  updatePersonalInfo('summary', suggestion.trim());
                  setOpen(false);
                }}
              >
                Accept summary
              </Button>
            </>
          )
        }
      >
        {step === 'questions' ? (
          <div className="space-y-5">
            {(!hasRole || !hasEvidence) && (
              <Alert tone="warning" title="Add a few details first so the summary is accurate">
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {!hasRole && (
                    <li>
                      A target role —{' '}
                      <button type="button" className="font-semibold underline" onClick={() => { setOpen(false); onNavigate('personal'); }}>
                        add it in Personal Information
                      </button>
                    </li>
                  )}
                  {!hasEvidence && <li>At least one skill, project, education entry, or job.</li>}
                </ul>
              </Alert>
            )}
            <fieldset>
              <legend className="mb-2 text-label font-medium text-ink">Where are you in your career?</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {stages.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-body transition-colors ${
                      stage === option.value ? 'border-primary bg-primary-light text-primary' : 'border-line hover:border-line-strong'
                    }`}
                  >
                    <input
                      type="radio"
                      name="summary-stage"
                      className="accent-primary"
                      checked={stage === option.value}
                      onChange={() => {
                        setStage(option.value);
                        if (option.value === 'student') setGraduated(false);
                        if (option.value === 'fresher' && graduated === null) setGraduated(true);
                      }}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {earlyCareer && (
              <div className="grid gap-4 sm:grid-cols-2">
                <fieldset>
                  <legend className="mb-2 text-label font-medium text-ink">Have you graduated?</legend>
                  <div className="flex gap-2">
                    {[
                      { value: true, label: 'Yes, graduated' },
                      { value: false, label: 'Still studying' },
                    ].map((option) => (
                      <label
                        key={option.label}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-small ${
                          graduated === option.value ? 'border-primary bg-primary-light text-primary' : 'border-line'
                        }`}
                      >
                        <input
                          type="radio"
                          name="summary-graduated"
                          className="accent-primary"
                          checked={graduated === option.value}
                          onChange={() => setGraduated(option.value)}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <TextField
                  label={graduated ? 'Graduation year' : 'Expected graduation year'}
                  inputMode="numeric"
                  maxLength={4}
                  value={year}
                  onChange={(event) => setYear(event.target.value.replace(/\D/g, ''))}
                  placeholder={String(CURRENT_YEAR)}
                  error={
                    year.length === 4 && !yearValid
                      ? graduated
                        ? `Graduation year cannot be after ${CURRENT_YEAR}.`
                        : `Expected year must be ${CURRENT_YEAR} or later.`
                      : null
                  }
                />
              </div>
            )}
            {stage === 'experienced' && (
              <TextField
                label="Years of relevant experience"
                value={years}
                onChange={(event) => setYears(event.target.value)}
                placeholder="e.g. 4"
                className="max-w-xs"
              />
            )}
          </div>
        ) : (
          <SuggestionReview
            original={data.personalInfo.summary}
            suggestion={suggestion}
            onSuggestionChange={setSuggestion}
            loading={loading}
            error={error}
          />
        )}
      </Dialog>
    </>
  );
}
