'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu as MenuIcon, Sparkles } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Templates', href: '#templates' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
];

// PRD §7.1 — logo, four links, and two actions. No sign-up.
export function LandingHeader({ onCreateResume }: { onCreateResume: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="whitespace-nowrap text-card font-semibold text-ink">AI Resume Studio</span>
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="rounded-lg px-3 py-2 text-body font-medium text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/builder" variant="secondary" className="hidden sm:inline-flex">
            Open Resume Studio
          </ButtonLink>
          <Button variant="primary" onClick={onCreateResume} className="hidden sm:inline-flex">
            Create Resume
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <MenuIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" size="sm">
        <nav aria-label="Main">
          <ul className="space-y-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-body font-medium text-ink hover:bg-surface-2">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-4 grid gap-2 border-t border-line pt-4">
          <ButtonLink href="/builder" variant="secondary">
            Open Resume Studio
          </ButtonLink>
          <Button
            variant="primary"
            onClick={() => {
              setMenuOpen(false);
              onCreateResume();
            }}
          >
            Create Resume
          </Button>
        </div>
      </Dialog>
    </header>
  );
}
