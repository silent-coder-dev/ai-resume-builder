'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, MessageCircleQuestion, Plus } from 'lucide-react';
import { Reveal, SectionHeading } from '@/components/home/landingPrimitives';

const FAQS = [
  {
    question: 'Is AI Resume Studio really free?',
    answer:
      'Yes. Every template, every AI tool, and the PDF download are free. There is no watermark and no account to create.',
  },
  {
    question: 'Where is my resume stored?',
    answer:
      'Only in your own browser (local storage). There is no database. Your details are sent to the AI provider only when you press an AI button, and only what that feature needs.',
  },
  {
    question: 'Will the AI add skills or numbers I do not have?',
    answer:
      'No. The AI is told never to invent skills, metrics, employers, dates, or results. When it polishes your resume, you see every change side by side and decide whether to apply it.',
  },
  {
    question: 'I am a fresher with no job experience. Will this work for me?',
    answer:
      'Yes. The summary writer has a fresher mode, you can move Projects and Education to the top, and the job matcher counts projects and coursework as real evidence for entry-level roles.',
  },
  {
    question: 'Can I import my old resume?',
    answer:
      'Yes. Upload a PDF (up to 8 MB) and the AI fills the matching fields. Anything it cannot clearly read stays empty, so you can add it yourself.',
  },
  {
    question: 'Is the ATS score the same as a real company’s score?',
    answer:
      'No tool can see a company’s private system. Our score is a clear checklist out of 100 that shows what is missing, so your resume is complete and easy for any ATS to read.',
  },
  {
    question: 'Does it work on my phone?',
    answer:
      'Yes. The full editor works on mobile, with an Edit / Preview switcher so you can check the A4 page as you type.',
  },
];

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative scroll-mt-24 px-5 py-24 sm:px-8 lg:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            align="left"
            eyebrow="FAQ"
            icon={<MessageCircleQuestion className="h-3.5 w-3.5" />}
            title="Questions, answered simply."
            description="Everything you need to know before you start. Still unsure? Open the editor and try it — nothing is saved anywhere but your browser."
          />
          <Reveal delay={0.1}>
            <Link
              href="/builder"
              className="group mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white shadow-xl shadow-slate-900/15 transition hover:bg-indigo-700"
            >
              Try the editor
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>

        <Reveal delay={0.05}>
          <div className="divide-y divide-slate-200/80 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            {FAQS.map((item, index) => {
              const open = openIndex === index;
              const panelId = `faq-panel-${index}`;
              return (
                <div key={item.question}>
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpenIndex(open ? null : index)}
                      aria-expanded={open}
                      aria-controls={panelId}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none sm:px-6"
                    >
                      <span className={`text-sm font-extrabold ${open ? 'text-indigo-700' : 'text-slate-900'}`}>{item.question}</span>
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${
                          open ? 'rotate-45 border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'
                        }`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        id={panelId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-sm leading-7 text-slate-600 sm:px-6">{item.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
