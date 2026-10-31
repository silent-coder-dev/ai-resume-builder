import type { Page } from '@playwright/test';
import { expect, resetStorage, test } from './helpers';

// AI calls and the compiler are mocked. The microphone and voice are replaced by
// small stand-ins, so these tests run anywhere and can "speak" on cue.
const FAKE_PDF = { name: 'resume.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% test file\n') };
const JOB_PDF = { name: 'job.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% job posting\n') };
const JOB_TEXT =
  'Junior Backend Developer at Example Corp. You will build REST APIs with Java and Spring Boot, write SQL queries, and deploy services with Docker. Required: Java, Spring Boot, SQL.';

const PARSED_RESUME = {
  personalInfo: { fullName: 'Riya Sen', targetRole: 'Backend Developer', email: 'riya@example.com', phone: '+91 90000 00000', location: 'Pune', summary: 'Graduate who builds backend services.' },
  skills: [{ id: '1', name: 'Java' }],
  projects: [{ id: '1', title: 'Library API', techStack: ['Java'], description: 'A REST API for a library.' }],
  education: [{ id: '1', institution: 'State University', degree: 'B.Tech', graduationYear: '2025' }],
};

type Body = { action: string; payload: Record<string, unknown> };

async function fakeSpeech(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: (utterance: SpeechSynthesisUtterance) => setTimeout(() => utterance.onend?.(new Event('end') as SpeechSynthesisEvent), 5),
        cancel: () => undefined,
        getVoices: () => [],
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      },
    });
    class FakeRecognition {
      onresult: ((event: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      start() {
        (window as unknown as { __mic: FakeRecognition }).__mic = this;
      }
      stop() {
        this.onend?.();
      }
      abort() {
        this.onend = null;
      }
    }
    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = FakeRecognition;
  });
}

const speak = (page: Page, text: string) =>
  page.evaluate((words) => {
    const mic = (window as unknown as { __mic: { onresult: (event: unknown) => void } }).__mic;
    mic.onresult({ resultIndex: 0, results: { length: 1, 0: { isFinal: true, 0: { transcript: words } } } });
  }, text);

async function mockApi(page: Page, url: string, handlers: Record<string, (payload: Record<string, unknown>) => unknown>) {
  const calls: Body[] = [];
  await page.route(url, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { result: handlers.GET?.({}) ?? { compilerAvailable: true } } });
      return;
    }
    const body = route.request().postDataJSON() as Body;
    calls.push(body);
    const handler = handlers[body.action];
    if (handler) await route.fulfill({ json: { result: handler(body.payload) } });
    else await route.fulfill({ status: 400, json: { error: `Unexpected action ${body.action}` } });
  });
  return calls;
}

const FEEDBACK = {
  spokenReply: 'Thanks, that makes sense.',
  ratings: { accuracy: 4, clarity: 4, completeness: 3, communication: 5 },
  strengths: ['You named a real project.'],
  improvements: ['Add the result you achieved.'],
  youCouldSay: 'I built the Library API with Java, and it handled [your result].',
  followUp: '',
};

test.beforeEach(async ({ page }) => {
  await resetStorage(page);
});

