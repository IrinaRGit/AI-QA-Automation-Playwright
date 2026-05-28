import { expect, test, waitForCreatedProgramId } from '../../fixtures/cleanup.fixture';
import {
  createButton,
  createProgram,
  login,
  openNewProgramModal,
  programNameField,
  programRow,
} from '../../fixtures/ds1-program.helpers';

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
    await login(page);
    await page.goto('/programs');
  });

  test('TC-012: Program name with leading and trailing whitespace is trimmed before save', async ({
    page,
    trackProgram,
  }) => {
    const trimmedName = `Trimmed Program ${Date.now()}`;
    const nameWithSpaces = `  ${trimmedName}  `;

    const dialog = await openNewProgramModal(page);
    await programNameField(dialog).fill(nameWithSpaces);

    const idPromise = waitForCreatedProgramId(page);
    await createButton(dialog).click();
    trackProgram(await idPromise);

    await expect(dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programRow(page, trimmedName).first()).toBeVisible({ timeout: 15_000 });
    await expect(programRow(page, nameWithSpaces)).toHaveCount(0);
  });

  test('TC-013: Program name consisting only of whitespace is rejected', async ({ page }) => {
    const dialog = await openNewProgramModal(page);
    await programNameField(dialog).fill('     ');
    await programNameField(dialog).blur();

    const createDisabled = !(await createButton(dialog).isEnabled());
    const validationVisible = await dialog
      .getByText(/required|must not be empty|cannot be blank/i)
      .isVisible()
      .catch(() => false);

    expect(
      createDisabled || validationVisible,
      'Whitespace-only name must be rejected (disabled Create or validation error)',
    ).toBeTruthy();
    await expect(dialog).toBeVisible();
  });

  test('TC-014: Program name with special characters is accepted', async ({ page, trackProgram }) => {
    const name = `Math & Science: K–12 (2026) ${Date.now()}`;

    const dialog = await openNewProgramModal(page);
    await programNameField(dialog).fill(name);

    const idPromise = waitForCreatedProgramId(page);
    await createButton(dialog).click();
    trackProgram(await idPromise);

    await expect(dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programRow(page, name).first()).toBeVisible({ timeout: 15_000 });
  });

  test('TC-015: Identical NFC and NFD Unicode names are treated as duplicates', async ({
    page,
    trackProgram,
  }) => {
    const existingName = `${CAFE_NFC} ${Date.now()}`;
    await createProgram(page, trackProgram, existingName);

    const dialog = await openNewProgramModal(page);
    const nfdVariant = existingName.replace(CAFE_NFC, CAFE_NFD);
    await programNameField(dialog).fill(nfdVariant);
    await createButton(dialog).click();

    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText(/already exists|duplicate|name.*taken/i),
    ).toBeVisible();
    await expect(programRow(page, existingName)).toHaveCount(1);
  });

  test('TC-016: Double-clicking Create does not submit the form twice', async ({
    page,
    trackProgram,
  }) => {
    const name = `Double-Click Safe Program ${Date.now()}`;

    const dialog = await openNewProgramModal(page);
    await programNameField(dialog).fill(name);

    const create = createButton(dialog);
    const idPromise = waitForCreatedProgramId(page);
    await create.dblclick();
    trackProgram(await idPromise);

    await expect(dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(programRow(page, name)).toHaveCount(1);
  });

  test('TC-017: Program appears in the list immediately after creation without page reload', async ({
    page,
    trackProgram,
  }) => {
    const name = `Instant Visibility Program ${Date.now()}`;

    const dialog = await openNewProgramModal(page);
    await programNameField(dialog).fill(name);

    const start = Date.now();
    const idPromise = waitForCreatedProgramId(page);
    await createButton(dialog).click();
    trackProgram(await idPromise);
    await expect(dialog).not.toBeVisible({ timeout: 2_000 });
    expect(Date.now() - start).toBeLessThan(2_000);

    await expect(programRow(page, name).first()).toBeVisible({ timeout: 2_000 });
    await expect(page).toHaveURL(/\/programs/);
  });

  test('TC-018: Program list row for the new program is uniquely identifiable', async ({
    page,
    trackProgram,
  }) => {
    const name = `Unique Row Program ${Date.now()}`;

    const dialog = await openNewProgramModal(page);
    await programNameField(dialog).fill(name);

    const idPromise = waitForCreatedProgramId(page);
    await createButton(dialog).click();
    trackProgram(await idPromise);

    await expect(dialog).not.toBeVisible({ timeout: 15_000 });

    const matchingRows = programRow(page, name);
    await expect(matchingRows).toHaveCount(1);

    const row = matchingRows.first();
    await expect(row).toHaveAccessibleName(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
});
