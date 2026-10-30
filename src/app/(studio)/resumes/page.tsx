import type { Metadata } from 'next';
import { ResumesDashboard } from '@/components/tools/ResumesDashboard';

export const metadata: Metadata = { title: 'My Resumes | AI Resume Studio' };

export default function ResumesPage() {
  return <ResumesDashboard />;
}
