'use client';

import React from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function SectionIntro({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-heading font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 text-body text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function ItemCard({
  title,
  subtitle,
  index,
  count,
  onMove,
  onRemove,
  removeLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  index: number;
  count: number;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  removeLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-body font-semibold text-ink">{title}</p>
          {subtitle && <p className="truncate text-label text-ink-2">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center">
          <Button variant="ghost" size="icon-sm" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${title} up`}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={`Move ${title} down`}>
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label={removeLabel} className="hover:text-error">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </div>
  );
}

export function AddItemButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="secondary" onClick={onClick} className="w-full border-dashed">
      <Plus className="h-4 w-4" aria-hidden="true" /> {label}
    </Button>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line-strong bg-surface px-4 py-6 text-center text-body text-ink-2">{children}</p>;
}

// Splits a comma-separated field without trimming the end of the text being
// typed, so multi-word entries like "Spring Boot" keep their spaces.
export const splitCommaList = (value: string) => value.split(',').map((part) => part.trimStart());

export const linesToList = (value: string) => value.split('\n');
