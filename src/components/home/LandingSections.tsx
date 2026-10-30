import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Download,
  FileSearch,
  FolderGit2,
  HardDrive,
  LayoutTemplate,
  Lock,
  Send,
  Target,
  Trash2,
  WandSparkles,
} from 'lucide-react';
import { recommendedSectionOrder } from '@/lib/resume/sections';
import { TEMPLATE_CATALOG } from '@/components/preview/templateCatalog';
import { ScaledResume } from '@/components/preview/ScaledResume';
import { landingDemoResume } from '@/components/home/landingDemoResume';

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-label font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-title font-bold tracking-tight text-ink">{title}</h2>
      {description && <p className="mt-3 text-body text-ink-2">{description}</p>}
    </div>
  );
}

// ---------- PRD §7.3 Features ----------

const FEATURES = [
  {
    icon: WandSparkles,
    title: 'AI Resume Writing',
    text: 'Improve, shorten, or fix grammar in any section. You see the original next to the suggestion and decide.',
    href: '/builder',
  },
  {
    icon: FileSearch,
    title: 'ATS Readiness Analysis',
    text: 'An explainable score with clear issues, why they matter, and a direct link to fix each one.',
    href: '/analyzer',
  },
  {
    icon: Target,
    title: 'Job Description Matching',
    text: 'See which requirements you already show, the real gaps, and create a separate tailored version.',
    href: '/job-match',
  },
  {
    icon: FolderGit2,
    title: 'GitHub Project Import',
    text: 'Turn public repositories into project entries written only from your README, languages, and topics.',
    href: '/github',
  },
  {
    icon: LayoutTemplate,
    title: 'Professional Templates',
    text: '11 ATS-friendly A4 templates and 7 accent colors. Switch any time — your content stays the same.',
    href: '#templates',
  },
  {
    icon: Download,
    title: 'Free PDF Export',
    text: 'Clean A4 PDFs with real, selectable text. No watermark, no paywall, no account.',
    href: '/builder',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-line bg-surface py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle
          eyebrow="Features"
          title="Everything you need to write a strong resume"
          description="Built for freshers, students, and experienced professionals. Every tool is free to use."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text, href }) => (
            <li key={title}>
              <Link
                href={href}
                className="group flex h-full flex-col rounded-xl border border-line bg-surface p-5 transition-colors duration-150 hover:border-line-strong hover:bg-canvas"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-card font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 flex-1 text-body text-ink-2">{text}</p>
                <span className="mt-4 flex items-center gap-1 text-small font-semibold text-primary">
                  Learn more <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------- Templates ----------

export function TemplatesSection({ onUseTemplate }: { onUseTemplate: (templateId: string) => void }) {
  const order = recommendedSectionOrder('experienced');
  return (
    <section id="templates" className="scroll-mt-20 border-t border-line py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle
          eyebrow="Templates"
          title="11 templates, all free and ATS-friendly"
          description="Real text, clear headings, and A4 sizing in every template. Preview them here with a sample resume."
        />
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {TEMPLATE_CATALOG.map((template) => (
            <li key={template.id} className="group flex flex-col rounded-xl border border-line bg-surface p-3">
              <ScaledResume initialScale={0.3} visibleHeight={1000} className="rounded-md border border-line">
                <template.Component data={landingDemoResume} accentColor="#4f46e5" sectionOrder={order} />
              </ScaledResume>
              <div className="mt-3 flex flex-1 flex-col px-1">
                <h3 className="text-body font-semibold text-ink">{template.name}</h3>
                <p className="text-small text-ink-2">{template.bestFor}</p>
                <button
                  type="button"
                  onClick={() => onUseTemplate(template.id)}
                  className="mt-3 self-start text-small font-semibold text-primary hover:underline"
                >
                  Use this template <span aria-hidden="true">→</span>
                  <span className="sr-only"> ({template.name})</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------- PRD §7.4 How it works ----------

const STEPS = [
  { title: 'Create or import your resume', text: 'Start blank, from an example, or import your existing PDF.' },
  { title: 'Improve content using AI', text: 'Get clearer wording and grammar fixes. Accept only what you like.' },
  { title: 'Analyze resume quality', text: 'See an explainable readiness score and what to fix first.' },
  { title: 'Match against job descriptions', text: 'Check your fit for a real posting and see the honest gaps.' },
  { title: 'Export your resume', text: 'Download a clean A4 PDF, free and without a watermark.' },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-t border-line bg-surface py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="How it works" title="Five steps from first draft to a ready-to-send PDF" />
        <ol className="mt-10 grid gap-4 md:grid-cols-5">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-line bg-surface p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-small font-semibold text-primary">
                {index + 1}
              </span>
              <h3 className="mt-4 text-body font-semibold text-ink">{step.title}</h3>
              <p className="mt-1 text-small text-ink-2">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------- PRD §7.5 Privacy ----------

const PRIVACY_POINTS = [
  { icon: Check, title: 'No account required', text: 'You never sign up or log in. There is no user database.' },
  { icon: HardDrive, title: 'Saved in your browser', text: 'Resumes are stored in this browser (IndexedDB) on your device and saved automatically as you type.' },
  { icon: Send, title: 'What goes to AI services', text: 'Only when you use an AI feature, the text that feature needs is sent to the AI provider to produce the answer.' },
  { icon: Trash2, title: 'Delete any time', text: 'Delete one resume from My Resumes, or everything from Privacy & Data.' },
  { icon: Lock, title: 'Know the limits', text: 'Clearing browser data or using a private window removes resumes. Export a backup to keep a copy.' },
];

export function PrivacySection() {
  return (
    <section id="privacy" className="scroll-mt-20 border-t border-line py-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <SectionTitle
            eyebrow="Privacy"
            title="Your resume stays in your hands"
            description="We are clear about what is stored where — including the limits of browser storage."
          />
          <Link href="/privacy" className="mt-6 inline-flex items-center gap-1 text-body font-semibold text-primary hover:underline">
            Read Privacy &amp; Data <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {PRIVACY_POINTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3 rounded-xl border border-line bg-surface p-4">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <span className="block text-body font-semibold text-ink">{title}</span>
                <span className="mt-0.5 block text-small text-ink-2">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------- About ----------

export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-20 border-t border-line bg-surface py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="text-label font-semibold uppercase tracking-wide text-primary">About</p>
        <h2 className="mt-2 text-title font-bold tracking-tight text-ink">AI should improve your story, never invent your achievements.</h2>
        <p className="mt-4 text-body text-ink-2">
          AI Resume Studio is a free resume builder made for people at every stage — especially freshers writing their first
          resume. The AI helps with wording, structure, and job fit, but it never adds skills, numbers, or experience you did not
          give it. Every suggestion waits for your approval, and your resumes stay on your device.
        </p>
        <p className="mt-4 text-small text-ink-2">Made by silent_coder.</p>
      </div>
    </section>
  );
}
