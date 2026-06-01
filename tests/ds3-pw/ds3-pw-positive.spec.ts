import { expect, test } from '@playwright/test';
import { BASE_PROGRAM_DESC, BASE_PROGRAM_NAME } from '../../pages/programs.constants';
import { ProgramsPage } from '../../pages/programs.page';

test.describe('DS-3 — Program name validation and duplicate prevention (Positive flows)', () => {
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
    'TC-001: Program name with special characters is accepted and program is created successfully',
    async ({ page }) => {
      const name = `Informatique & IA - Niveau 2 ${Date.now()}`;
      const description = "Programme avancé: IA appliquée, MLOps, et automatisation QA.";
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

      await programs.openNewProgram();
      await modal.fillProgramName(name);
      await modal.fillDescription(description);
      await modal.clickCreate();

      await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });
      await expect(programs.programRow(name).first()).toBeVisible({ timeout: 15_000 });
    },
  );

  test(
    'TC-002: Program name is trimmed and saved correctly when it includes leading/trailing spaces',
    async ({ page }) => {
      const baseName = `Informatique & IA - Niveau 2 ${Date.now()}`;
      const nameWithSpaces = `  ${baseName}  `;
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

      await programs.openNewProgram();
      await modal.fillProgramName(nameWithSpaces);
      await modal.fillDescription('Test trimming behavior for program names.');
      await modal.clickCreate();

      await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });
      await expect(programs.programRow(baseName).first()).toBeVisible({ timeout: 15_000 });

      const rows = programs.programRow(baseName);
      expect(await rows.count()).toBe(1);
    },
  );

  test(
    'TC-003: Program creation succeeds with a typical valid name that is not a duplicate',
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

      await programs.ensureProgramExists(BASE_PROGRAM_NAME, BASE_PROGRAM_DESC);
      await expect(programs.programRow(BASE_PROGRAM_NAME).first()).toBeVisible({ timeout: 30_000 });

      const uniqueName = `Web Development 2026 - Evening Track ${Date.now()}`;

      await programs.openNewProgram();
      await modal.fillProgramName(uniqueName);
      await modal.fillDescription('Evening cohort for working professionals.');
      await modal.clickCreate();

      await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });
      await expect(programs.programRow(uniqueName).first()).toBeVisible({ timeout: 15_000 });
      await expect(programs.duplicateNameError).not.toBeVisible();
    },
  );

  test(
    'TC-004: Single-character program name is accepted (minimum valid length)',
    async ({ page }) => {
      const singleCharName = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

      await programs.openNewProgram();
      await modal.fillProgramName(singleCharName);
      await expect(modal.createButton).toBeEnabled();
      await modal.clickCreate();

      const closed = await modal.dialog.isHidden({ timeout: 10_000 }).catch(() => false);
      if (closed) {
        await expect(programs.programRowExact(singleCharName).first()).toBeVisible({ timeout: 15_000 });
      } else {
        await expect(modal.duplicateError).toBeVisible();
      }
    },
  );
});
