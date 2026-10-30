import { createFirstResume, expect, resetStorage, test } from './helpers';

test.beforeEach(async ({ page }) => {
  await resetStorage(page);
});

// Compared with the real screen width: mobile browsers zoom out to fit wide pages, which makes innerWidth grow too.
const noHorizontalScroll = () => document.documentElement.scrollWidth <= window.screen.width + 1;

test('Mobile: every page fits the screen without sideways scrolling', async ({ page, consoleErrors }) => {
  void consoleErrors;
  for (const path of ['/', '/resumes', '/analyzer', '/job-match', '/github', '/interview', '/settings', '/privacy']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(noHorizontalScroll), `${path} has no horizontal overflow`).toBe(true);
  }
});

test('Mobile: editor and preview tabs, and the compact menu', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await createFirstResume(page, 'Phone Resume');
  await page.getByLabel('Full name').fill('Phone Person');
  expect(await page.evaluate(noHorizontalScroll)).toBe(true);

  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(page.locator('#printable-resume-canvas').getByText('Phone Person')).toBeVisible();
  await page.getByRole('tab', { name: 'Editor' }).click();
  await expect(page.getByLabel('Full name')).toBeVisible();

  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'My Resumes' }).click();
  await expect(page.getByRole('heading', { name: 'My Resumes' })).toBeVisible();
});
