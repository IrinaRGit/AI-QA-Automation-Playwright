import { expect, test, type Locator, type Page } from '@playwright/test';

const PROGRAM_NAME = 'Web Development 2026';
const PROGRAM_DESC =
  'Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.';

function newProgramDialog(page: Page) {
  return page.getByRole('dialog', { name: 'New Program' });
}

function editProgramDialog(page: Page) {
  return page.getByRole('dialog', { name: /Edit Program/i });
}

/** Program create/edit modals use these accessible names (Didaxis Studio). */
function programNameField(dialog: Locator) {
  return dialog.getByRole('textbox', { name: 'Program Name' });
}

function programDescriptionField(dialog: Locator) {
  return dialog.getByRole('textbox', { name: 'Description' });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function fillNewProgramForm(dialog: Locator, name: string, description: string) {
  await programNameField(dialog).fill(name);
  await programDescriptionField(dialog).fill(description);
}

async function ensureProgramExists(page: Page) {
  const row = page.getByRole('row', { name: new RegExp(PROGRAM_NAME) }).first();
  if ((await row.count()) > 0 && (await row.isVisible())) {
    return;
  }

  await page.getByRole('button', { name: '+ New Program' }).click();
  const createDialog = newProgramDialog(page);
  await fillNewProgramForm(createDialog, PROGRAM_NAME, PROGRAM_DESC);
  await createDialog.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('row', { name: new RegExp(PROGRAM_NAME) }).first()).toBeVisible({
    timeout: 30_000,
  });
}

test.describe('Didaxis Studio — programs', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.DIDAXIS_URL, 'Set DIDAXIS_URL in .env');
    test.skip(!process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD, 'Set DIDAXIS credentials in .env');
    await page.goto('/programs');
  });

  test('creates a new program with a unique name', async ({ page }) => {
    const uniqueName = `QA Program ${Date.now()}`;
    const uniqueDescription = `Automated test program created at ${Date.now()}.`;

    await page.getByRole('button', { name: '+ New Program' }).click();
    const createDialog = newProgramDialog(page);
    await fillNewProgramForm(createDialog, uniqueName, uniqueDescription);
    await createDialog.getByRole('button', { name: 'Create' }).click();

    await expect(
      page.getByRole('row', { name: new RegExp(escapeRegExp(uniqueName)) }).first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test('TC-001: Edit form opens pre-populated with the program’s current data', async ({ page }) => {
    await ensureProgramExists(page);

    const row = page.getByRole('row', { name: new RegExp(PROGRAM_NAME) }).first();
    await row.getByRole('button', { name: '✏️' }).click();

    const dialog = editProgramDialog(page);
    await expect(dialog.getByRole('heading', { name: /Edit Program/i })).toBeVisible();

    await expect(programNameField(dialog)).toHaveValue(PROGRAM_NAME);
    await expect(programDescriptionField(dialog)).toHaveValue(PROGRAM_DESC);
  });
});
