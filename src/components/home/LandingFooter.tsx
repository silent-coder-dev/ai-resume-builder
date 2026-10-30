import Link from 'next/link';
import { Sparkles } from 'lucide-react';

const GROUPS = [
  {
    title: 'Product',
    links: [
      { label: 'Resume Builder', href: '/builder' },
      { label: 'My Resumes', href: '/resumes' },
      { label: 'Templates', href: '/#templates' },
    ],
  },
  {
    title: 'Tools',
    links: [
      { label: 'Resume Analyzer', href: '/analyzer' },
      { label: 'Job Matcher', href: '/job-match' },
      { label: 'GitHub Projects', href: '/github' },
      { label: 'Interview Prep', href: '/interview' },
    ],
  },
  {
    title: 'Trust',
    links: [
      { label: 'Privacy & Data', href: '/privacy' },
      { label: 'Settings', href: '/settings' },
      { label: 'About', href: '/#about' },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 rounded-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-card font-semibold text-ink">AI Resume Studio</span>
          </Link>
          <p className="mt-3 max-w-xs text-small text-ink-2">
            Free, no sign-up resume builder. AI improves your wording — your facts stay yours.
          </p>
          <a
            href="https://github.com/silent-coder-dev"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-small font-medium text-ink-2 hover:text-ink"
          >
            Made by silent_coder
          </a>
        </div>
        {GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="text-label font-semibold uppercase tracking-wide text-ink">{group.title}</h2>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-small text-ink-2 hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-label text-ink-2 sm:px-6">
          © {new Date().getFullYear()} AI Resume Studio. AI suggestions can be wrong — always review your resume before sending it.
        </p>
      </div>
    </footer>
  );
}
