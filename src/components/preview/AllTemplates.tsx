'use client';

import React from 'react';
import type { Experience, ResumeData, SectionItem, SectionKey } from '@/types/resume';
import {
  customSectionIdFromKey,
  isCustomSectionKey,
  recommendedSectionOrder,
} from '@/lib/resume/sections';
import { safeHref } from '@/lib/resume/validation';
import {
  experienceBullets,
  hasText,
  isFilledAchievement,
  isFilledCertification,
  isFilledCustomItem,
  isFilledEducation,
  isFilledExperience,
  isFilledLanguage,
  isFilledLink,
  isFilledProject,
  isFilledSkill,
} from '@/utils/resumeContent';
import { Mail, Phone, MapPin } from 'lucide-react';

// Templates are pure: everything they show comes from these props.
export interface TemplateProps {
  data: ResumeData;
  accentColor: string;
  // Section order and visibility. Defaults to the standard order.
  sectionOrder?: readonly SectionItem[];
}

const formatDateRange = (start?: string, end?: string, isCurrent?: boolean) => {
  const startLabel = start?.trim();
  const endLabel = isCurrent ? 'Present' : end?.trim();
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
  return startLabel || endLabel || '';
};

// Placeholder text helps while editing, but is removed from the printed PDF.
const PreviewPlaceholder: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="no-print opacity-40">{children}</span>
);

const textOrPlaceholder = (value: string | undefined, placeholder: string) =>
  hasText(value) ? value : <PreviewPlaceholder>{placeholder}</PreviewPlaceholder>;

// Renders only the contact values that exist, with separators between them.
const ContactList: React.FC<{
  values: Array<string | undefined>;
  separator?: string;
  itemClassName?: string;
}> = ({ values, separator, itemClassName }) => (
  <>
    {values.filter(hasText).map((value, index) => (
      <React.Fragment key={`${index}-${value}`}>
        {separator && index > 0 && <span aria-hidden="true">{separator}</span>}
        <span className={itemClassName}>{value}</span>
      </React.Fragment>
    ))}
  </>
);

// LinkedIn / GitHub / Portfolio fields first, then any other profile links.
function profileLinks(data: ResumeData): Array<{ id: string; label: string; url: string }> {
  const { personalInfo } = data;
  return [
    { id: 'linkedin', label: 'LinkedIn', url: personalInfo.linkedinUrl ?? '' },
    { id: 'github', label: 'GitHub', url: personalInfo.githubUrl ?? '' },
    { id: 'portfolio', label: 'Portfolio', url: personalInfo.portfolioUrl ?? '' },
    ...(data.links ?? []).filter(isFilledLink).map((link) => ({ id: link.id, label: link.platform.trim() || 'Link', url: link.url })),
  ].filter((link) => hasText(link.url));
}

const hasProfileLinks = (data: ResumeData) => profileLinks(data).length > 0;

// Clickable link words in the header. Only http(s) links become clickable.
const RenderSocialLinks: React.FC<{ data: ResumeData; className?: string }> = ({ data, className = '' }) => {
  const links = profileLinks(data);
  if (links.length === 0) return null;
  return (
    <>
      {links.map((link) => {
        const href = safeHref(link.url);
        const classes = `inline-flex items-center text-[11px] font-semibold underline underline-offset-2 ${className}`;
        return href ? (
          <a key={link.id} href={href} target="_blank" rel="noopener noreferrer" className={classes} title={link.url}>
            {link.label}
          </a>
        ) : (
          <span key={link.id} className={classes}>
            {link.label}
          </span>
        );
      })}
    </>
  );
};

const SectionHeading: React.FC<{ accentColor: string; children: React.ReactNode; spacing?: string }> = ({
  accentColor,
  children,
  spacing = 'mb-2',
}) => (
  <h2
    className={`text-xs font-bold uppercase tracking-wider pb-1 ${spacing} border-b`}
    style={{ color: accentColor, borderColor: `${accentColor}40` }}
  >
    {children}
  </h2>
);

