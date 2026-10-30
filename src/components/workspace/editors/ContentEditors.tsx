'use client';

// Editors for every resume section except Personal Information.

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { CustomSectionItem, Experience } from '@/types/resume';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { createId, isFilledSkill } from '@/utils/resumeContent';
import { wordCount } from '@/lib/resume/validation';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input, SelectField, TextField, Textarea, TextareaField } from '@/components/ui/Field';
import { AiAssistMenu } from '@/components/workspace/ai/AiAssistMenu';
import { BulletsFromNotes } from '@/components/workspace/ai/BulletsFromNotes';
import { SummaryWriter } from '@/components/workspace/ai/SummaryWriter';
import {
  AddItemButton,
  EmptyHint,
  ItemCard,
  SectionIntro,
  linesToList,
  splitCommaList,
} from '@/components/workspace/editors/EditorShared';

// Context that the AI writing helper uses to stay relevant (never to add facts).
function useAiContext() {
  const targetRole = useWorkspaceStore((state) => state.current?.data.personalInfo.targetRole ?? '');
  const skills = useWorkspaceStore((state) => state.current?.data.skills);
  return { targetRole, skills: (skills ?? []).filter(isFilledSkill).map((skill) => skill.name) };
}

// ---------- Summary ----------

export function SummaryEditor({ onNavigate }: { onNavigate: (section: string) => void }) {
  const summary = useWorkspaceStore((state) => state.current?.data.personalInfo.summary ?? '');
  const updatePersonalInfo = useWorkspaceStore((state) => state.updatePersonalInfo);
  const ai = useAiContext();
  const words = wordCount(summary);

  return (
    <div>
      <SectionIntro
        title="Professional Summary"
        description="Two or three sentences: who you are, your strongest relevant skills, and what you want to do next."
        actions={<SummaryWriter onNavigate={onNavigate} />}
      />
      <TextareaField
        label="Summary"
        rows={6}
        value={summary}
        onChange={(event) => updatePersonalInfo('summary', event.target.value)}
        placeholder="e.g. Computer Science graduate who builds full-stack web apps with React and Node.js…"
        hint={`${words} word${words === 1 ? '' : 's'} · about 40–70 words reads best`}
        actions={
          <AiAssistMenu
            text={summary}
            context={{ field: 'professional summary', ...ai }}
            onAccept={(value) => updatePersonalInfo('summary', value)}
          />
        }
      />
    </div>
  );
}

// ---------- Work experience and internships ----------

