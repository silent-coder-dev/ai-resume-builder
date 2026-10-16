'use client';

import { MotionConfig } from 'framer-motion';
import { LandingNav } from '@/components/home/LandingNav';
import { LandingHero } from '@/components/home/LandingHero';
import { FeatureBento, HonestySection, HowItWorks, StatsBand } from '@/components/home/LandingFeatures';
import { TemplateShowcase } from '@/components/home/TemplateShowcase';
import { JobMatchSection } from '@/components/home/JobMatchSection';
import { LandingFaq } from '@/components/home/LandingFaq';
import { LandingFooter } from '@/components/home/LandingFooter';

// The home page. Each section lives in its own file in this folder.
export function StudioLanding() {
  return (
    // "user" turns off movement animations for people who ask their system for reduced motion.
    <MotionConfig reducedMotion="user">
      <main
        id="home"
        className="min-h-screen overflow-x-clip bg-[#f7f8fc] text-slate-900 selection:bg-indigo-200 selection:text-indigo-950"
      >
        <LandingNav />
        <LandingHero />
        <StatsBand />
        <FeatureBento />
        <TemplateShowcase />
        <HowItWorks />
        <HonestySection />
        <JobMatchSection />
        <LandingFaq />
        <LandingFooter />
      </main>
    </MotionConfig>
  );
}
