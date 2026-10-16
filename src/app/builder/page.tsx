'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useResumeStore } from '@/store/useResumeStore';
import { useStoreHydrated } from '@/store/useStoreHydrated';
import { FormWizard } from '@/components/wizard/FormWizard';
import { ResumeOptimizeButton } from '@/components/wizard/ResumeOptimizeButton';
import { SectionReorderModal } from '@/components/wizard/SectionReorderModal';
import { UploadResumeModal } from '@/components/wizard/UploadResumeModal';
import { calculateAtsScore } from '@/utils/atsScore';
import { hasResumeContent } from '@/utils/resumeContent';
import { AtsScoreMeter } from '@/components/ui/AtsScoreMeter';
import { ResumeCanvasContainer } from '@/components/preview/ResumeCanvasContainer';
import { Footer } from '@/components/layout/Footer';
import { printResumeDocument } from '@/utils/exportPdf';
import type { ResumeData } from '@/types/resume';
import {
  COLOR_OPTIONS,
  TEMPLATE_CATALOG,
  getTemplateEntry,
  renderResumeTemplate,
} from '@/components/preview/templateCatalog';

import {
  emptyResumeData,
  satyamResumeData,
  pawanResumeData,
  lawyerResumeData,
  doctorResumeData,
  teacherResumeData,
  salesResumeData,
  designerResumeData,
  financeResumeData,
  hrResumeData,
  dataScientistResumeData,
} from '@/types/initialResumeData';

import {
  Download,
  Sparkles,
  Palette,
  ArrowLeft,
  Layout,
  ChevronDown,
  UserCheck,
  Check,
  FileSpreadsheet,
  FileUp,
  Eye,
  Edit3,
  X,
  ArrowUpDown,
  Target,
  LoaderCircle,
} from 'lucide-react';

const TEMPLATES = TEMPLATE_CATALOG.map((entry) => ({
  id: entry.id,
  name: `${entry.number}. ${entry.name}`,
}));

const PROFILES = [
  { name: 'Blank / Empty Profile', role: 'Clean slate', data: emptyResumeData, isBlank: true },
  { name: 'Satyam Singh', role: 'Java & Spring Boot Engineer', data: satyamResumeData },
  { name: 'Pawan Sodham', role: 'MERN Stack & ML Engineer', data: pawanResumeData },
  { name: 'Ananya Deshmukh', role: 'Corporate Lawyer (LLB)', data: lawyerResumeData },
  { name: 'Dr. Siddharth Verma', role: 'Physician / Doctor (MBBS)', data: doctorResumeData },
  { name: 'Meera Iyer', role: 'STEM Educator (Physics)', data: teacherResumeData },
  { name: 'Rahul Mukherjee', role: 'Enterprise Sales Lead', data: salesResumeData },
  { name: 'Tanvi Nair', role: 'UI/UX Product Designer', data: designerResumeData },
  { name: 'Aditya Kulkarni', role: 'Investment Analyst (CFA)', data: financeResumeData },
  { name: 'Pooja Chawla', role: 'HR & Talent Acquisition', data: hrResumeData },
  { name: 'Karthik Ramanathan', role: 'Data Scientist & AI', data: dataScientistResumeData },
];

