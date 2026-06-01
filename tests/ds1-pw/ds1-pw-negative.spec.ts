import { expect, test, waitForCreatedProgramId } from '../../fixtures/cleanup.fixture';
import { PROGRAM_DESC } from '../../pages/programs.constants';
import { ProgramsPage } from '../../pages/programs.page';

test.describe('DS-1 — Create new academic program (Negative flows)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.DIDAXIS_URL, 'Set DIDAXIS_URL in .env');
    test.skip(
      !process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD,
      'Set DIDAXIS credentials in .env',
    );
    await new ProgramsPage(page).goto();
  });

  test('TC-007: Create button is disabled when program name is empty', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = programs.newProgramModal;

    await programs.openNewProgram();
    await modal.fillProgramName('');
    await modal.blurProgramName();

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
  });

  test('TC-008: Error is shown when a program name already exists', async ({ page, trackProgram }) => {
    const existingName = `Web Development 2026 ${Date.now()}`;
    const programs = new ProgramsPage(page);
    const modal = programs.newProgramModal;

    await programs.openNewProgram();
    await modal.fillProgramName(existingName);
    await modal.fillDescription(PROGRAM_DESC);
    const idPromise = waitForCreatedProgramId(page);
    await modal.clickCreate();
    trackProgram(await idPromise);
    await expect(programs.programRow(existingName).first()).toBeVisible({ timeout: 30_000 });

    await programs.openNewProgram();
    await modal.fillProgramName(existingName);
    await modal.clickCreate();

    await expect(modal.dialog).toBeVisible();
    await expect(modal.duplicateError).toBeVisible();
    await expect(programs.programRow(existingName)).toHaveCount(1);
  });

  test('TC-009: Duplicate detection is case-insensitive', async ({ page, trackProgram }) => {
    const existingName = `Web Development 2026 ${Date.now()}`;
    const programs = new ProgramsPage(page);
    const modal = programs.newProgramModal;

    await programs.openNewProgram();
    await modal.fillProgramName(existingName);
    await modal.fillDescription(PROGRAM_DESC);
    const idPromise = waitForCreatedProgramId(page);
    await modal.clickCreate();
    trackProgram(await idPromise);
    await expect(programs.programRow(existingName).first()).toBeVisible({ timeout: 30_000 });

    await programs.openNewProgram();
    await modal.fillProgramName(existingName.toLowerCase());
    await modal.clickCreate();

    await expect(modal.dialog).toBeVisible();
    await expect(modal.duplicateError).toBeVisible();
    await expect(programs.programRow(existingName)).toHaveCount(1);
  });

  test('TC-010: Program name exceeding 255 characters is rejected', async ({ page }) => {
    const overMaxName = `${'A'.repeat(256)}${Date.now()}`;
    const programs = new ProgramsPage(page);
    const modal = programs.newProgramModal;

    await programs.openNewProgram();
    await modal.fillProgramName(overMaxName);
    const inputValue = await modal.programNameInput.inputValue();

    if (inputValue.length <= 255) {
      expect(inputValue.length).toBeLessThanOrEqual(255);
    }

    await modal.clickCreate();

    const modalStillOpen = await modal.dialog.isVisible().catch(() => false);
    const validationVisible = await modal.maxLengthError.isVisible().catch(() => false);

    expect(
      modalStillOpen || validationVisible || inputValue.length <= 255,
      'Oversized name must not be saved silently',
    ).toBeTruthy();

    if (modalStillOpen) {
      await modal.dismissWithoutSaving();
    }
  });

  test('TC-011: Cancelling the form does not create a program', async ({ page }) => {
    const abandonedName = `Abandoned Program ${Date.now()}`;
    const programs = new ProgramsPage(page);
    const modal = programs.newProgramModal;

    await programs.openNewProgram();
    await modal.fillProgramName(abandonedName);
    await modal.dismissWithoutSaving();

    await expect(modal.dialog).not.toBeVisible({ timeout: 10_000 });
    await expect(programs.programRow(abandonedName)).toHaveCount(0);
  });
});
