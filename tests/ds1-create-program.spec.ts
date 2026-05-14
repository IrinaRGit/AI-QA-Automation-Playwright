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

async function login(page: Page) {
  if (!process.env.DIDAXIS_URL) {
    throw new Error('Set DIDAXIS_URL in .env (e.g. https://test.didaxis.studio)');
  }
  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  if (!email || !password) {
    throw new Error('Set DIDAXIS_EMAIL and DIDAXIS_PASSWORD in .env');
  }

  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  const invalidCreds = page.getByText(/Invalid email or password/i);
  try {
    await expect(page).not.toHaveURL(/\/login\b/, { timeout: 30_000 });
  } catch {
    if (await invalidCreds.isVisible().catch(() => false)) {
      throw new Error(
        'Login failed: invalid email or password. Set DIDAXIS_EMAIL and DIDAXIS_PASSWORD in .env to match test.didaxis.studio.',
      );
    }
    throw new Error('Login failed: still on /login after 30s (check network or account state).');
  }
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
    await login(page);
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