test('AI interview: one question at a time, spoken answers, feedback, follow-up, and a report', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await fakeSpeech(page);
  let answers = 0;
  const calls = await mockApi(page, '**/api/ai', {
    'parse-resume-pdf': () => PARSED_RESUME,
    'read-job-pdf': () => ({ text: JOB_TEXT, jobTitle: 'Junior Backend Developer' }),
    'interview-plan': () => ({
      jobTitle: 'Junior Backend Developer',
      greeting: 'Welcome Riya. We will go one question at a time.',
      closing: 'Thank you for your time.',
      questions: [
        { id: 'q1', focus: 'Introduction', question: 'Tell me about yourself.', requirement: '', evidence: null, whyAsked: '' },
        { id: 'q2', focus: 'Technical', question: 'How would you run a service in Docker?', requirement: 'Docker', evidence: 'gap', whyAsked: 'Docker is listed.' },
        { id: 'q3', focus: 'Behavioral', question: 'Tell me about a difficult deadline.', requirement: '', evidence: null, whyAsked: '' },
      ],
    }),
    'interview-answer': () => {
      answers += 1;
      return answers === 1 ? { ...FEEDBACK, followUp: 'What was the hardest part of the Library API?' } : FEEDBACK;
    },
    'interview-report': () => ({ summary: 'A solid first attempt with clear answers.', strengths: ['Clear structure'], focusAreas: ['Add results'], nextSteps: ['Practise Docker basics'] }),
  });

  await page.goto('/interview');
  await page.getByLabel('Resume PDF').setInputFiles(FAKE_PDF);
  await expect(page.getByRole('button', { name: 'resume.pdf' })).toBeVisible();
  await page.getByLabel('Upload the job description as a PDF or text file').setInputFiles(JOB_PDF);
  await expect(page.getByLabel(/^Job description/)).toHaveValue(JOB_TEXT);
  await page.getByRole('button', { name: 'Start interview' }).click();

  // Full screen, with the interviewer on stage.
  await expect(page.getByLabel('AI interview room')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement !== null)).toBe(true);
  await expect(page.getByRole('figure', { name: /AI interviewer/ })).toBeVisible();

  // The first question, answered out loud.
  await expect(page.getByRole('heading', { name: 'Tell me about yourself.' })).toBeVisible();
  const answerBox = page.getByLabel('Your answer');
  await expect(answerBox).toBeVisible();
  await speak(page, 'I am a graduate who built the Library API.');
  await expect(answerBox).toHaveValue('I am a graduate who built the Library API.');
  await page.getByRole('button', { name: 'Done answering' }).click();

  // Feedback after the answer.
  await expect(page.getByText('You could say it like this')).toBeVisible();
  await expect(page.getByText('I built the Library API with Java, and it handled [your result].')).toBeVisible();
  await expect(page.getByText('You named a real project.')).toBeVisible();

  const plan = calls.find((call) => call.action === 'interview-plan');
  expect(plan?.payload.jobDescription).toBe(JOB_TEXT);
  const firstAnswer = calls.find((call) => call.action === 'interview-answer');
  expect(firstAnswer?.payload).toMatchObject({ answer: 'I am a graduate who built the Library API.', allowFollowUp: true, jobDescription: JOB_TEXT });

  // The interviewer probes with a follow-up, then moves on.
  await page.getByRole('button', { name: 'Continue: one follow-up question' }).click();
  await expect(page.getByRole('heading', { name: 'What was the hardest part of the Library API?' })).toBeVisible();
  await answerBox.fill('The search was hard.');
  await page.getByRole('button', { name: 'Done answering' }).click();
  await expect(page.getByRole('button', { name: 'Next question' })).toBeVisible();
  const followUpAnswer = calls.filter((call) => call.action === 'interview-answer')[1];
  expect(followUpAnswer.payload.allowFollowUp).toBe(false);
  await page.getByRole('button', { name: 'Next question' }).click();

  // A gap in the resume is labelled, and a question can be skipped.
  await expect(page.getByRole('heading', { name: 'How would you run a service in Docker?' })).toBeVisible();
  await expect(page.getByText('Not on your resume')).toBeVisible();
  await expect(page.getByLabel('Your answer')).toBeVisible();
  await page.getByRole('button', { name: 'Skip' }).click();

  await expect(page.getByRole('heading', { name: 'Tell me about a difficult deadline.' })).toBeVisible();
  await expect(page.getByLabel('Your answer')).toBeVisible();
  await page.getByRole('button', { name: 'Done answering' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Say or type an answer first' })).toBeVisible();
  await answerBox.fill('I planned the work and met it.');
  await page.getByRole('button', { name: 'Done answering' }).click();
  await page.getByRole('button', { name: 'Finish interview' }).click();

  // The report, back in the normal page.
  await expect(page.getByRole('heading', { name: 'Junior Backend Developer' })).toBeVisible();
  await expect(page.getByLabel('AI interview room')).toBeHidden();
  await expect(page.getByText('A solid first attempt with clear answers.')).toBeVisible();
  // Three answers at 80 out of 100, one skipped at zero.
  await expect(page.getByText('60', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement !== null)).toBe(false);
});

