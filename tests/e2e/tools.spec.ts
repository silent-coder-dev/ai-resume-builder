import type { Page } from '@playwright/test';
import { expect, resetStorage, test } from './helpers';

// AI calls are mocked: these tests check the pages, not the AI provider.
const FAKE_PDF = { name: 'resume.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% test file\n') };

const JOB_TEXT =
  'Junior Backend Developer at Example Corp. You will build REST APIs with Java and Spring Boot, write SQL queries, ' +
  'and deploy services with Docker. Required: Java, Spring Boot, SQL. Preferred: Docker, Kubernetes.';

const PARSED_RESUME = {
  personalInfo: {
    fullName: 'Riya Sen',
    targetRole: 'Backend Developer',
    email: 'riya@example.com',
    phone: '+91 90000 00000',
    location: 'Pune, India',
    summary: 'Computer Science graduate who builds backend services with Java and Spring Boot.',
  },
  skills: [{ id: '1', name: 'Java' }, { id: '2', name: 'Spring Boot' }, { id: '3', name: 'SQL' }],
  projects: [{ id: '1', title: 'Library API', techStack: ['Java', 'Spring Boot'], description: 'A REST API for a college library.' }],
  education: [{ id: '1', institution: 'State University', degree: 'B.Tech', fieldOfStudy: 'Computer Science', graduationYear: '2025' }],
};

type AiBody = { action: string; payload: Record<string, unknown> };

async function mockAi(page: Page, handlers: Record<string, (payload: Record<string, unknown>) => unknown>) {
  const calls: AiBody[] = [];
  await page.route('**/api/ai', async (route) => {
    const body = route.request().postDataJSON() as AiBody;
    calls.push(body);
    const handler = handlers[body.action];
    if (handler) await route.fulfill({ json: { result: handler(body.payload) } });
    else await route.fulfill({ status: 400, json: { error: `Unexpected action ${body.action}` } });
  });
  return calls;
}

test.beforeEach(async ({ page }) => {
  await resetStorage(page);
});

test('Analyzer: analyze an uploaded PDF, then save it to fix issues', async ({ page, consoleErrors }) => {
  void consoleErrors;
  const calls = await mockAi(page, { 'parse-resume-pdf': () => PARSED_RESUME });

  await page.goto('/analyzer');
  await page.getByLabel('Resume PDF').setInputFiles(FAKE_PDF);

  await expect(page.getByText('Readiness estimate')).toBeVisible();
  await expect(page.getByRole('button', { name: 'resume.pdf' })).toBeVisible();
  await expect(page.getByLabel('Score it as')).toHaveValue('fresher');
  // An uploaded PDF is not in the editor yet, so there are no Fix links.
  await expect(page.getByRole('link', { name: /^Fix/ })).toHaveCount(0);
  expect(calls.map((call) => call.action)).toEqual(['parse-resume-pdf']);

  await page.getByRole('button', { name: 'Save as a resume' }).click();
  await expect(page.getByText('Saved as “Backend Developer Resume”. Use the Fix buttons to edit it.')).toBeVisible();
  await expect(page).toHaveURL(/\/analyzer\?resume=/);
  await expect(page.getByRole('radio', { name: 'Use a saved resume', exact: true })).toBeChecked();
  await expect(page.getByLabel('Saved resume', { exact: true })).toHaveValue(/.+/);
  await expect(page.getByRole('link', { name: /^Fix/ }).first()).toHaveAttribute('href', /\/builder\?id=.+&section=/);
  // The career stage chosen for the upload is kept.
  await expect(page.getByText(/Scored for early career/)).toBeVisible();

  // It is now a normal saved resume.
  await page.goto('/resumes');
  await expect(page.getByText('Backend Developer Resume').first()).toBeVisible();
});

test('Job matcher: uploaded resume and a .txt job description reach the match', async ({ page, consoleErrors }) => {
  void consoleErrors;
  const calls = await mockAi(page, {
    'parse-resume-pdf': () => PARSED_RESUME,
    'match-job': () => ({
      matchScore: 72,
      confidence: 'medium',
      domainMismatch: false,
      domainMismatchDetails: null,
      licenseRequired: false,
      licenseWarning: null,
      seniorityMismatch: false,
      seniorityWarning: null,
      matchingSkills: ['Java', 'Spring Boot', 'SQL'],
      missingSkills: ['Docker'],
      criteria: [{ requirement: 'Java', category: 'skill', importance: 'required', met: true, evidence: 'Skills: Java' }],
      blockers: [],
      fitChecks: { fieldAligned: true, relevantSkillsPresent: true, experienceLevelAligned: true, evidence: 'Projects match.' },
      tailoredSummary: '',
      actionableTips: ['Mention Docker only if you have used it.'],
      syncEligible: false,
      syncReason: 'Test',
      jobTitle: 'Junior Backend Developer',
      projectAlignment: [],
      keywordGaps: ['Docker'],
    }),
  });

  await page.goto('/job-match');
  await page.getByLabel('Resume PDF').setInputFiles(FAKE_PDF);
  await expect(page.getByRole('button', { name: 'resume.pdf' })).toBeVisible();
  await page
    .getByLabel('Upload the job description as a PDF or text file')
    .setInputFiles({ name: 'job.txt', mimeType: 'text/plain', buffer: Buffer.from(JOB_TEXT) });
  await expect(page.getByLabel(/^Job description/)).toHaveValue(JOB_TEXT);
  await page.getByRole('button', { name: 'Analyze match' }).click();
  await expect(page.getByText('72').first()).toBeVisible();

  const match = calls.find((call) => call.action === 'match-job');
  expect(match?.payload.jobDescription).toBe(JOB_TEXT);
  // A .txt file is read in the browser: no AI request for it.
  expect(calls.map((call) => call.action)).toEqual(['parse-resume-pdf', 'match-job']);
});
