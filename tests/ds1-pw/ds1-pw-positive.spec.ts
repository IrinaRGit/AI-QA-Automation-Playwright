import { expect, test, waitForCreatedProgramId } from '../../fixtures/cleanup.fixture';
import {
  PROGRAM_DESC,
  createButton,
  createProgram,
  openNewProgramModal,
  programDescriptionField,
  programNameField,
  programRow,
} from '../../fixtures/ds1-program.helpers';

test.describe('DS-1 — Create new academic program (Positive flows)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.DIDAXIS_URL, 'Set DIDAXIS_URL in .env');
    test.skip(
      !process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD,
      'Set DIDAXIS credentials in .env',
    );
    await page.goto('/programs');
  });

  test('TC-001: Navigate to program creation form', async ({ page }) => {
    const dialog = await openNewProgramModal(page);

    await expect(programNameField(dialog)).toBeVisible();
    await expect(programDescriptionField(dialog)).toBeVisible();
  });

  test('TC-002: Successfully create a program with name and description', async ({
    page,
    trackProgram,
  }) => {
    const name = `Web Development 2026 ${Date.now()}`;

    const dialog = await openNewProgramModal(page);
    await programNameField(dialog).fill(name);
    await programDescriptionField(dialog).fill(PROGRAM_DESC);

    const idPromise = waitForCreatedProgramId(page);
    await createButton(dialog).click();
    trackProgram(await idPromise);

    await expect(dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programRow(page, name).first()).toBeVisible({ timeout: 15_000 });
  });

  test('TC-003: Successfully create a program without a description', async ({
    page,
    trackProgram,
  }) => {
    const name = `Data Science Fundamentals ${Date.now()}`;

    const dialog = await openNewProgramModal(page);
    await programNameField(dialog).fill(name);

    const idPromise = waitForCreatedProgramId(page);
    await createButton(dialog).click();
    trackProgram(await idPromise);

    await expect(dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programRow(page, name).first()).toBeVisible({ timeout: 15_000 });
  });

  test('TC-004: Create button is enabled when program name is filled', async ({ page }) => {
    const dialog = await openNewProgramModal(page);
    await programNameField(dialog).fill('Cybersecurity Essentials');

    await expect(createButton(dialog)).toBeEnabled();
  });

  test('TC-005: Program name with minimum valid length (1 character) is accepted', async ({
    page,
    trackProgram,
  }) => {
    const name = String.fromCharCode(65 + (Date.now() % 26));

    const dialog = await openNewProgramModal(page);
    await programNameField(dialog).fill(name);

    const idPromise = waitForCreatedProgramId(page);
    await createButton(dialog).click();
    trackProgram(await idPromise);

    await expect(dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programRow(page, name).first()).toBeVisible({ timeout: 15_000 });
  });

  test('TC-006: Program name at maximum valid length (255 characters) is accepted', async ({
    page,
    trackProgram,
  }) => {
    const suffix = String(Date.now()).slice(-6);
    const name = `${'A'.repeat(255 - suffix.length)}${suffix}`;

    const dialog = await openNewProgramModal(page);
    await programNameField(dialog).fill(name);

    const idPromise = waitForCreatedProgramId(page);
    await createButton(dialog).click();
    trackProgram(await idPromise);

    await expect(dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programRow(page, name).first()).toBeVisible({ timeout: 15_000 });
  });
});
