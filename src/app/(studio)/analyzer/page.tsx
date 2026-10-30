import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AnalyzerTool } from '@/components/tools/AnalyzerTool';

export const metadata: Metadata = { title: 'Resume Analyzer | AI Resume Studio' };

export default function AnalyzerPage() {
  return (
    <Suspense>
      <AnalyzerTool />
    </Suspense>
  );
}
