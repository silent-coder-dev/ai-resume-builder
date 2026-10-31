'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Maximize, ShieldAlert, ShieldCheck } from 'lucide-react';
import { enterFullscreen } from '@/lib/assessment/session';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { formatClock } from '@/components/interview/types';
import { useImmersive } from '@/components/interview/useImmersive';
import { MAX_WARNINGS, PROCTOR_EVENT_TEXT, useProctor, type ProctorEvent } from '@/components/assessment/useProctor';

// The frame around every protected test: full screen, timer, warnings, and the
// overlay that hides the test until the candidate returns to full screen.
export function ExamShell({
  title,
  deadline,
  initialEvents,
  submitLabel = 'Submit test',
  submitting,
  onSubmitClick,
  onForceSubmit,
  onEvents,
  children,
}: {
  title: string;
  deadline: number | null;
  initialEvents: ProctorEvent[];
  submitLabel?: string;
  submitting: boolean;
  onSubmitClick: () => void;
  onForceSubmit: (reason: 'time' | 'warnings') => void;
  onEvents: (events: ProctorEvent[]) => void;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  useImmersive(rootRef);
  const [remaining, setRemaining] = useState<number | null>(null);
  const forcedRef = useRef(false);

  const force = (reason: 'time' | 'warnings') => {
    if (forcedRef.current) return;
    forcedRef.current = true;
    onForceSubmit(reason);
  };

  const proctor = useProctor({
    active: !submitting,
    initialEvents,
    onEvent: onEvents,
    onLimitReached: () => force('warnings'),
  });

  useEffect(() => {
    if (deadline === null) return;
    const tick = () => {
      const left = Math.ceil((deadline - Date.now()) / 1000);
      setRemaining(Math.max(0, left));
      if (left <= 0) force('time');
    };
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  const warnings = proctor.events.length;
  const low = remaining !== null && remaining <= 60;

  return createPortal(
    <div ref={rootRef} className="exam-locked fixed inset-0 z-[90] flex flex-col bg-canvas text-ink" aria-label={`Protected test: ${title}`}>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-2 text-white">
        <div className="flex min-w-0 items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <p className="truncate text-body font-semibold">{title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span
            className={`hidden items-center gap-1.5 rounded-md px-2 py-1 text-label font-semibold sm:flex ${warnings > 0 ? 'bg-amber-400/15 text-amber-300' : 'text-slate-400'}`}
            title="Leaving full screen or switching away counts as a warning."
          >
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" /> Warnings {warnings}/{MAX_WARNINGS}
          </span>
          {remaining !== null && (
            <span
              role="timer"
              aria-label="Time left"
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-body font-semibold tabular-nums ${low ? 'bg-rose-500/20 text-rose-300' : 'text-white'}`}
            >
              <Clock className="h-4 w-4" aria-hidden="true" /> {formatClock(remaining)}
            </span>
          )}
          <Button variant="primary" size="sm" onClick={onSubmitClick} loading={submitting} disabled={deadline === null}>
            {submitLabel}
          </Button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">{children}</div>

      {/* The test stays hidden until the candidate is back in full screen. */}
      {proctor.needsFullscreen && !submitting && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950 p-6 text-center text-white">
          <div className="max-w-md">
            <ShieldAlert className="mx-auto h-10 w-10 text-amber-400" aria-hidden="true" />
            <h2 className="mt-3 text-heading font-semibold">You left full screen</h2>
            <p className="mt-2 text-body text-slate-300">
              This counts as a warning ({warnings} of {MAX_WARNINGS}). The timer keeps running. The test ends automatically at {MAX_WARNINGS} warnings.
            </p>
            <Button variant="primary" size="lg" className="mt-5" onClick={() => void enterFullscreen()}>
              <Maximize className="h-4 w-4" aria-hidden="true" /> Return to the test
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={Boolean(proctor.lastWarning) && !proctor.needsFullscreen && !submitting}
        onClose={proctor.dismissWarning}
        title={`Warning ${warnings} of ${MAX_WARNINGS}`}
        description={proctor.lastWarning ? `${PROCTOR_EVENT_TEXT[proctor.lastWarning.type]}. Stay on this screen until you submit. The test ends automatically at ${MAX_WARNINGS} warnings.` : undefined}
        size="sm"
        footer={<Button variant="primary" onClick={proctor.dismissWarning}>Back to the test</Button>}
      >
        <span />
      </Dialog>
    </div>,
    document.body
  );
}
