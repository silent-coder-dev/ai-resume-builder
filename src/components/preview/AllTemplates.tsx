'use client';

import React from 'react';
import { ResumeData } from '@/types/resume';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
  accentColor?: string;
}

const AvatarImg: React.FC<{ url?: string; name: string; size?: string }> = ({
  url,
  name,
  size = 'w-20 h-20',
}) => {
  if (!url) return null;
  return (
    <img
      src={url}
      alt={name}
      className={`${size} rounded-full object-cover border-2 border-slate-200 shadow-xs shrink-0`}
    />
  );
};

// 0. BLANK CANVAS TEMPLATE
export const BlankCanvasTemplate: React.FC<TemplateProps> = ({ data, accentColor = '#0f172a' }) => {
  const { personalInfo, links, skills, experiences, education, projects, certifications, achievements } = data;
  const hasContent =
    personalInfo.fullName ||
    personalInfo.summary ||
    skills.length > 0 ||
    experiences.length > 0 ||
    education.length > 0 ||
    projects.length > 0 ||
    (certifications && certifications.length > 0) ||
    (achievements && achievements.length > 0);

  if (!hasContent) {
    return (
      <div
        id="resume-preview"
        className="w-full bg-white text-slate-400 p-12 shadow-md rounded-lg max-w-[800px] mx-auto min-h-[1050px] font-sans flex flex-col items-center justify-center border-2 border-dashed border-slate-200 print:shadow-none print:border-none"
      >
        <p className="text-sm font-medium">Blank Canvas</p>
        <p className="text-xs text-slate-400 mt-1">Start typing in the wizard or load a profile to populate this resume.</p>
      </div>
    );
  }

  return (
    <div
      id="resume-preview"
      className="w-full bg-white text-slate-900 p-8 sm:p-12 shadow-md rounded-lg max-w-[800px] mx-auto min-h-[1050px] font-sans print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none"
    >
      <header className="pb-4 mb-4 border-b border-slate-200 flex justify-between items-start">
        <div>
          {personalInfo.fullName && (
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: accentColor }}>
              {personalInfo.fullName}
            </h1>
          )}
          {personalInfo.targetRole && (
            <p className="text-sm font-medium text-slate-600 mt-0.5">{personalInfo.targetRole}</p>
          )}
          <div className="flex flex-wrap gap-x-3 text-xs text-slate-500 mt-2">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>• {personalInfo.phone}</span>}
            {personalInfo.location && <span>• {personalInfo.location}</span>}
          </div>
          {links && links.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs mt-1.5 text-blue-600">
              {links.map((l) => (
                <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="hover:underline">
                  {l.platform}
                </a>
              ))}
            </div>
          )}
        </div>
        {personalInfo.showPhoto && personalInfo.photoUrl && (
          <AvatarImg url={personalInfo.photoUrl} name={personalInfo.fullName} size="w-20 h-20" />
        )}
      </header>

      {personalInfo.summary && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>Summary</h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{personalInfo.summary}</p>
        </section>
      )}

      {skills && skills.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: accentColor }}>Skills</h2>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-mono">
            {skills.map((s) => s.name).join(' • ')}
          </p>
        </section>
      )}

      {experiences && experiences.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>Experience</h2>
          <div className="space-y-3">
            {experiences.map((exp) => (
              <div key={exp.id} className="text-xs sm:text-sm">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{exp.role} {exp.company && <span className="font-normal text-slate-600">— {exp.company}</span>}</span>
                  <span className="text-xs text-slate-500 font-normal">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</span>
                </div>
                <ul className="list-disc ml-4 space-y-0.5 text-slate-700 mt-1">
                  {exp.enhancedBullets?.length > 0 ? (
                    exp.enhancedBullets.map((b, i) => <li key={i}>{b}</li>)
                  ) : (
                    exp.rawDetails && <li>{exp.rawDetails}</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {projects && projects.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: accentColor }}>Projects</h2>
          <div className="space-y-2 text-xs sm:text-sm">
            {projects.map((p) => (
              <div key={p.id}>
                <span className="font-bold text-slate-900">{p.title}:</span>{' '}
                <span className="text-slate-700">{p.description}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {education && education.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: accentColor }}>Education</h2>
          <div className="space-y-1 text-xs">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between">
                <span><strong>{edu.degree} in {edu.fieldOfStudy}</strong> — {edu.institution}</span>
                <span className="text-slate-500">{edu.graduationYear}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {certifications && certifications.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: accentColor }}>Certifications</h2>
          <div className="space-y-1 text-xs text-slate-800">
            {certifications.map((c) => (
              <div key={c.id}>
                <strong>{c.name}</strong> — <span className="text-slate-600">{c.issuer}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {achievements && achievements.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: accentColor }}>Honors & Achievements</h2>
          <div className="space-y-1 text-xs text-slate-800">
            {achievements.map((a) => (
              <div key={a.id}>
                <strong>{a.title}:</strong> <span className="text-slate-600">{a.description}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// 1. MODERN TECH
export const ModernTemplate: React.FC<TemplateProps> = ({ data, accentColor = '#2563eb' }) => {
  const { personalInfo, links, skills, experiences, education, projects, certifications, achievements } = data;
  return (
    <div
      id="resume-preview"
      className="w-full bg-white text-slate-800 p-8 sm:p-12 shadow-md rounded-lg max-w-[800px] mx-auto min-h-[1050px] font-sans print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none"
    >
      <header className="border-b pb-5 mb-5 border-slate-200 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: accentColor }}>
            {personalInfo.fullName || 'Your Full Name'}
          </h1>
          <p className="text-base font-semibold text-slate-600 mt-0.5">
            {personalInfo.targetRole || 'Target Role'}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
            {personalInfo.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{personalInfo.email}</span>}
            {personalInfo.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{personalInfo.phone}</span>}
            {personalInfo.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{personalInfo.location}</span>}
          </div>
          {links && links.length > 0 && (
            <div className="flex flex-wrap gap-3 text-xs mt-2 text-blue-600">
              {links.map((l) => (
                <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                  <Globe className="w-3 h-3" />{l.platform}
                </a>
              ))}
            </div>
          )}
        </div>
        {personalInfo.showPhoto && personalInfo.photoUrl && (
          <AvatarImg url={personalInfo.photoUrl} name={personalInfo.fullName} size="w-24 h-24" />
        )}
      </header>

      {personalInfo.summary && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: accentColor }}>Summary</h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700">{personalInfo.summary}</p>
        </section>
      )}

      {skills.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>Technical & Professional Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span key={s.id} className="px-2.5 py-0.5 rounded text-xs bg-slate-100 text-slate-800 border border-slate-200 font-medium">{s.name}</span>
            ))}
          </div>
        </section>
      )}

      {experiences.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: accentColor }}>Experience</h2>
          <div className="space-y-3.5">
            {experiences.map((exp) => (
              <div key={exp.id} className="text-xs sm:text-sm">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>{exp.role}</span>
                  <span className="text-xs font-normal text-slate-500">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</span>
                </div>
                <div className="text-xs font-semibold text-slate-600 mb-1">{exp.company}</div>
                <ul className="list-disc ml-4 space-y-1 text-slate-700 leading-relaxed">
                  {exp.enhancedBullets?.length > 0 ? exp.enhancedBullets.map((b, i) => <li key={i}>{b}</li>) : <li>{exp.rawDetails}</li>}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: accentColor }}>Featured Projects</h2>
          <div className="space-y-2.5 text-xs sm:text-sm">
            {projects.map((p) => (
              <div key={p.id}>
                <div className="font-bold text-slate-900">{p.title}</div>
                {p.techStack?.length > 0 && <p className="text-[11px] text-slate-500 font-medium">Stack: {p.techStack.join(' • ')}</p>}
                <p className="text-xs leading-relaxed text-slate-700 mt-0.5">{p.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>Education</h2>
          <div className="space-y-1.5 text-xs sm:text-sm">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-slate-800">{edu.degree} in {edu.fieldOfStudy}</span>
                  <span className="text-slate-600 text-xs"> — {edu.institution}</span>
                </div>
                <span className="text-xs text-slate-500">{edu.graduationYear}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {certifications && certifications.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>Certifications</h2>
          <div className="space-y-1 text-xs sm:text-sm text-slate-700">
            {certifications.map((c) => (
              <div key={c.id}>
                <span className="font-bold text-slate-900">{c.name}</span> — <span>{c.issuer}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {achievements && achievements.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>Achievements & Honors</h2>
          <div className="space-y-1 text-xs sm:text-sm text-slate-700">
            {achievements.map((a) => (
              <div key={a.id}>
                <span className="font-bold text-slate-900">{a.title}:</span> {a.description}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// 2. CLASSIC EXECUTIVE SERIF
export const ClassicTemplate: React.FC<TemplateProps> = ({ data, accentColor = '#0f172a' }) => {
  const { personalInfo, links, skills, experiences, education, projects, certifications, achievements } = data;
  return (
    <div
      id="resume-preview"
      className="w-full bg-white text-slate-900 p-8 sm:p-12 shadow-md rounded-lg max-w-[800px] mx-auto min-h-[1050px] font-serif print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none"
    >
      <header className="text-center pb-4 mb-5 border-b-2" style={{ borderColor: accentColor }}>
        {personalInfo.showPhoto && personalInfo.photoUrl && (
          <div className="flex justify-center mb-3">
            <AvatarImg url={personalInfo.photoUrl} name={personalInfo.fullName} size="w-20 h-20" />
          </div>
        )}
        <h1 className="text-3xl font-bold uppercase tracking-wide" style={{ color: accentColor }}>
          {personalInfo.fullName}
        </h1>
        <p className="text-sm italic text-slate-700 mt-1">{personalInfo.targetRole}</p>
        <div className="flex flex-wrap justify-center gap-x-3 text-xs text-slate-600 mt-2 font-sans">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo.location && <span>• {personalInfo.location}</span>}
        </div>
        {links?.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-3 text-xs mt-1 text-blue-900 font-sans">
            {links.map((l) => (
              <a key={l.id} href={l.url} className="hover:underline">{l.platform}</a>
            ))}
          </div>
        )}
      </header>

      {personalInfo.summary && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2 font-sans" style={{ color: accentColor }}>
            Executive Summary
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed italic text-slate-800">{personalInfo.summary}</p>
        </section>
      )}

      {experiences?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2 font-sans" style={{ color: accentColor }}>
            Professional Experience
          </h2>
          <div className="space-y-3.5">
            {experiences.map((exp) => (
              <div key={exp.id} className="text-xs sm:text-sm">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>{exp.role}</span>
                  <span className="text-xs italic font-normal text-slate-600">{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</span>
                </div>
                <div className="text-xs italic text-slate-700 mb-1">{exp.company}</div>
                <ul className="list-disc ml-5 space-y-1 text-slate-800 leading-relaxed">
                  {exp.enhancedBullets?.length > 0 ? exp.enhancedBullets.map((b, i) => <li key={i}>{b}</li>) : <li>{exp.rawDetails}</li>}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {skills?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2 font-sans" style={{ color: accentColor }}>
            Areas of Expertise
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-800 font-sans">
            {skills.map((s) => s.name).join(' • ')}
          </p>
        </section>
      )}

      {projects?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2 font-sans" style={{ color: accentColor }}>
            Key Projects
          </h2>
          <div className="space-y-2 text-xs sm:text-sm">
            {projects.map((p) => (
              <div key={p.id}>
                <div className="font-bold text-slate-900">{p.title}</div>
                <p className="text-xs leading-relaxed text-slate-700">{p.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {education?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2 font-sans" style={{ color: accentColor }}>
            Education
          </h2>
          <div className="space-y-1.5 text-xs sm:text-sm">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold">{edu.degree} in {edu.fieldOfStudy}</span>
                  <span className="text-slate-600"> — {edu.institution}</span>
                </div>
                <span className="text-xs italic text-slate-600">{edu.graduationYear}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {certifications && certifications.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2 font-sans" style={{ color: accentColor }}>
            Certifications
          </h2>
          <div className="space-y-1 text-xs text-slate-800 font-sans">
            {certifications.map((c) => (
              <div key={c.id}>
                <strong>{c.name}</strong> — {c.issuer}
              </div>
            ))}
          </div>
        </section>
      )}

      {achievements && achievements.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2 font-sans" style={{ color: accentColor }}>
            Honors & Achievements
          </h2>
          <div className="space-y-1 text-xs text-slate-800 font-sans">
            {achievements.map((a) => (
              <div key={a.id}>
                <strong>{a.title}:</strong> {a.description}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// 3. CREATIVE SIDEBAR
export const SidebarTemplate: React.FC<TemplateProps> = ({ data, accentColor = '#2563eb' }) => {
  const { personalInfo, links, skills, experiences, education, projects, certifications, achievements } = data;
  return (
    <div
      id="resume-preview"
      className="w-full bg-white text-slate-800 shadow-md rounded-lg max-w-[800px] mx-auto min-h-[1050px] font-sans flex print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none"
    >
      <aside className="w-1/3 bg-slate-50 border-r border-slate-200 p-6 flex flex-col justify-between shrink-0">
        <div>
          {personalInfo.showPhoto && personalInfo.photoUrl && (
            <div className="flex justify-center mb-4">
              <AvatarImg url={personalInfo.photoUrl} name={personalInfo.fullName} size="w-24 h-24" />
            </div>
          )}
          <h1 className="text-xl font-extrabold text-slate-900 leading-tight" style={{ color: accentColor }}>
            {personalInfo.fullName}
          </h1>
          <p className="text-xs font-semibold text-slate-600 mt-1 mb-4">{personalInfo.targetRole}</p>

          <div className="space-y-2 text-[11px] text-slate-600 border-t border-slate-200 pt-3">
            {personalInfo.email && <div className="break-all"><strong className="block text-slate-800">Email</strong>{personalInfo.email}</div>}
            {personalInfo.phone && <div><strong className="block text-slate-800">Phone</strong>{personalInfo.phone}</div>}
            {personalInfo.location && <div><strong className="block text-slate-800">Location</strong>{personalInfo.location}</div>}
          </div>

          {links?.length > 0 && (
            <div className="border-t border-slate-200 pt-3 mt-3">
              <strong className="block text-[11px] text-slate-800 uppercase tracking-wider mb-1.5">Links</strong>
              <div className="space-y-1 text-[11px] text-blue-600">
                {links.map((l) => (
                  <a key={l.id} href={l.url} className="block hover:underline truncate">{l.platform}</a>
                ))}
              </div>
            </div>
          )}

          {skills?.length > 0 && (
            <div className="border-t border-slate-200 pt-3 mt-3">
              <strong className="block text-[11px] text-slate-800 uppercase tracking-wider mb-2" style={{ color: accentColor }}>Skills</strong>
              <div className="flex flex-wrap gap-1">
                {skills.map((s) => (
                  <span key={s.id} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700 font-medium">{s.name}</span>
                ))}
              </div>
            </div>
          )}

          {certifications && certifications.length > 0 && (
            <div className="border-t border-slate-200 pt-3 mt-3">
              <strong className="block text-[11px] text-slate-800 uppercase tracking-wider mb-2" style={{ color: accentColor }}>Certifications</strong>
              <div className="space-y-1 text-[10px] text-slate-700">
                {certifications.map((c) => (
                  <div key={c.id}>• <strong>{c.name}</strong></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="w-2/3 p-8">
        {personalInfo.summary && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-1.5 border-b border-slate-200" style={{ color: accentColor }}>About Me</h2>
            <p className="text-xs leading-relaxed text-slate-700">{personalInfo.summary}</p>
          </section>
        )}

        {experiences?.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2.5 border-b border-slate-200" style={{ color: accentColor }}>Experience</h2>
            <div className="space-y-3 text-xs">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{exp.role}</span>
                    <span className="text-[10px] text-slate-500 font-normal">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</span>
                  </div>
                  <div className="text-slate-600 font-medium mb-1">{exp.company}</div>
                  <ul className="list-disc ml-4 space-y-1 text-slate-700 leading-relaxed">
                    {exp.enhancedBullets?.length > 0 ? exp.enhancedBullets.map((b, i) => <li key={i}>{b}</li>) : <li>{exp.rawDetails}</li>}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {projects?.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b border-slate-200" style={{ color: accentColor }}>Projects</h2>
            <div className="space-y-2 text-xs">
              {projects.map((p) => (
                <div key={p.id}>
                  <span className="font-bold text-slate-900">{p.title}</span>
                  <p className="text-slate-700 text-xs mt-0.5">{p.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {education?.length > 0 && (
          <section className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b border-slate-200" style={{ color: accentColor }}>Education</h2>
            <div className="space-y-1.5 text-xs">
              {education.map((edu) => (
                <div key={edu.id} className="flex justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{edu.degree} in {edu.fieldOfStudy}</span>
                    <div className="text-slate-600 text-[11px]">{edu.institution}</div>
                  </div>
                  <span className="text-slate-500 text-xs">{edu.graduationYear}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {achievements && achievements.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b border-slate-200" style={{ color: accentColor }}>Honors</h2>
            <div className="space-y-1 text-xs">
              {achievements.map((a) => (
                <div key={a.id}>
                  <strong>{a.title}:</strong> {a.description}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

// 4. COMPACT ENGINEERING GRID
export const CompactTemplate: React.FC<TemplateProps> = ({ data, accentColor = '#0f172a' }) => {
  const { personalInfo, links, skills, experiences, education, projects, certifications, achievements } = data;
  return (
    <div
      id="resume-preview"
      className="w-full bg-white text-slate-900 p-6 sm:p-8 shadow-md rounded-lg max-w-[800px] mx-auto min-h-[1050px] font-sans text-xs print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none"
    >
      <div className="flex justify-between items-center border-b pb-3 mb-3 border-slate-300">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: accentColor }}>{personalInfo.fullName}</h1>
          <p className="text-xs font-semibold text-slate-700">{personalInfo.targetRole}</p>
        </div>
        <div className="text-right text-[11px] text-slate-600">
          <div>{personalInfo.email} • {personalInfo.phone}</div>
          <div>{personalInfo.location}</div>
          {links?.length > 0 && <div className="text-blue-600 font-mono">{links.map((l) => l.platform).join(' | ')}</div>}
        </div>
      </div>

      {personalInfo.summary && (
        <div className="mb-3">
          <p className="leading-snug text-slate-800">{personalInfo.summary}</p>
        </div>
      )}

      {skills?.length > 0 && (
        <div className="mb-3 border-t border-slate-200 pt-2">
          <strong className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Skills Matrix</strong>
          <p className="leading-relaxed font-mono text-[11px]">{skills.map((s) => s.name).join(' • ')}</p>
        </div>
      )}

      {experiences?.length > 0 && (
        <div className="mb-3 border-t border-slate-200 pt-2">
          <strong className="block text-[10px] uppercase font-bold text-slate-500 mb-2">Experience</strong>
          <div className="space-y-2.5">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between font-bold">
                  <span>{exp.role} <span className="font-normal text-slate-600">@ {exp.company}</span></span>
                  <span className="text-[10px] text-slate-500 font-mono">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</span>
                </div>
                <ul className="list-disc ml-4 space-y-0.5 leading-snug text-slate-800 mt-1">
                  {exp.enhancedBullets?.length > 0 ? exp.enhancedBullets.map((b, i) => <li key={i}>{b}</li>) : <li>{exp.rawDetails}</li>}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {projects?.length > 0 && (
        <div className="mb-3 border-t border-slate-200 pt-2">
          <strong className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Projects</strong>
          <div className="space-y-1.5">
            {projects.map((p) => (
              <div key={p.id}>
                <span className="font-bold">{p.title}</span> — <span className="text-slate-700">{p.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {education?.length > 0 && (
        <div className="border-t border-slate-200 pt-2">
          <strong className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Education</strong>
          {education.map((edu) => (
            <div key={edu.id} className="flex justify-between">
              <span><strong>{edu.degree} in {edu.fieldOfStudy}</strong> — {edu.institution}</span>
              <span className="font-mono text-[10px] text-slate-500">{edu.graduationYear}</span>
            </div>
          ))}
        </div>
      )}

      {certifications && certifications.length > 0 && (
        <div className="border-t border-slate-200 pt-2 mt-3">
          <strong className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Certifications</strong>
          <div className="font-mono text-[11px] text-slate-700">
            {certifications.map((c) => c.name).join(' • ')}
          </div>
        </div>
      )}
    </div>
  );
};

// 5. PURE MINIMALIST
export const MinimalTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, skills, experiences, education, projects, certifications } = data;
  return (
    <div
      id="resume-preview"
      className="w-full bg-white text-zinc-900 p-8 sm:p-12 shadow-md rounded-lg max-w-[800px] mx-auto min-h-[1050px] font-sans print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none"
    >
      <header className="mb-6">
        <h1 className="text-4xl font-light tracking-tight">{personalInfo.fullName}</h1>
        <p className="text-xs uppercase tracking-widest text-zinc-500 mt-1">{personalInfo.targetRole}</p>
        <p className="text-xs text-zinc-400 mt-2">{personalInfo.email} / {personalInfo.phone} / {personalInfo.location}</p>
      </header>

      {personalInfo.summary && (
        <div className="mb-6">
          <p className="text-xs leading-relaxed text-zinc-600">{personalInfo.summary}</p>
        </div>
      )}

      {experiences?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[10px] uppercase tracking-widest text-zinc-400 mb-3">Experience</h2>
          <div className="space-y-4 text-xs">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between text-zinc-900 font-medium">
                  <span>{exp.role}, {exp.company}</span>
                  <span className="text-zinc-400 text-[11px]">{exp.startDate} – {exp.isCurrent ? 'Now' : exp.endDate}</span>
                </div>
                <ul className="list-none space-y-1 text-zinc-600 mt-1 pl-2 border-l border-zinc-200">
                  {exp.enhancedBullets?.length > 0 ? exp.enhancedBullets.map((b, i) => <li key={i}>{b}</li>) : <li>{exp.rawDetails}</li>}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {skills?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Expertise</h2>
          <p className="text-xs text-zinc-600 leading-relaxed">{skills.map((s) => s.name).join(' / ')}</p>
        </div>
      )}

      {projects?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Projects</h2>
          <div className="space-y-2 text-xs text-zinc-600">
            {projects.map((p) => (
              <div key={p.id}>
                <strong className="text-zinc-900">{p.title}:</strong> {p.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {education?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Education</h2>
          {education.map((edu) => (
            <div key={edu.id} className="text-xs flex justify-between text-zinc-600">
              <span>{edu.degree} in {edu.fieldOfStudy}, {edu.institution}</span>
              <span className="text-zinc-400">{edu.graduationYear}</span>
            </div>
          ))}
        </div>
      )}

      {certifications && certifications.length > 0 && (
        <div>
          <h2 className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Certifications</h2>
          <p className="text-xs text-zinc-600 leading-relaxed">{certifications.map((c) => c.name).join(' / ')}</p>
        </div>
      )}
    </div>
  );
};

// 6. CORPORATE BANNER
export const CorporateTemplate: React.FC<TemplateProps> = ({ data, accentColor = '#0f172a' }) => {
  const { personalInfo, skills, experiences, education, certifications } = data;
  return (
    <div
      id="resume-preview"
      className="w-full bg-white text-slate-800 shadow-md rounded-lg max-w-[800px] mx-auto min-h-[1050px] font-sans print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none"
    >
      <div className="p-8 text-white flex justify-between items-center" style={{ backgroundColor: accentColor }}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{personalInfo.fullName}</h1>
          <p className="text-sm text-slate-200 mt-1">{personalInfo.targetRole}</p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300 mt-2">
            <span>{personalInfo.email}</span>
            <span>• {personalInfo.phone}</span>
            <span>• {personalInfo.location}</span>
          </div>
        </div>
        {personalInfo.showPhoto && personalInfo.photoUrl && (
          <AvatarImg url={personalInfo.photoUrl} name={personalInfo.fullName} size="w-20 h-20" />
        )}
      </div>

      <div className="p-8 space-y-5">
        {personalInfo.summary && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">Executive Summary</h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{personalInfo.summary}</p>
          </section>
        )}

        {experiences?.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1 mb-3">Work History</h2>
            <div className="space-y-3 text-xs sm:text-sm">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between font-bold">
                    <span>{exp.role}</span>
                    <span className="text-xs text-slate-500 font-normal">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-600 mb-1">{exp.company}</div>
                  <ul className="list-disc ml-4 space-y-1 text-slate-700">
                    {exp.enhancedBullets?.length > 0 ? exp.enhancedBullets.map((b, i) => <li key={i}>{b}</li>) : <li>{exp.rawDetails}</li>}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {skills?.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">Core Competencies</h2>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span key={s.id} className="text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded font-medium border border-slate-200">{s.name}</span>
              ))}
            </div>
          </section>
        )}

        {education?.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">Education & Credentials</h2>
            <div className="space-y-1 text-xs">
              {education.map((edu) => (
                <div key={edu.id} className="flex justify-between">
                  <span><strong>{edu.degree} in {edu.fieldOfStudy}</strong> — {edu.institution}</span>
                  <span className="text-slate-500">{edu.graduationYear}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {certifications && certifications.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">Certifications</h2>
            <div className="space-y-1 text-xs">
              {certifications.map((c) => (
                <div key={c.id}><strong>{c.name}</strong> — {c.issuer}</div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

// 7. LINEAR TIMELINE
export const TimelineTemplate: React.FC<TemplateProps> = ({ data, accentColor = '#2563eb' }) => {
  const { personalInfo, skills, experiences, education, certifications } = data;
  return (
    <div
      id="resume-preview"
      className="w-full bg-white text-slate-800 p-8 sm:p-12 shadow-md rounded-lg max-w-[800px] mx-auto min-h-[1050px] font-sans print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none"
    >
      <header className="mb-6 pb-4 border-b">
        <h1 className="text-3xl font-extrabold" style={{ color: accentColor }}>{personalInfo.fullName}</h1>
        <p className="text-sm font-semibold text-slate-600 mt-0.5">{personalInfo.targetRole}</p>
        <p className="text-xs text-slate-500 mt-1">{personalInfo.email} • {personalInfo.phone} • {personalInfo.location}</p>
      </header>

      {personalInfo.summary && (
        <section className="mb-6">
          <p className="text-xs leading-relaxed text-slate-700">{personalInfo.summary}</p>
        </section>
      )}

      {experiences?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: accentColor }}>Career Timeline</h2>
          <div className="relative pl-6 border-l-2 space-y-4" style={{ borderColor: accentColor }}>
            {experiences.map((exp) => (
              <div key={exp.id} className="relative text-xs sm:text-sm">
                <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-white border-2" style={{ borderColor: accentColor }} />
                <div className="font-bold text-slate-900">{exp.role} <span className="font-normal text-slate-500">at {exp.company}</span></div>
                <div className="text-[11px] text-slate-400 mb-1">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</div>
                <ul className="list-disc ml-4 space-y-1 text-slate-700">
                  {exp.enhancedBullets?.length > 0 ? exp.enhancedBullets.map((b, i) => <li key={i}>{b}</li>) : <li>{exp.rawDetails}</li>}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {skills?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>Skills Overview</h2>
          <p className="text-xs text-slate-700 leading-relaxed">{skills.map((s) => s.name).join(' • ')}</p>
        </section>
      )}

      {education?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>Education</h2>
          {education.map((edu) => (
            <div key={edu.id} className="text-xs flex justify-between">
              <span><strong>{edu.degree} in {edu.fieldOfStudy}</strong> — {edu.institution}</span>
              <span className="text-slate-500">{edu.graduationYear}</span>
            </div>
          ))}
        </section>
      )}

      {certifications && certifications.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>Certifications</h2>
          <div className="text-xs text-slate-700 space-y-0.5">
            {certifications.map((c) => (
              <div key={c.id}><strong>{c.name}</strong> ({c.issuer})</div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// 8. ACADEMIC & LEGAL
export const AcademicTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, skills, experiences, education, certifications, achievements } = data;
  return (
    <div
      id="resume-preview"
      className="w-full bg-white text-black p-10 sm:p-14 shadow-md rounded-lg max-w-[800px] mx-auto min-h-[1050px] font-serif leading-normal print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none"
    >
      <div className="text-center pb-4 mb-4 border-b">
        <h1 className="text-2xl font-bold uppercase tracking-wider">{personalInfo.fullName}</h1>
        <p className="text-xs italic mt-0.5">{personalInfo.targetRole}</p>
        <p className="text-xs mt-1">{personalInfo.email} | {personalInfo.phone} | {personalInfo.location}</p>
      </div>

      {personalInfo.summary && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b pb-0.5 mb-1.5">Statement</h2>
          <p className="text-xs text-justify">{personalInfo.summary}</p>
        </div>
      )}

      {education?.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b pb-0.5 mb-2">Education & Qualifications</h2>
          <div className="space-y-1 text-xs">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between">
                <span><strong>{edu.degree} in {edu.fieldOfStudy}</strong>, {edu.institution}</span>
                <span>{edu.graduationYear}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {experiences?.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b pb-0.5 mb-2">Appointments & Experience</h2>
          <div className="space-y-3 text-xs">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between font-bold">
                  <span>{exp.role}, {exp.company}</span>
                  <span>{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</span>
                </div>
                <ul className="list-disc ml-5 space-y-0.5 mt-0.5">
                  {exp.enhancedBullets?.length > 0 ? exp.enhancedBullets.map((b, i) => <li key={i}>{b}</li>) : <li>{exp.rawDetails}</li>}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {certifications && certifications.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b pb-0.5 mb-1.5">Certifications & Bar Memberships</h2>
          <p className="text-xs">{certifications.map((c) => `${c.name} (${c.issuer})`).join('; ')}</p>
        </div>
      )}

      {skills?.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest border-b pb-0.5 mb-1.5">Competencies</h2>
          <p className="text-xs">{skills.map((s) => s.name).join('; ')}</p>
        </div>
      )}
    </div>
  );
};

// 9. BOLD CREATIVE DESIGNER
export const CreativeTemplate: React.FC<TemplateProps> = ({ data, accentColor = '#7c3aed' }) => {
  const { personalInfo, skills, experiences, education, certifications, achievements } = data;
  return (
    <div
      id="resume-preview"
      className="w-full bg-white text-slate-900 p-8 sm:p-12 shadow-md rounded-lg max-w-[800px] mx-auto min-h-[1050px] font-sans print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none"
    >
      <header className="flex justify-between items-start mb-8 pb-6 border-b-4" style={{ borderColor: accentColor }}>
        <div>
          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded text-white tracking-widest" style={{ backgroundColor: accentColor }}>
            Resume
          </span>
          <h1 className="text-4xl font-black tracking-tight mt-1">{personalInfo.fullName}</h1>
          <p className="text-sm font-bold text-slate-500">{personalInfo.targetRole}</p>
          <div className="flex gap-3 text-xs text-slate-500 mt-2">
            <span>{personalInfo.email}</span>
            <span>{personalInfo.phone}</span>
            <span>{personalInfo.location}</span>
          </div>
        </div>
        {personalInfo.showPhoto && personalInfo.photoUrl && (
          <AvatarImg url={personalInfo.photoUrl} name={personalInfo.fullName} size="w-24 h-24" />
        )}
      </header>

      {personalInfo.summary && (
        <section className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 italic">{personalInfo.summary}</p>
        </section>
      )}

      {experiences?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} /> Experience
          </h2>
          <div className="space-y-4 text-xs sm:text-sm">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-900">{exp.role} — <span className="font-normal text-slate-600">{exp.company}</span></span>
                  <span className="text-xs text-slate-400">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</span>
                </div>
                <ul className="list-disc ml-4 space-y-1 text-slate-700 mt-1">
                  {exp.enhancedBullets?.length > 0 ? exp.enhancedBullets.map((b, i) => <li key={i}>{b}</li>) : <li>{exp.rawDetails}</li>}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {skills?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-black uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} /> Skills & Tools
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span key={s.id} className="text-xs px-3 py-1 rounded-full bg-slate-100 font-semibold text-slate-800 border border-slate-200">{s.name}</span>
            ))}
          </div>
        </section>
      )}

      {education?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-black uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} /> Education
          </h2>
          {education.map((edu) => (
            <div key={edu.id} className="text-xs flex justify-between">
              <span><strong>{edu.degree} in {edu.fieldOfStudy}</strong>, {edu.institution}</span>
              <span className="text-slate-500">{edu.graduationYear}</span>
            </div>
          ))}
        </section>
      )}

      {achievements && achievements.length > 0 && (
        <section>
          <h2 className="text-sm font-black uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} /> Honors
          </h2>
          <div className="space-y-1 text-xs">
            {achievements.map((a) => (
              <div key={a.id}><strong>{a.title}:</strong> {a.description}</div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// 10. MEDICAL & CLINICAL HEALTHCARE
export const MedicalTemplate: React.FC<TemplateProps> = ({ data, accentColor = '#059669' }) => {
  const { personalInfo, skills, experiences, education, certifications } = data;
  return (
    <div
      id="resume-preview"
      className="w-full bg-white text-slate-900 p-8 sm:p-12 shadow-md rounded-lg max-w-[800px] mx-auto min-h-[1050px] font-sans print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none"
    >
      <header className="border-b-2 pb-5 mb-5 flex justify-between items-center" style={{ borderColor: accentColor }}>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">{personalInfo.fullName}</h1>
          <p className="text-sm font-bold mt-0.5" style={{ color: accentColor }}>{personalInfo.targetRole}</p>
          <div className="flex flex-wrap gap-x-4 text-xs text-slate-600 mt-2">
            <span>{personalInfo.email}</span>
            <span>• {personalInfo.phone}</span>
            <span>• {personalInfo.location}</span>
          </div>
        </div>
        {personalInfo.showPhoto && personalInfo.photoUrl && (
          <AvatarImg url={personalInfo.photoUrl} name={personalInfo.fullName} size="w-20 h-20" />
        )}
      </header>

      {personalInfo.summary && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: accentColor }}>Clinical Practice & Profile</h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700">{personalInfo.summary}</p>
        </section>
      )}

      {experiences?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: accentColor }}>Clinical Residencies & Hospital Appointments</h2>
          <div className="space-y-3.5 text-xs sm:text-sm">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{exp.role}</span>
                  <span className="text-xs text-slate-500 font-normal">{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}</span>
                </div>
                <div className="text-xs font-medium text-slate-600 mb-1">{exp.company}</div>
                <ul className="list-disc ml-4 space-y-1 text-slate-700">
                  {exp.enhancedBullets?.length > 0 ? exp.enhancedBullets.map((b, i) => <li key={i}>{b}</li>) : <li>{exp.rawDetails}</li>}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {skills?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>Clinical Skills & Certifications</h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span key={s.id} className="text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded font-medium">{s.name}</span>
            ))}
          </div>
        </section>
      )}

      {education?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>Medical Education & Degrees</h2>
          {education.map((edu) => (
            <div key={edu.id} className="text-xs flex justify-between">
              <span><strong>{edu.degree} in {edu.fieldOfStudy}</strong> — {edu.institution}</span>
              <span className="text-slate-500">{edu.graduationYear}</span>
            </div>
          ))}
        </section>
      )}

      {certifications && certifications.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>Board Certifications & Licensure</h2>
          <div className="space-y-1 text-xs">
            {certifications.map((c) => (
              <div key={c.id}><strong>{c.name}</strong> — {c.issuer}</div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};