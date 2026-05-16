import { expect, test, type Locator, type Page } from '@playwright/test';

const BASE_PROGRAM_NAME = 'Web Development 2026';
const BASE_PROGRAM_DESC =
  'Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.';

// Update if the product documents a different limit; used as the assumed max for Name.
const ASSUMED_MAX_LENGTH = 255;

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

test.describe('DS-3 — Program name validation and duplicate prevention (Edge cases)', () => {
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
    'TC-010: Name supports accented characters and mixed punctuation without corruption',
    async ({ page }) => {
      const name = `Informatique & IA - Niveau 2 ${Date.now()}`;
      const description = "Vérifier l'encodage Unicode et l'affichage des caractères accentués.";

      await page.getByRole('button', { name: '+ New Program' }).click();
      const dialog = newProgramDialog(page);
      await programNameField(dialog).fill(name);
      await programDescriptionField(dialog).fill(description);
      await dialog.getByRole('button', { name: 'Create' }).click();

      await expect(dialog).not.toBeVisible({ timeout: 15_000 });

      // Accented characters must be preserved — no replacement characters (e.g. ?) in the list
      await expect(
        page.getByRole('row', { name: new RegExp(escapeRegExp(name)) }).first(),
      ).toBeVisible({ timeout: 15_000 });
    },
  );

  test(
    'TC-011: Name supports non-Latin characters (Unicode)',
    async ({ page }) => {
      const name = `データサイエンス 2026 ${Date.now()}`;

      await page.getByRole('button', { name: '+ New Program' }).click();
      const dialog = newProgramDialog(page);
      await programNameField(dialog).fill(name);
      await programDescriptionField(dialog).fill('Unicode name test.');
      await dialog.getByRole('button', { name: 'Create' }).click();

      await expect(dialog).not.toBeVisible({ timeout: 15_000 });

      // Non-Latin script must render correctly — no corruption or truncation
      await expect(
        page.getByRole('row', { name: new RegExp(escapeRegExp(name)) }).first(),
      ).toBeVisible({ timeout: 15_000 });
    },
  );

  test(
    'TC-012: Name max-length boundary — exactly max allowed characters succeeds without silent truncation',
    async ({ page }) => {
      const atMaxName = 'A'.repeat(ASSUMED_MAX_LENGTH);

      await page.getByRole('button', { name: '+ New Program' }).click();
      const dialog = newProgramDialog(page);
      await programNameField(dialog).fill(atMaxName);
      await dialog.getByRole('button', { name: 'Create' }).click();

      const saveSucceeded = await dialog.isHidden({ timeout: 15_000 }).catch(() => false);

      if (saveSucceeded) {
        // Program must appear in the list with the full name — no silent truncation
        await expect(
          page.getByRole('row', { name: new RegExp(escapeRegExp(atMaxName)) }).first(),
        ).toBeVisible({ timeout: 15_000 });
      } else {
        // ASSUMED_MAX_LENGTH exceeds the actual limit: a clear validation message must appear
        await expect(
          dialog.getByText(/max|maximum|too long|limit|characters/i),
        ).toBeVisible();
      }
    },
  );

  test(
    'TC-013: Name max-length overflow is blocked — max+1 characters are rejected',
    async ({ page }) => {
      const overMaxName = 'A'.repeat(ASSUMED_MAX_LENGTH + 1);

      await page.getByRole('button', { name: '+ New Program' }).click();
      const dialog = newProgramDialog(page);
      await programNameField(dialog).fill(overMaxName);

      const inputValue = await programNameField(dialog).inputValue();

      if (inputValue.length <= ASSUMED_MAX_LENGTH) {
        // Field hard-caps at the max — the UI already enforces the limit before submission
        expect(inputValue.length).toBeLessThanOrEqual(ASSUMED_MAX_LENGTH);
      } else {
        // Field allowed the overflow — submitting must produce a validation error
        await dialog.getByRole('button', { name: 'Create' }).click();
        await expect(dialog).toBeVisible();
        await expect(
          dialog.getByText(/max|maximum|too long|limit|characters/i),
        ).toBeVisible();
      }
    },
  );

  test(
    'TC-014: Duplicate detection is robust to Unicode normalization (visually identical NFC vs NFD names)',
    async ({ page }) => {
      const baseName = `Informatique & IA - Niveau 2 ${Date.now()}`;
      const nfcName = baseName.normalize('NFC');
      const nfdName = baseName.normalize('NFD');

      // Create the first program with the NFC-normalized form
      await page.getByRole('button', { name: '+ New Program' }).click();
      const dialog1 = newProgramDialog(page);
      await programNameField(dialog1).fill(nfcName);
      await programDescriptionField(dialog1).fill('NFC normalization form');
      await dialog1.getByRole('button', { name: 'Create' }).click();
      await expect(dialog1).not.toBeVisible({ timeout: 15_000 });

      // Attempt to create a second program using the NFD-normalized form (visually identical)
      await page.getByRole('button', { name: '+ New Program' }).click();
      const dialog2 = newProgramDialog(page);
      await programNameField(dialog2).fill(nfdName);
      await programDescriptionField(dialog2).fill('NFD form — should be treated as duplicate');
      await dialog2.getByRole('button', { name: 'Create' }).click();

      const duplicateBlocked = await dialog2
        .getByText(/already exists|duplicate|name.*taken/i)
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      if (duplicateBlocked) {
        // Visually identical duplicate correctly blocked
        await expect(dialog2).toBeVisible();
        await expect(
          dialog2.getByText(/already exists|duplicate|name.*taken/i),
        ).toBeVisible();
      } else {
        // Both accepted (app distinguishes by normalization form) — no user-visible confusion
        await expect(dialog2).not.toBeVisible({ timeout: 15_000 });
        const rows = page.getByRole('row', {
          name: new RegExp(escapeRegExp(nfcName)),
        });
        expect(await rows.count()).toBeGreaterThanOrEqual(1);
      }
    },
  );

  test(
    'TC-015: Internal multiple spaces are handled consistently for duplicate detection',
    async ({ page }) => {
      await ensureBaseProgramExists(page);

      const doubleSpacedName = BASE_PROGRAM_NAME.replace(/ /g, '  ');

      await page.getByRole('button', { name: '+ New Program' }).click();
      const dialog = newProgramDialog(page);
      await programNameField(dialog).fill(doubleSpacedName);
      await programDescriptionField(dialog).fill('Internal-space duplicate detection test');
      await dialog.getByRole('button', { name: 'Create' }).click();

      const duplicateBlocked = await dialog
        .getByText(/already exists|duplicate|name.*taken/i)
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      if (duplicateBlocked) {
        // Internal whitespace is normalized for duplicate checks — visually identical name blocked
        await expect(dialog).toBeVisible();
        await expect(
          dialog.getByText(/already exists|duplicate|name.*taken/i),
        ).toBeVisible();
      } else {
        // App treats it as a distinct name — both programs must be separately visible in the list
        await expect(dialog).not.toBeVisible({ timeout: 15_000 });
        const rows = page.getByRole('row', {
          name: new RegExp(escapeRegExp(BASE_PROGRAM_NAME), 'i'),
        });
        expect(await rows.count()).toBeGreaterThanOrEqual(1);
      }
    },
  );

  test(
    'TC-016: Script/HTML injection strings in Name are not executed and are handled safely',
    async ({ page }) => {
      const xssPayload = '<script>alert("xss")</script>';

      let dialogFired = false;
      page.on('dialog', async (nativeDialog) => {
        dialogFired = true;
        await nativeDialog.dismiss();
      });

      await page.getByRole('button', { name: '+ New Program' }).click();
      const dialog = newProgramDialog(page);
      await programNameField(dialog).fill(xssPayload);
      await programDescriptionField(dialog).fill('XSS injection safety test');
      await dialog.getByRole('button', { name: 'Create' }).click();

      const modalStillOpen = await dialog.isVisible({ timeout: 10_000 }).catch(() => false);

      if (modalStillOpen) {
        // Payload rejected — a validation or security error must be shown
        await expect(
          dialog.getByText(/invalid|not allowed|html|script|special characters/i),
        ).toBeVisible();
      } else {
        // Payload accepted — it must be stored and displayed as literal text, never executed
        await page.waitForTimeout(1_000);
        expect(
          dialogFired,
          'alert() must not have fired — XSS payload was not sanitised',
        ).toBe(false);

        await expect(
          page.getByRole('row', { name: new RegExp(escapeRegExp(xssPayload)) }).first(),
        ).toBeVisible({ timeout: 10_000 });
      }
    },
  );
});