export function ExperienceEditor({ list }: { list: 'experiences' | 'internships' }) {
  const items = useWorkspaceStore((state) => (list === 'experiences' ? state.current?.data.experiences : state.current?.data.internships)) ?? [];
  const careerStage = useWorkspaceStore((state) => state.current?.careerStage ?? null);
  const addItem = useWorkspaceStore((state) => state.addItem);
  const updateItem = useWorkspaceStore((state) => state.updateItem);
  const removeItem = useWorkspaceStore((state) => state.removeItem);
  const moveItem = useWorkspaceStore((state) => state.moveItem);
  const ai = useAiContext();
  const internship = list === 'internships';
  const noun = internship ? 'internship' : 'position';

  const blank = (): Experience => ({
    id: createId(),
    company: '',
    role: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    rawDetails: '',
    enhancedBullets: [],
  });

  return (
    <div>
      <SectionIntro
        title={internship ? 'Internships' : 'Work Experience'}
        description={
          internship
            ? 'Internships, apprenticeships, and training roles. Optional.'
            : careerStage === 'fresher' || careerStage === 'student'
              ? 'Optional for freshers and students. Leave it empty if you have not worked yet — it will not count against you.'
              : 'Your roles, most recent first.'
        }
      />
      <div className="space-y-4">
        {items.length === 0 && (
          <EmptyHint>{internship ? 'No internships added.' : 'No work experience added yet.'}</EmptyHint>
        )}
        {items.map((item, index) => {
          const bullets = item.enhancedBullets ?? [];
          const title = item.role || item.company || `New ${noun}`;
          return (
            <ItemCard
              key={item.id}
              title={title}
              subtitle={[item.company && item.role ? item.company : '', item.startDate].filter(Boolean).join(' · ')}
              index={index}
              count={items.length}
              onMove={(direction) => moveItem(list, item.id, direction)}
              onRemove={() => removeItem(list, item.id)}
              removeLabel={`Remove ${title}`}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label={internship ? 'Company / organisation' : 'Company'} value={item.company} onChange={(event) => updateItem(list, item.id, { company: event.target.value })} />
                <TextField label={internship ? 'Role' : 'Job title'} value={item.role} onChange={(event) => updateItem(list, item.id, { role: event.target.value })} />
                <TextField label="Start date" value={item.startDate} onChange={(event) => updateItem(list, item.id, { startDate: event.target.value })} placeholder="e.g. Jan 2023" />
                <TextField
                  label="End date"
                  value={item.isCurrent ? 'Present' : item.endDate}
                  disabled={item.isCurrent}
                  onChange={(event) => updateItem(list, item.id, { endDate: event.target.value })}
                  placeholder="e.g. Jun 2024"
                />
                <TextField label="Location" optional value={item.location ?? ''} onChange={(event) => updateItem(list, item.id, { location: event.target.value })} placeholder="City or Remote" />
                <div className="flex items-end pb-2">
                  <Checkbox
                    label={internship ? 'I am doing this now' : 'I currently work here'}
                    checked={item.isCurrent}
                    onChange={(event) => updateItem(list, item.id, { isCurrent: event.target.checked })}
                  />
                </div>
              </div>
              <TextareaField
                label="Bullet points"
                hint="One bullet per line. Start with a verb: built, led, improved…"
                rows={Math.max(4, bullets.length + 1)}
                value={bullets.join('\n')}
                onChange={(event) => updateItem(list, item.id, { enhancedBullets: linesToList(event.target.value) })}
                actions={
                  <AiAssistMenu
                    text={bullets.join('\n')}
                    context={{ field: internship ? 'internship bullet points' : 'work experience bullet points', bullets: true, ...ai }}
                    onAccept={(value) => updateItem(list, item.id, { enhancedBullets: value.split('\n') })}
                  />
                }
              />
              <TextareaField
                label="Rough notes"
                optional
                rows={3}
                hint="Not shown on the resume when you have bullets. AI can turn these notes into bullets."
                value={item.rawDetails}
                onChange={(event) => updateItem(list, item.id, { rawDetails: event.target.value })}
                actions={
                  <BulletsFromNotes
                    notes={item.rawDetails}
                    currentBullets={bullets.filter((bullet) => bullet.trim())}
                    role={item.role}
                    company={item.company}
                    targetRole={ai.targetRole}
                    onAccept={(next) => updateItem(list, item.id, { enhancedBullets: next })}
                  />
                }
              />
            </ItemCard>
          );
        })}
        <AddItemButton label={internship ? 'Add internship' : 'Add position'} onClick={() => addItem(list, blank())} />
      </div>
    </div>
  );
}

// ---------- Projects ----------

