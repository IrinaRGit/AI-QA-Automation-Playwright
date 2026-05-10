import { expect, test } from '@playwright/test';
import {
  FOUR_TODOS,
  addTodo,
  deleteTodoByLabel,
  expectRemainingCount,
  labelsInOrder,
  openTodoMvc,
  toggleTodoByLabel,
  todoRowByLabel,
  todoRows,
} from './helpers';

test.describe('TodoMVC — Positive flows (test plan)', () => {
  test('TC-001: Empty list shows todos heading and new-todo; no items; footer hidden', async ({
    page,
  }) => {
    await openTodoMvc(page);
    await expect(page).toHaveTitle(/React • TodoMVC/);
    await expect(page.getByPlaceholder('What needs to be done?')).toBeEnabled();
    await expect(todoRows(page)).toHaveCount(0);
    await expect(page.locator('.footer')).toBeHidden();
  });

  test('TC-002: Four distinct todos appear in order with footer and count', async ({ page }) => {
    await openTodoMvc(page);
    for (const t of FOUR_TODOS) {
      await addTodo(page, t);
    }
    await expect(todoRows(page)).toHaveCount(4);
    expect(await labelsInOrder(page)).toEqual([...FOUR_TODOS]);
    await expectRemainingCount(page, 4);
    const footer = page.locator('.footer');
    await expect(footer).toBeVisible();
    await expect(footer.getByRole('link', { name: 'All' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Active' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Completed' })).toBeVisible();
  });

  test('TC-003: Completing Pay rent updates state, filters, and Clear completed', async ({
    page,
  }) => {
    await openTodoMvc(page);
    for (const t of FOUR_TODOS) {
      await addTodo(page, t);
    }
    await toggleTodoByLabel(page, 'Pay rent');

    const payRow = todoRowByLabel(page, 'Pay rent').first();
    await expect(payRow).toHaveClass(/completed/);
    await expect(payRow.locator('.toggle')).toBeChecked();

    await expectRemainingCount(page, 3);
    await expect(page.locator('.clear-completed')).toBeVisible();

    await page.getByRole('link', { name: 'Active' }).click();
    expect(await labelsInOrder(page)).toEqual([
      'Buy milk',
      'Walk the dog',
      'Call dentist — 555-0100',
    ]);

    await page.getByRole('link', { name: 'Completed' }).click();
    expect(await labelsInOrder(page)).toEqual(['Pay rent']);

    await page.getByRole('link', { name: 'All' }).click();
    await expect(todoRows(page)).toHaveCount(4);
    await expect(todoRowByLabel(page, 'Pay rent').first()).toHaveClass(/completed/);
  });

  test('TC-004: Deleting Walk the dog removes only that row', async ({ page }) => {
    await openTodoMvc(page);
    for (const t of FOUR_TODOS) {
      await addTodo(page, t);
    }
    await deleteTodoByLabel(page, 'Walk the dog');

    await expect(page).toHaveTitle(/React • TodoMVC/);
    await expect(todoRowByLabel(page, 'Walk the dog')).toHaveCount(0);
    expect(await labelsInOrder(page)).toEqual([
      'Buy milk',
      'Pay rent',
      'Call dentist — 555-0100',
    ]);
    await expectRemainingCount(page, 3);
  });

  test('TC-005: Clear completed removes finished todos from All and Completed', async ({
    page,
  }) => {
    await openTodoMvc(page);
    for (const t of FOUR_TODOS) {
      await addTodo(page, t);
    }
    await toggleTodoByLabel(page, 'Buy milk');
    await toggleTodoByLabel(page, 'Pay rent');

    await page.locator('.clear-completed').click();

    expect(await labelsInOrder(page)).toEqual(['Walk the dog', 'Call dentist — 555-0100']);
    await expectRemainingCount(page, 2);
    await expect(page.locator('.todo-list li.completed')).toHaveCount(0);

    await page.getByRole('link', { name: 'Completed' }).click();
    await expect(todoRows(page)).toHaveCount(0);
  });

  test('TC-006: Double-click label edits todo text on Enter', async ({ page }) => {
    await openTodoMvc(page);
    await addTodo(page, 'Buy milk');

    const row = todoRows(page).first();
    await row.getByText('Buy milk', { exact: true }).dblclick();
    const editor = page.locator('li.editing input.edit');
    await expect(editor).toBeVisible();
    await editor.fill('Buy organic milk');
    await editor.press('Enter');

    await expect(todoRowByLabel(page, 'Buy organic milk')).toHaveCount(1);
    await expect(todoRowByLabel(page, 'Buy milk')).toHaveCount(0);
    await expect(todoRows(page)).toHaveCount(1);
    await expectRemainingCount(page, 1);
  });
});