test('AI interview: typing still works if the AI fails during an answer, and the interview can end early', async ({ page, consoleErrors }) => {
  await fakeSpeech(page);
  await page.route('**/api/ai', async (route) => {
    const body = route.request().postDataJSON() as Body;
    if (body.action === 'parse-resume-pdf') await route.fulfill({ json: { result: PARSED_RESUME } });
    else if (body.action === 'interview-plan') {
      await route.fulfill({
        json: {
          result: {
            jobTitle: '',
            greeting: 'Welcome.',
            closing: 'Thanks.',
            questions: [
              { id: 'q1', focus: 'Technical', question: 'First question?', requirement: '', evidence: null, whyAsked: '' },
              { id: 'q2', focus: 'Technical', question: 'Second question?', requirement: '', evidence: null, whyAsked: '' },
            ],
          },
        },
      });
    } else if (body.action === 'interview-answer') await route.fulfill({ status: 503, json: { error: 'The AI service is temporarily busy.' } });
    else await route.fulfill({ status: 503, json: { error: 'busy' } });
  });

  await page.goto('/interview');
  await page.getByLabel('Resume PDF').setInputFiles(FAKE_PDF);
  await expect(page.getByRole('button', { name: 'resume.pdf' })).toBeVisible();
  await page.getByRole('button', { name: 'Start interview' }).click();
  await expect(page.getByRole('heading', { name: 'First question?' })).toBeVisible();
  await page.getByLabel('Your answer').fill('My typed answer.');
  await page.getByRole('button', { name: 'Done answering' }).click();
  await expect(page.getByText('The AI service is temporarily busy.')).toBeVisible();
  await expect(page.getByLabel('Your answer')).toHaveValue('My typed answer.');
  await page.getByRole('button', { name: 'Continue without feedback' }).click();
  await expect(page.getByRole('heading', { name: 'Second question?' })).toBeVisible();

  await page.getByRole('button', { name: 'End', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'End interview' }).click();
  await expect(page.getByText('Interview report')).toBeVisible();
  await expect(page.getByText('The written summary isn’t available right now.')).toBeVisible();
  // These 503 responses are expected here.
  consoleErrors.length = 0;
});

const MCQ_START = {
  seconds: 300,
  negativeMark: 0.5,
  sealed: 'sealed-mcq',
  questions: [
    { id: 'q1', topic: 'Indian Polity', question: 'How many fundamental duties are there?', code: '', options: ['9', '10', '11', '12'] },
    { id: 'q2', topic: 'Geography', question: 'Which is the longest river in India?', code: '', options: ['Ganga', 'Godavari', 'Krishna', 'Narmada'] },
    { id: 'q3', topic: 'Geography', question: 'Capital of Kerala?', code: '', options: ['Kochi', 'Kozhikode', 'Thiruvananthapuram', 'Thrissur'] },
  ],
};

const MCQ_GRADE = {
  correct: 1,
  wrong: 1,
  unanswered: 1,
  score: 0.5,
  total: 3,
  negativeMark: 0.5,
  onTime: true,
  items: [
    { id: 'q1', chosen: 2, answer: 2, correct: true, explanation: 'There are 11 fundamental duties.' },
    { id: 'q2', chosen: 1, answer: 0, correct: false, explanation: 'The Ganga is the longest.' },
    { id: 'q3', chosen: null, answer: 2, correct: false, explanation: 'Thiruvananthapuram is the capital.' },
  ],
};

async function openTrack(page: Page, tab: string, title: string) {
  await page.goto('/assessment');
  await page.getByRole('tab', { name: tab }).click();
  await page.getByRole('button', { name: new RegExp(title) }).click();
  await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
}

