'use client';

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  // false while a task is running, so Esc / outside clicks cannot interrupt it.
  dismissible?: boolean;
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-5xl',
};

// Native <dialog>: the browser traps focus, makes the page behind inert,
// closes on Esc, and returns focus to the button that opened it.
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(event) => {
        // A click on the dialog element itself is a click on the backdrop.
        if (dismissible && event.target === ref.current) onClose();
      }}
      className={`app-dialog m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${SIZES[size]} overflow-hidden rounded-2xl border border-line bg-surface p-0 text-ink shadow-xl`}
    >
      {open && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
            <div className="min-w-0">
              <h2 id={titleId} className="text-card font-semibold text-ink">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-small text-ink-2">
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close dialog">
                <X className="h-4 w-4" />
              </Button>
            )}
          </header>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>}
          {footer && (
            <footer className="flex flex-col-reverse gap-2 border-t border-line bg-canvas px-6 py-4 sm:flex-row sm:justify-end">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      dismissible={!busy}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
