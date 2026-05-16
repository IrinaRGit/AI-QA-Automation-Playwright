import { expect, test, type Locator, type Page } from '@playwright/test';

const BASE_PROGRAM_NAME = 'Web Development 2026';
const BASE_PROGRAM_DESC =
  'Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.';
const UPDATED_DESC =
  'Full-stack curriculum updated to include Playwright end-to-end automation and CI best practices.';

// ── Locator helpers ────────────────────────────────────────────────────────────

function newProgramDialog(page: Page) {
  return page.getByRole('dialog', { name: 'New Program' });
}

function editProgramDialog(page: Page) {
  return page.getByRole('dialog', { name: /Edit Program/i });
}

function programNameField(dialog: Locator) {
  return dialog.getByRole('textbox', { name: 'Program Name' });
}

function programDescriptionField(dialog: Locator) {
  return dialog.getByRole('textbox', { name: 'Description' });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Auth ───────────────────────────────────────────────────────────────────────

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

  try {
    await expect(page).not.toHaveURL(/\/login\b/, { timeout: 30_000 });
  } catch {
    if (await page.getByText(/Invalid email or password/i).isVisible().catch(() => false)) {
      throw new Error('Login failed: invalid email or password. Check DIDAXIS_EMAIL / DIDAXIS_PASSWORD in .env.');
    }
    throw new Error('Login failed: still on /login after 30 s (check network or account state).');
  }
}

// ── Data helpers ───────────────────────────────────────────────────────────────

/**
 * Creates a program with a unique name to keep tests isolated.
 * Returns the generated program name so the caller can reference it.
 */
async function createUniqueProgram(page: Page): Promise<string> {
  const name = `${BASE_PROGRAM_NAME} ${Date.now()}`;

  await page.getByRole('button', { name: '+ New Program' }).click();
  const dialog = newProgramDialog(page);
  await dialog.getByRole('textbox', { name: 'Program Name' }).fill(name);
  await dialog.getByRole('textbox', { name: 'Description' }).fill(BASE_PROGRAM_DESC);
  await dialog.getByRole('button', { name: 'Create' }).click();

  await expect(
    page.getByRole('row', { name: new RegExp(escapeRegExp(name)) }).first(),
  ).toBeVisible({ timeout: 30_000 });

  return name;
}

/**
 * Ensures the canonical fixture program exists.
 * Used only by TC-001 which asserts known field values.
 */
async function ensureBaseProgramExists(page: Page) {
  const row = page.getByRole('row', { name: new RegExp(escapeRegExp(BASE_PROGRAM_NAME)) }).first();
  if ((await row.count()) > 0 && (await row.isVisible())) return;

  await page.getByRole('button', { name: '+ New Program' }).click();
  const dialog = newProgramDialog(page);
  await dialog.getByRole('textbox', { name: 'Program Name' }).fill(BASE_PROGRAM_NAME);
  await dialog.getByRole('textbox', { name: 'Description' }).fill(BASE_PROGRAM_DESC);
  await dialog.getByRole('button', { name: 'Create' }).click();

  await expect(
    page.getByRole('row', { name: new RegExp(escapeRegExp(BASE_PROGRAM_NAME)) }).first(),
  ).toBeVisible({ timeout: 30_000 });
}

