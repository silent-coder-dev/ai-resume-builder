import { describe, expect, it } from 'vitest';
import { analyzeResume } from '@/lib/resume/analyzer';
import { createBlankResumeData } from '@/lib/resume/record';
import { normalizeSectionOrder, recommendedSectionOrder } from '@/lib/resume/sections';
import { isValidEmail, isValidUrl, safeHref } from '@/lib/resume/validation';
import { checkRateLimit, resetRateLimits } from '@/lib/server/rateLimit';
import { DEFAULT_OPENROUTER_MODEL, hasOwnOpenRouterModel, openRouterModelsFor } from '@/lib/server/aiModels';
import { coerceResumeData, normalizeResumeData } from '@/utils/normalizeResumeData';
import type { ResumeData } from '@/types/resume';

function fresherResume(): ResumeData {
  const data = createBlankResumeData();
  data.personalInfo = {
    ...data.personalInfo,
    fullName: 'Riya Sen',
    email: 'riya@example.com',
    phone: '+91 98765 43210',
    location: 'Pune, India',
    githubUrl: 'github.com/riya',
    summary:
      'Computer Science graduate who builds web apps with React and Node.js. Built three projects covering authentication, payments, and dashboards, and enjoys writing clear, tested code for small teams.',
  };
  data.skills = ['React', 'Node.js', 'SQL', 'Git', 'TypeScript'].map((name, index) => ({ id: String(index), name }));
  data.projects = [
    { id: 'p1', title: 'Expense tracker', techStack: ['React'], description: 'A web app that tracks monthly spending with category budgets and charts.' },
  ];
  data.education = [{ id: 'e1', degree: 'B.Tech', institution: 'State University', graduationYear: '2025' }];
  return data;
}

describe('resume analyzer', () => {
  it('does not penalise freshers for having no work experience', () => {
    const result = analyzeResume({ data: fresherResume(), careerStage: 'fresher' });
    expect(result.score).toBe(100);
    expect(result.issues.find((issue) => issue.id === 'experience')).toBeUndefined();
  });

  it('expects work history from experienced candidates and explains why', () => {
    const result = analyzeResume({ data: fresherResume(), careerStage: 'experienced' });
    const issue = result.issues.find((item) => item.id === 'experience');
    expect(issue?.severity).toBe('critical');
    expect(issue?.target).toBe('experience');
    expect(result.score).toBeLessThan(100);
  });

  it('flags an invalid email as critical, with a fix target', () => {
    const data = fresherResume();
    data.personalInfo.email = 'not-an-email';
    const issue = analyzeResume({ data, careerStage: 'fresher' }).issues.find((item) => item.id === 'email');
    expect(issue).toMatchObject({ severity: 'critical', target: 'personal', title: 'Check your email address' });
  });

  it('category scores always add up to the total', () => {
    const result = analyzeResume({ data: createBlankResumeData(), careerStage: null });
    expect(result.categories.reduce((sum, item) => sum + item.score, 0)).toBe(result.score);
    expect(result.issues[0].severity).toBe('critical');
  });
});

describe('AI output cleanup', () => {
  it('drops empty entries, fixes repeated IDs, and moves profile links into their fields', () => {
    const data = normalizeResumeData({
      personalInfo: { fullName: 'Arun' },
      skills: ['SQL', '', { id: '1', name: 'Python' }, { id: '1', name: 'Excel' }],
      experiences: [{ id: '1', company: '' }, { id: '1', company: 'Acme', role: 'Analyst' }],
      links: [
        { id: 'a', platform: 'LinkedIn', url: 'https://linkedin.com/in/arun' },
        { id: 'b', platform: 'Kaggle', url: 'https://kaggle.com/arun' },
      ],
    });
    expect(data.skills.map((skill) => skill.name)).toEqual(['SQL', 'Python', 'Excel']);
    expect(new Set(data.skills.map((skill) => skill.id)).size).toBe(3);
    expect(data.experiences).toHaveLength(1);
    expect(data.personalInfo.linkedinUrl).toBe('https://linkedin.com/in/arun');
    expect(data.links?.map((link) => link.platform)).toEqual(['Kaggle']);
  });

  it('keeps half-filled rows when repairing saved data', () => {
    const data = coerceResumeData({ personalInfo: {}, experiences: [{ id: 'draft', company: '' }] });
    expect(data.experiences).toHaveLength(1);
    expect(data.internships).toEqual([]);
  });

  it('rejects values that are not resumes', () => {
    expect(() => normalizeResumeData('hello')).toThrow();
  });
});