test('Assessment: a government MCQ test with protection, warnings, and answer review', async ({ page, consoleErrors }) => {
  void consoleErrors;
  const calls = await mockApi(page, '**/api/assessment', {
    'mcq-start': () => MCQ_START,
    'mcq-submit': () => MCQ_GRADE,
  });

  await openTrack(page, 'Government Exams', 'SSC CGL');
  await page.getByRole('button', { name: 'Indian Polity', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start test' })).toBeDisabled();
  await page.getByLabel('I understand and I’m ready to start.').check();
  await page.getByRole('button', { name: 'Start test' }).click();

  const shell = page.getByLabel('Protected test: SSC CGL');
  await expect(shell).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement !== null)).toBe(true);
  await expect(page.getByRole('timer', { name: 'Time left' })).toBeVisible();
  expect(calls[0].payload).toMatchObject({ trackId: 'ssc-cgl', topics: ['Indian Polity'] });

  // The answer key is nowhere in what the browser received.
  expect(JSON.stringify(MCQ_START)).not.toContain('answer');

  await page.getByRole('radio', { name: '11' }).check();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('radio', { name: 'Godavari' }).check();
  await page.getByRole('button', { name: 'Review later' }).click();
  await expect(page.getByText('2 of 3 answered')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Question 2, answered, marked for review' })).toBeVisible();
  await page.getByRole('button', { name: 'Question 1, answered' }).click();
  await expect(page.getByRole('radio', { name: '11' })).toBeChecked();

  // Switching away is noticed once, however many events fire.
  await page.waitForTimeout(1700);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const warning = page.getByRole('dialog').filter({ hasText: 'Warning 1 of 3' });
  await expect(warning).toBeVisible();
  await warning.getByRole('button', { name: 'Back to the test' }).click();

  // Leaving full screen hides the test until the candidate returns.
  await page.waitForTimeout(1700);
  await page.evaluate(() => document.exitFullscreen());
  await expect(page.getByRole('heading', { name: 'You left full screen' })).toBeVisible();
  await page.getByRole('button', { name: 'Return to the test' }).click();
  await expect(page.getByRole('heading', { name: 'You left full screen' })).toBeHidden();

  // Copying and the right-click menu are blocked.
  const blocked = await page.evaluate(() => {
    const copy = new Event('copy', { bubbles: true, cancelable: true });
    const menu = new Event('contextmenu', { bubbles: true, cancelable: true });
    document.body.dispatchEvent(copy);
    document.body.dispatchEvent(menu);
    return copy.defaultPrevented && menu.defaultPrevented;
  });
  expect(blocked).toBe(true);

  await page.getByRole('button', { name: 'Finish test' }).first().click();
  const confirm = page.getByRole('dialog').filter({ hasText: 'Finish this test?' });
  await expect(confirm.getByText('1 question is not answered.')).toBeVisible();
  await confirm.getByRole('button', { name: 'Finish test' }).click();

  await expect(page.getByText('Test results')).toBeVisible();
  await expect(page.getByText('17%')).toBeVisible();
  await expect(page.getByText('1 correct · 1 wrong · 1 not answered · −0.5 per wrong answer')).toBeVisible();
  await expect(page.getByText('There are 11 fundamental duties.')).toBeVisible();
  await expect(page.getByText('Left full screen')).toBeVisible();
  const submit = calls.find((call) => call.action === 'mcq-submit');
  expect(submit?.payload).toEqual({ sealed: 'sealed-mcq', answers: { q1: 2, q2: 1 } });
  await expect.poll(() => page.evaluate(() => document.fullscreenElement !== null)).toBe(false);

  // The attempt is listed afterwards.
  await page.getByRole('button', { name: 'Back to all tests' }).click();
  await expect(page.getByRole('heading', { name: 'Your recent tests' })).toBeVisible();
  await expect(page.getByText('17%')).toBeVisible();
});

test('Assessment: three warnings end the test automatically', async ({ page, consoleErrors }) => {
  void consoleErrors;
  const calls = await mockApi(page, '**/api/assessment', { 'mcq-start': () => MCQ_START, 'mcq-submit': () => MCQ_GRADE });
  await openTrack(page, 'Engineering & CS', 'Java & OOP');
  await page.getByLabel('I understand and I’m ready to start.').check();
  await page.getByRole('button', { name: 'Start test' }).click();
  await expect(page.getByRole('timer', { name: 'Time left' })).toBeVisible();

  for (const count of [1, 2, 3]) {
    await page.waitForTimeout(1700);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    if (count < 3) {
      const warning = page.getByRole('dialog').filter({ hasText: `Warning ${count} of 3` });
      await expect(warning).toBeVisible();
      await warning.getByRole('button', { name: 'Back to the test' }).click();
    }
  }
  await expect(page.getByText('The test ended automatically after too many warnings.')).toBeVisible();
  expect(calls.some((call) => call.action === 'mcq-submit')).toBe(true);
});

test('Assessment: a test in progress survives a reload, and the reload is recorded', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await mockApi(page, '**/api/assessment', { 'mcq-start': () => MCQ_START, 'mcq-submit': () => MCQ_GRADE });
  await openTrack(page, 'Placement Aptitude', 'Quantitative Aptitude');
  await page.getByLabel('I understand and I’m ready to start.').check();
  await page.getByRole('button', { name: 'Start test' }).click();
  await page.getByRole('radio', { name: '11' }).check();

  page.once('dialog', (dialog) => void dialog.accept());
  await page.reload();
  await expect(page.getByText('You have a test in progress: Quantitative Aptitude')).toBeVisible();
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByText('Warnings 1/3')).toBeVisible();
  await expect(page.getByRole('radio', { name: '11' })).toBeChecked();
});

