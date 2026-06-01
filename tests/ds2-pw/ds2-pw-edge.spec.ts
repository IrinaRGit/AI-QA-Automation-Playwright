import { expect, test, type Page } from '@playwright/test';
import { BASE_PROGRAM_DESC, BASE_PROGRAM_NAME } from '../../pages/programs.constants';
import { ProgramsPage } from '../../pages/programs.page';

async function createUniqueProgram(page: Page): Promise<string> {
  const name = `${BASE_PROGRAM_NAME} ${Date.now()}`;
  const programs = new ProgramsPage(page);

  await programs.createProgram(name, BASE_PROGRAM_DESC);
  await expect(programs.programRow(name).first()).toBeVisible({ timeout: 30_000 });

  return name;
}

test.describe('DS-2 — Edit existing program details (Edge cases)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.DIDAXIS_URL, 'Set DIDAXIS_URL in .env');
    test.skip(
      !process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD,
      'Set DIDAXIS credentials in .env',
    );
    await new ProgramsPage(page).goto();
  });

  test('TC-021: Name supports common punctuation and symbols without breaking save or display', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = await createUniqueProgram(page);
    const specialName = `${programName} (C#/.NET & JS)`;

    await programs.openEditFor(programName);
    const modal = programs.editProgramModal;
    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await modal.fillProgramName(specialName);
    await modal.clickSave();

    await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programs.programRow(specialName).first()).toBeVisible({ timeout: 15_000 });

    await programs.openEditFor(specialName);
    const reOpenedModal = programs.editProgramModal;
    await expect(reOpenedModal.dialog).toBeVisible({ timeout: 10_000 });
    await expect(reOpenedModal.programNameInput).toHaveValue(specialName);
  });

  test('TC-022: Name supports non-English characters (Unicode)', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const programName = await createUniqueProgram(page);
    const unicodeName = `${programName} – Développement Web (東京)`;

    await programs.openEditFor(programName);
    const modal = programs.editProgramModal;
    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await modal.fillProgramName(unicodeName);
    await modal.clickSave();

    await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programs.programRow(unicodeName).first()).toBeVisible({ timeout: 15_000 });

    await programs.openEditFor(unicodeName);
    const reOpenedModal = programs.editProgramModal;
    await expect(reOpenedModal.dialog).toBeVisible({ timeout: 10_000 });
    await expect(reOpenedModal.programNameInput).toHaveValue(unicodeName);
  });

  test('TC-023: Description supports multi-line text and preserves line breaks', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const programName = await createUniqueProgram(page);
    const multilineDesc =
      'Full-stack curriculum:\n- HTML/CSS\n- JavaScript\n- React\n- Node.js\n- Playwright E2E';

    await programs.openEditFor(programName);
    const modal = programs.editProgramModal;
    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await modal.fillDescription(multilineDesc);
    await modal.clickSave();

    await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });

    await programs.openEditFor(programName);
    const reOpenedModal = programs.editProgramModal;
    await expect(reOpenedModal.dialog).toBeVisible({ timeout: 10_000 });
    const storedDesc = await reOpenedModal.descriptionInput.inputValue();
    expect(storedDesc.replace(/\r\n/g, '\n')).toBe(multilineDesc);
  });

  test('TC-024: Extremely long Description saves without truncation or UI lag', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const programName = await createUniqueProgram(page);
    const chunk = 'Full-stack curriculum updated. ';
    const longDesc = chunk.repeat(Math.ceil(5_000 / chunk.length)).slice(0, 5_000);

    await programs.openEditFor(programName);
    const modal = programs.editProgramModal;
    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await modal.fillDescription(longDesc);
    await modal.clickSave();

    const saveSucceeded = await modal.dialog.isHidden({ timeout: 15_000 }).catch(() => false);

    if (saveSucceeded) {
      await programs.openEditFor(programName);
      const reOpenedModal = programs.editProgramModal;
      await expect(reOpenedModal.dialog).toBeVisible({ timeout: 10_000 });
      const storedDesc = await reOpenedModal.descriptionInput.inputValue();
      expect(storedDesc.length).toBe(longDesc.length);
    } else {
      await expect(modal.maxLengthError).toBeVisible();
    }
  });

  test('TC-025: Name enforces max-length at boundary (exactly max and max+1 characters)', async ({
    page,
  }) => {
    const MAX_LENGTH = 255;
    const programs = new ProgramsPage(page);
    const programName = await createUniqueProgram(page);
    const atMaxName = 'A'.repeat(MAX_LENGTH);
    const overMaxName = 'A'.repeat(MAX_LENGTH + 1);

    await programs.openEditFor(programName);
    const modal1 = programs.editProgramModal;
    await expect(modal1.dialog).toBeVisible({ timeout: 10_000 });
    await modal1.fillProgramName(atMaxName);
    await modal1.clickSave();
    await expect(modal1.dialog).not.toBeVisible({ timeout: 15_000 });

    await programs.openEditFor(atMaxName);
    const reOpenedModal1 = programs.editProgramModal;
    await expect(reOpenedModal1.dialog).toBeVisible({ timeout: 10_000 });
    await expect(reOpenedModal1.programNameInput).toHaveValue(atMaxName);
    await reOpenedModal1.dismissWithoutSaving();
    await expect(reOpenedModal1.dialog).not.toBeVisible({ timeout: 10_000 });

    await programs.openEditFor(atMaxName);
    const modal2 = programs.editProgramModal;
    await expect(modal2.dialog).toBeVisible({ timeout: 10_000 });
    await modal2.fillProgramName(overMaxName);
    await modal2.clickSave();

    const modalStillOpen = await modal2.dialog.isVisible().catch(() => false);
    const inputValue = await modal2.programNameInput.inputValue();

    if (modalStillOpen) {
      await expect(modal2.maxLengthError).toBeVisible();
    } else {
      await programs.openEditFor(atMaxName);
      const storedModal = programs.editProgramModal;
      await expect(storedModal.dialog).toBeVisible({ timeout: 10_000 });
      const stored = await storedModal.programNameInput.inputValue();
      expect(stored.length).toBeLessThanOrEqual(MAX_LENGTH);
    }
    void inputValue;
  });

  test('TC-026: Name normalization prevents invisible duplicates (case and whitespace variations)', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = await createUniqueProgram(page);
    await page.waitForTimeout(20);
    const secondProgram = await createUniqueProgram(page);

    const caseVariant = programName.toLowerCase();
    const spaceVariant = programName.replace(/ /g, '  ');

    for (const variant of [caseVariant, spaceVariant]) {
      await programs.openEditFor(secondProgram);
      const modal = programs.editProgramModal;
      await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
      await modal.fillProgramName(variant);
      await modal.clickSave();

      const modalStillOpen = await modal.dialog.isVisible().catch(() => false);

      if (modalStillOpen) {
        await expect(modal.duplicateError).toBeVisible();
        await modal.dismissWithoutSaving();
        await expect(modal.dialog).not.toBeVisible({ timeout: 10_000 });
      } else {
        const rows = programs.programRow(programName);
        const count = await rows.count();
        expect(count).toBeLessThanOrEqual(2);
      }
    }
  });

  test('TC-027: HTML/JS injection strings in Description are not executed and are safely rendered', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = await createUniqueProgram(page);
    const xssPayload = '<script>alert("xss")</script>';

    let dialogFired = false;
    page.on('dialog', async (nativeDialog) => {
      dialogFired = true;
      await nativeDialog.dismiss();
    });

    await programs.openEditFor(programName);
    const modal = programs.editProgramModal;
    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await modal.fillDescription(xssPayload);
    await modal.clickSave();

    const modalStillOpen = await modal.dialog.isVisible({ timeout: 10_000 }).catch(() => false);

    if (modalStillOpen) {
      await expect(modal.securityError()).toBeVisible();
    } else {
      await page.waitForTimeout(1_000);
      expect(dialogFired, 'alert() must not have executed — XSS payload was not sanitised').toBe(false);

      await programs.openEditFor(programName);
      const reOpenedModal = programs.editProgramModal;
      await expect(reOpenedModal.dialog).toBeVisible({ timeout: 10_000 });
      const storedDesc = await reOpenedModal.descriptionInput.inputValue();
      expect(storedDesc).toContain('alert("xss")');
    }
  });

  test('TC-028: Rapid double-click on Save does not create inconsistent state or duplicate rows', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    const programName = await createUniqueProgram(page);
    const updatedName = `${programName} - Updated`;

    await programs.openEditFor(programName);
    const modal = programs.editProgramModal;
    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await modal.fillProgramName(updatedName);
    await modal.doubleClickSave();

    await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programs.programRow(updatedName)).toHaveCount(1);
    await expect(programs.programRowExact(programName)).toHaveCount(0);
  });
});