describe('section order', () => {
  it('repairs duplicates, unknown sections, and missing sections', () => {
    const order = normalizeSectionOrder([
      { id: 'skills', visible: false },
      { id: 'skills' },
      { id: 'hacked' },
      { id: 'custom:gone' },
    ]);
    expect(order[0]).toMatchObject({ id: 'skills', visible: false });
    expect(new Set(order.map((item) => item.id)).size).toBe(order.length);
    expect(order.map((item) => item.id).sort()).toEqual(recommendedSectionOrder(null).map((item) => item.id).sort());
  });

  it('adds every custom section that exists', () => {
    const order = normalizeSectionOrder([], [{ id: 'v1', title: 'Volunteering', items: [] }]);
    expect(order.at(-1)).toMatchObject({ id: 'custom:v1', label: 'Volunteering' });
  });
});

describe('validation', () => {
  it('only makes http(s) and mailto links clickable', () => {
    expect(safeHref('linkedin.com/in/me')).toBe('https://linkedin.com/in/me');
    expect(safeHref('mailto:me@example.com')).toBe('mailto:me@example.com');
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(isValidUrl('not a url')).toBe(false);
    expect(isValidEmail('me@example.com')).toBe(true);
  });
});

describe('AI rate limit', () => {
  it('enforces per-minute and per-day limits with a retry time', () => {
    resetRateLimits();
    const limits = { perMinute: 2, perDay: 3 };
    const start = Date.UTC(2026, 0, 1);
    expect(checkRateLimit('ai:1.2.3.4', limits, start).ok).toBe(true);
    expect(checkRateLimit('ai:1.2.3.4', limits, start + 1).ok).toBe(true);
    const minute = checkRateLimit('ai:1.2.3.4', limits, start + 2);
    expect(minute).toMatchObject({ ok: false, scope: 'minute' });
    expect(checkRateLimit('ai:1.2.3.4', limits, start + 61_000).ok).toBe(true);
    expect(checkRateLimit('ai:1.2.3.4', limits, start + 122_000)).toMatchObject({ ok: false, scope: 'day' });
    // Other visitors are not affected.
    expect(checkRateLimit('ai:5.6.7.8', limits, start + 122_000).ok).toBe(true);
  });
});

describe('OpenRouter model per tool', () => {
  const env = {
    OPENROUTER_MODEL: 'main/model:free',
    OPENROUTER_MODEL_ANALYZER: 'cohere/north-mini-code:free',
    OPENROUTER_MODEL_INTERVIEW: ' thinkingmachines/inkling-small:free ',
    OPENROUTER_MODEL_JOB_MATCH: 'liquid/lfm-2.5-2.6b:free',
  };

  it('uses each tool’s own model first, with the main model as a backup', () => {
    expect(openRouterModelsFor('aiAnalysis', env)).toEqual(['cohere/north-mini-code:free', 'main/model:free']);
    expect(openRouterModelsFor('interviewPrep', env)).toEqual(['thinkingmachines/inkling-small:free', 'main/model:free']);
    expect(openRouterModelsFor('jobMatch', env)).toEqual(['liquid/lfm-2.5-2.6b:free', 'main/model:free']);
  });

  it('uses the main model for tools without their own model', () => {
    expect(openRouterModelsFor('aiWriting', env)).toEqual(['main/model:free']);
    expect(openRouterModelsFor('resumeBuilder', env)).toEqual(['main/model:free']);
    expect(openRouterModelsFor(null, env)).toEqual(['main/model:free']);
  });

  it('adds the backup list without repeats, and has a default', () => {
    expect(openRouterModelsFor('jobMatch', { ...env, OPENROUTER_FALLBACK_MODELS: 'main/model:free, other/model' })).toEqual([
      'liquid/lfm-2.5-2.6b:free',
      'main/model:free',
      'other/model',
    ]);
    expect(openRouterModelsFor('aiAnalysis', { OPENROUTER_MODEL_ANALYZER: '' })).toEqual([DEFAULT_OPENROUTER_MODEL]);
  });

  it('knows when a tool has its own model (and so a main-model retry is possible)', () => {
    expect(hasOwnOpenRouterModel('jobMatch', env)).toBe(true);
    expect(hasOwnOpenRouterModel('aiWriting', env)).toBe(false);
    expect(hasOwnOpenRouterModel('jobMatch', { ...env, OPENROUTER_MODEL_JOB_MATCH: 'main/model:free' })).toBe(false);
  });
});
