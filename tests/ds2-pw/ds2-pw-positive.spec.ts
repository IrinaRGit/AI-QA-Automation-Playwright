import { expect, test, type Page } from '@playwright/test';
import {
  BASE_PROGRAM_DESC,
  BASE_PROGRAM_NAME,
  UPDATED_DESC,
} from '../../pages/programs.constants';
import { ProgramsPage } from '../../pages/programs.page';

async function createUniqueProgram(page: Page): Promise<string> {
  const name = `${BASE_PROGRAM_NAME} ${Date.now()}`;
  const programs = new ProgramsPage(page);

  await programs.createProgram(name, BASE_PROGRAM_DESC);
  await expect(programs.programRow(name).first()).toBeVisible({ timeout: 30_000 });

  return name;
}

test.describe('DS-2 — Edit existing program details (Positive flows)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.DIDAXIS_URL, 'Set DIDAXIS_URL in .env');
    test.skip(
      !process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD,
      'Set DIDAXIS credentials in .env',
    );
    await new ProgramsPage(page).goto();
  });

  test('TC-001: Edit form opens pre-populated with the program\'s current data', async ({ page }) => {
    const programs = new ProgramsPage(page);

    await programs.ensureProgramExists(BASE_PROGRAM_NAME, BASE_PROGRAM_DESC);
    await expect(programs.programRow(BASE_PROGRAM_NAME).first()).toBeVisible({ timeout: 30_000 });

    await programs.openEditFor(BASE_PROGRAM_NAME);

    const modal = programs.editProgramModal;
    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await expect(modal.programNameInput).toHaveValue(BASE_PROGRAM_NAME);
    await expect(modal.descriptionInput).toHaveValue(BASE_PROGRAM_DESC);
  });

  test('TC-002: Program name can be updated and reflected immediately in the list', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const originalName = await createUniqueProgram(page);
    const updatedName = `${originalName} - Updated`;

    await programs.openEditFor(originalName);
    const modal = programs.editProgramModal;
    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await modal.fillProgramName(updatedName);
    await modal.clickSave();

    await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programs.programRow(updatedName).first()).toBeVisible({ timeout: 15_000 });
    await expect(programs.programRowExact(originalName)).toHaveCount(0);
  });

  test('TC-003: Updating only Description preserves Name and other fields', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const programName = await createUniqueProgram(page);

    await programs.openEditFor(programName);
    const modal = programs.editProgramModal;
    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await modal.fillDescription(UPDATED_DESC);
    await modal.clickSave();

    await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programs.programRow(programName).first()).toBeVisible();

    await programs.openEditFor(programName);
    const reOpenedModal = programs.editProgramModal;
    await expect(reOpenedModal.dialog).toBeVisible({ timeout: 10_000 });
    await expect(reOpenedModal.programNameInput).toHaveValue(programName);
    await expect(reOpenedModal.descriptionInput).toHaveValue(UPDATED_DESC);
  });

  test('TC-004: Save is idempotent when no changes are made', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const programName = await createUniqueProgram(page);

    await programs.openEditFor(programName);
    const modal = programs.editProgramModal;
    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await modal.clickSave();

    await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programs.programRow(programName).first()).toBeVisible();

    await programs.openEditFor(programName);
    const reOpenedModal = programs.editProgramModal;
    await expect(reOpenedModal.dialog).toBeVisible({ timeout: 10_000 });
    await expect(reOpenedModal.programNameInput).toHaveValue(programName);
    await expect(reOpenedModal.descriptionInput).toHaveValue(BASE_PROGRAM_DESC);
  });

  test('TC-005: Cancel closes the modal without persisting edits', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const programName = await createUniqueProgram(page);
    const draftName = `${programName} - Draft`;

    await programs.openEditFor(programName);
    const modal = programs.editProgramModal;
    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await modal.fillProgramName(draftName);
    await modal.dismissWithoutSaving();

    await expect(modal.dialog).not.toBeVisible({ timeout: 10_000 });
    await expect(programs.programRow(programName).first()).toBeVisible();
    await expect(programs.programRow(draftName)).toHaveCount(0);

    await programs.openEditFor(programName);
    const reOpenedModal = programs.editProgramModal;
    await expect(reOpenedModal.dialog).toBeVisible({ timeout: 10_000 });
    await expect(reOpenedModal.programNameInput).toHaveValue(programName);
  });

  test('TC-006: Leading/trailing spaces in Name are handled consistently on save', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const programName = await createUniqueProgram(page);
    const nameWithSpaces = `  ${programName} - Spaced  `;
    const trimmedName = nameWithSpaces.trim();

    await programs.openEditFor(programName);
    const modal = programs.editProgramModal;
    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await modal.fillProgramName(nameWithSpaces);
    await modal.clickSave();

    await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programs.programRow(trimmedName).first()).toBeVisible({ timeout: 15_000 });

    await programs.openEditFor(trimmedName);
    const reOpenedModal = programs.editProgramModal;
    await expect(reOpenedModal.dialog).toBeVisible({ timeout: 10_000 });
    const storedName = await reOpenedModal.programNameInput.inputValue();
    expect(storedName.trim()).toBe(trimmedName);
    expect(storedName).toBe(storedName.trim());
  });
});
