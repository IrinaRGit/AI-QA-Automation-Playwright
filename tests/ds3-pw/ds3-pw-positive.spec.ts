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

test.describe('DS-3 — Program name validation and duplicate prevention (Positive flows)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.DIDAXIS_URL, 'Set DIDAXIS_URL in .env');
    test.skip(
      !process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD,
      'Set DIDAXIS credentials in .env',
    );
    await page.goto('/programs');
  });

  test(
    'TC-001: Program name with special characters is accepted and program is created successfully',
    async ({ page }) => {
      const name = `Informatique & IA - Niveau 2 ${Date.now()}`;
      const description = "Programme avancé: IA appliquée, MLOps, et automatisation QA.";

      await page.getByRole('button', { name: '+ New Program' }).click();
      const dialog = newProgramDialog(page);
      await programNameField(dialog).fill(name);
      await programDescriptionField(dialog).fill(description);
      await dialog.getByRole('button', { name: 'Create' }).click();

      await expect(dialog).not.toBeVisible({ timeout: 15_000 });
      await expect(
        page.getByRole('row', { name: new RegExp(escapeRegExp(name)) }).first(),
      ).toBeVisible({ timeout: 15_000 });
    },
  );

  test(
    'TC-002: Program name is trimmed and saved correctly when it includes leading/trailing spaces',
    async ({ page }) => {
      const baseName = `Informatique & IA - Niveau 2 ${Date.now()}`;
      const nameWithSpaces = `  ${baseName}  `;

      await page.getByRole('button', { name: '+ New Program' }).click();
      const dialog = newProgramDialog(page);
      await programNameField(dialog).fill(nameWithSpaces);
      await programDescriptionField(dialog).fill('Test trimming behavior for program names.');
      await dialog.getByRole('button', { name: 'Create' }).click();

      await expect(dialog).not.toBeVisible({ timeout: 15_000 });

      // The list must show the trimmed (user-friendly) name — no hidden whitespace duplicates
      await expect(
        page.getByRole('row', { name: new RegExp(escapeRegExp(baseName)) }).first(),
      ).toBeVisible({ timeout: 15_000 });

      const rows = page.getByRole('row', { name: new RegExp(escapeRegExp(baseName)) });
      expect(await rows.count()).toBe(1);
    },
  );

  test(
    'TC-003: Program creation succeeds with a typical valid name that is not a duplicate',
    async ({ page }) => {
      await ensureBaseProgramExists(page);

      const uniqueName = `Web Development 2026 - Evening Track ${Date.now()}`;

      await page.getByRole('button', { name: '+ New Program' }).click();
      const dialog = newProgramDialog(page);
      await programNameField(dialog).fill(uniqueName);
      await programDescriptionField(dialog).fill('Evening cohort for working professionals.');
      await dialog.getByRole('button', { name: 'Create' }).click();

      await expect(dialog).not.toBeVisible({ timeout: 15_000 });
      await expect(
        page.getByRole('row', { name: new RegExp(escapeRegExp(uniqueName)) }).first(),
      ).toBeVisible({ timeout: 15_000 });

      // No duplicate-name error should have appeared
      await expect(page.getByText(/already exists|duplicate|name.*taken/i)).not.toBeVisible();
    },
  );

  test(
    'TC-004: Single-character program name is accepted (minimum valid length)',
    async ({ page }) => {
      // Random A–Z letter to reduce collision risk across repeated runs
      const singleCharName = String.fromCharCode(65 + Math.floor(Math.random() * 26));

      await page.getByRole('button', { name: '+ New Program' }).click();
      const dialog = newProgramDialog(page);
      await programNameField(dialog).fill(singleCharName);

      // Create button must be enabled as soon as a single character is present
      await expect(dialog.getByRole('button', { name: 'Create' })).toBeEnabled();

      await dialog.getByRole('button', { name: 'Create' }).click();

      // Two outcomes: new program created (unique letter) OR duplicate error (letter already exists)
      const closed = await dialog.isHidden({ timeout: 10_000 }).catch(() => false);
      if (closed) {
        await expect(
          page
            .getByRole('row', { name: new RegExp(`^${escapeRegExp(singleCharName)}$`) })
            .first(),
        ).toBeVisible({ timeout: 15_000 });
      } else {
        // A single-character name is structurally valid — only a pre-existing duplicate is acceptable
        await expect(dialog.getByText(/already exists|duplicate|name.*taken/i)).toBeVisible();
      }
    },
  );
});
