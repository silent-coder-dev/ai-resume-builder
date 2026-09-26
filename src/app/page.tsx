'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { FormWizard } from '@/components/wizard/FormWizard';
import { UploadResumeModal } from '@/components/wizard/UploadResumeModal';
import { calculateAtsScore } from '@/utils/atsScore';
import { AtsScoreMeter } from '@/components/ui/AtsScoreMeter';
import { ResumeCanvasContainer } from '@/components/preview/ResumeCanvasContainer';
import { Footer } from '@/components/layout/Footer';

import {
  BlankCanvasTemplate,
  ModernTemplate,
  ClassicTemplate,
  SidebarTemplate,
  CompactTemplate,
  MinimalTemplate,
  CorporateTemplate,
  TimelineTemplate,
  AcademicTemplate,
  CreativeTemplate,
  MedicalTemplate,
} from '@/components/preview/AllTemplates';

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
  Upload,
  Layout,
  ChevronDown,
  UserCheck,
  Check,
  FileSpreadsheet,
  Menu,
  X,
} from 'lucide-react';

const COLOR_OPTIONS = [
  { name: 'Corporate Blue', hex: '#2563eb' },
  { name: 'Executive Slate', hex: '#0f172a' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Royal Violet', hex: '#7c3aed' },
  { name: 'Warm Amber', hex: '#d97706' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Neutral Zinc', hex: '#52525b' },
];

const TEMPLATES = [
  { id: 'blank', name: '0. Blank Canvas (Clean Slate)' },
  { id: 'modern', name: '1. Modern Tech' },
  { id: 'classic', name: '2. Executive Serif' },
  { id: 'sidebar', name: '3. Creative Sidebar' },
  { id: 'compact', name: '4. Compact Grid' },
  { id: 'minimal', name: '5. Pure Minimal' },
  { id: 'corporate', name: '6. Corporate Banner' },
  { id: 'timeline', name: '7. Career Timeline' },
  { id: 'academic', name: '8. Legal / Academic' },
  { id: 'creative', name: '9. Bold Designer' },
  { id: 'medical', name: '10. Clinical Healthcare' },
];

const PROFILES = [
  { name: 'Blank / Empty Profile', role: 'Start from scratch with clean fields', data: emptyResumeData, isBlank: true },
  { name: 'Satyam Singh', role: 'Java & Spring Boot Engineer', data: satyamResumeData },
  { name: 'Pawan Sodham', role: 'MERN Stack & ML Engineer', data: pawanResumeData },
  { name: 'Ananya Deshmukh', role: 'Corporate Lawyer (LLB)', data: lawyerResumeData },
  { name: 'Dr. Siddharth Verma', role: 'Physician / Doctor (MBBS)', data: doctorResumeData },
  { name: 'Meera Iyer', role: 'High School STEM Teacher', data: teacherResumeData },
  { name: 'Rahul Mukherjee', role: 'Enterprise B2B Sales Lead', data: salesResumeData },
  { name: 'Tanvi Nair', role: 'UI/UX Product Designer', data: designerResumeData },
  { name: 'Aditya Kulkarni', role: 'Investment Banking Analyst (CFA)', data: financeResumeData },
  { name: 'Pooja Chawla', role: 'HR & Talent Acquisition Lead', data: hrResumeData },
  { name: 'Karthik Ramanathan', role: 'Data Scientist & AI Specialist', data: dataScientistResumeData },
];

export default function Home() {
  const { resumeData, accentColor, setAccentColor, setResumeData } = useResumeStore();

  const [activeTemplate, setActiveTemplate] = useState('modern');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [templateOpen, setTemplateOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tRef = useRef<HTMLDivElement>(null);
  const cRef = useRef<HTMLDivElement>(null);
  const pRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (tRef.current && !tRef.current.contains(e.target as Node)) setTemplateOpen(false);
      if (cRef.current && !cRef.current.contains(e.target as Node)) setColorOpen(false);
      if (pRef.current && !pRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const { score, tips } = calculateAtsScore(resumeData);

  const renderActiveTemplate = () => {
    switch (activeTemplate) {
      case 'blank':
        return <BlankCanvasTemplate data={resumeData} accentColor={accentColor} />;
      case 'classic':
        return <ClassicTemplate data={resumeData} accentColor={accentColor} />;
      case 'sidebar':
        return <SidebarTemplate data={resumeData} accentColor={accentColor} />;
      case 'compact':
        return <CompactTemplate data={resumeData} accentColor={accentColor} />;
      case 'minimal':
        return <MinimalTemplate data={resumeData} accentColor={accentColor} />;
      case 'corporate':
        return <CorporateTemplate data={resumeData} accentColor={accentColor} />;
      case 'timeline':
        return <TimelineTemplate data={resumeData} accentColor={accentColor} />;
      case 'academic':
        return <AcademicTemplate data={resumeData} accentColor={accentColor} />;
      case 'creative':
        return <CreativeTemplate data={resumeData} accentColor={accentColor} />;
      case 'medical':
        return <MedicalTemplate data={resumeData} accentColor={accentColor} />;
      case 'modern':
      default:
        return <ModernTemplate data={resumeData} accentColor={accentColor} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <UploadResumeModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />

      {/* Responsive Navigation Bar */}
      <header className="no-print bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-3 sm:px-6 lg:px-8 py-2.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 max-w-[1700px] mx-auto">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 leading-none">
                  AI Resume Studio
                </h1>
                <span className="text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-200 leading-none">
                  Free
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden md:block mt-0.5 leading-none">
                ATS-Optimized Resumes by silent_coder
              </p>
            </div>
          </div>

          {/* Desktop Controls (>= 768px) */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <AtsScoreMeter score={score} tips={tips} />

            {/* Template Dropdown */}
            <div className="relative" ref={tRef}>
              <button
                type="button"
                onClick={() => setTemplateOpen((p) => !p)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <Layout className="w-3.5 h-3.5 text-blue-600" />
                <span>Templates</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              {templateOpen && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-40 max-h-80 overflow-y-auto">
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
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5" style={{ color: accentColor }} />
                <span>Color</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              {colorOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-40">
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
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Profiles</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-40 max-h-96 overflow-y-auto">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Profile to Load
                  </div>
                  {PROFILES.map((prof, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setResumeData(prof.data);
                        setProfileOpen(false);
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

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Upload</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>

          {/* Mobile Actions Bar (< 768px) */}
          <div className="flex md:hidden items-center gap-1.5">
            <AtsScoreMeter score={score} tips={tips} />

            <button
              type="button"
              onClick={() => window.print()}
              title="Download PDF"
              className="p-2 bg-slate-950 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Tray */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTemplateOpen((p) => !p);
                  setColorOpen(false);
                  setProfileOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Layout className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">
                    {TEMPLATES.find((t) => t.id === activeTemplate)?.name.split('.')[1] || 'Template'}
                  </span>
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen((p) => !p);
                  setTemplateOpen(false);
                  setColorOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Profiles</span>
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setAccentColor(c.hex)}
                    title={c.name}
                    className={`w-6 h-6 rounded-full border shrink-0 transition-transform ${
                      accentColor === c.hex ? 'scale-110 ring-2 ring-blue-500 ring-offset-1 border-transparent' : 'border-black/10'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsUploadOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shrink-0"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Upload</span>
              </button>
            </div>

            {templateOpen && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-md p-1.5 max-h-56 overflow-y-auto">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setActiveTemplate(t.id);
                      setTemplateOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                      activeTemplate === t.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <span>{t.name}</span>
                    {activeTemplate === t.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}

            {profileOpen && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-md p-1.5 max-h-56 overflow-y-auto">
                {PROFILES.map((prof, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setResumeData(prof.data);
                      setProfileOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs border-b border-slate-100 last:border-none ${
                      prof.isBlank ? 'bg-amber-50/70 text-amber-900' : 'text-slate-800'
                    }`}
                  >
                    <div className="font-bold">{prof.name}</div>
                    <div className="text-[10px] text-slate-500">{prof.role}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Split Screen */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="no-print lg:col-span-5 h-[calc(100vh-110px)] sticky top-18">
            <FormWizard />
          </section>

          <section className="lg:col-span-7 flex justify-center w-full">
            <ResumeCanvasContainer activeTemplate={activeTemplate}>
              {renderActiveTemplate()}
            </ResumeCanvasContainer>
          </section>
        </div>
      </main>

      {/* Branded Footer */}
      <Footer />
    </div>
  );
}