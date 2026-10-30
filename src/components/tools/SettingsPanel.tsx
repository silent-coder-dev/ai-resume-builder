'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import type { CareerStage } from '@/types/resume';
import { usePreferences } from '@/store/usePreferences';
import { COLOR_OPTIONS, TEMPLATE_CATALOG } from '@/components/preview/templateCatalog';
import { Card, PageHeader, Skeleton } from '@/components/ui/Primitives';
import { SelectField } from '@/components/ui/Field';

interface UsagePolicy {
  plan: string;
  aiRequestsPerMinute: number;
  aiRequestsPerDay: number;
  provider: string;
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-card font-semibold text-ink">{title}</h2>
      {description && <p className="mt-1 text-small text-ink-2">{description}</p>}
      <div className="mt-5">{children}</div>
    </Card>
  );
}

export function SettingsPanel() {
  const preferences = usePreferences();
  const [policy, setPolicy] = useState<UsagePolicy | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/ai')
      .then((response) => response.json())
      .then((data: { result?: UsagePolicy }) => {
        if (!cancelled && data.result) setPolicy(data.result);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader title="Settings" description="Preferences are stored in this browser. They never contain resume content." />
      <div className="mt-6 space-y-4">
        <Section title="New resume defaults" description="Used when you create a new resume. Each resume can still be changed any time.">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Default template"
              value={preferences.defaultTemplateId}
              onChange={(event) => preferences.setPreference('defaultTemplateId', event.target.value)}
            >
              {TEMPLATE_CATALOG.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Default career stage"
              value={preferences.defaultCareerStage ?? ''}
              onChange={(event) => preferences.setPreference('defaultCareerStage', (event.target.value || null) as CareerStage | null)}
            >
              <option value="">Ask each time</option>
              <option value="student">Student</option>
              <option value="fresher">Fresher</option>
              <option value="experienced">Experienced</option>
            </SelectField>
          </div>
          <fieldset className="mt-5">
            <legend className="mb-2 text-label font-medium text-ink">Default accent color</legend>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => {
                const selected = preferences.defaultAccentColor === color.hex;
                return (
                  <button
                    key={color.hex}
                    type="button"
                    aria-pressed={selected}
                    aria-label={color.name}
                    title={color.name}
                    onClick={() => preferences.setPreference('defaultAccentColor', color.hex)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${selected ? 'border-ink' : 'border-surface shadow-sm'}`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {selected && <Check className="h-4 w-4 text-white" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </Section>

        <Section title="Accessibility">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Motion"
              hint="“Follow my device” respects your system’s reduced-motion setting."
              value={preferences.motion}
              onChange={(event) => preferences.setPreference('motion', event.target.value as 'system' | 'reduce')}
            >
              <option value="system">Follow my device</option>
              <option value="reduce">Always reduce motion</option>
            </SelectField>
            <SelectField
              label="Sidebar"
              value={preferences.sidebarCollapsed === null ? 'auto' : preferences.sidebarCollapsed ? 'collapsed' : 'expanded'}
              onChange={(event) =>
                preferences.setPreference('sidebarCollapsed', event.target.value === 'auto' ? null : event.target.value === 'collapsed')
              }
            >
              <option value="auto">Automatic</option>
              <option value="expanded">Always expanded</option>
              <option value="collapsed">Icons only</option>
            </SelectField>
          </div>
        </Section>

        <Section
          title="AI usage"
          description="Everything is free during launch. To keep it that way, AI features have fair-use limits. You are never charged, and you can always keep editing your resume without AI."
        >
          {policy ? (
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-label text-ink-2">Plan</dt>
                <dd className="text-body font-semibold text-ink">{policy.plan}</dd>
              </div>
              <div>
                <dt className="text-label text-ink-2">AI requests per minute</dt>
                <dd className="text-body font-semibold text-ink">{policy.aiRequestsPerMinute}</dd>
              </div>
              <div>
                <dt className="text-label text-ink-2">AI requests per day</dt>
                <dd className="text-body font-semibold text-ink">{policy.aiRequestsPerDay}</dd>
              </div>
            </dl>
          ) : (
            <Skeleton className="h-12" />
          )}
          <p className="mt-4 text-small text-ink-2">
            AI features are provided by {policy?.provider ?? 'an external AI service'}. Read{' '}
            <Link href="/privacy" className="font-semibold text-primary hover:underline">
              Privacy &amp; Data
            </Link>{' '}
            to see exactly what is sent.
          </p>
        </Section>
      </div>
    </div>
  );
}
