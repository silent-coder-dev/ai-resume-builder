import type { Metadata } from 'next';
import { PrivacyPanel } from '@/components/tools/PrivacyPanel';

export const metadata: Metadata = { title: 'Privacy & Data | AI Resume Studio' };

export default function PrivacyPage() {
  return <PrivacyPanel />;
}
