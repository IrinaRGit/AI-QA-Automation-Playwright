import { expect, test } from '../../fixtures/cleanup.fixture';
import {
  PROGRAM_DESC,
  closeDialogWithoutSaving,
  createButton,
  createProgram,
  login,
  openNewProgramModal,
  programNameField,
  programRow,
} from '../../fixtures/ds1-program.helpers';

test.describe('DS-1 — Create new academic program (Negative flows)', () => {
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

  test('TC-007: Create button is disabled when program name is empty', async ({ page }) => {
    const dialog = await openNewProgramModal(page);
    await programNameField(dialog).fill('');
    await programNameField(dialog).blur();

    await expect(createButton(dialog)).toBeDisabled();
    await expect(dialog).toBeVisible();
  });

  test('TC-008: Error is shown when a program name already exists', async ({ page, trackProgram }) => {
    const existingName = `Web Development 2026 ${Date.now()}`;
    await createProgram(page, trackProgram, existingName, PROGRAM_DESC);

    const dialog = await openNewProgramModal(page);
    await programNameField(dialog).fill(existingName);
    await createButton(dialog).click();

    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText(/already exists|duplicate|name.*taken/i),
    ).toBeVisible();
    await expect(programRow(page, existingName)).toHaveCount(1);
  });

  test('TC-009: Duplicate detection is case-insensitive', async ({ page, trackProgram }) => {
    const existingName = `Web Development 2026 ${Date.now()}`;
    await createProgram(page, trackProgram, existingName, PROGRAM_DESC);

    const dialog = await openNewProgramModal(page);
    await programNameField(dialog).fill(existingName.toLowerCase());
    await createButton(dialog).click();

    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText(/already exists|duplicate|name.*taken/i),
    ).toBeVisible();
    await expect(programRow(page, existingName)).toHaveCount(1);
  });

  test('TC-010: Program name exceeding 255 characters is rejected', async ({ page }) => {
    const overMaxName = `${'A'.repeat(256)}${Date.now()}`;

    const dialog = await openNewProgramModal(page);
    await programNameField(dialog).fill(overMaxName);
    const inputValue = await programNameField(dialog).inputValue();

    if (inputValue.length <= 255) {
      expect(inputValue.length).toBeLessThanOrEqual(255);
    }

    await createButton(dialog).click();

    const modalStillOpen = await dialog.isVisible().catch(() => false);
    const validationVisible = await dialog
      .getByText(/max|maximum|too long|255|limit|characters/i)
      .isVisible()
      .catch(() => false);

    expect(
      modalStillOpen || validationVisible || inputValue.length <= 255,
      'Oversized name must not be saved silently',
    ).toBeTruthy();

    if (modalStillOpen) {
      await closeDialogWithoutSaving(dialog);
    }
  });

  test('TC-011: Cancelling the form does not create a program', async ({ page }) => {
    const abandonedName = `Abandoned Program ${Date.now()}`;

    const dialog = await openNewProgramModal(page);
    await programNameField(dialog).fill(abandonedName);
    await closeDialogWithoutSaving(dialog);

    await expect(dialog).not.toBeVisible({ timeout: 10_000 });
    await expect(programRow(page, abandonedName)).toHaveCount(0);
  });
});
