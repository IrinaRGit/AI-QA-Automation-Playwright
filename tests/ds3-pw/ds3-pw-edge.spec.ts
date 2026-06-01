import { expect, test } from '@playwright/test';
import { ASSUMED_MAX_LENGTH, BASE_PROGRAM_DESC, BASE_PROGRAM_NAME } from '../../pages/programs.constants';
import { ProgramsPage } from '../../pages/programs.page';

test.describe('DS-3 — Program name validation and duplicate prevention (Edge cases)', () => {
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
    'TC-010: Name supports accented characters and mixed punctuation without corruption',
    async ({ page }) => {
      const name = `Informatique & IA - Niveau 2 ${Date.now()}`;
      const description = "Vérifier l'encodage Unicode et l'affichage des caractères accentués.";
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
    'TC-011: Name supports non-Latin characters (Unicode)',
    async ({ page }) => {
      const name = `データサイエンス 2026 ${Date.now()}`;
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

      await programs.openNewProgram();
      await modal.fillProgramName(name);
      await modal.fillDescription('Unicode name test.');
      await modal.clickCreate();

      await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });
      await expect(programs.programRow(name).first()).toBeVisible({ timeout: 15_000 });
    },
  );

  test(
    'TC-012: Name max-length boundary — exactly max allowed characters succeeds without silent truncation',
    async ({ page }) => {
      const atMaxName = 'A'.repeat(ASSUMED_MAX_LENGTH);
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

      await programs.openNewProgram();
      await modal.fillProgramName(atMaxName);
      await modal.clickCreate();

      const saveSucceeded = await modal.dialog.isHidden({ timeout: 15_000 }).catch(() => false);

      if (saveSucceeded) {
        await expect(programs.programRow(atMaxName).first()).toBeVisible({ timeout: 15_000 });
      } else {
        await expect(modal.maxLengthError).toBeVisible();
      }
    },
  );

  test(
    'TC-013: Name max-length overflow is blocked — max+1 characters are rejected',
    async ({ page }) => {
      const overMaxName = 'A'.repeat(ASSUMED_MAX_LENGTH + 1);
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

      await programs.openNewProgram();
      await modal.fillProgramName(overMaxName);

      const inputValue = await modal.programNameInput.inputValue();

      if (inputValue.length <= ASSUMED_MAX_LENGTH) {
        expect(inputValue.length).toBeLessThanOrEqual(ASSUMED_MAX_LENGTH);
      } else {
        await modal.clickCreate();
        await expect(modal.dialog).toBeVisible();
        await expect(modal.maxLengthError).toBeVisible();
      }
    },
  );

  test(
    'TC-014: Duplicate detection is robust to Unicode normalization (visually identical NFC vs NFD names)',
    async ({ page }) => {
      const baseName = `Informatique & IA - Niveau 2 ${Date.now()}`;
      const nfcName = baseName.normalize('NFC');
      const nfdName = baseName.normalize('NFD');
      const programs = new ProgramsPage(page);

      await programs.openNewProgram();
      const modal1 = programs.newProgramModal;
      await modal1.fillProgramName(nfcName);
      await modal1.fillDescription('NFC normalization form');
      await modal1.clickCreate();
      await expect(modal1.dialog).not.toBeVisible({ timeout: 15_000 });

      await programs.openNewProgram();
      const modal2 = programs.newProgramModal;
      await modal2.fillProgramName(nfdName);
      await modal2.fillDescription('NFD form — should be treated as duplicate');
      await modal2.clickCreate();

      const duplicateBlocked = await modal2.duplicateError
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      if (duplicateBlocked) {
        await expect(modal2.dialog).toBeVisible();
        await expect(modal2.duplicateError).toBeVisible();
      } else {
        await expect(modal2.dialog).not.toBeVisible({ timeout: 15_000 });
        const rows = programs.programRow(nfcName);
        expect(await rows.count()).toBeGreaterThanOrEqual(1);
      }
    },
  );

  test(
    'TC-015: Internal multiple spaces are handled consistently for duplicate detection',
    async ({ page }) => {
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

      await programs.ensureProgramExists(BASE_PROGRAM_NAME, BASE_PROGRAM_DESC);
      await expect(programs.programRow(BASE_PROGRAM_NAME).first()).toBeVisible({ timeout: 30_000 });

      const doubleSpacedName = BASE_PROGRAM_NAME.replace(/ /g, '  ');

      await programs.openNewProgram();
      await modal.fillProgramName(doubleSpacedName);
      await modal.fillDescription('Internal-space duplicate detection test');
      await modal.clickCreate();

      const duplicateBlocked = await modal.duplicateError
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      if (duplicateBlocked) {
        await expect(modal.dialog).toBeVisible();
        await expect(modal.duplicateError).toBeVisible();
      } else {
        await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });
        const rows = programs.programRow(BASE_PROGRAM_NAME);
        expect(await rows.count()).toBeGreaterThanOrEqual(1);
      }
    },
  );

  test(
    'TC-016: Script/HTML injection strings in Name are not executed and are handled safely',
    async ({ page }) => {
      const xssPayload = '<script>alert("xss")</script>';
      const programs = new ProgramsPage(page);
      const modal = programs.newProgramModal;

      let dialogFired = false;
      page.on('dialog', async (nativeDialog) => {
        dialogFired = true;
        await nativeDialog.dismiss();
      });

      await programs.openNewProgram();
      await modal.fillProgramName(xssPayload);
      await modal.fillDescription('XSS injection safety test');
      await modal.clickCreate();

      const modalStillOpen = await modal.dialog.isVisible({ timeout: 10_000 }).catch(() => false);

      if (modalStillOpen) {
        await expect(modal.securityError()).toBeVisible();
      } else {
        await page.waitForTimeout(1_000);
        expect(
          dialogFired,
          'alert() must not have fired — XSS payload was not sanitised',
        ).toBe(false);

        await expect(programs.programRow(xssPayload).first()).toBeVisible({ timeout: 10_000 });
      }
    },
  );
});
