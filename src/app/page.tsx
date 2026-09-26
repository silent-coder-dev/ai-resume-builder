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
  Eye,
  Edit3,
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

export default function Home() {
  const { resumeData, accentColor, setAccentColor, setResumeData } = useResumeStore();

  const [activeTemplate, setActiveTemplate] = useState('modern');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  // Desktop Dropdown States
  const [templateOpen, setTemplateOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Dedicated Mobile Bottom-Sheet Modals
  const [mobileTemplateSheet, setMobileTemplateSheet] = useState(false);
  const [mobileProfileSheet, setMobileProfileSheet] = useState(false);

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

      {/* Top Navbar */}
      <header className="no-print bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-3 sm:px-6 lg:px-8 py-2.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 max-w-[1700px] mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 leading-none">
                  AI Resume Studio
                </h1>
                <span className="text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-200">
                  Free
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block mt-0.5 leading-none">
                ATS-Optimized Resumes by silent_coder
              </p>
            </div>
          </div>

          {/* Desktop Controls (>= 1024px) */}
          <div className="hidden lg:flex items-center gap-2">
            <AtsScoreMeter score={score} tips={tips} />

            {/* Template Dropdown */}
            <div className="relative" ref={tRef}>
              <button
                type="button"
                onClick={() => setTemplateOpen((p) => !p)}
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
                        activeTemplate === t.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
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
                      <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.hex }} />
                      <span className={accentColor === c.hex ? 'font-bold text-blue-600' : ''}>{c.name}</span>
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Profiles</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 max-h-96 overflow-y-auto">
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
                        prof.isBlank ? 'bg-amber-50/60 hover:bg-amber-100/60 text-amber-900 mb-1' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        {prof.isBlank && <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />}
                        {prof.name}
                      </div>
                      <div className={`text-[11px] ${prof.isBlank ? 'text-amber-700' : 'text-slate-500'}`}>{prof.role}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Upload */}
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Upload</span>
            </button>

            {/* Download PDF */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-950 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>

          {/* Mobile & Tablet Header Controls (< 1024px) */}
          <div className="flex lg:hidden items-center gap-1.5">
            <AtsScoreMeter score={score} tips={tips} />

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="p-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              title="Upload Resume"
            >
              <Upload className="w-4 h-4 text-blue-600" />
            </button>

            {/* Download PDF */}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1 px-3 py-2 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Toolbar (< 1024px): Direct Buttons for Template, Profile & Colors */}
        <div className="flex lg:hidden items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-slate-100 overflow-x-auto scrollbar-none">
          {/* Template Sheet Trigger */}
          <button
            type="button"
            onClick={() => setMobileTemplateSheet(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 shrink-0 cursor-pointer"
          >
            <Layout className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate max-w-[110px]">
              {TEMPLATES.find((t) => t.id === activeTemplate)?.name.replace(/^\d+\.\s*/, '')}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {/* Profiles Sheet Trigger */}
          <button
            type="button"
            onClick={() => setMobileProfileSheet(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 shrink-0 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Profiles</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {/* Accent Color Swatches */}
          <div className="flex items-center gap-1 shrink-0 px-1 py-0.5 bg-slate-50 border border-slate-200 rounded-lg">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setAccentColor(c.hex)}
                className={`w-5 h-5 rounded-full border transition-transform ${
                  accentColor === c.hex ? 'scale-110 ring-2 ring-blue-500 ring-offset-1 border-transparent' : 'border-black/10'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Mobile Tab Switcher (< 1024px) */}
      <div className="no-print lg:hidden px-4 pt-3 pb-2 sticky top-[88px] z-30 bg-slate-100/95 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/90 rounded-xl shadow-inner">
          <button
            type="button"
            onClick={() => setMobileTab('editor')}
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

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Wizard Column */}
          <section
            className={`no-print lg:col-span-5 ${
              mobileTab === 'editor' ? 'block' : 'hidden lg:block'
            } lg:h-[calc(100vh-110px)] lg:sticky lg:top-18`}
          >
            <FormWizard onSwitchToPreview={() => setMobileTab('preview')} />
          </section>

          {/* Resume Canvas Preview Column */}
          <section
            className={`lg:col-span-7 flex justify-center w-full ${
              mobileTab === 'preview' ? 'block' : 'hidden lg:flex'
            }`}
          >
            <ResumeCanvasContainer activeTemplate={activeTemplate}>
              {renderActiveTemplate()}
            </ResumeCanvasContainer>
          </section>
        </div>
      </main>

      {/* Branded Footer */}
      <Footer />

      {/* MOBILE TEMPLATE BOTTOM SHEET */}
      {mobileTemplateSheet && (
        <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setMobileTemplateSheet(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl p-5 max-h-[75vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Choose Resume Template</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileTemplateSheet(false)}
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

      {/* MOBILE PROFILE BOTTOM SHEET */}
      {mobileProfileSheet && (
        <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setMobileProfileSheet(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl p-5 max-h-[75vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Load a Pre-filled Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileProfileSheet(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-3 space-y-2">
              {PROFILES.map((prof, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setResumeData(prof.data);
                    setMobileProfileSheet(false);
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