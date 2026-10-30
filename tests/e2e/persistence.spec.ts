import { readFile } from 'node:fs/promises';
import { createFirstResume, deleteDatabase, expect, resetStorage, resumeIdFromUrl, test, waitForSaved } from './helpers';

test.beforeEach(async ({ page }) => {
  await resetStorage(page);
});

test('Scenario A: a refresh restores the resume without asking anything', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await createFirstResume(page, 'Java Developer Resume');
  const id = resumeIdFromUrl(page);
  await page.getByLabel('Full name').fill('Asha Verma');
  await page.getByLabel('Target role / headline').fill('Java Developer');
  await waitForSaved(page);

  await page.reload();
  await expect(page.getByLabel('Full name')).toHaveValue('Asha Verma');
  await expect(page.getByLabel('Target role / headline')).toHaveValue('Java Developer');
  expect(resumeIdFromUrl(page)).toBe(id);
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Opening /builder without an id restores the last edited resume (deterministic).
  await page.goto('/builder');
  await expect(page).toHaveURL(new RegExp(`id=${id}`));
  await expect(page.getByLabel('Full name')).toHaveValue('Asha Verma');
});

test('Back navigation keeps the resume and never creates a new one', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await createFirstResume(page, 'Back Button Resume');
  await page.getByLabel('Full name').fill('Typed Before Leaving');
  await page.getByRole('link', { name: 'My Resumes' }).first().click();
  await expect(page.getByRole('heading', { name: 'My Resumes' })).toBeVisible();
  await page.goBack();
  await expect(page.getByLabel('Full name')).toHaveValue('Typed Before Leaving');

  // Leave the app entirely, then come back.
  await page.goto('/');
  await page.goBack();
  await expect(page.getByLabel('Full name')).toHaveValue('Typed Before Leaving');
  await page.goto('/resumes');
  await expect(page.getByRole('heading', { name: 'Back Button Resume' })).toHaveCount(1);
});

test('Scenarios B, D, E: new-resume dialog, independent new resume, and Cancel', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await createFirstResume(page, 'Java Developer Resume');
  const javaId = resumeIdFromUrl(page);
  await page.getByLabel('Full name').fill('Original Name');
  await waitForSaved(page);

  // Scenario B: the choice dialog appears.
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('menuitem', { name: 'New resume', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'What would you like to do?' })).toBeVisible();
  await expect(dialog.getByText('You already have an existing resume.')).toBeVisible();

  // Scenario E: Cancel changes nothing.
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(resumeIdFromUrl(page)).toBe(javaId);
  await expect(page.getByLabel('Full name')).toHaveValue('Original Name');

  // Scenario D: create a new, independent resume.
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('menuitem', { name: 'New resume', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Create a new resume' }).click();
  await page.getByRole('dialog').getByLabel('Resume name').fill('Full Stack Developer Resume');
  await page.getByRole('dialog').getByRole('button', { name: 'Create resume' }).click();
  await expect(page.getByLabel('Resume name')).toHaveValue('Full Stack Developer Resume');
  const fullStackId = resumeIdFromUrl(page);
  expect(fullStackId).not.toBe(javaId);
  await expect(page.getByLabel('Full name')).toHaveValue('');

  // The original is unchanged.
  await page.goto(`/builder?id=${javaId}`);
  await expect(page.getByLabel('Full name')).toHaveValue('Original Name');
  await page.goto('/resumes');
  await expect(page.getByRole('heading', { level: 2, name: /Developer Resume$/ })).toHaveCount(2);
});

test('Scenario C: "Build My Resume" → Continue opens the existing resume unchanged', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await createFirstResume(page, 'Continue Me');
  const id = resumeIdFromUrl(page);
  await page.getByLabel('Full name').fill('Still Here');
  await waitForSaved(page);

  await page.goto('/');
  await page.getByRole('button', { name: 'Build My Resume' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: /Continue “Continue Me”/ }).click();
  await expect(page).toHaveURL(new RegExp(`id=${id}`));
  await expect(page.getByLabel('Full name')).toHaveValue('Still Here');
});

test('Duplicate, edit independently, and delete one resume', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await createFirstResume(page, 'Base Resume');
  await page.getByLabel('Full name').fill('Base Person');
  await waitForSaved(page);

  await page.goto('/resumes');
  await page.getByRole('button', { name: 'Actions for Base Resume' }).click();
  await page.getByRole('menuitem', { name: 'Duplicate' }).click();
  await expect(page.getByRole('heading', { name: 'Base Resume (copy)' })).toBeVisible();

  await page.getByRole('link', { name: 'Open Base Resume (copy)' }).click();
  await page.getByLabel('Full name').fill('Copy Person');
  await waitForSaved(page);
  await page.goto('/resumes');
  await page.getByRole('link', { name: 'Open Base Resume', exact: true }).click();
  await expect(page.getByLabel('Full name')).toHaveValue('Base Person');

  await page.goto('/resumes');
  await page.getByRole('button', { name: 'Actions for Base Resume (copy)' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete resume' }).click();
  await expect(page.getByRole('heading', { name: 'Base Resume (copy)' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Base Resume', exact: true })).toBeVisible();
});

test('Scenario F: cleared storage explains itself, and a backup restores resumes', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await createFirstResume(page, 'Backed Up Resume');
  await page.getByLabel('Full name').fill('Backup Person');
  await waitForSaved(page);

  await page.goto('/resumes');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export all' }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  expect(JSON.parse(await readFile(backupPath, 'utf8')).format).toBe('ai-resume-studio-backup');

  await resetStorage(page);
  await page.goto('/resumes');
  await expect(page.getByRole('heading', { name: 'No resumes on this device yet' })).toBeVisible();
  await expect(page.getByText(/browser data may have been cleared/)).toBeVisible();

  await page.getByLabel('Backup file').setInputFiles(backupPath);
  await expect(page.getByRole('heading', { name: 'Backed Up Resume' })).toBeVisible();
  await page.getByRole('link', { name: 'Open Backed Up Resume' }).click();
  await expect(page.getByLabel('Full name')).toHaveValue('Backup Person');
});

test('A draft saved by the previous version of the app is moved over', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await page.goto('/privacy');
  await page.evaluate(() => {
    localStorage.setItem(
      'ai_resume_studio_store',
      JSON.stringify({
        state: {
          resumeData: { personalInfo: { fullName: 'Legacy User', targetRole: 'QA Engineer', email: '', phone: '', location: '', summary: '' } },
          activeTemplate: 'classic',
        },
      })
    );
  });
  // Start from a database that has never seen this browser's old draft.
  await deleteDatabase(page);
  await page.goto('/builder');
  await expect(page.getByLabel('Resume name')).toHaveValue('QA Engineer Resume');
  await expect(page.getByLabel('Full name')).toHaveValue('Legacy User');
  await expect(page.getByText(/earlier draft is now saved/)).toBeVisible();
});
