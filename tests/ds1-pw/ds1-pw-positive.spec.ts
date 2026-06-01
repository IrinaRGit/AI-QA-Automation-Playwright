import { expect, test, waitForCreatedProgramId } from '../../fixtures/cleanup.fixture';
import { PROGRAM_DESC } from '../../pages/programs.constants';
import { ProgramsPage } from '../../pages/programs.page';

test.describe('DS-1 — Create new academic program (Positive flows)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.DIDAXIS_URL, 'Set DIDAXIS_URL in .env');
    test.skip(
      !process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD,
      'Set DIDAXIS credentials in .env',
    );
    await new ProgramsPage(page).goto();
  });

  test('TC-001: Navigate to program creation form', async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.openNewProgram();

    const modal = programs.newProgramModal;
    await expect(modal.programNameInput).toBeVisible();
    await expect(modal.descriptionInput).toBeVisible();
  });

  test('TC-002: Successfully create a program with name and description', async ({
    page,
    trackProgram,
  }) => {
    const name = `Web Development 2026 ${Date.now()}`;
    const programs = new ProgramsPage(page);
    const modal = programs.newProgramModal;

    await programs.openNewProgram();
    await modal.fillProgramName(name);
    await modal.fillDescription(PROGRAM_DESC);

    const idPromise = waitForCreatedProgramId(page);
    await modal.clickCreate();
    trackProgram(await idPromise);

    await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programs.programRow(name).first()).toBeVisible({ timeout: 15_000 });
  });

  test('TC-003: Successfully create a program without a description', async ({
    page,
    trackProgram,
  }) => {
    const name = `Data Science Fundamentals ${Date.now()}`;
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

  test('TC-004: Create button is enabled when program name is filled', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = programs.newProgramModal;

    await programs.openNewProgram();
    await modal.fillProgramName('Cybersecurity Essentials');

    await expect(modal.createButton).toBeEnabled();
  });

  test('TC-005: Program name with minimum valid length (1 character) is accepted', async ({
    page,
    trackProgram,
  }) => {
    const name = String.fromCharCode(65 + (Date.now() % 26));
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

  test('TC-006: Program name at maximum valid length (255 characters) is accepted', async ({
    page,
    trackProgram,
  }) => {
    const suffix = String(Date.now()).slice(-6);
    const name = `${'A'.repeat(255 - suffix.length)}${suffix}`;
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
});