export function ProjectsEditor() {
  const items = useWorkspaceStore((state) => state.current?.data.projects) ?? [];
  const resumeId = useWorkspaceStore((state) => state.current?.id);
  const addItem = useWorkspaceStore((state) => state.addItem);
  const updateItem = useWorkspaceStore((state) => state.updateItem);
  const removeItem = useWorkspaceStore((state) => state.removeItem);
  const moveItem = useWorkspaceStore((state) => state.moveItem);
  const ai = useAiContext();

  return (
    <div>
      <SectionIntro
        title="Projects"
        description="College, personal, freelance, or open-source work. Say what you built, with what, and what it does."
        actions={
          <a href={`/github?resume=${resumeId ?? ''}`} className="text-small font-semibold text-primary hover:underline">
            Import from GitHub →
          </a>
        }
      />
      <div className="space-y-4">
        {items.length === 0 && <EmptyHint>No projects added yet.</EmptyHint>}
        {items.map((item, index) => {
          const title = item.title || 'New project';
          return (
            <ItemCard
              key={item.id}
              title={title}
              subtitle={item.techStack.filter(Boolean).join(', ')}
              index={index}
              count={items.length}
              onMove={(direction) => moveItem('projects', item.id, direction)}
              onRemove={() => removeItem('projects', item.id)}
              removeLabel={`Remove ${title}`}
            >
              <TextField label="Project name" value={item.title} onChange={(event) => updateItem('projects', item.id, { title: event.target.value })} />
              <TextField
                label="Tools and technologies"
                hint="Separate with commas."
                value={item.techStack.join(', ')}
                onChange={(event) => updateItem('projects', item.id, { techStack: splitCommaList(event.target.value) })}
                placeholder="e.g. React, Node.js, PostgreSQL"
              />
              <TextareaField
                label="Description"
                rows={4}
                value={item.description}
                onChange={(event) => updateItem('projects', item.id, { description: event.target.value })}
                actions={
                  <AiAssistMenu
                    text={item.description}
                    context={{ field: 'project description', ...ai }}
                    onAccept={(value) => updateItem('projects', item.id, { description: value })}
                  />
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Code link" optional inputMode="url" value={item.githubUrl ?? ''} onChange={(event) => updateItem('projects', item.id, { githubUrl: event.target.value })} placeholder="github.com/you/project" />
                <TextField label="Live link" optional inputMode="url" value={item.liveUrl ?? ''} onChange={(event) => updateItem('projects', item.id, { liveUrl: event.target.value })} placeholder="project.example.com" />
              </div>
            </ItemCard>
          );
        })}
        <AddItemButton
          label="Add project"
          onClick={() => addItem('projects', { id: createId(), title: '', techStack: [], description: '', githubUrl: '', liveUrl: '' })}
        />
      </div>
    </div>
  );
}

// ---------- Education ----------

export function EducationEditor() {
  const items = useWorkspaceStore((state) => state.current?.data.education) ?? [];
  const addItem = useWorkspaceStore((state) => state.addItem);
  const updateItem = useWorkspaceStore((state) => state.updateItem);
  const removeItem = useWorkspaceStore((state) => state.removeItem);
  const moveItem = useWorkspaceStore((state) => state.moveItem);
  const add = (degree = '') =>
    addItem('education', { id: createId(), institution: '', degree, fieldOfStudy: '', graduationYear: '', scoreOrGpa: '' });

  return (
    <div>
      <SectionIntro
        title="Education"
        description="Add each qualification separately, most recent first. Missing details can stay blank."
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => add('Class 12')}>
              + Class 12
            </Button>
            <Button size="sm" variant="secondary" onClick={() => add('Class 10')}>
              + Class 10
            </Button>
          </>
        }
      />
      <div className="space-y-4">
        {items.length === 0 && <EmptyHint>No education added yet.</EmptyHint>}
        {items.map((item, index) => {
          const title = item.degree || item.institution || 'New qualification';
          return (
            <ItemCard
              key={item.id}
              title={title}
              subtitle={[item.institution && item.degree ? item.institution : '', item.graduationYear].filter(Boolean).join(' · ')}
              index={index}
              count={items.length}
              onMove={(direction) => moveItem('education', item.id, direction)}
              onRemove={() => removeItem('education', item.id)}
              removeLabel={`Remove ${title}`}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Degree or qualification" value={item.degree} onChange={(event) => updateItem('education', item.id, { degree: event.target.value })} placeholder="e.g. B.Tech, Class 12" />
                <TextField label="School / college / university" value={item.institution} onChange={(event) => updateItem('education', item.id, { institution: event.target.value })} />
                <TextField label="Field of study" optional value={item.fieldOfStudy ?? ''} onChange={(event) => updateItem('education', item.id, { fieldOfStudy: event.target.value })} placeholder="e.g. Computer Science" />
                <TextField label="Year" value={item.graduationYear} onChange={(event) => updateItem('education', item.id, { graduationYear: event.target.value })} placeholder="e.g. 2025 or 2021 – 2025" />
                <TextField label="Marks / CGPA" optional value={item.scoreOrGpa ?? ''} onChange={(event) => updateItem('education', item.id, { scoreOrGpa: event.target.value })} placeholder="e.g. CGPA 8.2" />
              </div>
            </ItemCard>
          );
        })}
        <AddItemButton label="Add qualification" onClick={() => add()} />
      </div>
    </div>
  );
}

// ---------- Skills ----------