const RoleList: React.FC<{ items: Experience[] }> = ({ items }) => (
  <div className="space-y-3">
    {items.map((exp) => {
      const bullets = experienceBullets(exp);
      const dates = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
      const subline = [exp.company, exp.location].filter(hasText).join(' · ');
      return (
        <div key={exp.id} className="break-inside-avoid">
          <div className="flex justify-between items-baseline gap-3">
            <span className="text-xs font-bold text-slate-900">{exp.role}</span>
            {dates && <span className="shrink-0 text-[10px] font-semibold text-slate-500">{dates}</span>}
          </div>
          {subline && <div className="text-[11px] font-semibold text-slate-600 mb-1">{subline}</div>}
          {bullets.length > 0 ? (
            <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700">
              {bullets.map((bullet, idx) => (
                <li key={idx} className="leading-relaxed">
                  {bullet}
                </li>
              ))}
            </ul>
          ) : (
            hasText(exp.rawDetails) && (
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{exp.rawDetails}</p>
            )
          )}
        </div>
      );
    })}
  </div>
);

// Shared section engine: every template renders its body through this, so
// section order, visibility, and "hide empty sections" work everywhere.
const DynamicSectionsRenderer: React.FC<TemplateProps> = ({ data, accentColor, sectionOrder }) => {
  const order = sectionOrder ?? recommendedSectionOrder(null);

  const renderSection = (id: SectionKey) => {
    if (isCustomSectionKey(id)) {
      const section = (data.customSections ?? []).find((item) => item.id === customSectionIdFromKey(id));
      const items = (section?.items ?? []).filter(isFilledCustomItem);
      if (!section || items.length === 0) return null;
      return (
        <section className="break-inside-avoid mb-4">
          <SectionHeading accentColor={accentColor}>{section.title || 'Additional'}</SectionHeading>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline gap-3">
                  <span className="text-xs font-bold text-slate-900">{item.title}</span>
                  {hasText(item.date) && <span className="shrink-0 text-[10px] font-semibold text-slate-500">{item.date}</span>}
                </div>
                {hasText(item.subtitle) && <div className="text-[11px] font-semibold text-slate-600">{item.subtitle}</div>}
                {hasText(item.description) && (
                  <p className="text-xs text-slate-700 mt-0.5 leading-relaxed whitespace-pre-line">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }

    switch (id) {
      case 'summary':
        if (!hasText(data.personalInfo.summary)) return null;
        return (
          <section className="break-inside-avoid mb-4">
            <SectionHeading accentColor={accentColor} spacing="mb-1.5">Professional Summary</SectionHeading>
            <p className="text-xs text-slate-700 leading-relaxed text-justify">{data.personalInfo.summary}</p>
          </section>
        );

      case 'skills': {
        const skills = (data.skills ?? []).filter(isFilledSkill);
        if (skills.length === 0) return null;
        return (
          <section className="break-inside-avoid mb-4">
            <SectionHeading accentColor={accentColor} spacing="mb-1.5">Skills & Core Competencies</SectionHeading>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span key={skill.id} className="px-2 py-0.5 text-[11px] font-medium rounded bg-slate-100 text-slate-800 border border-slate-200">
                  {skill.name}
                </span>
              ))}
            </div>
          </section>
        );
      }

      case 'experience':
      case 'internships': {
        const items = ((id === 'experience' ? data.experiences : data.internships) ?? []).filter(isFilledExperience);
        if (items.length === 0) return null;
        return (
          <section className="break-inside-avoid mb-4">
            <SectionHeading accentColor={accentColor}>{id === 'experience' ? 'Work Experience' : 'Internships'}</SectionHeading>
            <RoleList items={items} />
          </section>
        );
      }

      case 'projects': {
        const projects = (data.projects ?? []).filter(isFilledProject);
        if (projects.length === 0) return null;
        return (
          <section className="break-inside-avoid mb-4">
            <SectionHeading accentColor={accentColor}>Key Projects</SectionHeading>
            <div className="space-y-2.5">
              {projects.map((proj) => {
                const techStack = (proj.techStack ?? []).filter(hasText).map((tech) => tech.trim());
                const links = [
                  { label: 'Code', href: proj.githubUrl ? safeHref(proj.githubUrl) : null },
                  { label: 'Live', href: proj.liveUrl ? safeHref(proj.liveUrl) : null },
                ].filter((link): link is { label: string; href: string } => Boolean(link.href));
                return (
                  <div key={proj.id} className="break-inside-avoid">
                    <div className="flex justify-between items-baseline flex-wrap gap-1">
                      <span className="text-xs font-bold text-slate-900">
                        {proj.title}
                        {links.map((link) => (
                          <a
                            key={link.label}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-[10px] font-semibold underline underline-offset-2"
                            style={{ color: accentColor }}
                          >
                            {link.label}
                          </a>
                        ))}
                      </span>
                      {techStack.length > 0 && <span className="text-[10px] text-slate-500 font-mono">{techStack.join(' • ')}</span>}
                    </div>
                    {hasText(proj.description) && (
                      <p className="text-xs text-slate-700 mt-0.5 leading-relaxed whitespace-pre-line">{proj.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      }

      case 'education': {
        const education = (data.education ?? []).filter(isFilledEducation);
        if (education.length === 0) return null;
        return (
          <section className="break-inside-avoid mb-4">
            <SectionHeading accentColor={accentColor}>Education</SectionHeading>
            <div className="space-y-2">
              {education.map((edu) => (
                <div key={edu.id} className="break-inside-avoid flex justify-between items-start gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{edu.degree}</div>
                    <div className="text-[11px] text-slate-600">{[edu.institution, edu.fieldOfStudy].filter(hasText).join(' • ')}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-semibold text-slate-500">{edu.graduationYear}</span>
                    {hasText(edu.scoreOrGpa) && <div className="text-[10px] text-slate-500">Score: {edu.scoreOrGpa}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case 'certifications': {
        const certifications = (data.certifications ?? []).filter(isFilledCertification);
        if (certifications.length === 0) return null;
        return (
          <section className="break-inside-avoid mb-4">
            <SectionHeading accentColor={accentColor} spacing="mb-1.5">Certifications</SectionHeading>
            <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
              {certifications.map((cert) => (
                <li key={cert.id}>
                  <span className="font-bold text-slate-800">{cert.name}</span>
                  {hasText(cert.issuer) && ` — ${cert.issuer}`}
                  {hasText(cert.date) && <span className="text-slate-500"> ({cert.date})</span>}
                </li>
              ))}
            </ul>
          </section>
        );
      }

      case 'achievements': {
        const achievements = (data.achievements ?? []).filter(isFilledAchievement);
        if (achievements.length === 0) return null;
        return (
          <section className="break-inside-avoid mb-4">
            <SectionHeading accentColor={accentColor} spacing="mb-1.5">Key Achievements</SectionHeading>
            <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
              {achievements.map((ach) => (
                <li key={ach.id}>
                  {hasText(ach.title) && <span className="font-bold text-slate-800">{ach.title}</span>}
                  {hasText(ach.title) && hasText(ach.description) && ': '}
                  {hasText(ach.description) && ach.description}
                </li>
              ))}
            </ul>
          </section>
        );
      }

      case 'languages': {
        const languages = (data.languages ?? []).filter(isFilledLanguage);
        if (languages.length === 0) return null;
        return (
          <section className="break-inside-avoid mb-4">
            <SectionHeading accentColor={accentColor} spacing="mb-1.5">Languages</SectionHeading>
            <p className="text-xs text-slate-700">
              {languages.map((language) => (hasText(language.proficiency) ? `${language.name} (${language.proficiency})` : language.name)).join(' · ')}
            </p>
          </section>
        );
      }

      default:
        return null;
    }
  };

  return (
    <>
      {order
        .filter((sec) => sec.visible)
        .map((sec) => (
          <React.Fragment key={sec.id}>{renderSection(sec.id)}</React.Fragment>
        ))}
    </>
  );
};

// 1. MODERN TECH TEMPLATE
export const ModernTemplate: React.FC<TemplateProps> = ({ data, accentColor, sectionOrder }) => {
  return (
    <div className="resume-page w-[794px] min-h-[1123px] bg-white p-8 font-sans text-slate-900 box-border">
      <header className="border-b-2 pb-4 mb-4" style={{ borderColor: accentColor }}>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: accentColor }}>
          {textOrPlaceholder(data.personalInfo.fullName, 'Your Full Name')}
        </h1>
        <div className="text-sm font-bold text-slate-700 mt-0.5">
          {textOrPlaceholder(data.personalInfo.targetRole, 'Professional Title')}
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-600 mt-2 font-medium">
          {hasText(data.personalInfo.email) && (
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" /> {data.personalInfo.email}
            </span>
          )}
          {hasText(data.personalInfo.phone) && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> {data.personalInfo.phone}
            </span>
          )}
          {hasText(data.personalInfo.location) && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {data.personalInfo.location}
            </span>
          )}
          <RenderSocialLinks data={data} className="text-slate-800 font-bold" />
        </div>
      </header>

      <main>
        <DynamicSectionsRenderer data={data} accentColor={accentColor} sectionOrder={sectionOrder} />
      </main>
    </div>
  );
};

// 2. CLASSIC EXECUTIVE SERIF TEMPLATE
export const ClassicTemplate: React.FC<TemplateProps> = ({ data, accentColor, sectionOrder }) => (
  <div className="resume-page w-[794px] min-h-[1123px] bg-white p-10 font-serif text-slate-900 box-border">
    <header className="text-center border-b pb-4 mb-5" style={{ borderColor: accentColor }}>
      <h1 className="text-3xl font-bold tracking-normal uppercase text-slate-900">
        {textOrPlaceholder(data.personalInfo.fullName, 'Your Name')}
      </h1>
      <p className="text-sm italic font-semibold text-slate-700 mt-1">
        {textOrPlaceholder(data.personalInfo.targetRole, 'Executive Profile')}
      </p>
      <div className="flex justify-center flex-wrap gap-3 text-[11px] text-slate-600 mt-2 font-sans">
        <ContactList
          values={[data.personalInfo.location, data.personalInfo.phone, data.personalInfo.email]}
        />
        <RenderSocialLinks data={data} className="text-slate-900 font-bold" />
      </div>
    </header>
    <main className="font-sans">
      <DynamicSectionsRenderer data={data} accentColor={accentColor} sectionOrder={sectionOrder} />
    </main>
  </div>
);

// 3. SIDEBAR CREATIVE TEMPLATE
export const SidebarTemplate: React.FC<TemplateProps> = ({ data, accentColor, sectionOrder }) => {
  const hasLinks = hasProfileLinks(data);
  return (
    <div className="resume-page w-[794px] min-h-[1123px] bg-white flex font-sans box-border">
      <aside className="w-64 bg-slate-900 text-white p-6 shrink-0">
        <h1 className="text-xl font-black leading-tight text-white">
          {textOrPlaceholder(data.personalInfo.fullName, 'Your Name')}
        </h1>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          {textOrPlaceholder(data.personalInfo.targetRole, 'Professional Title')}
        </p>

        <div className="mt-6 space-y-2 text-xs text-slate-300">
          {hasText(data.personalInfo.email) && (
            <div className="flex items-center gap-2 break-all">
              <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span>{data.personalInfo.email}</span>
            </div>
          )}
          {hasText(data.personalInfo.phone) && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span>{data.personalInfo.phone}</span>
            </div>
          )}
          {hasText(data.personalInfo.location) && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span>{data.personalInfo.location}</span>
            </div>
          )}

          {hasLinks && (
            <div className="pt-3 border-t border-slate-800 space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Profiles
              </div>
              <div className="flex flex-col gap-1">
                <RenderSocialLinks data={data} className="text-slate-200 hover:text-white" />
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 p-8">
        <DynamicSectionsRenderer data={data} accentColor={accentColor} sectionOrder={sectionOrder} />
      </main>
    </div>
  );
};

// 4. COMPACT GRID TEMPLATE
export const CompactTemplate: React.FC<TemplateProps> = ({ data, accentColor, sectionOrder }) => (
  <div className="resume-page w-[794px] min-h-[1123px] bg-white p-7 font-sans text-slate-900 box-border leading-tight">
    <header className="flex justify-between items-center gap-4 border-b pb-2 mb-3" style={{ borderColor: accentColor }}>
      <div>
        <h1 className="text-xl font-bold" style={{ color: accentColor }}>
          {textOrPlaceholder(data.personalInfo.fullName, 'Your Name')}
        </h1>
        <div className="text-xs font-semibold text-slate-600">
          {textOrPlaceholder(data.personalInfo.targetRole, 'Professional Title')}
        </div>
      </div>
      <div className="text-right text-[10px] text-slate-500">
        <div className="flex justify-end gap-1">
          <ContactList values={[data.personalInfo.email, data.personalInfo.phone]} separator="|" />
        </div>
        {hasText(data.personalInfo.location) && <div>{data.personalInfo.location}</div>}
        <div className="flex justify-end gap-2 mt-0.5">
          <RenderSocialLinks data={data} className="text-slate-800 font-bold" />
        </div>
      </div>
    </header>
    <main>
      <DynamicSectionsRenderer data={data} accentColor={accentColor} sectionOrder={sectionOrder} />
    </main>
  </div>
);

// 5. PURE MINIMAL TEMPLATE
export const MinimalTemplate: React.FC<TemplateProps> = ({ data, accentColor, sectionOrder }) => (
  <div className="resume-page w-[794px] min-h-[1123px] bg-white p-10 font-sans text-slate-800 box-border">
    <header className="mb-6">
      <h1 className="text-2xl font-light tracking-wide text-slate-900">
        {textOrPlaceholder(data.personalInfo.fullName, 'Your Name')}
      </h1>
      <p className="text-xs tracking-widest uppercase font-semibold text-slate-500 mt-0.5">
        {textOrPlaceholder(data.personalInfo.targetRole, 'Professional Title')}
      </p>
      <div className="text-[11px] text-slate-400 mt-2 flex flex-wrap gap-2.5">
        <ContactList
          values={[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location]}
          separator="•"
        />
        <RenderSocialLinks data={data} className="text-slate-800 font-bold" />
      </div>
    </header>
    <main>
      <DynamicSectionsRenderer data={data} accentColor={accentColor} sectionOrder={sectionOrder} />
    </main>
  </div>
);

// 6. CORPORATE BANNER TEMPLATE
export const CorporateTemplate: React.FC<TemplateProps> = ({ data, accentColor, sectionOrder }) => (
  <div className="resume-page w-[794px] min-h-[1123px] bg-white font-sans text-slate-900 box-border">
    <div className="p-8 text-white" style={{ backgroundColor: accentColor }}>
      <h1 className="text-2xl font-black">
        {textOrPlaceholder(data.personalInfo.fullName, 'Your Name')}
      </h1>
      <div className="text-xs font-medium text-white/90 mt-1">
        {textOrPlaceholder(data.personalInfo.targetRole, 'Professional Title')}
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] text-white/90 mt-3">
        <ContactList
          values={[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location]}
        />
        <RenderSocialLinks data={data} className="text-white underline font-bold" />
      </div>
    </div>
    <main className="p-8">
      <DynamicSectionsRenderer data={data} accentColor={accentColor} sectionOrder={sectionOrder} />
    </main>
  </div>
);

// 7. TIMELINE TEMPLATE
export const TimelineTemplate: React.FC<TemplateProps> = ({ data, accentColor, sectionOrder }) => (
  <div className="resume-page w-[794px] min-h-[1123px] bg-white p-8 font-sans text-slate-900 box-border">
    <header className="border-l-4 pl-4 mb-6" style={{ borderColor: accentColor }}>
      <h1 className="text-2xl font-extrabold text-slate-900">
        {textOrPlaceholder(data.personalInfo.fullName, 'Your Name')}
      </h1>
      <p className="text-xs font-bold text-slate-600 mt-0.5">
        {textOrPlaceholder(data.personalInfo.targetRole, 'Professional Title')}
      </p>
      <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-2.5">
        <ContactList
          values={[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location]}
        />
        <RenderSocialLinks data={data} className="text-slate-800 font-bold" />
      </div>
    </header>
    <main className="pl-4 border-l border-slate-200">
      <DynamicSectionsRenderer data={data} accentColor={accentColor} sectionOrder={sectionOrder} />
    </main>
  </div>
);

// 8. ACADEMIC / LEGAL TEMPLATE
export const AcademicTemplate: React.FC<TemplateProps> = ({ data, accentColor, sectionOrder }) => (
  <div className="resume-page w-[794px] min-h-[1123px] bg-white p-10 font-serif text-slate-900 box-border">
    <header className="text-center pb-4 mb-4 border-b-2 border-slate-800">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
        {textOrPlaceholder(data.personalInfo.fullName, 'Your Name')}
      </h1>
      <div className="text-xs font-semibold text-slate-700 italic mt-0.5">
        Curriculum Vitae
        {hasText(data.personalInfo.targetRole) && ` • ${data.personalInfo.targetRole}`}
      </div>
      <div className="text-[11px] text-slate-600 mt-1 flex justify-center flex-wrap gap-3 font-sans">
        <ContactList
          values={[data.personalInfo.location, data.personalInfo.email, data.personalInfo.phone]}
        />
        <RenderSocialLinks data={data} className="text-slate-900 font-bold" />
      </div>
    </header>
    <main className="font-serif">
      <DynamicSectionsRenderer data={data} accentColor={accentColor} sectionOrder={sectionOrder} />
    </main>
  </div>
);

// 9. BOLD CREATIVE DESIGNER TEMPLATE
export const CreativeTemplate: React.FC<TemplateProps> = ({ data, accentColor, sectionOrder }) => (
  <div className="resume-page w-[794px] min-h-[1123px] bg-white p-8 font-sans text-slate-900 box-border">
    <header className="mb-6 flex justify-between items-end gap-4 border-b-4 pb-4" style={{ borderColor: accentColor }}>
      <div>
        <h1 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">
          {textOrPlaceholder(data.personalInfo.fullName, 'Your Name')}
        </h1>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: accentColor }}>
          {textOrPlaceholder(data.personalInfo.targetRole, 'Professional Title')}
        </p>
      </div>
      <div className="text-right text-[11px] text-slate-600 font-medium">
        <ContactList
          values={[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location]}
          itemClassName="block"
        />
        <div className="mt-0.5 flex justify-end gap-2">
          <RenderSocialLinks data={data} className="text-slate-900 font-bold" />
        </div>
      </div>
    </header>
    <main>
      <DynamicSectionsRenderer data={data} accentColor={accentColor} sectionOrder={sectionOrder} />
    </main>
  </div>
);

// 10. CLINICAL HEALTHCARE TEMPLATE
export const MedicalTemplate: React.FC<TemplateProps> = ({ data, accentColor, sectionOrder }) => (
  <div className="resume-page w-[794px] min-h-[1123px] bg-white p-8 font-sans text-slate-900 box-border">
    <header className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-5 flex justify-between items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {textOrPlaceholder(data.personalInfo.fullName, 'Your Name')}
        </h1>
        <div className="text-xs font-bold text-teal-700 mt-0.5">
          {textOrPlaceholder(data.personalInfo.targetRole, 'Professional Title')}
        </div>
      </div>
      <div className="text-right text-[11px] text-slate-600">
        <ContactList
          values={[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location]}
          itemClassName="block"
        />
        <div className="mt-0.5 flex justify-end gap-2">
          <RenderSocialLinks data={data} className="text-teal-800 font-bold" />
        </div>
      </div>
    </header>
    <main>
      <DynamicSectionsRenderer data={data} accentColor={accentColor} sectionOrder={sectionOrder} />
    </main>
  </div>
);

// 0. BLANK CANVAS TEMPLATE
export const BlankCanvasTemplate: React.FC<TemplateProps> = ({ data, accentColor, sectionOrder }) => (
  <div className="resume-page w-[794px] min-h-[1123px] bg-white p-8 font-sans text-slate-900 box-border">
    <header className="border-b pb-3 mb-4">
      <h1 className="text-2xl font-bold text-slate-900">
        {textOrPlaceholder(data.personalInfo.fullName, 'Untitled Resume')}
      </h1>
      <p className="text-xs font-medium text-slate-500">
        {textOrPlaceholder(data.personalInfo.targetRole, 'Click form fields to start building')}
      </p>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
        <ContactList
          values={[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location]}
          separator="•"
        />
        <RenderSocialLinks data={data} className="text-slate-800 font-bold" />
      </div>
    </header>
    <main>
      <DynamicSectionsRenderer data={data} accentColor={accentColor} sectionOrder={sectionOrder} />
    </main>
  </div>
);
