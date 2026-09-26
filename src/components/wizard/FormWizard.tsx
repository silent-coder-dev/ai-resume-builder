'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useResumeStore } from '@/store/useResumeStore';
import { SkillLevel, ExperienceItem } from '@/types/resume';
import {
  Sparkles,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  Award,
  Trophy,
  Eye,
} from 'lucide-react';

const STEPS = [
  'Target & Info',
  'Skills',
  'Links',
  'Experience',
  'Education & Projects',
  'Certifications & Honors (Optional)',
];

interface FormWizardProps {
  onSwitchToPreview?: () => void;
}

export const FormWizard: React.FC<FormWizardProps> = ({ onSwitchToPreview }) => {
  const {
    resumeData,
    activeStep,
    setActiveStep,
    updatePersonalInfo,
    addLink,
    removeLink,
    addSkill,
    removeSkill,
    addExperience,
    removeExperience,
    updateExperience,
    setEnhancedBullets,
    addEducation,
    removeEducation,
    updateEducation,
    addProject,
    removeProject,
    updateProject,
    addCertification,
    removeCertification,
    updateCertification,
    addAchievement,
    removeAchievement,
    updateAchievement,
  } = useResumeStore();

  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [enhancingExpId, setEnhancingExpId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('Intermediate');
  const [newLinkPlatform, setNewLinkPlatform] = useState('GitHub');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const handleGenerateSummary = async () => {
    setErrorMessage(null);
    try {
      setIsGeneratingSummary(true);
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
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      if (data.result) {
        updatePersonalInfo('summary', data.result);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to call Gemini API');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleEnhanceExperience = async (exp: ExperienceItem) => {
    if (!exp.rawDetails.trim()) return;
    setErrorMessage(null);

    try {
      setEnhancingExpId(exp.id);
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
      if (!res.ok) throw new Error(data.error || 'Failed to enhance');
      if (Array.isArray(data.result) && data.result.length > 0) {
        setEnhancedBullets(exp.id, data.result);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to call Gemini API');
    } finally {
      setEnhancingExpId(null);
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    addSkill({
      id: Date.now().toString(),
      name: newSkillName.trim(),
      level: newSkillLevel,
    });
    setNewSkillName('');
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkUrl.trim()) return;
    addLink({
      id: Date.now().toString(),
      platform: newLinkPlatform,
      url: newLinkUrl.trim(),
    });
    setNewLinkUrl('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 flex flex-col h-auto lg:h-full relative overflow-hidden">
      {/* Scrollable Form Body */}
      <div className="p-4 sm:p-6 flex-1 overflow-y-auto pb-28 lg:pb-6 space-y-4 touch-pan-y">
        {errorMessage && (
          <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold ml-2">✕</button>
          </div>
        )}

        {/* Step Indicators with Touch Scroll */}
        <nav
          aria-label="Resume wizard steps"
          className="relative flex items-center justify-between pb-3 border-b border-slate-100 overflow-x-auto gap-2 touch-pan-x scrollbar-none"
        >
          {STEPS.map((step, idx) => (
            <button
              key={step}
              type="button"
              onClick={() => setActiveStep(idx)}
              className="relative px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer shrink-0 rounded-lg flex items-center gap-1.5"
            >
              {activeStep === idx && (
                <motion.div
                  layoutId="active-step-pill"
                  className="absolute inset-0 bg-blue-50 border border-blue-200/80 rounded-lg"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span
                className={`relative z-10 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  activeStep === idx ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {idx + 1}
              </span>
              <span
                className={`relative z-10 text-[11px] font-medium ${
                  activeStep === idx ? 'text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {step.split(' ')[0]}
              </span>
            </button>
          ))}
        </nav>

        {/* STEP 0: TARGET & INFO */}
        {activeStep === 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Target Role & Background
            </h3>

            {/* Profile Photo */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> Include Profile Photo?
                </span>
                <input
                  type="checkbox"
                  checked={!!resumeData.personalInfo.showPhoto}
                  onChange={(e) => updatePersonalInfo('showPhoto', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>

              {resumeData.personalInfo.showPhoto && (
                <div className="flex items-center gap-3 pt-1">
                  {resumeData.personalInfo.photoUrl && (
                    <img
                      src={resumeData.personalInfo.photoUrl}
                      alt="Avatar"
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-400 shrink-0"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          updatePersonalInfo('photoUrl', ev.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Target Job Title / Profile *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer"
                  value={resumeData.personalInfo.targetRole}
                  onChange={(e) => updatePersonalInfo('targetRole', e.target.value)}
                  className="w-full text-base sm:text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Years of Experience
                </label>
                <select
                  value={resumeData.personalInfo.yearsOfExperience}
                  onChange={(e) => updatePersonalInfo('yearsOfExperience', e.target.value)}
                  className="w-full text-base sm:text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800"
                >
                  <option value="0 (Fresher / Entry Level)">0 (Fresher / Entry Level)</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5+ years">5+ years</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Relevant Field / Domain
              </label>
              <input
                type="text"
                placeholder="e.g. Backend Development, Cloud Systems"
                value={resumeData.personalInfo.experienceField}
                onChange={(e) => updatePersonalInfo('experienceField', e.target.value)}
                className="w-full text-base sm:text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.fullName}
                  onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                  className="w-full text-base sm:text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  value={resumeData.personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  className="w-full text-base sm:text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  className="w-full text-base sm:text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Location / City</label>
                <input
                  type="text"
                  value={resumeData.personalInfo.location}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  className="w-full text-base sm:text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 bg-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  Professional Summary / Objective
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-semibold shadow hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingSummary ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  )}
                  Generate ATS Objective with AI
                </button>
              </div>
              <textarea
                rows={4}
                value={resumeData.personalInfo.summary}
                onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                className="w-full text-base sm:text-xs p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 bg-white"
              />
            </div>
          </div>
        )}

        {/* STEP 1: SKILLS */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Relevant Skills & Proficiency
            </h3>

            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                placeholder="Skill (e.g. React, Java, Docker)"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="flex-1 text-base sm:text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 bg-white"
              />
              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                className="text-xs px-2 sm:px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-800"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Professional">Professional</option>
              </select>
              <button
                type="submit"
                className="px-3 sm:px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-slate-800 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-2">
              {resumeData.skills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full text-xs"
                >
                  <span className="font-semibold text-slate-800">{skill.name}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill.id)}
                    className="text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: LINKS */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Social & Portfolio Links
            </h3>

            <form onSubmit={handleAddLink} className="flex gap-2">
              <select
                value={newLinkPlatform}
                onChange={(e) => setNewLinkPlatform(e.target.value)}
                className="text-xs px-2 sm:px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium w-28 sm:w-32 text-slate-800 shrink-0"
              >
                <option value="GitHub">GitHub</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="LeetCode">LeetCode</option>
                <option value="Portfolio">Portfolio</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                placeholder="https://..."
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                className="flex-1 text-base sm:text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 bg-white"
              />
              <button
                type="submit"
                className="px-3 sm:px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-slate-800 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>

            <div className="space-y-2 pt-2">
              {resumeData.links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-lg text-xs"
                >
                  <div className="truncate mr-2">
                    <span className="font-semibold text-slate-800 mr-2">{link.platform}:</span>
                    <span className="text-blue-600 font-mono text-[11px]">{link.url}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLink(link.id)}
                    className="text-slate-400 hover:text-red-500 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: EXPERIENCE */}
        {activeStep === 3 && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Work Experience
              </h3>
              <button
                type="button"
                onClick={() =>
                  addExperience({
                    id: Date.now().toString(),
                    company: '',
                    role: '',
                    startDate: '2023',
                    endDate: 'Present',
                    isCurrent: true,
                    rawDetails: '',
                    enhancedBullets: [],
                  })
                }
                className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1 hover:bg-slate-800 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {resumeData.experiences.map((exp) => (
              <div key={exp.id} className="p-4 border rounded-xl bg-slate-50 space-y-3 relative">
                <button
                  type="button"
                  onClick={() => removeExperience(exp.id)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Company</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                      className="w-full text-base sm:text-xs px-2.5 py-1.5 border rounded-md bg-white outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                      className="w-full text-base sm:text-xs px-2.5 py-1.5 border rounded-md bg-white outline-none text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
                    <input
                      type="text"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                      className="w-full text-base sm:text-xs px-2.5 py-1.5 border rounded-md bg-white outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">End Date</label>
                    <input
                      type="text"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                      className="w-full text-base sm:text-xs px-2.5 py-1.5 border rounded-md bg-white outline-none text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-600">
                      Responsibilities (Casual Notes)
                    </label>
                    <button
                      type="button"
                      onClick={() => handleEnhanceExperience(exp)}
                      disabled={enhancingExpId === exp.id || !exp.rawDetails.trim()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white text-[11px] font-semibold rounded hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
                    >
                      {enhancingExpId === exp.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-yellow-300" />
                      )}
                      Rewrite with AI
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={exp.rawDetails}
                    onChange={(e) => updateExperience(exp.id, { rawDetails: e.target.value })}
                    className="w-full text-base sm:text-xs p-2.5 border rounded-md bg-white outline-none text-slate-800"
                  />
                </div>

                {exp.enhancedBullets && exp.enhancedBullets.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs space-y-1.5">
                    <div className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> AI-Enhanced Bullets:
                    </div>
                    <ul className="list-disc ml-4 space-y-1 text-slate-700">
                      {exp.enhancedBullets.map((bullet, bIdx) => (
                        <li key={bIdx}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* STEP 4: EDUCATION & PROJECTS */}
        {activeStep === 4 && (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Education
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    addEducation({
                      id: Date.now().toString(),
                      institution: '',
                      degree: 'B.Tech',
                      fieldOfStudy: 'Computer Engineering',
                      graduationYear: '2024',
                      scoreOrGpa: '',
                    })
                  }
                  className="px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded flex items-center gap-1 hover:bg-slate-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {resumeData.education.map((edu) => (
                <div key={edu.id} className="p-3 border rounded-lg bg-slate-50 mb-2 space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => removeEducation(edu.id)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                    <input
                      type="text"
                      placeholder="Institution"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                      className="text-base sm:text-xs px-2 py-1.5 border rounded bg-white outline-none text-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Degree & Major"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                      className="text-base sm:text-xs px-2 py-1.5 border rounded bg-white outline-none text-slate-800"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Featured Projects
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    addProject({
                      id: Date.now().toString(),
                      title: 'New Project',
                      techStack: ['React', 'Node.js'],
                      description: 'Engineered a scalable system...',
                    })
                  }
                  className="px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded flex items-center gap-1 hover:bg-slate-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Project
                </button>
              </div>

              {resumeData.projects.map((proj) => (
                <div key={proj.id} className="p-3 border rounded-lg bg-slate-50 mb-2 space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => removeProject(proj.id)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="pr-6">
                    <input
                      type="text"
                      placeholder="Project Title"
                      value={proj.title}
                      onChange={(e) => updateProject(proj.id, { title: e.target.value })}
                      className="text-base sm:text-xs px-2 py-1.5 border rounded bg-white outline-none w-full font-semibold mb-2 text-slate-800"
                    />
                    <textarea
                      rows={2}
                      placeholder="Project description..."
                      value={proj.description}
                      onChange={(e) => updateProject(proj.id, { description: e.target.value })}
                      className="text-base sm:text-xs p-2 border rounded bg-white outline-none w-full text-slate-800"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: CERTIFICATIONS & HONORS */}
        {activeStep === 5 && (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-blue-600" /> Certifications (Optional)
                  </h3>
                  <p className="text-[11px] text-slate-400">Add course certificates or licenses.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    addCertification({
                      id: Date.now().toString(),
                      name: '',
                      issuer: '',
                    })
                  }
                  className="px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded flex items-center gap-1 hover:bg-slate-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Cert
                </button>
              </div>

              {(resumeData.certifications || []).length === 0 && (
                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 border rounded-lg text-center">
                  No certifications added. This section stays hidden on your resume.
                </p>
              )}

              {(resumeData.certifications || []).map((cert) => (
                <div key={cert.id} className="p-3 border rounded-lg bg-slate-50 mb-2 space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => removeCertification(cert.id)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                    <input
                      type="text"
                      placeholder="Certificate Name (e.g. AWS Cloud Practitioner)"
                      value={cert.name}
                      onChange={(e) => updateCertification(cert.id, { name: e.target.value })}
                      className="text-base sm:text-xs px-2 py-1.5 border rounded bg-white outline-none text-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Issuer (e.g. Amazon Web Services / IIT Bombay)"
                      value={cert.issuer}
                      onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
                      className="text-base sm:text-xs px-2 py-1.5 border rounded bg-white outline-none text-slate-800"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" /> Honors & Achievements (Optional)
                  </h3>
                  <p className="text-[11px] text-slate-400">Add awards, hackathons, or recognitions.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    addAchievement({
                      id: Date.now().toString(),
                      title: '',
                      description: '',
                    })
                  }
                  className="px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded flex items-center gap-1 hover:bg-slate-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Award
                </button>
              </div>

              {(resumeData.achievements || []).length === 0 && (
                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 border rounded-lg text-center">
                  No honors added. This section stays hidden on your resume.
                </p>
              )}

              {(resumeData.achievements || []).map((ach) => (
                <div key={ach.id} className="p-3 border rounded-lg bg-slate-50 mb-2 space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => removeAchievement(ach.id)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="pr-6 space-y-1.5">
                    <input
                      type="text"
                      placeholder="Award Title (e.g. 1st Place National Hackathon)"
                      value={ach.title}
                      onChange={(e) => updateAchievement(ach.id, { title: e.target.value })}
                      className="text-base sm:text-xs px-2 py-1.5 border rounded bg-white outline-none w-full font-semibold text-slate-800"
                    />
                    <textarea
                      rows={2}
                      placeholder="Brief note or impact..."
                      value={ach.description}
                      onChange={(e) => updateAchievement(ach.id, { description: e.target.value })}
                      className="text-base sm:text-xs p-2 border rounded bg-white outline-none w-full text-slate-800"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Persistent Bottom Bar (Back / Next / View Preview) */}
      <div className="fixed lg:static bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md lg:bg-white border-t border-slate-200/90 px-4 py-3 sm:px-6 flex justify-between items-center shadow-lg lg:shadow-none">
        <button
          type="button"
          disabled={activeStep === 0}
          onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
          className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-1 cursor-pointer transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
          Step {activeStep + 1} of {STEPS.length}
        </span>

        <div className="flex items-center gap-2">
          {/* Quick Preview Button on mobile */}
          {onSwitchToPreview && (
            <button
              type="button"
              onClick={onSwitchToPreview}
              className="lg:hidden px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Preview</span>
            </button>
          )}

          {activeStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setActiveStep(activeStep + 1)}
              className="px-4 sm:px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 flex items-center gap-1 shadow-sm cursor-pointer transition"
            >
              Next Step <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onSwitchToPreview) onSwitchToPreview();
              }}
              className="px-4 sm:px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 shadow-sm cursor-pointer transition"
            >
              Finish & View <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};