test('Assessment: coding round with public and hidden tests', async ({ page, context, consoleErrors }) => {
  void consoleErrors;
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const publicResults = [{ input: '1 2', expected: '3', verdict: 'passed', stdout: '3\n', stderr: '' }];
  const calls = await mockApi(page, '**/api/assessment', {
    GET: () => ({ compilerAvailable: true }),
    'coding-start': () => ({
      seconds: 1800,
      sealed: 'sealed-coding',
      problem: {
        title: 'Add Two Numbers',
        statement: 'Read two integers and print their sum.',
        inputFormat: 'Two integers.',
        outputFormat: 'Their sum.',
        constraints: ['Small numbers'],
        examples: [{ input: '1 2', expected: '3' }],
        hiddenCount: 3,
      },
    }),
    'coding-run': () => ({ public: publicResults }),
    'coding-submit': () => ({
      public: publicResults,
      hidden: [{ verdict: 'passed' }, { verdict: 'wrong_answer' }, { verdict: 'time_limit' }],
      passed: 2,
      total: 4,
      incomplete: false,
      accepted: false,
      onTime: true,
    }),
    review: () => ({ approach: 'Read both numbers and add them.', reference: 'print(sum(map(int, input().split())))', referenceLanguage: 'Python 3' }),
  });

  await openTrack(page, 'Engineering & CS', 'Coding Round');
  await page.getByRole('button', { name: 'Arrays', exact: true }).click();
  await page.getByLabel('Language').selectOption('java');
  await page.getByLabel('I understand and I’m ready to start.').check();
  await page.getByRole('button', { name: 'Start test' }).click();

  await expect(page.getByRole('heading', { name: 'Add Two Numbers' })).toBeVisible();
  await expect(page.getByText('Submit also runs 3 hidden tests.')).toBeVisible();

  // Starter code in the chosen language; all five languages are offered.
  const exam = page.getByLabel('Protected test: Coding Round');
  const editor = page.locator('.cm-content');
  await expect(editor).toContainText('public class Main');
  await expect(exam.getByLabel('Language').locator('option')).toHaveText(['Python 3', 'Java', 'C', 'C++', 'C#']);

  // Pasting from outside is blocked; typing works.
  await editor.click();
  await page.evaluate(() => navigator.clipboard.writeText('PASTED_FROM_OUTSIDE'));
  await page.keyboard.press('Control+V');
  await expect(editor).not.toContainText('PASTED_FROM_OUTSIDE');
  await page.keyboard.type('// my code');
  await expect(editor).toContainText('// my code');

  // Each language keeps its own code.
  await exam.getByLabel('Language').selectOption('python');
  await expect(editor).toContainText('sys.stdin');
  await exam.getByLabel('Language').selectOption('java');
  await expect(editor).toContainText('// my code');

  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.getByText('Public test 1')).toBeVisible();
  const run = calls.find((call) => call.action === 'coding-run');
  expect(run?.payload).toMatchObject({ sealed: 'sealed-coding', language: 'java' });
  expect(String(run?.payload.source)).toContain('// my code');

  await page.getByRole('button', { name: 'Submit code' }).click();
  await expect(page.getByText('2 of 4 tests passed')).toBeVisible();
  await expect(page.getByText('Hidden test 2')).toBeVisible();
  await expect(page.getByText('Time limit exceeded')).toBeVisible();

  await page.getByRole('button', { name: 'Finish test' }).first().click();
  await page.getByRole('dialog').filter({ hasText: 'Finish this test?' }).getByRole('button', { name: 'Finish test' }).click();
  await expect(page.getByText('50%')).toBeVisible();
  await expect(page.getByText('Read both numbers and add them.')).toBeVisible();
});

