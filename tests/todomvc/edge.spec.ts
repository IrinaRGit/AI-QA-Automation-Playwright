import { expect, test } from '@playwright/test';
import {
  FOUR_TODOS,
  TODOMVC_HASH_ACTIVE,
  TODOMVC_HASH_COMPLETED,
  addTodo,
  deleteTodoByLabel,
  expectRemainingCount,
  openTodoMvc,
  toggleTodoByLabel,
  todoRowByLabel,
  todoRows,
} from './helpers';

test.describe('TodoMVC — Edge cases (test plan)', () => {
  test('TC-201: Duplicate titles create separate rows', async ({ page }) => {
    await openTodoMvc(page);
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Buy milk');

    await expect(todoRowByLabel(page, 'Buy milk')).toHaveCount(2);
    await expectRemainingCount(page, 2);
  });

  test('TC-202: HTML-like text is shown as text; no dialog / script execution', async ({
    page,
  }) => {
    await openTodoMvc(page);
    const payload = '<script>alert(1)</script> — safe?';
    let dialogSeen = false;
    page.once('dialog', () => {
      dialogSeen = true;
    });

    await addTodo(page, payload);

    await expect(todoRowByLabel(page, payload)).toHaveCount(1);
    await expect(todoRowByLabel(page, payload).locator('label')).toHaveText(payload);
    await toggleTodoByLabel(page, payload);
    await deleteTodoByLabel(page, payload);
    expect(dialogSeen).toBe(false);
  });

  test('TC-203: Unicode and emoji in todo title', async ({ page }) => {
    await openTodoMvc(page);
    const title = 'Покупки 🛒 — 日本語';
    await addTodo(page, title);

    await expect(todoRowByLabel(page, title).locator('label')).toHaveText(title);
    await expectRemainingCount(page, 1);
  });

  test('TC-204: Very long title still yields one toggleable, deletable row', async ({
    page,
  }) => {
    await openTodoMvc(page);
    const long = 'A'.repeat(2000);
    await addTodo(page, long);

    await expect(todoRows(page)).toHaveCount(1);
    const row = todoRows(page).first();
    await row.locator('.toggle').scrollIntoViewIfNeeded();
    await expect(row.locator('.toggle')).toBeVisible();
    await row.hover();
    await expect(row.locator('.destroy')).toBeVisible();
  });

  test('TC-205 / TC-206: Hash routes filter Active and Completed', async ({ page }) => {
    await openTodoMvc(page);
    await addTodo(page, 'A');
    await addTodo(page, 'B');
    await toggleTodoByLabel(page, 'B');

    await page.goto(TODOMVC_HASH_ACTIVE);
    await expect(page.locator('h1', { hasText: 'todos' })).toBeVisible();
    expect(await todoRows(page).locator('label').allTextContents()).toEqual(['A']);

    await page.goto(TODOMVC_HASH_COMPLETED);
    expect(await todoRows(page).locator('label').allTextContents()).toEqual(['B']);
  });

  test('TC-207: Toggling completed Pay rent back to active updates filters', async ({
    page,
  }) => {
    await openTodoMvc(page);
    for (const t of FOUR_TODOS) {
      await addTodo(page, t);
    }
    await toggleTodoByLabel(page, 'Pay rent');
    await expectRemainingCount(page, 3);

    await toggleTodoByLabel(page, 'Pay rent');
    const row = todoRowByLabel(page, 'Pay rent').first();
    await expect(row).not.toHaveClass(/completed/);
    await expect(row.locator('.toggle')).not.toBeChecked();
    await expectRemainingCount(page, 4);

    await page.getByRole('link', { name: 'Active' }).click();
    await expect(todoRowByLabel(page, 'Pay rent').first()).toBeVisible();

    await page.getByRole('link', { name: 'Completed' }).click();
    await expect(todoRowByLabel(page, 'Pay rent')).toHaveCount(0);
  });
});
