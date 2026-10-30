import type { Metadata } from 'next';
import { SettingsPanel } from '@/components/tools/SettingsPanel';

export const metadata: Metadata = { title: 'Settings | AI Resume Studio' };

export default function SettingsPage() {
  return <SettingsPanel />;
}
