import React from 'react';
import type { ResumeData, SectionItem } from '@/types/resume';
import {
  AcademicTemplate,
  BlankCanvasTemplate,
  ClassicTemplate,
  CompactTemplate,
  CorporateTemplate,
  CreativeTemplate,
  MedicalTemplate,
  MinimalTemplate,
  ModernTemplate,
  SidebarTemplate,
  TimelineTemplate,
  type TemplateProps,
} from '@/components/preview/AllTemplates';

export interface TemplateEntry {
  id: string;
  number: number;
  name: string;
  bestFor: string;
  Component: React.FC<TemplateProps>;
}

// One list of templates shared by the editor and the home page gallery.
export const TEMPLATE_CATALOG: TemplateEntry[] = [
  { id: 'blank', number: 0, name: 'Blank Canvas', bestFor: 'The simplest possible layout', Component: BlankCanvasTemplate },
  { id: 'modern', number: 1, name: 'Modern Tech', bestFor: 'Software, IT, startups', Component: ModernTemplate },
  { id: 'classic', number: 2, name: 'Executive Serif', bestFor: 'Managers and senior roles', Component: ClassicTemplate },
  { id: 'sidebar', number: 3, name: 'Creative Sidebar', bestFor: 'Designers and portfolios', Component: SidebarTemplate },
  { id: 'compact', number: 4, name: 'Compact Grid', bestFor: 'Fitting a lot onto one page', Component: CompactTemplate },
  { id: 'minimal', number: 5, name: 'Pure Minimal', bestFor: 'A clean, quiet look', Component: MinimalTemplate },
  { id: 'corporate', number: 6, name: 'Corporate Banner', bestFor: 'Business, consulting, sales', Component: CorporateTemplate },
  { id: 'timeline', number: 7, name: 'Career Timeline', bestFor: 'Showing a clear career path', Component: TimelineTemplate },
  { id: 'academic', number: 8, name: 'Legal / Academic', bestFor: 'Law, research, teaching', Component: AcademicTemplate },
  { id: 'creative', number: 9, name: 'Bold Designer', bestFor: 'Creative and marketing roles', Component: CreativeTemplate },
  { id: 'medical', number: 10, name: 'Clinical Healthcare', bestFor: 'Doctors, nurses, healthcare', Component: MedicalTemplate },
];

export const DEFAULT_TEMPLATE_ID = 'modern';

export const COLOR_OPTIONS = [
  { name: 'Corporate Blue', hex: '#2563eb' },
  { name: 'Executive Slate', hex: '#0f172a' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Royal Violet', hex: '#7c3aed' },
  { name: 'Warm Amber', hex: '#d97706' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Neutral Zinc', hex: '#52525b' },
];

export function getTemplateEntry(id: string): TemplateEntry {
  return (
    TEMPLATE_CATALOG.find((entry) => entry.id === id) ??
    TEMPLATE_CATALOG.find((entry) => entry.id === DEFAULT_TEMPLATE_ID)!
  );
}

export function renderResumeTemplate(
  id: string,
  data: ResumeData,
  accentColor: string,
  sectionOrder?: readonly SectionItem[]
) {
  const { Component } = getTemplateEntry(id);
  return <Component data={data} accentColor={accentColor} sectionOrder={sectionOrder} />;
}