export default function BuilderPage() {
  const hydrated = useStoreHydrated();
  const {
    resumeData,
    accentColor,
    setAccentColor,
    setResumeData,
    activeTemplate,
    setActiveTemplate,
  } = useResumeStore();

  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  // Desktop Dropdown States
  const [templateOpen, setTemplateOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Mobile Bottom-Sheet States
  const [mobileTemplateSheet, setMobileTemplateSheet] = useState(false);
  const [mobileProfileSheet, setMobileProfileSheet] = useState(false);

  const tRef = useRef<HTMLDivElement>(null);
  const cRef = useRef<HTMLDivElement>(null);
  const pRef = useRef<HTMLDivElement>(null);

  // The mobile tab switcher sticks right under the header, whatever its real height is.
  const [headerNode, setHeaderNode] = useState<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (!headerNode) return;
    const observer = new ResizeObserver(() => setHeaderHeight(headerNode.offsetHeight));
    observer.observe(headerNode);
    return () => observer.disconnect();
  }, [headerNode]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (tRef.current && !tRef.current.contains(e.target as Node)) setTemplateOpen(false);
      if (cRef.current && !cRef.current.contains(e.target as Node)) setColorOpen(false);
      if (pRef.current && !pRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setTemplateOpen(false);
      setColorOpen(false);
      setProfileOpen(false);
      setMobileTemplateSheet(false);
      setMobileProfileSheet(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const { score, tips } = calculateAtsScore(resumeData);

  const handleDownloadPdf = () => {
    printResumeDocument('printable-resume-canvas', resumeData.personalInfo.fullName);
  };

  // Loading a sample replaces the current draft, so ask first when there is real work to lose.
  const loadProfile = (profile: { name: string; data: ResumeData; isBlank?: boolean }) => {
    if (hasResumeContent(resumeData)) {
      const message = profile.isBlank
        ? 'Clear the current resume and start with a blank page? This cannot be undone.'
        : `Replace your current resume with the "${profile.name}" sample? Your current details will be lost.`;
      if (!window.confirm(message)) return false;
    }
    setResumeData(profile.data);
    return true;
  };

  const openImport = () => {
    setProfileOpen(false);
    setMobileProfileSheet(false);
    setIsImportOpen(true);
  };


  // The saved draft is read from this browser after the first paint.
  // Showing a short loader avoids flashing an empty resume.
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100/70 text-slate-500">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <LoaderCircle className="h-4 w-4 animate-spin text-indigo-600" />
          Opening your resume…
        </div>
      </div>
    );
  }

  const activeTemplateName = getTemplateEntry(activeTemplate).name;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Section Reorder Modal */}
      <SectionReorderModal isOpen={isReorderOpen} onClose={() => setIsReorderOpen(false)} />
      <UploadResumeModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />

      {/* Top Navbar */}
      <header
        ref={setHeaderNode}
        className="no-print bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-3 sm:px-6 lg:px-8 py-2.5 shadow-2xs"
      >
        <div className="flex items-center justify-between gap-2 max-w-[1700px] mx-auto">
          {/* Logo & Branding */}
          <div className="flex min-w-0 items-center gap-2 shrink-0">
            <Link
              href="/"
              aria-label="Back to AI Resume Studio home"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden text-[10px] font-bold sm:inline">Home</span>
            </Link>
            <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xs shadow-blue-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="truncate text-xs font-bold leading-none tracking-tight text-slate-900 sm:text-sm">
                    AI Resume Studio
                  </h1>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-emerald-700">
                    Free
                  </span>
                </div>
                <p className="mt-0.5 hidden text-[10px] leading-none text-slate-400 sm:block">
                  ATS-Optimized Resumes by silent_coder
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Controls (>= 1024px) */}
          <div className="hidden lg:flex items-center gap-2">
            <AtsScoreMeter score={score} tips={tips} />

            {/* Reorder Sections Button */}
            <button
              type="button"
              onClick={() => setIsReorderOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
              <span>Reorder</span>
            </button>

            {/* Template Dropdown */}
            <div className="relative" ref={tRef}>
              <button
                type="button"
                onClick={() => setTemplateOpen((p) => !p)}
                aria-expanded={templateOpen}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <Layout className="w-3.5 h-3.5 text-blue-600" />
                <span>Templates</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              {templateOpen && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 max-h-80 overflow-y-auto">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setActiveTemplate(t.id);
                        setTemplateOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition ${
                        activeTemplate === t.id
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{t.name}</span>
                      {activeTemplate === t.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Color Dropdown */}
            <div className="relative" ref={cRef}>
              <button
                type="button"
                onClick={() => setColorOpen((p) => !p)}
                aria-expanded={colorOpen}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5" style={{ color: accentColor }} />
                <span>Color</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              {colorOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        setAccentColor(c.hex);
                        setColorOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 cursor-pointer transition"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className={accentColor === c.hex ? 'font-bold text-blue-600' : ''}>
                        {c.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profiles Dropdown */}
            <div className="relative" ref={pRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((p) => !p)}
                aria-expanded={profileOpen}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Profiles</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 max-h-96 overflow-y-auto">
                  <button
                    type="button"
                    onClick={openImport}
                    className="mb-1 w-full text-left px-3 py-2 rounded-lg text-xs cursor-pointer transition bg-blue-50/70 hover:bg-blue-100/70 text-blue-900"
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <FileUp className="w-3.5 h-3.5 text-blue-600" />
                      Import my resume PDF
                    </div>
                    <div className="text-[11px] text-blue-700">AI fills the editor from your file</div>
                  </button>
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Or load a sample profile
                  </div>
                  {PROFILES.map((prof) => (
                    <button
                      key={prof.name}
                      type="button"
                      onClick={() => {
                        if (loadProfile(prof)) setProfileOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs cursor-pointer transition border-b border-slate-100 last:border-none ${
                        prof.isBlank
                          ? 'bg-amber-50/60 hover:bg-amber-100/60 text-amber-900 mb-1'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        {prof.isBlank && <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />}
                        {prof.name}
                      </div>
                      <div className={`text-[11px] ${prof.isBlank ? 'text-amber-700' : 'text-slate-500'}`}>
                        {prof.role}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stable Native PDF Download Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-950 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>

          {/* Mobile Header Controls (< 1024px) */}
          <div className="flex lg:hidden items-center gap-1.5">
            <AtsScoreMeter score={score} tips={tips} />

            {/* Reorder Button Mobile */}
            <button
              type="button"
              onClick={() => setIsReorderOpen(true)}
              className="p-2 border border-slate-200 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              title="Reorder Sections"
              aria-label="Reorder sections"
            >
              <ArrowUpDown className="w-4 h-4 text-indigo-600" />
            </button>

            {/* Mobile Download Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              aria-label="Download PDF"
              className="flex items-center gap-1 px-3 py-2 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Toolbar */}
        <div className="flex lg:hidden items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-slate-100 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setMobileTemplateSheet(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 shrink-0 cursor-pointer"
          >
            <Layout className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate max-w-[110px]">{activeTemplateName}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setMobileProfileSheet(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 shrink-0 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Profiles</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          <div className="flex items-center gap-1 shrink-0 px-1 py-0.5 bg-slate-50 border border-slate-200 rounded-lg">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setAccentColor(c.hex)}
                aria-label={`Accent color: ${c.name}`}
                aria-pressed={accentColor === c.hex}
                title={c.name}
                className={`w-5 h-5 rounded-full border transition-transform ${
                  accentColor === c.hex
                    ? 'scale-110 ring-2 ring-blue-500 ring-offset-1 border-transparent'
                    : 'border-black/10'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div
        className="no-print lg:hidden px-4 pt-3 pb-2 sticky z-30 bg-slate-100/95 backdrop-blur-sm"
        style={{ top: headerHeight }}
      >
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/90 rounded-xl shadow-inner">
          <button
            type="button"
            onClick={() => setMobileTab('editor')}
            aria-pressed={mobileTab === 'editor'}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mobileTab === 'editor'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>1. Edit Form</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            aria-pressed={mobileTab === 'preview'}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mobileTab === 'preview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>2. Live Preview</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <main className="print-shell flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-6 lg:p-8">
        <div className="no-print mb-4 flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/#job-match"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
          >
            <Target className="h-4 w-4 text-indigo-600" />
            Match to a job
          </Link>
          <ResumeOptimizeButton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section
            className={`no-print lg:col-span-5 ${
              mobileTab === 'editor' ? 'block' : 'hidden lg:block'
            } lg:h-[calc(100vh-110px)] lg:sticky lg:top-18`}
          >
            <FormWizard onSwitchToPreview={() => setMobileTab('preview')} />
          </section>

          <section
            className={`lg:col-span-7 justify-center w-full ${
              mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <ResumeCanvasContainer activeTemplate={activeTemplate}>
              {renderResumeTemplate(activeTemplate, resumeData, accentColor)}
            </ResumeCanvasContainer>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Template Sheet Modal */}
      {mobileTemplateSheet && (
        <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setMobileTemplateSheet(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Choose resume template"
            className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl p-5 max-h-[75vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Choose Resume Template</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileTemplateSheet(false)}
                aria-label="Close template list"
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-3 space-y-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setActiveTemplate(t.id);
                    setMobileTemplateSheet(false);
                  }}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    activeTemplate === t.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span>{t.name}</span>
                  {activeTemplate === t.id && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Profile Sheet Modal */}
      {mobileProfileSheet && (
        <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setMobileProfileSheet(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Load a profile"
            className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl p-5 max-h-[75vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Import or Load a Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileProfileSheet(false)}
                aria-label="Close profile list"
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-3 space-y-2">
              <button
                type="button"
                onClick={openImport}
                className="w-full text-left p-3 rounded-xl text-xs transition border bg-blue-50/80 border-blue-200 text-blue-900"
              >
                <div className="font-bold flex items-center gap-1.5">
                  <FileUp className="w-3.5 h-3.5 text-blue-600" />
                  Import my resume PDF
                </div>
                <div className="text-[11px] mt-0.5 text-blue-700">AI fills the editor from your file</div>
              </button>
              {PROFILES.map((prof) => (
                <button
                  key={prof.name}
                  type="button"
                  onClick={() => {
                    if (loadProfile(prof)) setMobileProfileSheet(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl text-xs transition border ${
                    prof.isBlank
                      ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {prof.isBlank && <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />}
                    {prof.name}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${prof.isBlank ? 'text-amber-700' : 'text-slate-500'}`}>
                    {prof.role}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
