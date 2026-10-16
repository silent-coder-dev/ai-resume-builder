'use client';

import { useSyncExternalStore } from 'react';
import { useResumeStore } from '@/store/useResumeStore';

// The saved draft lives in localStorage, which the server cannot see.
// Components that render saved data wait for this to be true so the
// server HTML and the first browser render always match.
export function useStoreHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useResumeStore.persist.onFinishHydration(onChange),
    () => useResumeStore.persist.hasHydrated(),
    () => false
  );
}
