import { Suspense } from 'react';
import type { Metadata } from 'next';
import { JobMatchTool } from '@/components/tools/JobMatchTool';

export const metadata: Metadata = { title: 'Job Matcher | AI Resume Studio' };

export default function JobMatchPage() {
  return (
    <Suspense>
      <JobMatchTool />
    </Suspense>
  );
}
