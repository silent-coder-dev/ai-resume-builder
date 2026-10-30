'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, RotateCcw } from 'lucide-react';
import type { SectionKey } from '@/types/resume';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { customSectionKey, sectionLabel } from '@/lib/resume/sections';
import { sectionHasContent } from '@/lib/resume/sectionContent';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';

export type EditorSection = SectionKey | 'personal';

// Left column of the workspace: every section in resume order, with
// completion dots, move up/down, show/hide, and "add custom section".
export function SectionNav({
  active,
  onSelect,
  compact = false,
}: {
  active: EditorSection;
  onSelect: (section: EditorSection) => void;
  compact?: boolean;
}) {
  const sectionOrder = useWorkspaceStore((state) => state.current?.sectionOrder);
  const data = useWorkspaceStore((state) => state.current?.data);
  const moveSection = useWorkspaceStore((state) => state.moveSection);
  const toggleSectionVisibility = useWorkspaceStore((state) => state.toggleSectionVisibility);
  const resetSectionOrder = useWorkspaceStore((state) => state.resetSectionOrder);
  const addCustomSection = useWorkspaceStore((state) => state.addCustomSection);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  if (!sectionOrder || !data) return null;

  const item = (key: EditorSection, label: string, index?: number, visible = true) => {
    const isActive = active === key;
    const done = sectionHasContent(key, data);
    return (
      <li key={key} className="group flex items-center gap-1">
        <button
          type="button"
          onClick={() => onSelect(key)}
          aria-current={isActive ? 'step' : undefined}
          className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-body transition-colors duration-150 ${
            isActive ? 'bg-primary-light font-semibold text-primary' : 'text-ink hover:bg-surface-2'
          } ${visible ? '' : 'opacity-60'}`}
        >
          <span
            aria-hidden="true"
            className={`h-2 w-2 shrink-0 rounded-full ${done ? 'bg-success' : 'border border-line-strong bg-surface'}`}
          />
          <span className="truncate">{label}</span>
          <span className="sr-only">{done ? '(has content)' : '(empty)'}{visible ? '' : ', hidden on resume'}</span>
        </button>
        {index !== undefined && !compact && (
          <span className="flex shrink-0 items-center xl:hidden xl:group-focus-within:flex xl:group-hover:flex">
            <button
              type="button"
              onClick={() => moveSection(key as SectionKey, -1)}
              disabled={index === 0}
              aria-label={`Move ${label} up`}
              className="rounded-md p-1.5 text-ink-2 hover:bg-surface-2 hover:text-ink disabled:opacity-30"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => moveSection(key as SectionKey, 1)}
              disabled={index === sectionOrder.length - 1}
              aria-label={`Move ${label} down`}
              className="rounded-md p-1.5 text-ink-2 hover:bg-surface-2 hover:text-ink disabled:opacity-30"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => toggleSectionVisibility(key as SectionKey)}
              aria-label={`${visible ? 'Hide' : 'Show'} ${label} on the resume`}
              aria-pressed={!visible}
              className="rounded-md p-1.5 text-ink-2 hover:bg-surface-2 hover:text-ink"
            >
              {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          </span>
        )}
      </li>
    );
  };

  return (
    <nav aria-label="Resume sections">
      <p className="px-3 pb-2 text-label font-medium uppercase tracking-wide text-ink-2">Sections</p>
      <ul className="space-y-0.5">
        {item('personal', 'Personal Information')}
        {sectionOrder.map((section, index) =>
          item(section.id, sectionLabel(section.id, data.customSections), index, section.visible)
        )}
      </ul>

      {!compact && (
        <div className="mt-3 space-y-1 border-t border-line pt-3">
          {adding ? (
            <form
              className="space-y-2 px-1"
              onSubmit={(event) => {
                event.preventDefault();
                const id = addCustomSection(newTitle);
                setAdding(false);
                setNewTitle('');
                if (id) onSelect(customSectionKey(id));
              }}
            >
              <Input
                autoFocus
                aria-label="New section title"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="e.g. Volunteering"
                maxLength={40}
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" variant="primary" disabled={!newTitle.trim()}>
                  Add
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add custom section
            </Button>
          )}
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={resetSectionOrder}>
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" /> Recommended order
          </Button>
        </div>
      )}
    </nav>
  );
}
