import { Suspense } from 'react';
import type { Metadata } from 'next';
import { InterviewTool } from '@/components/tools/InterviewTool';

export const metadata: Metadata = { title: 'AI Interview | AI Resume Studio' };

export default function InterviewPage() {
  return (
    <Suspense>
      <InterviewTool />
    </Suspense>
  );
}
