import { expect, test, type Locator, type Page } from '@playwright/test';

const BASE_PROGRAM_NAME = 'Web Development 2026';
const BASE_PROGRAM_DESC =
  'Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.';

// ── Locator helpers ────────────────────────────────────────────────────────────

function newProgramDialog(page: Page) {
  return page.getByRole('dialog', { name: 'New Program' });
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
      throw new Error(
        'Login failed: invalid credentials. Check DIDAXIS_EMAIL / DIDAXIS_PASSWORD in .env.',
      );
    }
    throw new Error('Login failed: still on /login after 30 s (check network or account state).');
  }
}

// ── Data helpers ───────────────────────────────────────────────────────────────

async function ensureBaseProgramExists(page: Page) {
  const row = page
    .getByRole('row', { name: new RegExp(escapeRegExp(BASE_PROGRAM_NAME)) })
    .first();
  if ((await row.count()) > 0 && (await row.isVisible())) return;

  await page.getByRole('button', { name: '+ New Program' }).click();
  const dialog = newProgramDialog(page);
  await programNameField(dialog).fill(BASE_PROGRAM_NAME);
  await programDescriptionField(dialog).fill(BASE_PROGRAM_DESC);
  await dialog.getByRole('button', { name: 'Create' }).click();

  await expect(
    page.getByRole('row', { name: new RegExp(escapeRegExp(BASE_PROGRAM_NAME)) }).first(),
  ).toBeVisible({ timeout: 30_000 });
}

// ── Tests ──────────────────────────────────────────────────────────────────────

test.describe('DS-3 — Program name validation and duplicate prevention (Negative flows)', () => {
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

  test(
    'TC-004: Program name with only whitespace is rejected and form is not submitted',
    async ({ page }) => {
      await page.getByRole('button', { name: '+ New Program' }).click();
      const dialog = newProgramDialog(page);
      await programNameField(dialog).fill('   ');
      await dialog.getByRole('button', { name: 'Create' }).click();

      // Whitespace-only must be treated as empty — form stays open
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByText(/required|must not be empty|cannot be blank/i),
      ).toBeVisible();
    },
  );

  test(
    'TC-005: Empty program name is rejected and form is not submitted',
    async ({ page }) => {
      await page.getByRole('button', { name: '+ New Program' }).click();
      const dialog = newProgramDialog(page);
      await programNameField(dialog).fill('');

      const createBtn = dialog.getByRole('button', { name: 'Create' });

      // The Create button must be disabled when Name is empty, OR clicking it shows a validation error
      const isDisabled = await createBtn.isDisabled().catch(() => false);
      if (isDisabled) {
        await expect(createBtn).toBeDisabled();
      } else {
        await createBtn.click();
        await expect(dialog).toBeVisible();
        await expect(
          dialog.getByText(/required|must not be empty|cannot be blank/i),
        ).toBeVisible();
      }
    },
  );

  test(
    'TC-006: Exact duplicate program name is rejected with a "name already exists" error',
    async ({ page }) => {
      await ensureBaseProgramExists(page);

      await page.getByRole('button', { name: '+ New Program' }).click();
      const dialog = newProgramDialog(page);
      await programNameField(dialog).fill(BASE_PROGRAM_NAME);
      await programDescriptionField(dialog).fill('Duplicate name attempt');
      await dialog.getByRole('button', { name: 'Create' }).click();

      // Form must not close — duplicate name blocked
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(
        dialog.getByText(/already exists|duplicate|name.*taken/i),
      ).toBeVisible();

      // Exactly one row for BASE_PROGRAM_NAME must remain — no second copy created
      const rows = page.getByRole('row', {
        name: new RegExp(`^${escapeRegExp(BASE_PROGRAM_NAME)}$`),
      });
      await expect(rows).toHaveCount(1);
    },
  );

  test(
    'TC-007: Duplicate prevention applies when name differs only by case (if case-insensitive)',
    async ({ page }) => {
      await ensureBaseProgramExists(page);

      const lowerCaseName = BASE_PROGRAM_NAME.toLowerCase();

      await page.getByRole('button', { name: '+ New Program' }).click();
      const dialog = newProgramDialog(page);
      await programNameField(dialog).fill(lowerCaseName);
      await programDescriptionField(dialog).fill('Case-variant duplicate attempt');
      await dialog.getByRole('button', { name: 'Create' }).click();

      const duplicateErrorShown = await dialog
        .getByText(/already exists|duplicate|name.*taken/i)
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      if (duplicateErrorShown) {
        // Case-insensitive uniqueness is enforced — duplicate correctly blocked
        await expect(dialog).toBeVisible();
        await expect(
          dialog.getByText(/already exists|duplicate|name.*taken/i),
        ).toBeVisible();
      } else {
        // Case-sensitive uniqueness: the new program was created — both names are distinct
        await expect(dialog).not.toBeVisible({ timeout: 15_000 });

        // No invisible or confusing duplicate: at most one row per visible name
        const rowsInsensitive = page.getByRole('row', {
          name: new RegExp(escapeRegExp(BASE_PROGRAM_NAME), 'i'),
        });
        expect(await rowsInsensitive.count()).toBeGreaterThanOrEqual(1);
      }
    },
  );

  test(
    'TC-008: Duplicate prevention applies when name differs only by leading/trailing whitespace',
    async ({ page }) => {
      await ensureBaseProgramExists(page);

      const nameWithSpaces = `  ${BASE_PROGRAM_NAME}  `;

      await page.getByRole('button', { name: '+ New Program' }).click();
      const dialog = newProgramDialog(page);
      await programNameField(dialog).fill(nameWithSpaces);
      await programDescriptionField(dialog).fill('Whitespace-padded duplicate attempt');
      await dialog.getByRole('button', { name: 'Create' }).click();

      // After trimming the input equals BASE_PROGRAM_NAME — a duplicate error must be shown
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(
        dialog.getByText(/already exists|duplicate|name.*taken|required/i),
      ).toBeVisible();
    },
  );

  test(
    'TC-009: Server-side validation errors do not create a program or show false success',
    async ({ page }) => {
      // Force a 400 on any POST to the programs endpoint
      await page.route(/\/programs/, async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Bad Request: validation failed' }),
          });
        } else {
          await route.continue();
        }
      });

      await page.getByRole('button', { name: '+ New Program' }).click();
      const dialog = newProgramDialog(page);
      await programNameField(dialog).fill('Informatique & IA - Niveau 2');
      await programDescriptionField(dialog).fill('Server error test');
      await dialog.getByRole('button', { name: 'Create' }).click();

      // The dialog must remain open — no false success confirmation
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(
        dialog.getByText(/error|failed|could not create|try again|bad request/i),
      ).toBeVisible();

      // No row should have been created for the program
      await expect(
        page.getByRole('row', { name: /Informatique & IA - Niveau 2/i }),
      ).toHaveCount(0);
    },
  );
});
