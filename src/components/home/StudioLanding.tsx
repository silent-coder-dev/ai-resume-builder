'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { Button } from '@/components/ui/Button';
import { useNewResumeFlow } from '@/components/workspace/NewResumeDialog';
import { LandingHeader } from '@/components/home/LandingHeader';
import { EditorPreview } from '@/components/home/EditorPreview';
import {
  AboutSection,
  FeaturesSection,
  HowItWorksSection,
  PrivacySection,
  TemplatesSection,
} from '@/components/home/LandingSections';
import { LandingFooter } from '@/components/home/LandingFooter';

const PROMISES = ['Free — no paywall or watermark', 'No sign-up', 'Saved automatically in your browser'];

// The home page (PRD §7).
export function StudioLanding() {
  const router = useRouter();
  const phase = useWorkspaceStore((state) => state.phase);
  const latest = useWorkspaceStore((state) => state.resumes[0]);
  const newResume = useNewResumeFlow();

  // Load saved resumes so returning visitors can continue where they left off.
  useEffect(() => {
    void useWorkspaceStore.getState().init();
  }, []);

  // "Build My Resume": first-time visitors go straight to the workspace; anyone
  // with saved resumes is asked whether to continue or create a new one.
  const buildResume = async (options: { templateId?: string } = {}) => {
    await useWorkspaceStore.getState().init();
    if (useWorkspaceStore.getState().resumes.length === 0) {
      router.push(options.templateId ? `/builder?new=1&template=${options.templateId}` : '/builder');
      return;
    }
    await newResume.start(options);
  };

  return (
    <div className="min-h-dvh bg-canvas">
      <LandingHeader onCreateResume={() => void buildResume()} />

      <main>
        <section className="overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:py-24">
            <div>
              <h1 className="text-[36px] font-bold leading-[44px] tracking-tight text-ink sm:text-hero">
                Build a Resume That Gets You Noticed.
              </h1>
              <p className="mt-5 max-w-xl text-card leading-7 text-ink-2">
                Create professional, ATS-friendly resumes with AI-powered writing assistance, real project insights and
                job-specific recommendations.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button variant="primary" size="lg" onClick={() => void buildResume()}>
                  Build My Resume <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
                <a
                  href="#templates"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-line bg-surface px-5 text-card font-semibold text-ink transition-colors duration-150 hover:border-line-strong hover:bg-surface-2"
                >
                  Explore Templates
                </a>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {PROMISES.map((promise) => (
                  <li key={promise} className="flex items-center gap-1.5 text-small text-ink-2">
                    <Check className="h-4 w-4 text-success" aria-hidden="true" /> {promise}
                  </li>
                ))}
              </ul>
              {phase === 'ready' && latest && (
                <p className="mt-6 text-small text-ink-2">
                  Welcome back.{' '}
                  <Link href={`/builder?id=${latest.id}`} className="font-semibold text-primary hover:underline">
                    Continue editing “{latest.title}” →
                  </Link>
                </p>
              )}
            </div>
            <EditorPreview />
          </div>
        </section>

        <FeaturesSection />
        <TemplatesSection onUseTemplate={(templateId) => void buildResume({ templateId })} />
        <HowItWorksSection />
        <PrivacySection />
        <AboutSection />

        <section className="border-t border-line py-16">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-heading font-semibold text-ink">Ready to start?</h2>
              <p className="mt-1 text-body text-ink-2">Your first draft is a few minutes away. No account needed.</p>
            </div>
            <Button variant="primary" size="lg" onClick={() => void buildResume()}>
              Build My Resume <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </section>
      </main>

      <LandingFooter />
      {newResume.dialog}
    </div>
  );
}
