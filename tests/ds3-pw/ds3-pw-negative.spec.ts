import { expect, test } from '@playwright/test';
import { BASE_PROGRAM_DESC, BASE_PROGRAM_NAME } from '../../pages/programs.constants';
import { ProgramsPage } from '../../pages/programs.page';

test.describe('DS-3 — Program name validation and duplicate prevention (Negative flows)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.DIDAXIS_URL, 'Set DIDAXIS_URL in .env');
    test.skip(
      !process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD,
      'Set DIDAXIS credentials in .env',
    );
    await new ProgramsPage(page).goto();
  });

  test(
    'TC-004: Program name with only whitespace is rejected and form is not submitted',
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

      await programs.openNewProgram();
      await modal.fillProgramName('   ');
      await modal.clickCreate();

      await expect(modal.dialog).toBeVisible();
      await expect(modal.requiredError).toBeVisible();
    },
  );

  test(
    'TC-005: Empty program name is rejected and form is not submitted',
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

      await programs.openNewProgram();
      await modal.fillProgramName('');

      const isDisabled = await modal.createButton.isDisabled().catch(() => false);
      if (isDisabled) {
        await expect(modal.createButton).toBeDisabled();
      } else {
        await modal.clickCreate();
        await expect(modal.dialog).toBeVisible();
        await expect(modal.requiredError).toBeVisible();
      }
    },
  );

  test(
    'TC-006: Exact duplicate program name is rejected with a "name already exists" error',
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

      await programs.ensureProgramExists(BASE_PROGRAM_NAME, BASE_PROGRAM_DESC);
      await expect(programs.programRow(BASE_PROGRAM_NAME).first()).toBeVisible({ timeout: 30_000 });

      await programs.openNewProgram();
      await modal.fillProgramName(BASE_PROGRAM_NAME);
      await modal.fillDescription('Duplicate name attempt');
      await modal.clickCreate();

      await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
      await expect(modal.duplicateError).toBeVisible();
      await expect(programs.programRowExact(BASE_PROGRAM_NAME)).toHaveCount(1);
    },
  );

  test(
    'TC-007: Duplicate prevention applies when name differs only by case (if case-insensitive)',
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

      await programs.ensureProgramExists(BASE_PROGRAM_NAME, BASE_PROGRAM_DESC);
      await expect(programs.programRow(BASE_PROGRAM_NAME).first()).toBeVisible({ timeout: 30_000 });

      const lowerCaseName = BASE_PROGRAM_NAME.toLowerCase();

      await programs.openNewProgram();
      await modal.fillProgramName(lowerCaseName);
      await modal.fillDescription('Case-variant duplicate attempt');
      await modal.clickCreate();

      const duplicateErrorShown = await modal.duplicateError
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      if (duplicateErrorShown) {
        await expect(modal.dialog).toBeVisible();
        await expect(modal.duplicateError).toBeVisible();
      } else {
        await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });

        const rowsInsensitive = programs.programRow(BASE_PROGRAM_NAME);
        expect(await rowsInsensitive.count()).toBeGreaterThanOrEqual(1);
      }
    },
  );

  test(
    'TC-008: Duplicate prevention applies when name differs only by leading/trailing whitespace',
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

      await programs.ensureProgramExists(BASE_PROGRAM_NAME, BASE_PROGRAM_DESC);
      await expect(programs.programRow(BASE_PROGRAM_NAME).first()).toBeVisible({ timeout: 30_000 });

      const nameWithSpaces = `  ${BASE_PROGRAM_NAME}  `;

      await programs.openNewProgram();
      await modal.fillProgramName(nameWithSpaces);
      await modal.fillDescription('Whitespace-padded duplicate attempt');
      await modal.clickCreate();

      await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
      await expect(modal.duplicateError.or(modal.requiredError)).toBeVisible();
    },
  );

  test(
    'TC-009: Server-side validation errors do not create a program or show false success',
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

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

      await programs.openNewProgram();
      await modal.fillProgramName('Informatique & IA - Niveau 2');
      await modal.fillDescription('Server error test');
      await modal.clickCreate();

      await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
      await expect(modal.serverError).toBeVisible();
      await expect(programs.programRow('Informatique & IA - Niveau 2')).toHaveCount(0);
    },
  );
});
