import { expect, test, waitForCreatedProgramId } from '../fixtures/cleanup.fixture';
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

  test('TC-001: Edit form opens pre-populated with the program’s current data', async ({ page, trackProgram }) => {
    const uniqueName = `QA Edit Program ${Date.now()}`;
    const uniqueDescription = `Pre-populated edit check created at ${Date.now()}.`;
    const programs = new ProgramsPage(page);
    const newModal = programs.newProgramModal;

    await programs.openNewProgram();
    await newModal.fillProgramName(uniqueName);
    await newModal.fillDescription(uniqueDescription);

    const idPromise = waitForCreatedProgramId(page);
    await newModal.clickCreate();
    trackProgram(await idPromise);

    await expect(programs.programRow(uniqueName).first()).toBeVisible({ timeout: 30_000 });

    await programs.openEditFor(uniqueName);

    const modal = programs.editProgramModal;
    await expect(modal.heading).toBeVisible();
    await expect(modal.programNameInput).toHaveValue(uniqueName);
    await expect(modal.descriptionInput).toHaveValue(uniqueDescription);
  });
});
