import { expect, test, waitForCreatedProgramId } from '../fixtures/cleanup.fixture';
import { BASE_PROGRAM_DESC, BASE_PROGRAM_NAME } from '../pages/programs.constants';
import { ProgramsPage } from '../pages/programs.page';

test.describe('Didaxis Studio — programs', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.DIDAXIS_URL, 'Set DIDAXIS_URL in .env');
    test.skip(!process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD, 'Set DIDAXIS credentials in .env');
    await new ProgramsPage(page).goto();
  });

  test('creates a new program with a unique name', async ({ page, trackProgram }) => {
    const uniqueName = `QA Program ${Date.now()}`;
    const uniqueDescription = `Automated test program created at ${Date.now()}.`;
    const programs = new ProgramsPage(page);
    const modal = programs.newProgramModal;

    await programs.openNewProgram();
    await modal.fillProgramName(uniqueName);
    await modal.fillDescription(uniqueDescription);

    const idPromise = waitForCreatedProgramId(page);
    await modal.clickCreate();
    trackProgram(await idPromise);

    await expect(programs.programRow(uniqueName).first()).toBeVisible({ timeout: 30_000 });
  });

  test('TC-001: Edit form opens pre-populated with the program’s current data', async ({ page }) => {
    const programs = new ProgramsPage(page);

    await programs.ensureProgramExists(BASE_PROGRAM_NAME, BASE_PROGRAM_DESC);
    await expect(programs.programRow(BASE_PROGRAM_NAME).first()).toBeVisible({ timeout: 30_000 });

    await programs.openEditFor(BASE_PROGRAM_NAME);

    const modal = programs.editProgramModal;
    await expect(modal.heading).toBeVisible();
    await expect(modal.programNameInput).toHaveValue(BASE_PROGRAM_NAME);
    await expect(modal.descriptionInput).toHaveValue(BASE_PROGRAM_DESC);
  });
});
