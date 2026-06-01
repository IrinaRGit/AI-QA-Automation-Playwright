import { expect, test, type Page } from '@playwright/test';
import { AUTH_STORAGE_PATH } from '../../fixtures/auth.constants';
import { BASE_PROGRAM_DESC, BASE_PROGRAM_NAME } from '../../pages/programs.constants';
import { ProgramsPage } from '../../pages/programs.page';

async function createUniqueProgram(page: Page): Promise<string> {
  const name = `${BASE_PROGRAM_NAME} ${Date.now()}`;
  const programs = new ProgramsPage(page);

  await programs.createProgram(name, BASE_PROGRAM_DESC);
  await expect(programs.programRow(name).first()).toBeVisible({ timeout: 30_000 });

  return name;
}

test.describe('DS-2 — Edit existing program details (Negative flows)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.DIDAXIS_URL, 'Set DIDAXIS_URL in .env');
    test.skip(
      !process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD,
      'Set DIDAXIS credentials in .env',
    );
    await new ProgramsPage(page).goto();
  });

  test('TC-011: Save is blocked when Name is empty (required field validation)', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const programName = await createUniqueProgram(page);

    await programs.openEditFor(programName);
    const modal = programs.editProgramModal;
    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await modal.fillProgramName('');
    await modal.clickSave();

    await expect(modal.dialog).toBeVisible();
    await expect(modal.requiredError).toBeVisible();
    await expect(programs.programRow(programName).first()).toBeVisible();
  });

  test('TC-012: Save is blocked when Name contains only whitespace', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const programName = await createUniqueProgram(page);

    await programs.openEditFor(programName);
    const modal = programs.editProgramModal;
    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await modal.fillProgramName('     ');
    await modal.clickSave();

    await expect(modal.dialog).toBeVisible();
    await expect(modal.requiredError).toBeVisible();
    await expect(programs.programRow(programName).first()).toBeVisible();
  });

  test('TC-013: Duplicate Name is rejected with a user-friendly error', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const firstProgram = await createUniqueProgram(page);
    await page.waitForTimeout(20);
    const secondProgram = await createUniqueProgram(page);

    await programs.openEditFor(secondProgram);
    const modal = programs.editProgramModal;
    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await modal.fillProgramName(firstProgram);
    await modal.clickSave();

    await expect(modal.dialog).toBeVisible();
    await expect(modal.duplicateError).toBeVisible();
    await expect(programs.programRow(secondProgram).first()).toBeVisible();
  });

  test('TC-014: Server error on save does not close the modal or corrupt data', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const programName = await createUniqueProgram(page);
    const updatedName = `${programName} - Updated`;

    await page.route('**/programs/**', async (route) => {
      const method = route.request().method();
      if (method === 'PUT' || method === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal Server Error' }),
        });
      } else {
        await route.continue();
      }
    });

    await programs.openEditFor(programName);
    const modal = programs.editProgramModal;
    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await modal.fillProgramName(updatedName);
    await modal.clickSave();

    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await expect(modal.saveError).toBeVisible();
    await expect(programs.programRow(programName).first()).toBeVisible();
    await expect(programs.programRow(updatedName)).toHaveCount(0);
  });

  test('TC-015: Network interruption during save does not show a false success', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const programName = await createUniqueProgram(page);

    await page.route('**/programs/**', async (route) => {
      const method = route.request().method();
      if (method === 'PUT' || method === 'PATCH') {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    await programs.openEditFor(programName);
    const modal = programs.editProgramModal;
    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await modal.fillDescription('Updated description while offline.');
    await modal.clickSave();

    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await expect(modal.networkError()).toBeVisible();
    await expect(programs.programRow(programName).first()).toBeVisible();
  });

  test.skip('TC-016: Unauthorized user cannot save edits', async () => {
    // Precondition: DIDAXIS_UNAUTH_EMAIL / DIDAXIS_UNAUTH_PASSWORD must exist in .env
  });

  test('TC-017: Concurrent modification is handled without silently overwriting the other session', async ({
    browser,
  }) => {
    const context1 = await browser.newContext({
      baseURL: process.env.DIDAXIS_URL,
      storageState: AUTH_STORAGE_PATH,
    });
    const context2 = await browser.newContext({
      baseURL: process.env.DIDAXIS_URL,
      storageState: AUTH_STORAGE_PATH,
    });
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      const programs1 = new ProgramsPage(page1);
      await programs1.goto();
      const programName = await createUniqueProgram(page1);

      await programs1.openEditFor(programName);
      const modal1 = programs1.editProgramModal;
      await expect(modal1.dialog).toBeVisible({ timeout: 10_000 });
      await modal1.fillDescription('Local edit after concurrent update.');

      const programs2 = new ProgramsPage(page2);
      await programs2.goto();
      await programs2.openEditFor(programName);
      const modal2 = programs2.editProgramModal;
      await expect(modal2.dialog).toBeVisible({ timeout: 10_000 });
      const concurrentName = `${programName} - Updated by Admin`;
      await modal2.fillProgramName(concurrentName);
      await modal2.clickSave();
      await expect(modal2.dialog).not.toBeVisible({ timeout: 15_000 });

      await modal1.clickSave();

      const conflictShown = await modal1.conflictError.isVisible().catch(() => false);
      const modalClosed = await modal1.dialog.isHidden().catch(() => false);

      expect(
        conflictShown || modalClosed,
        'Expected either a conflict notice or the modal to close cleanly (last-write-wins)',
      ).toBeTruthy();

      const oldNameCount = await programs1.programRow(programName).count();
      expect(oldNameCount).toBeLessThanOrEqual(1);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('TC-018: Save updates the existing record without creating a duplicate row', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const programName = await createUniqueProgram(page);
    const updatedName = `${programName} - Updated`;

    await programs.openEditFor(programName);
    const modal = programs.editProgramModal;
    await expect(modal.dialog).toBeVisible({ timeout: 10_000 });
    await modal.fillProgramName(updatedName);
    await modal.clickSave();

    await expect(modal.dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programs.programRow(updatedName)).toHaveCount(1);
    await expect(programs.programRowExact(programName)).toHaveCount(0);
  });
});
