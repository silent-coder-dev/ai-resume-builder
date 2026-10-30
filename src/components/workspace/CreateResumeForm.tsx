'use client';

import React, { useId, useRef, useState } from 'react';
import { Copy, FilePlus2, FileText, FileUp, LayoutTemplate } from 'lucide-react';
import type { CareerStage } from '@/types/resume';
import type { ResumeRecord } from '@/lib/resume/record';
import { suggestResumeTitle } from '@/lib/resume/record';
import { SAMPLE_PROFILES, sampleForEditing } from '@/lib/resume/samples';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { usePreferences } from '@/store/usePreferences';
import { parseResumePdf, validateResumePdf } from '@/utils/resumeImport';
import { TEMPLATE_CATALOG } from '@/components/preview/templateCatalog';
import { Button } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Primitives';

type StartMethod = 'blank' | 'pdf' | 'example' | 'copy';

const STAGES: Array<{ value: CareerStage | null; label: string }> = [
  { value: 'student', label: 'Student' },
  { value: 'fresher', label: 'Fresher' },
  { value: 'experienced', label: 'Experienced' },
  { value: null, label: 'Skip for now' },
];

// The "create a new resume" form (PRD §8, §10): name, optional career stage,
// and how to start. Always creates a NEW resume with its own ID.
export function CreateResumeForm({
  onCreated,
  onCancel,
  initialTemplateId,
  initialAccentColor,
  initialMethod = 'blank',
  submitLabel = 'Create resume',
}: {
  onCreated: (record: ResumeRecord) => void;
  onCancel?: () => void;
  initialTemplateId?: string;
  initialAccentColor?: string;
  initialMethod?: StartMethod;
  submitLabel?: string;
}) {
  const resumes = useWorkspaceStore((state) => state.resumes);
  const createResume = useWorkspaceStore((state) => state.createResume);
  const duplicateResume = useWorkspaceStore((state) => state.duplicateResume);
  const openResume = useWorkspaceStore((state) => state.openResume);
  const preferences = usePreferences();

  const [title, setTitle] = useState('');
  const [stage, setStage] = useState<CareerStage | null>(preferences.defaultCareerStage);
  const [method, setMethod] = useState<StartMethod>(initialMethod);
  const [templateId, setTemplateId] = useState(initialTemplateId ?? preferences.defaultTemplateId);
  const [sampleId, setSampleId] = useState(SAMPLE_PROFILES[0].id);
  const [copyFromId, setCopyFromId] = useState(resumes[0]?.id ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageName = useId();

  const methods: Array<{ value: StartMethod; label: string; detail: string; icon: React.ComponentType<{ className?: string }> }> = [
    { value: 'blank', label: 'Blank resume', detail: 'Start with empty sections.', icon: FilePlus2 },
    { value: 'pdf', label: 'Import a PDF', detail: 'AI copies your old resume into the fields.', icon: FileUp },
    { value: 'example', label: 'Example resume', detail: 'Start from a filled-in sample and edit it.', icon: LayoutTemplate },
    ...(resumes.length > 0
      ? [{ value: 'copy' as const, label: 'Copy an existing resume', detail: 'Duplicate one of your resumes.', icon: Copy }]
      : []),
  ];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      let record: ResumeRecord;
      if (method === 'copy') {
        const source = resumes.find((item) => item.id === copyFromId);
        if (!source) throw new Error('Choose a resume to copy.');
        record = await duplicateResume(source.id, title.trim() || `${source.title} (copy)`);
        await openResume(record.id);
      } else if (method === 'pdf') {
        if (!file) throw new Error('Choose a PDF file to import.');
        const data = await parseResumePdf(file);
        record = await createResume({
          title: title.trim() || suggestResumeTitle(data),
          careerStage: stage,
          data,
          templateId,
          accentColor: initialAccentColor ?? preferences.defaultAccentColor,
        });
      } else if (method === 'example') {
        const sample = SAMPLE_PROFILES.find((item) => item.id === sampleId) ?? SAMPLE_PROFILES[0];
        record = await createResume({
          title: title.trim() || `${sample.role} Resume`,
          careerStage: stage ?? sample.careerStage,
          data: sampleForEditing(sample),
          templateId: initialTemplateId ?? sample.templateId,
          accentColor: initialAccentColor ?? preferences.defaultAccentColor,
        });
      } else {
        record = await createResume({
          title: title.trim() || 'Untitled Resume',
          careerStage: stage,
          templateId,
          accentColor: initialAccentColor ?? preferences.defaultAccentColor,
        });
      }
      onCreated(record);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The resume could not be created.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-6">
      <TextField
        label="Resume name"
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="e.g. Full Stack Developer Resume"
        hint="Only you see this name. It helps you tell your resumes apart."
        maxLength={80}
      />

      {method !== 'copy' && (
        <fieldset>
          <legend className="mb-2 text-label font-medium text-ink">
            Career stage <span className="font-normal text-ink-2">(optional)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((option) => (
              <label
                key={option.label}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-body transition-colors ${
                  stage === option.value ? 'border-primary bg-primary-light text-primary' : 'border-line hover:border-line-strong'
                }`}
              >
                <input
                  type="radio"
                  name={stageName}
                  className="accent-primary"
                  checked={stage === option.value}
                  onChange={() => setStage(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-label text-ink-2">Freshers and students get Education and Projects first. You can change this later.</p>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 text-label font-medium text-ink">How do you want to start?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {methods.map(({ value, label, detail, icon: Icon }) => (
            <label
              key={value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                method === value ? 'border-primary bg-primary-light' : 'border-line bg-surface hover:border-line-strong'
              }`}
            >
              <input type="radio" name={`${stageName}-method`} className="sr-only" checked={method === value} onChange={() => setMethod(value)} />
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${method === value ? 'text-primary' : 'text-ink-2'}`} aria-hidden="true" />
              <span>
                <span className="block text-body font-semibold text-ink">{label}</span>
                <span className="block text-small text-ink-2">{detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {method === 'pdf' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            aria-label="Resume PDF file"
            onChange={async (event) => {
              const chosen = event.target.files?.[0];
              event.target.value = '';
              if (!chosen) return;
              try {
                await validateResumePdf(chosen);
                setFile(chosen);
                setError(null);
              } catch (caught) {
                setFile(null);
                setError(caught instanceof Error ? caught.message : 'Choose a PDF file.');
              }
            }}
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full justify-start">
            <FileText className="h-4 w-4" aria-hidden="true" />
            {file ? file.name : 'Choose a PDF (up to 8 MB)'}
          </Button>
          <p className="mt-1.5 text-label text-ink-2">
            Your file is sent to the AI service to read it. Anything it cannot read clearly stays empty for you to fill in.
          </p>
        </div>
      )}

      {method === 'example' && (
        <SelectField label="Example resume" value={sampleId} onChange={(event) => setSampleId(event.target.value)}>
          {SAMPLE_PROFILES.map((sample) => (
            <option key={sample.id} value={sample.id}>
              {sample.role} — {sample.name}
            </option>
          ))}
        </SelectField>
      )}

      {method === 'copy' && (
        <SelectField label="Resume to copy" value={copyFromId} onChange={(event) => setCopyFromId(event.target.value)}>
          {resumes.map((resume) => (
            <option key={resume.id} value={resume.id}>
              {resume.title}
            </option>
          ))}
        </SelectField>
      )}

      {(method === 'blank' || method === 'pdf') && (
        <SelectField label="Template" hint="You can switch templates any time." value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
          {TEMPLATE_CATALOG.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} — {template.bestFor}
            </option>
          ))}
        </SelectField>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={busy}>
          {busy && method === 'pdf' ? 'Reading your PDF…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
