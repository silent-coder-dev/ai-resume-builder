'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { CareerStage } from '@/types/resume';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { isValidEmail, isValidPhone, isValidUrl } from '@/lib/resume/validation';
import { createId } from '@/utils/resumeContent';
import { TextField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { AddItemButton, SectionIntro } from '@/components/workspace/editors/EditorShared';

const STAGES: Array<{ value: CareerStage; label: string; hint: string }> = [
  { value: 'student', label: 'Student', hint: 'Still studying' },
  { value: 'fresher', label: 'Fresher', hint: 'Recently graduated' },
  { value: 'experienced', label: 'Experienced', hint: 'Has work history' },
];

export function PersonalEditor() {
  const info = useWorkspaceStore((state) => state.current?.data.personalInfo);
  // Fallbacks stay outside the selectors: a new [] inside one would re-render forever.
  const links = useWorkspaceStore((state) => state.current?.data.links) ?? [];
  const careerStage = useWorkspaceStore((state) => state.current?.careerStage) ?? null;
  const updatePersonalInfo = useWorkspaceStore((state) => state.updatePersonalInfo);
  const setCareerStage = useWorkspaceStore((state) => state.setCareerStage);
  const addItem = useWorkspaceStore((state) => state.addItem);
  const updateItem = useWorkspaceStore((state) => state.updateItem);
  const removeItem = useWorkspaceStore((state) => state.removeItem);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [stageChanged, setStageChanged] = useState<CareerStage | null>(null);

  if (!info) return null;
  const touch = (field: string) => setTouched((previous) => ({ ...previous, [field]: true }));
  const urlError = (field: string, value?: string) =>
    touched[field] && value?.trim() && !isValidUrl(value) ? 'Enter a web address, for example linkedin.com/in/your-name.' : null;

  return (
    <div>
      <SectionIntro title="Personal Information" description="How employers reach you. Only add what you are happy to share." />

      <fieldset className="mb-6">
        <legend className="mb-2 text-label font-medium text-ink">Career stage</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {STAGES.map((stage) => (
            <label
              key={stage.value}
              className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors ${
                careerStage === stage.value ? 'border-primary bg-primary-light' : 'border-line bg-surface hover:border-line-strong'
              }`}
            >
              <input
                type="radio"
                name="career-stage"
                className="mt-1 accent-primary"
                checked={careerStage === stage.value}
                onChange={() => {
                  setCareerStage(stage.value);
                  setStageChanged(stage.value);
                }}
              />
              <span>
                <span className="block text-body font-medium text-ink">{stage.label}</span>
                <span className="block text-label text-ink-2">{stage.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {stageChanged && (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-small text-ink-2">
            {stageChanged === 'experienced'
              ? 'Want Work Experience near the top?'
              : 'Want Education and Projects near the top? Work experience stays optional.'}
            <Button
              size="sm"
              variant="subtle"
              onClick={() => {
                setCareerStage(stageChanged, true);
                setStageChanged(null);
              }}
            >
              Use recommended order
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setStageChanged(null)}>
              No thanks
            </Button>
          </div>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Full name"
          autoComplete="name"
          value={info.fullName}
          onChange={(event) => updatePersonalInfo('fullName', event.target.value)}
          placeholder="e.g. Priya Sharma"
        />
        <TextField
          label="Target role / headline"
          value={info.targetRole}
          onChange={(event) => updatePersonalInfo('targetRole', event.target.value)}
          placeholder="e.g. Full Stack Developer"
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={info.email}
          onChange={(event) => updatePersonalInfo('email', event.target.value)}
          onBlur={() => touch('email')}
          placeholder="name@example.com"
          error={touched.email && info.email.trim() && !isValidEmail(info.email) ? 'Enter a valid email address.' : null}
        />
        <TextField
          label="Phone"
          type="tel"
          autoComplete="tel"
          value={info.phone}
          onChange={(event) => updatePersonalInfo('phone', event.target.value)}
          onBlur={() => touch('phone')}
          placeholder="+91 98765 43210"
          error={touched.phone && info.phone.trim() && !isValidPhone(info.phone) ? 'Enter a phone number with 7–15 digits.' : null}
        />
        <TextField
          label="Location"
          optional
          value={info.location}
          onChange={(event) => updatePersonalInfo('location', event.target.value)}
          placeholder="City, Country"
          className="sm:col-span-2"
        />
        <TextField
          label="LinkedIn URL"
          optional
          inputMode="url"
          value={info.linkedinUrl ?? ''}
          onChange={(event) => updatePersonalInfo('linkedinUrl', event.target.value)}
          onBlur={() => touch('linkedinUrl')}
          placeholder="linkedin.com/in/your-name"
          error={urlError('linkedinUrl', info.linkedinUrl)}
        />
        <TextField
          label="GitHub URL"
          optional
          inputMode="url"
          value={info.githubUrl ?? ''}
          onChange={(event) => updatePersonalInfo('githubUrl', event.target.value)}
          onBlur={() => touch('githubUrl')}
          placeholder="github.com/your-name"
          error={urlError('githubUrl', info.githubUrl)}
        />
        <TextField
          label="Portfolio URL"
          optional
          inputMode="url"
          value={info.portfolioUrl ?? ''}
          onChange={(event) => updatePersonalInfo('portfolioUrl', event.target.value)}
          onBlur={() => touch('portfolioUrl')}
          placeholder="your-site.com"
          error={urlError('portfolioUrl', info.portfolioUrl)}
          className="sm:col-span-2"
        />
      </div>

      <div className="mt-6">
        <p className="text-label font-medium text-ink">Other links</p>
        <p className="mb-3 text-label text-ink-2">For example LeetCode, Kaggle, Behance, or a publication.</p>
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className="flex items-start gap-2">
              <TextField
                label="Label"
                value={link.platform}
                onChange={(event) => updateItem('links', link.id, { platform: event.target.value })}
                placeholder="LeetCode"
                className="w-32 shrink-0 sm:w-40"
              />
              <TextField
                label="URL"
                inputMode="url"
                value={link.url}
                onChange={(event) => updateItem('links', link.id, { url: event.target.value })}
                onBlur={() => touch(`link-${link.id}`)}
                placeholder="leetcode.com/u/your-name"
                error={urlError(`link-${link.id}`, link.url)}
                className="min-w-0 flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="mt-[22px] hover:text-error"
                onClick={() => removeItem('links', link.id)}
                aria-label={`Remove ${link.platform || 'link'}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <AddItemButton label="Add another link" onClick={() => addItem('links', { id: createId(), platform: '', url: '' })} />
        </div>
      </div>
    </div>
  );
}
