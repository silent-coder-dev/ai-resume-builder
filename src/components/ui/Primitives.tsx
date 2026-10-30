import React from 'react';

export function Card({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-xl border border-line bg-surface ${className}`} {...props}>
      {children}
    </div>
  );
}

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-ink-2',
  primary: 'bg-primary-light text-primary',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-800',
  error: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
};

export function Badge({
  tone = 'neutral',
  className = '',
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-label font-medium ${BADGE_TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-surface-2 ${className}`} />;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-title font-bold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-body text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  className = '',
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center rounded-xl border border-dashed border-line-strong bg-surface px-6 py-12 text-center ${className}`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-card font-semibold text-ink">{title}</h2>
      <div className="mt-1.5 max-w-md text-body text-ink-2">{description}</div>
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}

export function Alert({
  tone = 'info',
  title,
  children,
  actions,
  className = '',
}: {
  tone?: 'info' | 'success' | 'warning' | 'error';
  title?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  const tones = {
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    success: 'border-green-200 bg-green-50 text-green-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    error: 'border-red-200 bg-red-50 text-red-900',
  };
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-small ${tones[tone]} ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {title && <p className="font-semibold">{title}</p>}
          {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return '';
  const seconds = Math.round((Date.now() - time) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(time).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const time = Date.parse(iso);
  return Number.isNaN(time) ? '' : new Date(time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