test('Assessment: the coding round says so when no compiler is set up', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await mockApi(page, '**/api/assessment', { GET: () => ({ compilerAvailable: false }) });
  await openTrack(page, 'Engineering & CS', 'Coding Round');
  await expect(page.getByText('The compiler isn’t set up on this site yet.')).toBeVisible();
  await page.getByLabel('I understand and I’m ready to start.').check();
  await expect(page.getByRole('button', { name: 'Start test' })).toBeDisabled();
});

test('Assessment: SQL round with a compiler and a hidden data set', async ({ page, consoleErrors }) => {
  void consoleErrors;
  const calls = await mockApi(page, '**/api/assessment', {
    'sql-start': () => ({
      seconds: 900,
      sealed: 'sealed-sql',
      problem: {
        title: 'Top Earner',
        question: 'Return the name of the highest-paid employee.',
        schema: 'CREATE TABLE staff (name TEXT, pay INT);',
        tables: [{ name: 'staff', columns: ['name', 'pay'], rows: [['Asha', 5], ['Ravi', 9]] }],
        expected: { columns: ['name'], rows: [['Ravi']] },
        orderMatters: false,
      },
    }),
    'sql-run': () => ({ error: null, columns: ['name'], rows: [['Ravi']], matches: true }),
    'sql-submit': () => ({ error: null, columns: ['name'], rows: [['Ravi']], matches: true, hiddenPassed: false, accepted: false, onTime: true }),
    review: () => ({ approach: 'Sort by pay.', reference: 'SELECT name FROM staff ORDER BY pay DESC LIMIT 1', referenceLanguage: 'SQL' }),
  });

  await openTrack(page, 'Engineering & CS', 'SQL Round');
  await page.getByLabel('I understand and I’m ready to start.').check();
  await page.getByRole('button', { name: 'Start test' }).click();
  await expect(page.getByRole('heading', { name: 'Top Earner' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'staff', exact: true })).toBeVisible();

  await page.locator('.cm-content').click();
  await page.keyboard.press('Control+End');
  await page.keyboard.type('name FROM staff ORDER BY pay DESC LIMIT 1');
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.getByText('Matches the expected result')).toBeVisible();
  expect(calls.find((call) => call.action === 'sql-run')?.payload.query).toContain('ORDER BY pay');

  await page.getByRole('button', { name: 'Submit query' }).click();
  await expect(page.getByText('Hidden data set: Failed')).toBeVisible();

  await page.getByRole('button', { name: 'Finish test' }).first().click();
  await page.getByRole('dialog').filter({ hasText: 'Finish this test?' }).getByRole('button', { name: 'Finish test' }).click();
  await expect(page.getByText('50%')).toBeVisible();
  await expect(page.getByText('Hidden data failed')).toBeVisible();
});
