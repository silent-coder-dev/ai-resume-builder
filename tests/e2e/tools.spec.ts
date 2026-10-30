import type { Page } from '@playwright/test';
import { expect, resetStorage, test } from './helpers';

// AI calls are mocked: these tests check the pages, not the AI provider.
const FAKE_PDF = { name: 'resume.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% test file\n') };
const JOB_PDF = { name: 'job.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% job posting\n') };

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

test('Interview prep: uploaded resume + job description PDF, with coding questions and sample code', async ({ page, context, consoleErrors }) => {
  void consoleErrors;
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const calls = await mockAi(page, {
    'parse-resume-pdf': () => PARSED_RESUME,
    'read-job-pdf': () => ({ text: JOB_TEXT, jobTitle: 'Junior Backend Developer' }),
    'interview-questions': () => ({
      jobTitle: 'Junior Backend Developer',
      roleInvolvesCoding: true,
      questions: [
        {
          id: 'q1',
          category: 'coding',
          question: 'Write a method that returns the first non-repeating character in a string.',
          requirement: 'Java',
          evidence: 'shown',
          basedOn: 'Job: Java',
          whyAsked: 'Checks core Java and problem solving.',
          answerPoints: ['Count characters in one pass', 'Return the first with count 1'],
          code: {
            language: 'Java',
            snippet: 'static Character firstUnique(String s) {\n  Map<Character, Integer> counts = new LinkedHashMap<>();\n  for (char c : s.toCharArray()) counts.merge(c, 1, Integer::sum);\n  for (var entry : counts.entrySet()) if (entry.getValue() == 1) return entry.getKey();\n  return null;\n}',
            explanation: 'One pass to count, one pass to find. O(n) time, O(k) space.',
          },
        },
        {
          id: 'q2',
          category: 'technical',
          question: 'How would you run a Spring Boot service in Docker?',
          requirement: 'Docker',
          evidence: 'gap',
          basedOn: 'Job: Docker',
          whyAsked: 'Docker is preferred for this role.',
          answerPoints: ['Explain what you know about images and containers'],
          code: null,
        },
      ],
    }),
    'interview-feedback': () => ({
      ratings: { accuracy: 4, clarity: 4, completeness: 3, communication: 4 },
      strengths: ['Correct use of a LinkedHashMap.'],
      improvements: ['State the time complexity.'],
      betterAnswerOutline: ['Explain the approach', 'Write the code', 'State the complexity'],
    }),
  });

  await page.goto('/interview');
  await page.getByLabel('Resume PDF').setInputFiles(FAKE_PDF);
  await expect(page.getByRole('button', { name: 'resume.pdf' })).toBeVisible();

  await page.getByLabel('Upload the job description as a PDF or text file').setInputFiles(JOB_PDF);
  await expect(page.getByLabel(/^Job description/)).toHaveValue(JOB_TEXT);

  await page.getByRole('button', { name: 'Prepare questions' }).click();
  await expect(page.getByRole('heading', { name: 'Questions for Junior Backend Developer' })).toBeVisible();
  await expect(page.getByText('2 of 2 test job requirements · 1 not shown on your resume')).toBeVisible();

  const request = calls.find((call) => call.action === 'interview-questions');
  expect(request?.payload.jobDescription).toBe(JOB_TEXT);
  expect(request?.payload.categories).toContain('coding');
  expect((request?.payload.resumeData as { personalInfo: { fullName: string } }).personalInfo.fullName).toBe('Riya Sen');

  const coding = page.getByRole('listitem').filter({ hasText: 'first non-repeating character' });
  await expect(coding.getByText('Coding', { exact: true })).toBeVisible();
  await expect(coding.getByText('On your resume')).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'Spring Boot service in Docker' }).getByText('Not on your resume')).toBeVisible();

  // The sample code stays hidden until asked for, so the candidate can try first.
  await expect(coding.getByText('LinkedHashMap')).toBeHidden();
  await coding.getByText('Show a sample answer and code').click();
  await expect(coding.getByText(/counts\.merge/)).toBeVisible();
  await expect(coding.getByText(/O\(n\) time/)).toBeVisible();
  await coding.getByRole('button', { name: 'Copy the Java code' }).click();
  await expect(coding.getByRole('button', { name: 'Copy the Java code' })).toHaveText(/Copied/);

  await coding.getByLabel('Your code or approach').fill('Use a LinkedHashMap to count characters, then return the first with count 1.');
  await coding.getByRole('button', { name: 'Get feedback' }).click();
  await expect(coding.getByText('Correct use of a LinkedHashMap.')).toBeVisible();
  const feedback = calls.find((call) => call.action === 'interview-feedback');
  expect(feedback?.payload).toMatchObject({ category: 'coding', jobDescription: JOB_TEXT });

  // The code block scrolls inside its box; the page never scrolls sideways on a phone.
  await page.setViewportSize({ width: 360, height: 800 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('Interview prep: a role without coding says so instead of inventing code', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await mockAi(page, {
    'parse-resume-pdf': () => PARSED_RESUME,
    'interview-questions': () => ({
      jobTitle: '',
      roleInvolvesCoding: false,
      questions: [
        { id: 'q1', category: 'behavioral', question: 'Tell me about a deadline you missed.', requirement: '', evidence: null, basedOn: 'Target role', whyAsked: '', answerPoints: [], code: null },
      ],
    }),
  });
  await page.goto('/interview');
  await page.getByLabel('Resume PDF').setInputFiles(FAKE_PDF);
  await expect(page.getByRole('button', { name: 'resume.pdf' })).toBeVisible();
  await page.getByRole('button', { name: 'Prepare questions' }).click();
  await expect(page.getByText(/No coding questions: this role does not involve writing code/)).toBeVisible();
  await expect(page.getByText('Show a sample answer')).toHaveCount(0);
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