export function SkillsEditor() {
  const skills = useWorkspaceStore((state) => state.current?.data.skills) ?? [];
  const addItem = useWorkspaceStore((state) => state.addItem);
  const updateItem = useWorkspaceStore((state) => state.updateItem);
  const removeItem = useWorkspaceStore((state) => state.removeItem);
  const [draft, setDraft] = useState('');

  const commit = () => {
    const names = draft.split(',').map((name) => name.trim()).filter(Boolean);
    const existing = new Set(skills.map((skill) => skill.name.trim().toLowerCase()));
    for (const name of names) {
      if (!existing.has(name.toLowerCase())) {
        addItem('skills', { id: createId(), name, level: 'Professional' });
        existing.add(name.toLowerCase());
      }
    }
    setDraft('');
  };

  return (
    <div>
      <SectionIntro title="Technical Skills" description="Tools, languages, and methods you have actually used. Five or more helps keyword matching." />
      <Field label="Add skills" hint="Press Enter or use commas to add several at once.">
        {(control) => (
          <div className="flex gap-2">
            <Input
              {...control}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commit();
                }
              }}
              placeholder="e.g. Python, SQL, Figma"
            />
            <Button variant="primary" onClick={commit} disabled={!draft.trim()}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add
            </Button>
          </div>
        )}
      </Field>
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Your skills">
        {skills.length === 0 && <li className="text-body text-ink-2">No skills added yet.</li>}
        {skills.map((skill) => (
          <li key={skill.id} className="flex items-center gap-1 rounded-lg border border-line bg-surface py-1 pl-1 pr-1">
            <input
              aria-label="Skill name"
              value={skill.name}
              onChange={(event) => updateItem('skills', skill.id, { name: event.target.value })}
              size={Math.max(4, skill.name.length)}
              className="rounded-md bg-transparent px-2 py-0.5 text-body text-ink focus:bg-surface-2 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeItem('skills', skill.id)}
              aria-label={`Remove ${skill.name || 'skill'}`}
              className="rounded-md p-1 text-ink-2 hover:bg-surface-2 hover:text-error"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Certifications ----------

export function CertificationsEditor() {
  const items = useWorkspaceStore((state) => state.current?.data.certifications) ?? [];
  const addItem = useWorkspaceStore((state) => state.addItem);
  const updateItem = useWorkspaceStore((state) => state.updateItem);
  const removeItem = useWorkspaceStore((state) => state.removeItem);
  const moveItem = useWorkspaceStore((state) => state.moveItem);

  return (
    <div>
      <SectionIntro title="Certifications" description="Optional. Only add certificates and licenses you actually hold." />
      <div className="space-y-4">
        {items.length === 0 && <EmptyHint>No certifications added. Empty sections are hidden on the resume.</EmptyHint>}
        {items.map((item, index) => {
          const title = item.name || 'New certification';
          return (
            <ItemCard
              key={item.id}
              title={title}
              subtitle={item.issuer}
              index={index}
              count={items.length}
              onMove={(direction) => moveItem('certifications', item.id, direction)}
              onRemove={() => removeItem('certifications', item.id)}
              removeLabel={`Remove ${title}`}
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <TextField label="Name" className="sm:col-span-3" value={item.name} onChange={(event) => updateItem('certifications', item.id, { name: event.target.value })} />
                <TextField label="Issuer" className="sm:col-span-2" value={item.issuer} onChange={(event) => updateItem('certifications', item.id, { issuer: event.target.value })} />
                <TextField label="Date" optional value={item.date ?? ''} onChange={(event) => updateItem('certifications', item.id, { date: event.target.value })} placeholder="e.g. 2024" />
              </div>
            </ItemCard>
          );
        })}
        <AddItemButton label="Add certification" onClick={() => addItem('certifications', { id: createId(), name: '', issuer: '', date: '' })} />
      </div>
    </div>
  );
}

// ---------- Achievements ----------

export function AchievementsEditor() {
  const items = useWorkspaceStore((state) => state.current?.data.achievements) ?? [];
  const addItem = useWorkspaceStore((state) => state.addItem);
  const updateItem = useWorkspaceStore((state) => state.updateItem);
  const removeItem = useWorkspaceStore((state) => state.removeItem);
  const moveItem = useWorkspaceStore((state) => state.moveItem);
  const ai = useAiContext();

  return (
    <div>
      <SectionIntro title="Achievements" description="Optional. Awards, ranks, scholarships, competitions, or milestones." />
      <div className="space-y-4">
        {items.length === 0 && <EmptyHint>No achievements added. Empty sections are hidden on the resume.</EmptyHint>}
        {items.map((item, index) => {
          const title = item.title || 'New achievement';
          return (
            <ItemCard
              key={item.id}
              title={title}
              index={index}
              count={items.length}
              onMove={(direction) => moveItem('achievements', item.id, direction)}
              onRemove={() => removeItem('achievements', item.id)}
              removeLabel={`Remove ${title}`}
            >
              <TextField label="Title" value={item.title} onChange={(event) => updateItem('achievements', item.id, { title: event.target.value })} />
              <TextareaField
                label="Details"
                optional
                rows={3}
                value={item.description}
                onChange={(event) => updateItem('achievements', item.id, { description: event.target.value })}
                actions={
                  <AiAssistMenu
                    text={item.description}
                    context={{ field: 'achievement description', ...ai }}
                    onAccept={(value) => updateItem('achievements', item.id, { description: value })}
                  />
                }
              />
            </ItemCard>
          );
        })}
        <AddItemButton label="Add achievement" onClick={() => addItem('achievements', { id: createId(), title: '', description: '' })} />
      </div>
    </div>
  );
}

// ---------- Languages ----------

const PROFICIENCY = ['Native', 'Fluent', 'Professional', 'Intermediate', 'Basic'];

export function LanguagesEditor() {
  const items = useWorkspaceStore((state) => state.current?.data.languages) ?? [];
  const addItem = useWorkspaceStore((state) => state.addItem);
  const updateItem = useWorkspaceStore((state) => state.updateItem);
  const removeItem = useWorkspaceStore((state) => state.removeItem);
  const moveItem = useWorkspaceStore((state) => state.moveItem);

  return (
    <div>
      <SectionIntro title="Languages" description="Optional. Spoken languages and how well you use them." />
      <div className="space-y-4">
        {items.length === 0 && <EmptyHint>No languages added. Empty sections are hidden on the resume.</EmptyHint>}
        {items.map((item, index) => {
          const title = item.name || 'New language';
          return (
            <ItemCard
              key={item.id}
              title={title}
              subtitle={item.proficiency}
              index={index}
              count={items.length}
              onMove={(direction) => moveItem('languages', item.id, direction)}
              onRemove={() => removeItem('languages', item.id)}
              removeLabel={`Remove ${title}`}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Language" value={item.name} onChange={(event) => updateItem('languages', item.id, { name: event.target.value })} placeholder="e.g. Hindi" />
                <SelectField label="Level" value={item.proficiency} onChange={(event) => updateItem('languages', item.id, { proficiency: event.target.value })}>
                  <option value="">Not specified</option>
                  {PROFICIENCY.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </SelectField>
              </div>
            </ItemCard>
          );
        })}
        <AddItemButton label="Add language" onClick={() => addItem('languages', { id: createId(), name: '', proficiency: '' })} />
      </div>
    </div>
  );
}

// ---------- Custom sections ----------

export function CustomSectionEditor({ sectionId, onRemoved }: { sectionId: string; onRemoved: () => void }) {
  const section = useWorkspaceStore((state) => state.current?.data.customSections?.find((item) => item.id === sectionId));
  const renameCustomSection = useWorkspaceStore((state) => state.renameCustomSection);
  const removeCustomSection = useWorkspaceStore((state) => state.removeCustomSection);
  const addCustomItem = useWorkspaceStore((state) => state.addCustomItem);
  const updateCustomItem = useWorkspaceStore((state) => state.updateCustomItem);
  const removeCustomItem = useWorkspaceStore((state) => state.removeCustomItem);
  const moveCustomItem = useWorkspaceStore((state) => state.moveCustomItem);
  const ai = useAiContext();

  if (!section) return <EmptyHint>This section no longer exists.</EmptyHint>;
  const update = (item: CustomSectionItem, patch: Partial<CustomSectionItem>) => updateCustomItem(section.id, item.id, patch);

  return (
    <div>
      <SectionIntro
        title={section.title || 'Custom Section'}
        description="Anything that does not fit elsewhere: volunteering, publications, leadership, hobbies…"
        actions={
          <Button
            size="sm"
            variant="ghost"
            className="hover:text-error"
            onClick={() => {
              removeCustomSection(section.id);
              onRemoved();
            }}
          >
            Delete section
          </Button>
        }
      />
      <TextField label="Section title" value={section.title} onChange={(event) => renameCustomSection(section.id, event.target.value)} className="mb-5" />
      <div className="space-y-4">
        {section.items.length === 0 && <EmptyHint>No entries yet.</EmptyHint>}
        {section.items.map((item, index) => {
          const title = item.title || 'New entry';
          return (
            <ItemCard
              key={item.id}
              title={title}
              subtitle={item.subtitle}
              index={index}
              count={section.items.length}
              onMove={(direction) => moveCustomItem(section.id, item.id, direction)}
              onRemove={() => removeCustomItem(section.id, item.id)}
              removeLabel={`Remove ${title}`}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Title" value={item.title} onChange={(event) => update(item, { title: event.target.value })} />
                <TextField label="Subtitle" optional value={item.subtitle} onChange={(event) => update(item, { subtitle: event.target.value })} placeholder="Organisation or role" />
                <TextField label="Date" optional value={item.date} onChange={(event) => update(item, { date: event.target.value })} />
              </div>
              <Field
                label="Details"
                optional
                actions={
                  <AiAssistMenu
                    text={item.description}
                    context={{ field: `${section.title || 'custom section'} entry`, ...ai }}
                    onAccept={(value) => update(item, { description: value })}
                  />
                }
              >
                {(control) => <Textarea {...control} rows={3} value={item.description} onChange={(event) => update(item, { description: event.target.value })} />}
              </Field>
            </ItemCard>
          );
        })}
        <AddItemButton label="Add entry" onClick={() => addCustomItem(section.id)} />
      </div>
    </div>
  );
}
