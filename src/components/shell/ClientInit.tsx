'use client';

import { useEffect } from 'react';
import { usePreferences } from '@/store/usePreferences';
import { Toaster } from '@/components/ui/Toast';

// Loads saved preferences and applies the in-app reduced-motion setting.
export function ClientInit() {
  const motion = usePreferences((state) => state.motion);

  useEffect(() => {
    void usePreferences.persist.rehydrate();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', motion === 'reduce');
  }, [motion]);

  return <Toaster />;
}
