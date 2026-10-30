import { Suspense } from 'react';
import type { Metadata } from 'next';
import { GithubTool } from '@/components/tools/GithubTool';

export const metadata: Metadata = { title: 'GitHub Projects | AI Resume Studio' };

export default function GithubPage() {
  return (
    <Suspense>
      <GithubTool />
    </Suspense>
  );
}
