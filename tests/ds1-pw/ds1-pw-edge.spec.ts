import { expect, test, waitForCreatedProgramId } from '../../fixtures/cleanup.fixture';
import { escapeRegExp } from '../../pages/programs.constants';
import { ProgramsPage } from '../../pages/programs.page';

const CAFE_NFC = 'Caf\u00e9 Studies';
const CAFE_NFD = 'Cafe\u0301 Studies';

test.describe('DS-1 — Create new academic program (Edge cases)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.DIDAXIS_URL, 'Set DIDAXIS_URL in .env');
    test.skip(
      !process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD,
      'Set DIDAXIS credentials in .env',
    );
    await new ProgramsPage(page).goto();
  });

  test('TC-012: Program name with leading and trailing whitespace is trimmed before save', async ({
    page,
    trackProgram,
  }) => {
    const trimmedName = `Trimmed Program ${Date.now()}`;
    const nameWithSpaces = `  ${trimmedName}  `;
    const programs = new ProgramsPage(page);
    const modal = programs.newProgramModal;

    await programs.openNewProgram();
    await modal.fillProgramName(nameWithSpaces);

    const idPromise = waitForCreatedProgramId(page);
    await modal.clickCreate();
    trackProgram(await idPromise);

    await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programs.programRow(trimmedName).first()).toBeVisible({ timeout: 15_000 });
    await expect(programs.programRow(nameWithSpaces)).toHaveCount(0);
  });

  test('TC-013: Program name consisting only of whitespace is rejected', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = programs.newProgramModal;

    await programs.openNewProgram();
    await modal.fillProgramName('     ');
    await modal.blurProgramName();

    const createDisabled = !(await modal.createButton.isEnabled());
    const validationVisible = await modal.requiredError.isVisible().catch(() => false);

    expect(
      createDisabled || validationVisible,
      'Whitespace-only name must be rejected (disabled Create or validation error)',
    ).toBeTruthy();
    await expect(modal.dialog).toBeVisible();
  });

  test('TC-014: Program name with special characters is accepted', async ({ page, trackProgram }) => {
    const name = `Math & Science: K–12 (2026) ${Date.now()}`;
    const programs = new ProgramsPage(page);
    const modal = programs.newProgramModal;

    await programs.openNewProgram();
    await modal.fillProgramName(name);

    const idPromise = waitForCreatedProgramId(page);
    await modal.clickCreate();
    trackProgram(await idPromise);

    await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programs.programRow(name).first()).toBeVisible({ timeout: 15_000 });
  });

  test('TC-015: Identical NFC and NFD Unicode names are treated as duplicates', async ({
    page,
    trackProgram,
  }) => {
    const existingName = `${CAFE_NFC} ${Date.now()}`;
    const programs = new ProgramsPage(page);
    const modal = programs.newProgramModal;

    await programs.openNewProgram();
    await modal.fillProgramName(existingName);
    const idPromise = waitForCreatedProgramId(page);
    await modal.clickCreate();
    trackProgram(await idPromise);
    await expect(programs.programRow(existingName).first()).toBeVisible({ timeout: 30_000 });

    await programs.openNewProgram();
    const nfdVariant = existingName.replace(CAFE_NFC, CAFE_NFD);
    await modal.fillProgramName(nfdVariant);
    await modal.clickCreate();

    await expect(modal.dialog).toBeVisible();
    await expect(modal.duplicateError).toBeVisible();
    await expect(programs.programRow(existingName)).toHaveCount(1);
  });

  test('TC-016: Double-clicking Create does not submit the form twice', async ({
    page,
    trackProgram,
  }) => {
    const name = `Double-Click Safe Program ${Date.now()}`;
    const programs = new ProgramsPage(page);
    const modal = programs.newProgramModal;

    await programs.openNewProgram();
    await modal.fillProgramName(name);

    const idPromise = waitForCreatedProgramId(page);
    await modal.doubleClickCreate();
    trackProgram(await idPromise);

    await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programs.programRow(name)).toHaveCount(1);
  });

  test('TC-017: Program appears in the list immediately after creation without page reload', async ({
    page,
    trackProgram,
  }) => {
    const name = `Instant Visibility Program ${Date.now()}`;
    const programs = new ProgramsPage(page);
    const modal = programs.newProgramModal;

    await programs.openNewProgram();
    await modal.fillProgramName(name);

    const start = Date.now();
    const idPromise = waitForCreatedProgramId(page);
    await modal.clickCreate();
    trackProgram(await idPromise);
    await expect(modal.dialog).not.toBeVisible({ timeout: 2_000 });
    expect(Date.now() - start).toBeLessThan(2_000);

    await expect(programs.programRow(name).first()).toBeVisible({ timeout: 2_000 });
    await expect(page).toHaveURL(/\/programs/);
  });

  test('TC-018: Program list row for the new program is uniquely identifiable', async ({
    page,
    trackProgram,
  }) => {
    const name = `Unique Row Program ${Date.now()}`;
    const programs = new ProgramsPage(page);
    const modal = programs.newProgramModal;

    await programs.openNewProgram();
    await modal.fillProgramName(name);

    const idPromise = waitForCreatedProgramId(page);
    await modal.clickCreate();
    trackProgram(await idPromise);

    await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });

    const matchingRows = programs.programRow(name);
    await expect(matchingRows).toHaveCount(1);

    const row = matchingRows.first();
    await expect(row).toHaveAccessibleName(new RegExp(escapeRegExp(name)));
  });
});
