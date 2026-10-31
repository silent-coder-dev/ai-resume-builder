'use client';

import { useEffect, useState, type RefObject } from 'react';
import { enterFullscreen, exitFullscreen, isFullscreen, isFullscreenSupported } from '@/lib/assessment/session';

// For full-screen layers: hides the page behind from keyboards and screen readers,
// and tracks whether the browser is still in full-screen mode.
export function useImmersive(rootRef: RefObject<HTMLElement | null>) {
  const [fullscreen, setFullscreen] = useState(() => isFullscreen());

  useEffect(() => {
    const root = rootRef.current;
    const hidden: Element[] = [];
    for (const element of Array.from(document.body.children)) {
      if (element !== root && !element.hasAttribute('inert')) {
        element.setAttribute('inert', '');
        hidden.push(element);
      }
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      for (const element of hidden) element.removeAttribute('inert');
      document.body.style.overflow = previousOverflow;
    };
  }, [rootRef]);

  useEffect(() => {
    const onChange = () => setFullscreen(isFullscreen());
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  return { fullscreen, supported: isFullscreenSupported(), enter: enterFullscreen, exit: exitFullscreen };
}
