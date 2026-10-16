'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu, Sparkles, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Templates', href: '#templates' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Job match', href: '#job-match' },
  { label: 'FAQ', href: '#faq' },
];

const subscribeToScroll = (onChange: () => void) => {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
};

export function LandingNav() {
  const scrolled = useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > 16,
    () => false
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const solid = scrolled || menuOpen;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <nav
        aria-label="Main navigation"
        className={`mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl px-3 py-2.5 transition-all duration-300 sm:px-4 ${
          solid
            ? 'border border-white/10 bg-slate-950/75 shadow-2xl shadow-black/30 backdrop-blur-xl'
            : 'border border-transparent bg-transparent'
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-4 w-4" />
            <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/25" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-extrabold tracking-tight text-white">AI Resume Studio</span>
            <span className="hidden text-[10px] font-medium text-slate-400 sm:block">Honest resumes, beautifully made</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/builder"
            className="group hidden items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-extrabold text-slate-950 shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:inline-flex"
          >
            Open editor
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="mx-auto mt-2 max-w-7xl rounded-2xl border border-white/10 bg-slate-950/90 p-2 shadow-2xl backdrop-blur-xl lg:hidden"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/builder"
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-slate-950"
            >
              Open editor <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
