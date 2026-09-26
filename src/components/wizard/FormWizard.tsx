'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useResumeStore } from '@/store/useResumeStore';
import {
  User,
  Sparkles,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Award,
  Trophy,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Globe,
} from 'lucide-react';

interface FormWizardProps {
  onSwitchToPreview?: () => void;
}

const STEPS = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
];

export const FormWizard: React.FC<FormWizardProps> = ({ onSwitchToPreview }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [enhancingIndex, setEnhancingIndex] = useState<number | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const navScrollRef = useRef<HTMLDivElement>(null);

  const {
    resumeData,
    updatePersonalInfo,
    addLink,
    removeLink,
    updateLink,
    addSkill,
    removeSkill,
    addExperience,
    removeExperience,
    updateExperience,
    addProject,
    removeProject,
    updateProject,
    addEducation,
    removeEducation,
    updateEducation,
    addCertification,
    removeCertification,
    addAchievement,
    removeAchievement,
  } = useResumeStore();

  const scrollNav = (direction: 'left' | 'right') => {
    if (navScrollRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      navScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-summary',
          payload: {
            targetRole: resumeData.personalInfo.targetRole,
            yearsOfExperience: resumeData.personalInfo.yearsOfExperience,
            experienceField: resumeData.personalInfo.experienceField,
            skills: resumeData.skills,
            education: resumeData.education,
          },
        }),
      });
      const data = await res.json();
      if (data.result) {
        updatePersonalInfo('summary', data.result);
      }
    } catch (err) {
      console.error('Summary generation failed:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleEnhanceExperience = async (index: number) => {
    const exp = resumeData.experiences[index];
    if (!exp || !exp.rawDetails.trim()) return;

    setEnhancingIndex(index);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enhance-experience',
          payload: {
            company: exp.company,
            role: exp.role,
            rawDetails: exp.rawDetails,
            targetRole: resumeData.personalInfo.targetRole,
          },
        }),
      });
      const data = await res.json();
      if (data.result && Array.isArray(data.result)) {
        updateExperience(exp.id, { enhancedBullets: data.result });
      }
    } catch (err) {
      console.error('Experience enhancement failed:', err);
    } finally {
      setEnhancingIndex(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Sliding Navigation Bar */}
      <div className="p-2 sm:p-2.5 bg-slate-50/90 border-b border-slate-200/90 flex items-center gap-1 relative select-none">
        <button
          type="button"
          onClick={() => scrollNav('left')}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition shrink-0 cursor-pointer hidden sm:flex items-center justify-center"
          title="Scroll Left"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div
          ref={navScrollRef}
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-none px-1 py-0.5 scroll-smooth flex-1"
        >
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === idx;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-wizard-pill"
                    className="absolute inset-0 bg-blue-600 rounded-xl shadow-xs"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{step.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollNav('right')}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition shrink-0 cursor-pointer hidden sm:flex items-center justify-center"
          title="Scroll Right"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <div className="shrink-0 pl-1 border-l border-slate-200 hidden md:block">
          <span className="text-[10px] font-mono font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200">
            {activeStep + 1}/{STEPS.length}
          </span>
        </div>
      </div>

      {/* Form Step Body */}
      <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
        {/* 1. PERSONAL INFO & CLICKABLE LINKS */}
        {activeStep === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={resumeData.personalInfo.fullName}
                  onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                  placeholder="e.g. Satyam Singh"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Target Role / Job Title
                </label>
                <input
                  type="text"
                  value={resumeData.personalInfo.targetRole}
                  onChange={(e) => updatePersonalInfo('targetRole', e.target.value)}
                  placeholder="e.g. Java Backend Engineer"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={resumeData.personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={resumeData.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.location}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  placeholder="City, Country"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Clickable Profile Links Section */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Clickable Links (GitHub, LinkedIn, Portfolio, etc.)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    addLink({
                      id: Date.now().toString(),
                      platform: 'GitHub',
                      url: '',
                    })
                  }
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-blue-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Link</span>
                </button>
              </div>

              {(!resumeData.links || resumeData.links.length === 0) && (
                <p className="text-[11px] text-slate-400 italic">
                  No links added yet. Click &quot;Add Link&quot; to show clickable links on your resume.
                </p>
              )}

              <div className="space-y-2">
                {(resumeData.links || []).map((link) => (
                  <div key={link.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Label (e.g. GitHub, LinkedIn)"
                      value={link.platform}
                      onChange={(e) => updateLink(link.id, { platform: e.target.value })}
                      className="w-28 text-xs p-2 border border-slate-200 rounded-xl bg-white outline-none font-semibold shrink-0"
                    />
                    <input
                      type="text"
                      placeholder="URL (e.g. https://github.com/username)"
                      value={link.url}
                      onChange={(e) => updateLink(link.id, { url: e.target.value })}
                      className="flex-1 text-xs p-2 border border-slate-200 rounded-xl bg-white outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(link.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                      title="Remove Link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Professional Summary */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Professional Summary
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingSummary ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                  )}
                  <span>AI Generate</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={resumeData.personalInfo.summary}
                onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                placeholder="Brief summary of your professional expertise..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* 2. SKILLS */}
        {activeStep === 1 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Technical & Core Skills</span>
              <button
                type="button"
                onClick={() =>
                  addSkill({ id: Date.now().toString(), name: '', level: 'Professional' })
                }
                className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill</span>
              </button>
            </div>

            <div className="space-y-2">
              {resumeData.skills.map((skill) => (
                <div key={skill.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={skill.name}
                    placeholder="e.g. Java 21, Spring Boot, Docker, PostgreSQL"
                    onChange={(e) => {
                      const updated = resumeData.skills.map((s) =>
                        s.id === skill.id ? { ...s, name: e.target.value } : s
                      );
                      useResumeStore.setState({
                        resumeData: { ...resumeData, skills: updated },
                      });
                    }}
                    className="flex-1 text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeSkill(skill.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. WORK EXPERIENCE */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Work Experience</span>
              <button
                type="button"
                onClick={() =>
                  addExperience({
                    id: Date.now().toString(),
                    company: '',
                    role: '',
                    startDate: '',
                    endDate: '',
                    isCurrent: false,
                    rawDetails: '',
                    enhancedBullets: [],
                  })
                }
                className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Position</span>
              </button>
            </div>

            {resumeData.experiences.map((exp, idx) => (
              <div key={exp.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex justify-between items-start">
                  <div className="grid grid-cols-2 gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                      className="text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Job Title / Role"
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                      className="text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none font-semibold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExperience(exp.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Start (e.g. 2022)"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                    className="p-2 border border-slate-200 rounded-lg bg-white outline-none text-xs"
                  />
                  <input
                    type="text"
                    placeholder="End (or 'Present')"
                    value={exp.endDate}
                    onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                    className="p-2 border border-slate-200 rounded-lg bg-white outline-none text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-600">Your Rough Notes:</span>
                    <button
                      type="button"
                      onClick={() => handleEnhanceExperience(idx)}
                      disabled={enhancingIndex === idx || !exp.rawDetails.trim()}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50 cursor-pointer"
                    >
                      {enhancingIndex === idx ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-yellow-500" />
                      )}
                      <span>AI Enhance (Google X-Y-Z)</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={exp.rawDetails}
                    placeholder="Describe what you built, architecture, technologies used..."
                    onChange={(e) => updateExperience(exp.id, { rawDetails: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none"
                  />
                </div>

                {exp.enhancedBullets && exp.enhancedBullets.length > 0 && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> AI Enhanced Bullets
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      {exp.enhancedBullets.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 4. KEY PROJECTS */}
        {activeStep === 3 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Key Projects</span>
              <button
                type="button"
                onClick={() =>
                  addProject({
                    id: Date.now().toString(),
                    title: '',
                    techStack: [],
                    description: '',
                  })
                }
                className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </button>
            </div>

            {resumeData.projects.map((proj) => (
              <div key={proj.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    placeholder="Project Title"
                    value={proj.title}
                    onChange={(e) => updateProject(proj.id, { title: e.target.value })}
                    className="text-xs p-2 border border-slate-200 rounded-lg bg-white flex-1 mr-2 outline-none font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => removeProject(proj.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Tech Stack (comma separated: Java 21, Spring Boot, Docker)"
                  value={(proj.techStack || []).join(', ')}
                  onChange={(e) =>
                    updateProject(proj.id, {
                      techStack: e.target.value.split(',').map((s) => s.trim()),
                    })
                  }
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none"
                />

                <textarea
                  rows={2}
                  placeholder="What problem did it solve? What metrics did you achieve?"
                  value={proj.description}
                  onChange={(e) => updateProject(proj.id, { description: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none"
                />
              </div>
            ))}
          </div>
        )}

        {/* 5. EDUCATION */}
        {activeStep === 4 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Education Details</span>
              <button
                type="button"
                onClick={() =>
                  addEducation({
                    id: Date.now().toString(),
                    institution: '',
                    degree: '',
                    fieldOfStudy: '',
                    graduationYear: '',
                    scoreOrGpa: '',
                  })
                }
                className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Education</span>
              </button>
            </div>

            {resumeData.education.map((edu) => (
              <div key={edu.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    placeholder="Degree (e.g. B.Tech in Computer Science)"
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                    className="text-xs p-2 border border-slate-200 rounded-lg bg-white flex-1 mr-2 outline-none font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => removeEducation(edu.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="University / College"
                    value={edu.institution}
                    onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                    className="text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Graduation Year (e.g. 2024)"
                    value={edu.graduationYear}
                    onChange={(e) => updateEducation(edu.id, { graduationYear: e.target.value })}
                    className="text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. CERTIFICATIONS */}
        {activeStep === 5 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Certifications</span>
              <button
                type="button"
                onClick={() =>
                  addCertification({
                    id: Date.now().toString(),
                    name: '',
                    issuer: '',
                  })
                }
                className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Certification</span>
              </button>
            </div>
            {(resumeData.certifications || []).map((cert) => (
              <div key={cert.id} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Certification Name"
                  value={cert.name}
                  onChange={(e) => {
                    const updated = (resumeData.certifications || []).map((c) =>
                      c.id === cert.id ? { ...c, name: e.target.value } : c
                    );
                    useResumeStore.setState({
                      resumeData: { ...resumeData, certifications: updated },
                    });
                  }}
                  className="flex-1 text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                />
                <input
                  type="text"
                  placeholder="Issuer"
                  value={cert.issuer}
                  onChange={(e) => {
                    const updated = (resumeData.certifications || []).map((c) =>
                      c.id === cert.id ? { ...c, issuer: e.target.value } : c
                    );
                    useResumeStore.setState({
                      resumeData: { ...resumeData, certifications: updated },
                    });
                  }}
                  className="w-36 text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeCertification(cert.id)}
                  className="p-2 text-slate-400 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 7. ACHIEVEMENTS */}
        {activeStep === 6 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Key Achievements</span>
              <button
                type="button"
                onClick={() =>
                  addAchievement({
                    id: Date.now().toString(),
                    title: '',
                    description: '',
                  })
                }
                className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Achievement</span>
              </button>
            </div>
            {(resumeData.achievements || []).map((ach) => (
              <div key={ach.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    placeholder="Achievement Title"
                    value={ach.title}
                    onChange={(e) => {
                      const updated = (resumeData.achievements || []).map((a) =>
                        a.id === ach.id ? { ...a, title: e.target.value } : a
                      );
                      useResumeStore.setState({
                        resumeData: { ...resumeData, achievements: updated },
                      });
                    }}
                    className="text-xs p-2 border border-slate-200 rounded-lg bg-white flex-1 mr-2 outline-none font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => removeAchievement(ach.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Details / Description"
                  value={ach.description}
                  onChange={(e) => {
                    const updated = (resumeData.achievements || []).map((a) =>
                      a.id === ach.id ? { ...a, description: e.target.value } : a
                    );
                    useResumeStore.setState({
                      resumeData: { ...resumeData, achievements: updated },
                    });
                  }}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <button
          type="button"
          disabled={activeStep === 0}
          onClick={() => setActiveStep((p) => p - 1)}
          className="px-3 py-1.5 border border-slate-200 text-slate-600 disabled:opacity-30 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        {onSwitchToPreview && (
          <button
            type="button"
            onClick={onSwitchToPreview}
            className="lg:hidden px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Preview Canvas
          </button>
        )}

        <button
          type="button"
          disabled={activeStep === STEPS.length - 1}
          onClick={() => setActiveStep((p) => p + 1)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};