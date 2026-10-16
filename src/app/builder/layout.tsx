import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resume Editor | AI Resume Studio',
  description:
    'Edit your resume step by step, preview 11 ATS-friendly templates live, and download a clean A4 PDF.',
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
