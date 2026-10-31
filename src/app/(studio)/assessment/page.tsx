import type { Metadata } from 'next';
import { AssessmentCenter } from '@/components/assessment/AssessmentCenter';

export const metadata: Metadata = { title: 'Assessment Center | AI Resume Studio' };

export default function AssessmentPage() {
  return <AssessmentCenter />;
}