/** Opens the Edit Program modal for the given program row and returns the dialog locator. */
async function openEditModal(page: Page, programName: string): Promise<Locator> {
  const row = page.getByRole('row', { name: new RegExp(escapeRegExp(programName)) }).first();
  await row.getByRole('button', { name: '✏️' }).click();
  const dialog = editProgramDialog(page);
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  return dialog;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

test.describe('DS-2 — Edit existing program details (Positive flows)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.DIDAXIS_URL, 'Set DIDAXIS_URL in .env');
    test.skip(
      !process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD,
      'Set DIDAXIS credentials in .env',
    );
    await login(page);
    await page.goto('/programs');
  });

  test('TC-001: Edit form opens pre-populated with the program\'s current data', async ({ page }) => {
    await ensureBaseProgramExists(page);

    const dialog = await openEditModal(page, BASE_PROGRAM_NAME);

    await expect(programNameField(dialog)).toHaveValue(BASE_PROGRAM_NAME);
    await expect(programDescriptionField(dialog)).toHaveValue(BASE_PROGRAM_DESC);
  });

  test('TC-002: Program name can be updated and reflected immediately in the list', async ({ page }) => {
    const originalName = await createUniqueProgram(page);
    const updatedName = `${originalName} - Updated`;

    const dialog = await openEditModal(page, originalName);
    await programNameField(dialog).fill(updatedName);
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('row', { name: new RegExp(escapeRegExp(updatedName)) }).first(),
    ).toBeVisible({ timeout: 15_000 });
    // Original name row must be gone — no duplicate created
    await expect(
      page.getByRole('row', { name: new RegExp(`^${escapeRegExp(originalName)}$`) }),
    ).toHaveCount(0);
  });

  test('TC-003: Updating only Description preserves Name and other fields', async ({ page }) => {
    const programName = await createUniqueProgram(page);

    const dialog = await openEditModal(page, programName);
    await programDescriptionField(dialog).fill(UPDATED_DESC);
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('row', { name: new RegExp(escapeRegExp(programName)) }).first(),
    ).toBeVisible();

    // Re-open and confirm Name is unchanged, Description is updated
    const reOpenedDialog = await openEditModal(page, programName);
    await expect(programNameField(reOpenedDialog)).toHaveValue(programName);
    await expect(programDescriptionField(reOpenedDialog)).toHaveValue(UPDATED_DESC);
  });

  test('TC-004: Save is idempotent when no changes are made', async ({ page }) => {
    const programName = await createUniqueProgram(page);

    const dialog = await openEditModal(page, programName);
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('row', { name: new RegExp(escapeRegExp(programName)) }).first(),
    ).toBeVisible();

    // Re-open and confirm all values are unchanged
    const reOpenedDialog = await openEditModal(page, programName);
    await expect(programNameField(reOpenedDialog)).toHaveValue(programName);
    await expect(programDescriptionField(reOpenedDialog)).toHaveValue(BASE_PROGRAM_DESC);
  });

  test('TC-005: Cancel closes the modal without persisting edits', async ({ page }) => {
    const programName = await createUniqueProgram(page);
    const draftName = `${programName} - Draft`;

    const dialog = await openEditModal(page, programName);
    await programNameField(dialog).fill(draftName);

    // Use Cancel button if available, otherwise fall back to the X close control
    const cancelButton = dialog.getByRole('button', { name: /^cancel$/i });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
    } else {
      await dialog.getByRole('button', { name: /close|×|✕/i }).click();
    }

    await expect(dialog).not.toBeVisible({ timeout: 10_000 });
    // Original name still visible in the list — draft was not saved
    await expect(
      page.getByRole('row', { name: new RegExp(escapeRegExp(programName)) }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('row', { name: new RegExp(escapeRegExp(draftName)) }),
    ).toHaveCount(0);

    // Re-open and confirm the stored Name is still the original
    const reOpenedDialog = await openEditModal(page, programName);
    await expect(programNameField(reOpenedDialog)).toHaveValue(programName);
  });

  test('TC-006: Leading/trailing spaces in Name are handled consistently on save', async ({ page }) => {
    const programName = await createUniqueProgram(page);
    const nameWithSpaces = `  ${programName} - Spaced  `;
    const trimmedName = nameWithSpaces.trim();

    const dialog = await openEditModal(page, programName);
    await programNameField(dialog).fill(nameWithSpaces);
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).not.toBeVisible({ timeout: 15_000 });
    // List must show the trimmed (user-friendly) name
    await expect(
      page.getByRole('row', { name: new RegExp(escapeRegExp(trimmedName)) }).first(),
    ).toBeVisible({ timeout: 15_000 });

    // Re-open and confirm stored value has no hidden leading/trailing whitespace
    const reOpenedDialog = await openEditModal(page, trimmedName);
    const storedName = await programNameField(reOpenedDialog).inputValue();
    expect(storedName.trim()).toBe(trimmedName);
    expect(storedName).toBe(storedName.trim());
  });
});
