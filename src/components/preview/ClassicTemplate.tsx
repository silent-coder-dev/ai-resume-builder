'use client';

import React from 'react';
import { ResumeData } from '@/types/resume';

interface ClassicTemplateProps {
  data: ResumeData;
  accentColor?: string;
}

export const ClassicTemplate: React.FC<ClassicTemplateProps> = ({
  data,
  accentColor = '#0f172a',
}) => {
  const { personalInfo, links, skills, experiences, education, projects } = data;

  return (
    <div
      id="resume-preview"
      className="w-full bg-white text-slate-900 p-8 sm:p-12 shadow-md rounded-lg max-w-[800px] mx-auto min-h-[1050px] transition-all duration-300 print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none"
      style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
    >
      {/* Header */}
      <header className="text-center pb-4 mb-5 border-b-2" style={{ borderColor: accentColor }}>
        <h1 className="text-3xl font-bold tracking-wide uppercase" style={{ color: accentColor }}>
          {personalInfo.fullName || 'Your Full Name'}
        </h1>
        <p className="text-sm italic text-slate-700 mt-1 font-serif">
          {personalInfo.targetRole || 'Target Professional Role'}
        </p>

        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-2.5">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo.location && <span>• {personalInfo.location}</span>}
        </div>

        {links && links.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-3 text-xs mt-1.5 text-blue-800">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                target="_blank"
                rel="noreferrer"
                className="hover:underline font-medium"
              >
                {link.platform}: {link.url.replace(/^https?:\/\//, '')}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Summary */}
      {personalInfo.summary && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2 font-sans"
            style={{ color: accentColor }}
          >
            Executive Summary
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-800 italic">
            {personalInfo.summary}
          </p>
        </section>
      )}

      {/* Experience */}
      {experiences && experiences.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-3 font-sans"
            style={{ color: accentColor }}
          >
            Professional Experience
          </h2>
          <div className="space-y-3.5">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline text-xs sm:text-sm">
                  <span className="font-bold text-slate-900">{exp.role}</span>
                  <span className="text-xs text-slate-600 italic">
                    {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-700 italic mb-1">
                  {exp.company}
                </div>
                <ul className="list-disc ml-5 space-y-1 text-slate-800 text-xs sm:text-sm leading-relaxed">
                  {exp.enhancedBullets && exp.enhancedBullets.length > 0 ? (
                    exp.enhancedBullets.map((bullet, idx) => <li key={idx}>{bullet}</li>)
                  ) : (
                    <li>{exp.rawDetails || 'Responsibilities handled at position.'}</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills - Clean Bullet Separation Without Proficiency */}
      {skills && skills.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2 font-sans"
            style={{ color: accentColor }}
          >
            Areas of Expertise & Skills
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-800 font-sans">
            {skills.map((s, idx) => (
              <span key={s.id}>
                <span className="font-medium">{s.name}</span>
                {idx < skills.length - 1 ? ' • ' : ''}
              </span>
            ))}
          </p>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2.5 font-sans"
            style={{ color: accentColor }}
          >
            Selected Key Projects
          </h2>
          <div className="space-y-2.5">
            {projects.map((proj) => (
              <div key={proj.id} className="text-xs sm:text-sm">
                <div className="font-bold text-slate-900">{proj.title}</div>
                {proj.techStack && proj.techStack.length > 0 && (
                  <p className="text-[11px] text-slate-600 italic">
                    Technologies: {proj.techStack.join(', ')}
                  </p>
                )}
                <p className="text-xs leading-relaxed text-slate-800 mt-0.5">
                  {proj.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section className="mb-4">
          <h2
            className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2 font-sans"
            style={{ color: accentColor }}
          >
            Education
          </h2>
          <div className="space-y-1.5">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline text-xs sm:text-sm">
                <div>
                  <span className="font-bold text-slate-900">{edu.degree} in {edu.fieldOfStudy}</span>
                  <span className="text-xs text-slate-600"> — {edu.institution}</span>
                </div>
                <span className="text-xs text-slate-600 italic">{edu.graduationYear}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};