import { expect, type Locator, type Page } from '@playwright/test';
import { waitForCreatedProgramId } from './cleanup.fixture';

export const PROGRAM_DESC = 'Full-stack web development program';

export function newProgramDialog(page: Page) {
  return page.getByRole('dialog', { name: 'New Program' });
}

export function programNameField(dialog: Locator) {
  return dialog.getByRole('textbox', { name: 'Program Name' });
}

export function programDescriptionField(dialog: Locator) {
  return dialog.getByRole('textbox', { name: 'Description' });
}

export function createButton(dialog: Locator) {
  return dialog.getByRole('button', { name: 'Create' });
}

export function cancelButton(dialog: Locator) {
  return dialog.getByRole('button', { name: /^cancel$/i });
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function programRow(page: Page, name: string) {
  return page.getByRole('row', { name: new RegExp(escapeRegExp(name)) });
}

export async function login(page: Page) {
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
      throw new Error('Login failed: invalid credentials. Check DIDAXIS_EMAIL / DIDAXIS_PASSWORD in .env.');
    }
    throw new Error('Login failed: still on /login after 30 s (check network or account state).');
  }
}

export async function openNewProgramModal(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: '+ New Program' }).click();
  const dialog = newProgramDialog(page);
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  return dialog;
}

export async function createProgram(
  page: Page,
  trackProgram: (uuid: string) => void,
  name: string,
  description?: string,
): Promise<void> {
  const dialog = await openNewProgramModal(page);
  await programNameField(dialog).fill(name);
  if (description !== undefined) {
    await programDescriptionField(dialog).fill(description);
  }

  const idPromise = waitForCreatedProgramId(page);
  await createButton(dialog).click();
  trackProgram(await idPromise);

  await expect(programRow(page, name).first()).toBeVisible({ timeout: 30_000 });
}

export async function closeDialogWithoutSaving(dialog: Locator): Promise<void> {
  const cancel = cancelButton(dialog);
  if (await cancel.isVisible()) {
    await cancel.click();
  } else {
    await dialog.getByRole('button', { name: /close|×|✕/i }).click();
  }
}
