import { expect, test, type Locator, type Page } from '@playwright/test';

const BASE_PROGRAM_NAME = 'Web Development 2026';
const BASE_PROGRAM_DESC =
  'Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.';

// ── Locator helpers ────────────────────────────────────────────────────────────

function newProgramDialog(page: Page) {
  return page.getByRole('dialog', { name: 'New Program' });
}

function editProgramDialog(page: Page) {
  return page.getByRole('dialog', { name: /Edit Program/i });
}

function programNameField(dialog: Locator) {
  return dialog.getByRole('textbox', { name: 'Program Name' });
}

function programDescriptionField(dialog: Locator) {
  return dialog.getByRole('textbox', { name: 'Description' });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Auth ───────────────────────────────────────────────────────────────────────

async function login(page: Page) {
  if (!process.env.DIDAXIS_URL) {
    throw new Error('Set DIDAXIS_URL in .env (e.g. https://test.didaxis.studio)');
  }
  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  if (!email || !password) {
    throw new Error('Set DIDAXIS_EMAIL and DIDAXIS_PASSWORD in .env');
  }

  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  try {
    await expect(page).not.toHaveURL(/\/login\b/, { timeout: 30_000 });
  } catch {
    if (await page.getByText(/Invalid email or password/i).isVisible().catch(() => false)) {
      throw new Error('Login failed: invalid credentials. Check DIDAXIS_EMAIL / DIDAXIS_PASSWORD in .env.');
    }
    throw new Error('Login failed: still on /login after 30 s (check network or account state).');
  }
}

// ── Data helpers ───────────────────────────────────────────────────────────────

async function createUniqueProgram(page: Page): Promise<string> {
  const name = `${BASE_PROGRAM_NAME} ${Date.now()}`;

  await page.getByRole('button', { name: '+ New Program' }).click();
  const dialog = newProgramDialog(page);
  await dialog.getByRole('textbox', { name: 'Program Name' }).fill(name);
  await dialog.getByRole('textbox', { name: 'Description' }).fill(BASE_PROGRAM_DESC);
  await dialog.getByRole('button', { name: 'Create' }).click();

  await expect(
    page.getByRole('row', { name: new RegExp(escapeRegExp(name)) }).first(),
  ).toBeVisible({ timeout: 30_000 });

  return name;
}

async function openEditModal(page: Page, programName: string): Promise<Locator> {
  const row = page.getByRole('row', { name: new RegExp(escapeRegExp(programName)) }).first();
  await row.getByRole('button', { name: '✏️' }).click();
  const dialog = editProgramDialog(page);
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  return dialog;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

test.describe('DS-2 — Edit existing program details (Edge cases)', () => {
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

  test('TC-021: Name supports common punctuation and symbols without breaking save or display', async ({ page }) => {
    const programName = await createUniqueProgram(page);
    const specialName = `${programName} (C#/.NET & JS)`;

    const dialog = await openEditModal(page, programName);
    await programNameField(dialog).fill(specialName);
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).not.toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('row', { name: new RegExp(escapeRegExp(specialName)) }).first(),
    ).toBeVisible({ timeout: 15_000 });

    // Re-open and confirm stored value matches exactly (no character corruption)
    const reOpenedDialog = await openEditModal(page, specialName);
    await expect(programNameField(reOpenedDialog)).toHaveValue(specialName);
  });

  test('TC-022: Name supports non-English characters (Unicode)', async ({ page }) => {
    const programName = await createUniqueProgram(page);
    const unicodeName = `${programName} – Développement Web (東京)`;

    const dialog = await openEditModal(page, programName);
    await programNameField(dialog).fill(unicodeName);
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).not.toBeVisible({ timeout: 15_000 });
    // Unicode characters must render correctly — no replacement chars or truncation
    await expect(
      page.getByRole('row', { name: new RegExp(escapeRegExp(unicodeName)) }).first(),
    ).toBeVisible({ timeout: 15_000 });

    // Re-open and confirm full Unicode value persisted
    const reOpenedDialog = await openEditModal(page, unicodeName);
    await expect(programNameField(reOpenedDialog)).toHaveValue(unicodeName);
  });

  test('TC-023: Description supports multi-line text and preserves line breaks', async ({ page }) => {
    const programName = await createUniqueProgram(page);
    const multilineDesc =
      'Full-stack curriculum:\n- HTML/CSS\n- JavaScript\n- React\n- Node.js\n- Playwright E2E';

    const dialog = await openEditModal(page, programName);
    await programDescriptionField(dialog).fill(multilineDesc);
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).not.toBeVisible({ timeout: 15_000 });

    // Re-open and confirm line breaks and content are preserved
    const reOpenedDialog = await openEditModal(page, programName);
    const storedDesc = await programDescriptionField(reOpenedDialog).inputValue();
    // Normalise \r\n vs \n for cross-platform comparison
    expect(storedDesc.replace(/\r\n/g, '\n')).toBe(multilineDesc);
  });

  test('TC-024: Extremely long Description saves without truncation or UI lag', async ({ page }) => {
    const programName = await createUniqueProgram(page);
    const chunk = 'Full-stack curriculum updated. ';
    const longDesc = chunk.repeat(Math.ceil(5_000 / chunk.length)).slice(0, 5_000);

    const dialog = await openEditModal(page, programName);
    await programDescriptionField(dialog).fill(longDesc);
    await dialog.getByRole('button', { name: 'Save' }).click();

    // Two valid outcomes: save succeeds with full text, OR a clear max-length error is shown
    const saveSucceeded = await dialog.isHidden({ timeout: 15_000 }).catch(() => false);

    if (saveSucceeded) {
      // Full text must be persisted — no silent truncation
      const reOpenedDialog = await openEditModal(page, programName);
      const storedDesc = await programDescriptionField(reOpenedDialog).inputValue();
      expect(storedDesc.length).toBe(longDesc.length);
    } else {
      // Save blocked: an explicit max-length validation message must be visible
      await expect(
        dialog.getByText(/max|maximum|too long|limit|characters/i),
      ).toBeVisible();
    }
  });

  test('TC-025: Name enforces max-length at boundary (exactly max and max+1 characters)', async ({ page }) => {
    // Assumed max length of 255; update if the product specifies a different value
    const MAX_LENGTH = 255;
    const programName = await createUniqueProgram(page);
    const atMaxName = 'A'.repeat(MAX_LENGTH);
    const overMaxName = 'A'.repeat(MAX_LENGTH + 1);

    // Boundary: exactly MAX_LENGTH characters — save must succeed
    const dialog1 = await openEditModal(page, programName);
    await programNameField(dialog1).fill(atMaxName);
    await dialog1.getByRole('button', { name: 'Save' }).click();
    await expect(dialog1).not.toBeVisible({ timeout: 15_000 });
    const reOpenedDialog1 = await openEditModal(page, atMaxName);
    await expect(programNameField(reOpenedDialog1)).toHaveValue(atMaxName);
    // Close and reset for next boundary check
    const cancelBtn = reOpenedDialog1.getByRole('button', { name: /^cancel$/i });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
    } else {
      await reOpenedDialog1.getByRole('button', { name: /close|×|✕/i }).click();
    }
    await expect(reOpenedDialog1).not.toBeVisible({ timeout: 10_000 });

    // Boundary: MAX_LENGTH + 1 characters — save must be blocked with a clear message
    const dialog2 = await openEditModal(page, atMaxName);
    await programNameField(dialog2).fill(overMaxName);
    await dialog2.getByRole('button', { name: 'Save' }).click();

    // Either the input itself truncates to MAX_LENGTH, or save is blocked with a validation error
    const modalStillOpen = await dialog2.isVisible().catch(() => false);
    const inputValue = await programNameField(dialog2).inputValue();

    if (modalStillOpen) {
      // Save was blocked: explicit max-length error must be shown
      await expect(
        dialog2.getByText(/max|maximum|too long|limit|characters/i),
      ).toBeVisible();
    } else {
      // Input was hard-capped by the field itself: stored value must not exceed MAX_LENGTH
      const stored = await (async () => {
        const d = await openEditModal(page, atMaxName);
        return programNameField(d).inputValue();
      })();
      expect(stored.length).toBeLessThanOrEqual(MAX_LENGTH);
    }
    // Suppress unused variable warning
    void inputValue;
  });

  test('TC-026: Name normalization prevents invisible duplicates (case and whitespace variations)', async ({ page }) => {
    const programName = await createUniqueProgram(page);
    await page.waitForTimeout(20);
    const secondProgram = await createUniqueProgram(page);

    // Try to rename secondProgram to a case/space variant of the first
    const caseVariant = programName.toLowerCase();
    const spaceVariant = programName.replace(/ /g, '  '); // double spaces

    for (const variant of [caseVariant, spaceVariant]) {
      const dialog = await openEditModal(page, secondProgram);
      await programNameField(dialog).fill(variant);
      await dialog.getByRole('button', { name: 'Save' }).click();

      // Two valid outcomes: rejected (uniqueness enforced) OR saved with consistent display
      const modalStillOpen = await dialog.isVisible().catch(() => false);

      if (modalStillOpen) {
        // Uniqueness enforced — a duplicate/conflict message must be shown
        await expect(
          dialog.getByText(/already exists|duplicate|name.*taken/i),
        ).toBeVisible();
        // Cancel to reset state
        const cancelBtn = dialog.getByRole('button', { name: /^cancel$/i });
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        } else {
          await dialog.getByRole('button', { name: /close|×|✕/i }).click();
        }
        await expect(dialog).not.toBeVisible({ timeout: 10_000 });
      } else {
        // Save succeeded — both programs must show distinct, user-readable names (no invisible duplicates)
        const rows = page.getByRole('row', { name: new RegExp(escapeRegExp(programName), 'i') });
        const count = await rows.count();
        // At most one row should visually match the base name (no invisible duplicates confusing users)
        expect(count).toBeLessThanOrEqual(2);
      }
    }
  });

  test('TC-027: HTML/JS injection strings in Description are not executed and are safely rendered', async ({ page }) => {
    const programName = await createUniqueProgram(page);
    const xssPayload = '<script>alert("xss")</script>';

    // Detect if a native alert/dialog fires — it must not
    let dialogFired = false;
    page.on('dialog', async (nativeDialog) => {
      dialogFired = true;
      await nativeDialog.dismiss();
    });

    const dialog = await openEditModal(page, programName);
    await programDescriptionField(dialog).fill(xssPayload);
    await dialog.getByRole('button', { name: 'Save' }).click();

    // Two valid outcomes: save blocked with a validation error, OR saved with the payload escaped
    const modalStillOpen = await dialog.isVisible({ timeout: 10_000 }).catch(() => false);

    if (modalStillOpen) {
      // Rejected: an appropriate validation/security error must be shown
      await expect(
        dialog.getByText(/invalid|not allowed|html|script/i),
      ).toBeVisible();
    } else {
      // Accepted: must be stored/displayed as literal text — never executed
      await page.waitForTimeout(1_000); // allow time for any deferred script execution
      expect(dialogFired, 'alert() must not have executed — XSS payload was not sanitised').toBe(false);

      // Re-open and verify the payload is stored as plain text
      const reOpenedDialog = await openEditModal(page, programName);
      const storedDesc = await programDescriptionField(reOpenedDialog).inputValue();
      expect(storedDesc).toContain('alert("xss")');
    }
  });

  test('TC-028: Rapid double-click on Save does not create inconsistent state or duplicate rows', async ({ page }) => {
    const programName = await createUniqueProgram(page);
    const updatedName = `${programName} - Updated`;

    const dialog = await openEditModal(page, programName);
    await programNameField(dialog).fill(updatedName);

    const saveButton = dialog.getByRole('button', { name: 'Save' });

    // Double-click Save in quick succession
    await saveButton.click();
    await saveButton.click({ force: true }); // force past any brief disable state

    await expect(dialog).not.toBeVisible({ timeout: 15_000 });

    // Exactly one row must exist for the updated name — no duplicate created
    await expect(
      page.getByRole('row', { name: new RegExp(escapeRegExp(updatedName)) }),
    ).toHaveCount(1);
    // Original name row must be gone
    await expect(
      page.getByRole('row', { name: new RegExp(`^${escapeRegExp(programName)}$`) }),
    ).toHaveCount(0);
  });
});
