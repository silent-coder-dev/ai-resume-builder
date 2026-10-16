'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, LayoutTemplate } from 'lucide-react';
import { DEFAULT_SECTION_ORDER, useResumeStore } from '@/store/useResumeStore';
import {
  COLOR_OPTIONS,
  TEMPLATE_CATALOG,
  getTemplateEntry,
  renderResumeTemplate,
} from '@/components/preview/templateCatalog';
import { landingDemoResume } from '@/components/home/landingDemoResume';
import { Reveal, ScaledResume, SectionHeading } from '@/components/home/landingPrimitives';

export function TemplateShowcase() {
  const router = useRouter();
  const setActiveTemplate = useResumeStore((state) => state.setActiveTemplate);
  const setAccentColor = useResumeStore((state) => state.setAccentColor);
  const [templateId, setTemplateId] = useState('modern');
  const [accent, setAccent] = useState(COLOR_OPTIONS[3].hex);
  const selected = getTemplateEntry(templateId);
  const accentName = COLOR_OPTIONS.find((color) => color.hex === accent)?.name ?? 'Accent';

  // Only the look changes. The user's resume content is never touched here.
  const applyTemplate = () => {
    setActiveTemplate(templateId);
    setAccentColor(accent);
    router.push('/builder');
  };

  return (
    <section id="templates" className="relative scroll-mt-24 overflow-hidden px-5 py-24 sm:px-8 lg:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-20 h-[30rem] w-[30rem] rounded-full bg-violet-200/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 bottom-0 h-[26rem] w-[26rem] rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[.92fr_1.08fr] lg:items-center lg:gap-16">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Template gallery"
            icon={<LayoutTemplate className="h-3.5 w-3.5" />}
            title={
              <>
                11 templates.{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  One click to switch.
                </span>
              </>
            }
            description="Every template reads cleanly in applicant tracking systems. Try them live — your words stay the same, only the look changes."
          />

          <Reveal delay={0.1} className="mt-8">
            <div aria-label="Resume template" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TEMPLATE_CATALOG.map((entry) => {
                const active = entry.id === templateId;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTemplateId(entry.id)}
                    className={`group relative rounded-2xl border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      active
                        ? 'border-transparent bg-slate-950 text-white shadow-lg shadow-indigo-900/20'
                        : 'border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md'
                    }`}
                  >
                    <span className={`block font-mono text-[10px] ${active ? 'text-indigo-300' : 'text-slate-400'}`}>
                      {String(entry.number).padStart(2, '0')}
                    </span>
                    <span className="mt-0.5 block text-xs font-extrabold leading-tight">{entry.name}</span>
                    {active && <Check className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-500">Accent</span>
              <div aria-label="Accent color" className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    aria-pressed={accent === color.hex}
                    aria-label={color.name}
                    title={color.name}
                    onClick={() => setAccent(color.hex)}
                    className={`h-7 w-7 rounded-full border-2 transition ${
                      accent === color.hex ? 'scale-110 border-white ring-2 ring-slate-950' : 'border-white shadow hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={applyTemplate}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-indigo-600/25 transition hover:from-indigo-700 hover:to-violet-700"
              >
                Use {selected.name}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </motion.button>
              <p className="text-xs leading-5 text-slate-500">
                Best for: <strong className="text-slate-700">{selected.bestFor}</strong>
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="relative mx-auto max-w-[560px] rounded-[2rem] bg-slate-950 p-4 shadow-[0_50px_120px_-40px_rgba(30,27,75,0.8)] sm:p-6">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
              <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: `${accent}55` }} />
              <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
            </div>
            <div className="relative mb-4 flex items-center justify-between gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-200">
                Template {selected.number} · {selected.name}
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-200">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
                {accentName}
              </span>
            </div>
            <div className="relative overflow-hidden rounded-xl shadow-2xl">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${templateId}-${accent}`}
                  initial={{ opacity: 0, y: 12, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.985 }}
                  transition={{ duration: 0.22 }}
                >
                  <ScaledResume initialScale={0.62}>
                    {renderResumeTemplate(templateId, landingDemoResume, accent, DEFAULT_SECTION_ORDER)}
                  </ScaledResume>
                </motion.div>
              </AnimatePresence>
            </div>
            <p className="relative mt-3 text-center text-[10px] text-slate-500">
              Live preview with a sample profile · real A4 size, scaled to fit
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
