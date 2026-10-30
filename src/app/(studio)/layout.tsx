import { AppShell } from '@/components/shell/AppShell';

// Every studio page (builder, resumes, analyzer, job matcher, GitHub import,
// interview prep, settings, privacy) shares the sidebar and workspace lifecycle.
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
