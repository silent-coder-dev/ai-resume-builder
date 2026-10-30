import { expect, test as base, type Page } from '@playwright/test';

// Every test starts with empty browser storage and fails on console errors
// (for example React hydration mismatches).
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, provide) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await provide(errors);
    expect(errors, 'No console errors').toEqual([]);
  },
});

export { expect };

export async function deleteDatabase(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase('ai-resume-studio');
        request.onsuccess = request.onerror = () => resolve();
      })
  );
}

export async function resetStorage(page: Page) {
  await page.goto('/privacy');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await deleteDatabase(page);
}

// Opens a section in the editor: the sidebar on wide screens, the dropdown on narrow ones.
export async function openSection(page: Page, label: RegExp, value: string) {
  const sidebarButton = page.getByRole('navigation', { name: 'Resume sections' }).getByRole('button', { name: label });
  if (await sidebarButton.first().isVisible()) await sidebarButton.first().click();
  else await page.getByLabel('Choose a section to edit').selectOption(value);
}

// Creates a blank resume through the first-run form and waits for the editor.
export async function createFirstResume(page: Page, title: string) {
  await page.goto('/builder');
  await expect(page.getByRole('heading', { name: /create your first resume/i })).toBeVisible();
  await page.getByLabel('Resume name').fill(title);
  await page.getByRole('button', { name: 'Create resume' }).click();
  await expect(page).toHaveURL(/\/builder\?id=/);
  await expect(page.getByLabel('Resume name')).toHaveValue(title);
}

export async function waitForSaved(page: Page) {
  await expect(page.getByText('All changes saved')).toBeVisible();
}

export function resumeIdFromUrl(page: Page): string {
  return new URL(page.url()).searchParams.get('id') ?? '';
}
