'use client';

import Link from 'next/link';
import { create } from 'zustand';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  action?: { label: string; href: string };
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = nextId++;
    set({ toasts: [...get().toasts.slice(-3), { ...toast, id }] });
    setTimeout(() => get().dismiss(id), toast.tone === 'error' ? 8000 : 5000);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
}));

export function toast(message: string, options: { tone?: ToastTone; action?: { label: string; href: string } } = {}) {
  useToastStore.getState().push({ message, tone: options.tone ?? 'success', action: options.action });
}

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
const TONES = {
  success: 'text-success',
  error: 'text-error',
  info: 'text-info',
};

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
    >
      {toasts.map((item) => {
        const Icon = ICONS[item.tone];
        return (
          <div
            key={item.id}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-body text-ink shadow-lg"
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${TONES[item.tone]}`} aria-hidden="true" />
            <p className="min-w-0 flex-1">
              {item.message}
              {item.action && (
                <Link href={item.action.href} className="ml-1.5 font-semibold text-primary hover:underline">
                  {item.action.label}
                </Link>
              )}
            </p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss message"
              className="-mr-1 rounded-md p-1 text-ink-2 hover:bg-surface-2 hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
