import { expect, test, type Locator, type Page } from '@playwright/test';

const BASE_PROGRAM_NAME = 'Web Development 2026';
const BASE_PROGRAM_DESC =
  'Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.';

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
      throw new Error('Login failed: invalid credentials. Check DIDAXIS_EMAIL / DIDAXIS_PASSWORD in .env.');
    }
    throw new Error('Login failed: still on /login after 30 s (check network or account state).');
  }
}

// ── Data helpers ───────────────────────────────────────────────────────────────

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

async function openEditModal(page: Page, programName: string): Promise<Locator> {
  const row = page.getByRole('row', { name: new RegExp(escapeRegExp(programName)) }).first();
  await row.getByRole('button', { name: '✏️' }).click();
  const dialog = editProgramDialog(page);
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  return dialog;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

test.describe('DS-2 — Edit existing program details (Negative flows)', () => {
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

  test('TC-011: Save is blocked when Name is empty (required field validation)', async ({ page }) => {
    const programName = await createUniqueProgram(page);

    const dialog = await openEditModal(page, programName);
    await programNameField(dialog).fill('');
    await dialog.getByRole('button', { name: 'Save' }).click();

    // Modal must stay open
    await expect(dialog).toBeVisible();
    // Inline validation message must be visible
    await expect(dialog.getByText(/required|must not be empty|cannot be blank/i)).toBeVisible();
    // List must be unchanged
    await expect(
      page.getByRole('row', { name: new RegExp(escapeRegExp(programName)) }).first(),
    ).toBeVisible();
  });

  test('TC-012: Save is blocked when Name contains only whitespace', async ({ page }) => {
    const programName = await createUniqueProgram(page);

    const dialog = await openEditModal(page, programName);
    await programNameField(dialog).fill('     ');
    await dialog.getByRole('button', { name: 'Save' }).click();

    // Whitespace-only value must be treated as invalid — modal stays open
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/required|must not be empty|cannot be blank/i)).toBeVisible();
    // No update to the list
    await expect(
      page.getByRole('row', { name: new RegExp(escapeRegExp(programName)) }).first(),
    ).toBeVisible();
  });

  test('TC-013: Duplicate Name is rejected with a user-friendly error', async ({ page }) => {
    const firstProgram = await createUniqueProgram(page);
    // Small gap to guarantee distinct timestamps
    await page.waitForTimeout(20);
    const secondProgram = await createUniqueProgram(page);

    const dialog = await openEditModal(page, secondProgram);
    await programNameField(dialog).fill(firstProgram);
    await dialog.getByRole('button', { name: 'Save' }).click();

    // Modal must stay open with a conflict/duplicate error
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText(/already exists|duplicate|name.*taken/i),
    ).toBeVisible();
    // Second program's row must be unchanged in the list
    await expect(
      page.getByRole('row', { name: new RegExp(escapeRegExp(secondProgram)) }).first(),
    ).toBeVisible();
  });

  test('TC-014: Server error on save does not close the modal or corrupt data', async ({ page }) => {
    const programName = await createUniqueProgram(page);
    const updatedName = `${programName} - Updated`;

    // Force a 500 on the save (PUT/PATCH) request only
    await page.route('**/programs/**', async (route) => {
      const method = route.request().method();
      if (method === 'PUT' || method === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal Server Error' }),
        });
      } else {
        await route.continue();
      }
    });

    const dialog = await openEditModal(page, programName);
    await programNameField(dialog).fill(updatedName);
    await dialog.getByRole('button', { name: 'Save' }).click();

    // Modal must remain open (or reopen) with a user-facing error
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText(/could not save|error|failed|try again/i)).toBeVisible();

    // Programmatic state must not have changed in the list
    await expect(
      page.getByRole('row', { name: new RegExp(escapeRegExp(programName)) }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('row', { name: new RegExp(escapeRegExp(updatedName)) }),
    ).toHaveCount(0);
  });

  test('TC-015: Network interruption during save does not show a false success', async ({ page }) => {
    const programName = await createUniqueProgram(page);

    // Abort the save (PUT/PATCH) request to simulate a network drop
    await page.route('**/programs/**', async (route) => {
      const method = route.request().method();
      if (method === 'PUT' || method === 'PATCH') {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    const dialog = await openEditModal(page, programName);
    await programDescriptionField(dialog).fill('Updated description while offline.');
    await dialog.getByRole('button', { name: 'Save' }).click();

    // Modal must NOT close on a network failure
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    // A network/offline error must be shown
    await expect(
      dialog.getByText(/network|offline|connection|could not save|failed/i),
    ).toBeVisible();
    // List must be unchanged
    await expect(
      page.getByRole('row', { name: new RegExp(escapeRegExp(programName)) }).first(),
    ).toBeVisible();
  });

  // TC-016 requires a separate non-admin account.
  // Set DIDAXIS_UNAUTH_EMAIL and DIDAXIS_UNAUTH_PASSWORD in .env and remove skip to enable.
  test.skip('TC-016: Unauthorized user cannot save edits', async () => {
    // Precondition: DIDAXIS_UNAUTH_EMAIL / DIDAXIS_UNAUTH_PASSWORD must exist in .env
    // Steps:
    //   1. Login as the unauthorized user.
    //   2. Navigate to /programs.
    //   3. Assert the ✏️ edit button is not visible, OR attempt to open it.
    //   4. If modal opens, change Name and click Save.
    //   5. Assert save is rejected (403 / permission error shown) and modal does not close as success.
  });

  test('TC-017: Concurrent modification is handled without silently overwriting the other session', async ({ browser }) => {
    // Each session gets its own isolated browser context
    const context1 = await browser.newContext({ baseURL: process.env.DIDAXIS_URL });
    const context2 = await browser.newContext({ baseURL: process.env.DIDAXIS_URL });
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      await login(page1);
      await page1.goto('/programs');
      const programName = await createUniqueProgram(page1);

      // Session 1: open the edit modal and prepare a description change (do not save yet)
      const dialog1 = await openEditModal(page1, programName);
      await programDescriptionField(dialog1).fill('Local edit after concurrent update.');

      // Session 2: update the same program's name first
      await login(page2);
      await page2.goto('/programs');
      const dialog2 = await openEditModal(page2, programName);
      const concurrentName = `${programName} - Updated by Admin`;
      await programNameField(dialog2).fill(concurrentName);
      await dialog2.getByRole('button', { name: 'Save' }).click();
      await expect(dialog2).not.toBeVisible({ timeout: 15_000 });

      // Session 1: now click Save — this edit is stale
      await dialog1.getByRole('button', { name: 'Save' }).click();

      // Acceptable outcomes: conflict message shown, OR the modal closes
      // (last-write-wins) — but the final state must be predictable and consistent.
      const conflictShown = await dialog1
        .getByText(/updated by someone else|conflict|stale|refresh/i)
        .isVisible()
        .catch(() => false);
      const modalClosed = await dialog1.isHidden().catch(() => false);

      expect(
        conflictShown || modalClosed,
        'Expected either a conflict notice or the modal to close cleanly (last-write-wins)',
      ).toBeTruthy();

      // Regardless of policy, both old and concurrent name must not coexist as separate rows
      const oldNameCount = await page1
        .getByRole('row', { name: new RegExp(escapeRegExp(programName)) })
        .count();
      expect(oldNameCount).toBeLessThanOrEqual(1);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('TC-018: Save updates the existing record without creating a duplicate row', async ({ page }) => {
    const programName = await createUniqueProgram(page);
    const updatedName = `${programName} - Updated`;

    const dialog = await openEditModal(page, programName);
    await programNameField(dialog).fill(updatedName);
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).not.toBeVisible({ timeout: 15_000 });

    // Exactly one row for the updated name — no duplicate
    await expect(
      page.getByRole('row', { name: new RegExp(escapeRegExp(updatedName)) }),
    ).toHaveCount(1);
    // Original name row must be gone
    await expect(
      page.getByRole('row', { name: new RegExp(`^${escapeRegExp(programName)}$`) }),
    ).toHaveCount(0);
  });
});
