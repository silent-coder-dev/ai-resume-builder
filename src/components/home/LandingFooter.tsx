'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Code2,
  LockKeyhole,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

const FOOTER_LINKS = [
  { label: 'Resume builder', href: '/builder' },
  { label: 'Import a resume', href: '/#start' },
  { label: 'Match a job', href: '/#job-match' },
  { label: 'How it works', href: '/#features' },
];

export function LandingFooter() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="no-print relative z-10 overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-32 -top-48 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute -bottom-48 left-1/4 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-6 pt-10 sm:px-8 sm:pt-14">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45 }}
          className="grid gap-8 rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/10 backdrop-blur-sm sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center"
        >
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-indigo-200">
              <Sparkles className="h-3 w-3" /> Your next chapter starts here
            </span>
            <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
              Make your experience
              <span className="block bg-gradient-to-r from-indigo-300 to-sky-300 bg-clip-text text-transparent">
                impossible to overlook.
              </span>
            </h2>
            <p className="mt-3 max-w-xl text-xs leading-6 text-slate-300 sm:text-sm">
              Build a resume that sounds like you, highlights what you have actually done, and is
              ready for the next opportunity.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Link
              href="/builder"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-extrabold text-slate-950 transition hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              Open resume studio <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#job-match"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-bold text-white transition hover:border-white/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              Explore job matching <WandSparkles className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        <div className="grid gap-8 border-b border-white/10 py-9 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-12">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-950/50">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-sm font-extrabold tracking-tight">AI Resume Studio</span>
            </Link>
            <p className="mt-3 max-w-sm text-[11px] leading-5 text-slate-400">
              A thoughtful workspace for building, refining, and tailoring a resume—with you in
              control of every change.
            </p>
            <a
              href="https://github.com/silent-coder-dev"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold text-slate-300 transition hover:border-white/25 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              <Code2 className="h-3.5 w-3.5" /> Made by silent_coder
              <ArrowUpRight className="h-3 w-3 text-slate-500" />
            </a>
          </div>

          <nav aria-label="Footer navigation">
            <h3 className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-300">
              Explore
            </h3>
            <ul className="mt-3 space-y-2.5">
              {FOOTER_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1 text-[11px] text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                  >
                    {link.label} <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-300">
              Built around your story
            </h3>
            <p className="mt-3 text-[11px] leading-5 text-slate-400">
              Your draft is saved in this browser. When you use an AI feature, the information
              needed for that request is sent to the AI provider configured for this app.
            </p>
            <p className="mt-3 inline-flex items-start gap-2 text-[10px] leading-5 text-slate-500">
              <LockKeyhole className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
              Review AI suggestions and verify your details before applying or sharing.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-5 text-[9px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AI Resume Studio. Built with care for your next step.</p>
          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/10 px-3 py-2 font-bold text-slate-300 transition hover:border-white/25 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            Back to top <ArrowUp className="h-3 w-3" />
          </button>
        </div>
      </div>
    </footer>
  );
}
