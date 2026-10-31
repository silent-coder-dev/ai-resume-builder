// Small browser helpers shared by the interview and the protected tests.

import { getMeta, setMeta } from '@/lib/storage/resumeRepository';

/* ---------- Full screen ---------- */

export const isFullscreenSupported = () =>
  typeof document !== 'undefined' && typeof document.documentElement.requestFullscreen === 'function';

export const isFullscreen = () => typeof document !== 'undefined' && document.fullscreenElement !== null;

// Must run inside a click handler; browsers refuse it otherwise. Phones without
// full-screen support still get the full-window layout, so a refusal is not an error.
export async function enterFullscreen(): Promise<boolean> {
  if (!isFullscreenSupported()) return false;
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    // Chromium can make Esc a long-press while the page is full screen.
    const keyboard = (navigator as Navigator & { keyboard?: { lock?: (keys: string[]) => Promise<void> } }).keyboard;
    void keyboard?.lock?.(['Escape'])?.catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}

export async function exitFullscreen() {
  const keyboard = (navigator as Navigator & { keyboard?: { unlock?: () => void } }).keyboard;
  keyboard?.unlock?.();
  if (typeof document !== 'undefined' && document.fullscreenElement) {
    await document.exitFullscreen().catch(() => undefined);
  }
}

/* ---------- Surviving a reload ---------- */

// A session lives in this tab only, so an accidental reload can resume it and
// closing the tab forgets it.
export function saveSnapshot(key: string, value: unknown) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the session still works, it just can't resume.
  }
}

export function loadSnapshot<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearSnapshot(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

/* ---------- Attempt history ---------- */

// Only a summary is kept (no answers or transcripts), on this device.
export interface AttemptSummary {
  id: string;
  kind: 'interview' | 'mcq' | 'coding' | 'sql';
  title: string;
  // 0 to 100.
  percent: number;
  detail: string;
  warnings: number;
  at: string;
}

const HISTORY_KEY = 'practiceHistory';
const MAX_HISTORY = 40;

export async function loadAttempts(): Promise<AttemptSummary[]> {
  try {
    return (await getMeta<AttemptSummary[]>(HISTORY_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function saveAttempt(attempt: Omit<AttemptSummary, 'id' | 'at'>): Promise<void> {
  try {
    const previous = await loadAttempts();
    const entry: AttemptSummary = { ...attempt, id: `${Date.now()}`, at: new Date().toISOString() };
    await setMeta(HISTORY_KEY, [entry, ...previous].slice(0, MAX_HISTORY));
  } catch {
    // History is a convenience; a failed save must not disturb the results.
  }
}
