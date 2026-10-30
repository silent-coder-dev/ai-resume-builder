import { createFirstResume, expect, openSection, resetStorage, test, waitForSaved } from './helpers';

test.beforeEach(async ({ page }) => {
  await resetStorage(page);
});

test('AI suggestions change nothing until accepted', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await page.route('**/api/ai', async (route) => {
    const body = route.request().postDataJSON() as { action: string };
    if (body.action === 'rewrite-text') {
      await route.fulfill({ json: { result: { suggestion: 'Builds tested web apps with React.', notes: ['Add a result if you have one.'] } } });
    } else {
      await route.fallback();
    }
  });

  await createFirstResume(page, 'AI Resume');
  await openSection(page, /^Professional Summary/, 'summary');
  const summary = page.getByLabel('Summary', { exact: true });
  await summary.fill('i build web app with react');
  await waitForSaved(page);

  await page.getByRole('button', { name: /AI writing help for professional summary/ }).click();
  await page.getByRole('menuitem', { name: 'Improve writing' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('i build web app with react')).toBeVisible();
  await expect(dialog.getByLabel(/Suggestion/)).toHaveValue('Builds tested web apps with React.');
  await expect(dialog.getByText('Add a result if you have one.')).toBeVisible();

  await dialog.getByRole('button', { name: 'Reject' }).click();
  await expect(summary).toHaveValue('i build web app with react');

  await page.getByRole('button', { name: /AI writing help for professional summary/ }).click();
  await page.getByRole('menuitem', { name: 'Fix grammar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Accept suggestion' }).click();
  await expect(summary).toHaveValue('Builds tested web apps with React.');

  // Undo brings the original back.
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(summary).toHaveValue('i build web app with react');
});

test('AI usage limits show a clear message', async ({ page, consoleErrors }) => {
  // A 429 response is logged by the browser as a failed resource; that is expected here.
  consoleErrors.length = 0;
  await page.route('**/api/ai', (route) =>
    route.fulfill({ status: 429, json: { error: 'You have used today’s free AI requests (150 per day).', retryAfterSeconds: 3600 } })
  );
  await createFirstResume(page, 'Limit Resume');
  await openSection(page, /^Professional Summary/, 'summary');
  await page.getByLabel('Summary', { exact: true }).fill('Some summary text');
  await page.getByRole('button', { name: /AI writing help for professional summary/ }).click();
  await page.getByRole('menuitem', { name: 'Make concise' }).click();
  await expect(page.getByRole('dialog').getByText(/today’s free AI requests/)).toBeVisible();
  consoleErrors.length = 0;
});

test('Sections: fresher order, add/hide/reorder, custom section, and live preview', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await createFirstResume(page, 'Sections Resume');
  await page.getByLabel(/Fresher/).check();
  await page.getByRole('button', { name: 'Use recommended order' }).click();

  const nav = page.getByRole('navigation', { name: 'Resume sections' }).first();
  const labels = await nav.locator('li > button span.truncate').allInnerTexts();
  expect(labels.slice(0, 4)).toEqual([
    'Personal Information',
    'Professional Summary',
    'Education',
    'Projects',
  ]);

  // Custom section shows up on the resume once it has content.
  await nav.getByRole('button', { name: 'Add custom section' }).click();
  await page.getByLabel('New section title').fill('Volunteering');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Add entry' }).click();
  await page.getByLabel('Title', { exact: true }).fill('Weekend coding club mentor');
  const preview = page.locator('#printable-resume-canvas');
  await expect(preview.getByText('Volunteering')).toBeVisible();
  await expect(preview.getByText('Weekend coding club mentor')).toBeVisible();

  // Hiding a section removes it from the resume. On wide screens the row's
  // controls appear on hover or keyboard focus.
  await nav.getByRole('button', { name: /^Volunteering/ }).hover();
  await page.getByRole('button', { name: 'Hide Volunteering on the resume' }).click();
  await expect(preview.getByText('Weekend coding club mentor')).toHaveCount(0);
  await waitForSaved(page);
});

test('Template picker previews every template and the PDF export uses the chosen one', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await createFirstResume(page, 'Template Resume');
  await page.getByLabel('Full name').fill('Template Person');

  await page.getByRole('button', { name: /Modern Tech|Template/ }).first().click();
  const dialog = page.getByRole('dialog');
  for (const name of ['Blank Canvas', 'Executive Serif', 'Legal / Academic', 'Clinical Healthcare']) {
    await expect(dialog.getByRole('button', { name: new RegExp(name) })).toBeVisible();
  }
  await dialog.getByRole('button', { name: /Creative Sidebar/ }).click();
  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(page.locator('#printable-resume-canvas aside')).toBeVisible();
  await waitForSaved(page);

  // Stub print() so the test can see the print document.
  await page.evaluate(() => {
    const frame = document.createElement('iframe');
    frame.id = 'resume-print-iframe';
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(frame);
    (window as unknown as { printed: number }).printed = 0;
    frame.contentWindow!.print = () => {
      (window as unknown as { printed: number }).printed += 1;
    };
  });
  await page.getByRole('button', { name: 'Download PDF' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1);
  const printed = await page.evaluate(() => {
    const doc = (document.getElementById('resume-print-iframe') as HTMLIFrameElement).contentDocument!;
    return { title: doc.title, hasName: doc.body.innerText.includes('Template Person'), sidebar: !!doc.querySelector('aside'), placeholders: doc.querySelectorAll('.no-print').length };
  });
  expect(printed).toEqual({ title: 'Template_Person_Resume', hasName: true, sidebar: true, placeholders: 0 });
});

test('Keyboard: dialogs trap focus and close with Escape', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await createFirstResume(page, 'Keyboard Resume');
  const more = page.getByRole('button', { name: 'More actions' });
  await more.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'New resume', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(more).toBeFocused();

  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter'); // "New resume"
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'What would you like to do?' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
