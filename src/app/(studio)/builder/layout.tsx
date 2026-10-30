import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resume Builder | AI Resume Studio',
  description:
    'Edit your resume section by section with a live A4 preview, AI writing help, autosave, undo, and free PDF export.',
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
