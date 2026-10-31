'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isFullscreen, isFullscreenSupported } from '@/lib/assessment/session';

// The protected test environment. What a website can honestly do:
// - keep the test full screen and notice when the candidate leaves it,
// - notice switching tabs or apps,
// - block copy, paste, right-click, and common shortcuts,
// - end the test after repeated warnings, and report it all in the results.
// It can't see other devices or apps, so results are self-assessment, not proof.

export const MAX_WARNINGS = 3;

export type ProctorEventType = 'left-fullscreen' | 'switched-away' | 'reloaded';

export interface ProctorEvent {
  type: ProctorEventType;
  at: number;
}

export const PROCTOR_EVENT_TEXT: Record<ProctorEventType, string> = {
  'left-fullscreen': 'Left full screen',
  'switched-away': 'Switched to another tab or window',
  reloaded: 'Reloaded the page',
};

const BLOCKED_KEYS = new Set(['F12', 'PrintScreen', 'F5', 'ContextMenu']);

function isBlockedShortcut(event: KeyboardEvent): boolean {
  if (BLOCKED_KEYS.has(event.key)) return true;
  if (!(event.ctrlKey || event.metaKey)) return false;
  const key = event.key.toLowerCase();
  if (event.shiftKey && ['i', 'j', 'c', 'k', 'r'].includes(key)) return true;
  return ['p', 's', 'u', 'r', 'n', 't', 'o', 'g', 'f', 'h', 'l', 'd', 'j'].includes(key);
}

interface ProctorOptions {
  active: boolean;
  initialEvents?: ProctorEvent[];
  onLimitReached: () => void;
  onEvent?: (events: ProctorEvent[]) => void;
}

export function useProctor({ active, initialEvents = [], onLimitReached, onEvent }: ProctorOptions) {
  const [events, setEvents] = useState<ProctorEvent[]>(initialEvents);
  const [blocked, setBlocked] = useState(0);
  const [needsFullscreen, setNeedsFullscreen] = useState(false);
  const [lastWarning, setLastWarning] = useState<ProctorEvent | null>(null);

  const eventsRef = useRef(initialEvents);
  const lastEventAt = useRef(0);
  const graceUntil = useRef(0);
  const limitRef = useRef(onLimitReached);
  const eventRef = useRef(onEvent);
  // Text copied inside the code editor can be pasted back into it.
  const internalClipboard = useRef('');

  useEffect(() => {
    limitRef.current = onLimitReached;
    eventRef.current = onEvent;
  }, [onEvent, onLimitReached]);

  const record = useCallback((type: ProctorEventType) => {
    const now = Date.now();
    // Leaving usually fires several browser events at once; count it one time.
    if (now < graceUntil.current || now - lastEventAt.current < 1500) return;
    lastEventAt.current = now;
    const event: ProctorEvent = { type, at: now };
    const next = [...eventsRef.current, event];
    eventsRef.current = next;
    setEvents(next);
    setLastWarning(event);
    eventRef.current?.(next);
    if (next.length >= MAX_WARNINGS) limitRef.current();
  }, []);

  useEffect(() => {
    if (!active) return;
    graceUntil.current = Date.now() + 1500;

    const onFullscreenChange = () => {
      if (isFullscreen()) {
        setNeedsFullscreen(false);
        // The full-screen notice already told them; no second popup.
        setLastWarning(null);
        graceUntil.current = Date.now() + 1000;
      } else {
        setNeedsFullscreen(true);
        record('left-fullscreen');
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') record('switched-away');
    };
    const onBlur = () => record('switched-away');

    const inEditor = (target: EventTarget | null) => target instanceof Element && target.closest('.cm-editor') !== null;
    const block = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      setBlocked((count) => count + 1);
    };
    const onCopy = (event: ClipboardEvent) => {
      if (inEditor(event.target)) {
        internalClipboard.current = window.getSelection()?.toString() ?? '';
        return;
      }
      block(event);
    };
    const onPaste = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData('text') ?? '';
      const same = text.replace(/\r\n/g, '\n').trim() === internalClipboard.current.replace(/\r\n/g, '\n').trim();
      if (inEditor(event.target) && text && same) return;
      block(event);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (isBlockedShortcut(event)) block(event);
    };
    const onContextMenu = (event: Event) => block(event);
    const onDrag = (event: Event) => block(event);
    const onUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('copy', onCopy, true);
    document.addEventListener('cut', onCopy, true);
    document.addEventListener('paste', onPaste, true);
    document.addEventListener('contextmenu', onContextMenu, true);
    document.addEventListener('dragstart', onDrag, true);
    document.addEventListener('drop', onDrag, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('copy', onCopy, true);
      document.removeEventListener('cut', onCopy, true);
      document.removeEventListener('paste', onPaste, true);
      document.removeEventListener('contextmenu', onContextMenu, true);
      document.removeEventListener('dragstart', onDrag, true);
      document.removeEventListener('drop', onDrag, true);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [active, record]);

  return {
    events,
    blocked,
    needsFullscreen: needsFullscreen && isFullscreenSupported(),
    lastWarning,
    dismissWarning: () => setLastWarning(null),
  };
}
