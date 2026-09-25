'use client';

import React from 'react';
import { ResumeData } from '@/types/resume';
import { Mail, Phone, MapPin, Globe, ExternalLink } from 'lucide-react';

interface ModernTemplateProps {
  data: ResumeData;
  accentColor?: string;
}

export const ModernTemplate: React.FC<ModernTemplateProps> = ({
  data,
  accentColor = '#2563eb',
}) => {
  const { personalInfo, links, skills, experiences, education, projects } = data;

  return (
    <div
      id="resume-preview"
      className="w-full bg-white text-slate-800 p-8 sm:p-12 shadow-md rounded-lg max-w-[800px] mx-auto min-h-[1050px] transition-all duration-300 print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none"
      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
    >
      {/* Header Section */}
      <header className="border-b pb-5 mb-5 border-slate-200">
        <h1
          className="text-3xl sm:text-4xl font-extrabold tracking-tight"
          style={{ color: accentColor }}
        >
          {personalInfo.fullName || 'Your Full Name'}
        </h1>
        <p className="text-base sm:text-lg font-medium text-slate-600 mt-1">
          {personalInfo.targetRole || 'Target Professional Role'}
        </p>

        {/* Contact Strip */}
        <div className="flex flex-wrap gap-y-1.5 gap-x-4 text-xs sm:text-sm text-slate-500 mt-3.5">
          {personalInfo.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {personalInfo.email}
            </span>
          )}
          {personalInfo.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              {personalInfo.phone}
            </span>
          )}
          {personalInfo.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {personalInfo.location}
            </span>
          )}
        </div>

        {/* Links */}
        {links && links.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 mt-2.5">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:underline text-blue-600 font-medium"
              >
                <Globe className="w-3 h-3" />
                {link.platform || 'Link'}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Professional Summary */}
      {personalInfo.summary && (
        <section className="mb-6">
          <h2
            className="text-xs font-bold uppercase tracking-wider mb-2"
            style={{ color: accentColor }}
          >
            Professional Summary
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
            {personalInfo.summary}
          </p>
        </section>
      )}

      {/* Skills Section - Clean Tags Without Proficiency */}
      {skills && skills.length > 0 && (
        <section className="mb-6">
          <h2
            className="text-xs font-bold uppercase tracking-wider mb-2.5"
            style={{ color: accentColor }}
          >
            Technical & Professional Skills
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center px-2.5 py-1 rounded text-xs bg-slate-100 text-slate-800 border border-slate-200 font-medium"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Experience Section */}
      {experiences && experiences.length > 0 && (
        <section className="mb-6">
          <h2
            className="text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: accentColor }}
          >
            Work Experience
          </h2>
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id} className="text-xs sm:text-sm">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-bold text-slate-900">{exp.role}</span>
                  <span className="text-xs text-slate-500 font-medium">
                    {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-600 mb-1.5">
                  {exp.company}
                </div>
                <ul className="list-disc ml-4 space-y-1 text-slate-700 text-xs sm:text-sm leading-relaxed">
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

      {/* Projects Section */}
      {projects && projects.length > 0 && (
        <section className="mb-6">
          <h2
            className="text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: accentColor }}
          >
            Featured Projects
          </h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id} className="text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{proj.title}</span>
                  {proj.liveUrl && (
                    <a
                      href={proj.liveUrl.startsWith('http') ? proj.liveUrl : `https://${proj.liveUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 hover:text-blue-700 inline-flex items-center"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {proj.techStack && proj.techStack.length > 0 && (
                  <p className="text-[11px] text-slate-500 font-medium my-0.5">
                    Stack: {proj.techStack.join(' • ')}
                  </p>
                )}
                <p className="text-xs leading-relaxed text-slate-700 mt-1">
                  {proj.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education Section */}
      {education && education.length > 0 && (
        <section className="mb-6">
          <h2
            className="text-xs font-bold uppercase tracking-wider mb-2.5"
            style={{ color: accentColor }}
          >
            Education
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline text-xs sm:text-sm">
                <div>
                  <span className="font-bold text-slate-800">
                    {edu.degree} in {edu.fieldOfStudy}
                  </span>
                  <div className="text-xs text-slate-600">{edu.institution}</div>
                </div>
                <div className="text-right text-xs text-slate-500 font-medium">
                  {edu.graduationYear}
                  {edu.scoreOrGpa && <div className="text-[11px] text-slate-400">{edu.scoreOrGpa}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};