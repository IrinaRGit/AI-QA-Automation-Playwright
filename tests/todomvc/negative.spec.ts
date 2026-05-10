import { expect, test } from '@playwright/test';
import {
  addTodo,
  deleteTodoByLabel,
  openTodoMvc,
  toggleTodoByLabel,
  todoRowByLabel,
  todoRows,
} from './helpers';

test.describe('TodoMVC — Negative flows (test plan)', () => {
  test('TC-101: Empty Enter does not add a todo', async ({ page }) => {
    await openTodoMvc(page);
    const input = page.getByPlaceholder('What needs to be done?');
    await input.press('Enter');
    await expect(todoRows(page)).toHaveCount(0);
    await expect(page.locator('.footer')).toBeHidden();
  });

  test('TC-101 (non-empty): Empty Enter does not increase count', async ({ page }) => {
    await openTodoMvc(page);
    await addTodo(page, 'Buy milk');
    const before = await todoRows(page).count();
    const input = page.getByPlaceholder('What needs to be done?');
    await input.press('Enter');
    await expect(todoRows(page)).toHaveCount(before);
  });

  test('TC-102: Whitespace-only input does not leave blank-label todos', async ({ page }) => {
    await openTodoMvc(page);
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('   ');
    await input.press('Enter');

    const count = await todoRows(page).count();
    if (count === 0) {
      await expect(page.locator('.footer')).toBeHidden();
    } else {
      for (let i = 0; i < count; i++) {
        const text = (await todoRows(page).nth(i).locator('label').innerText()).trim();
        expect(text.length).toBeGreaterThan(0);
      }
    }
  });

  test('TC-103: Deleting the only todo hides footer and clears list', async ({ page }) => {
    await openTodoMvc(page);
    await addTodo(page, 'Buy milk');
    await deleteTodoByLabel(page, 'Buy milk');

    await expect(todoRows(page)).toHaveCount(0);
    await expect(page.locator('.footer')).toBeHidden();
    await expect(page.getByPlaceholder('What needs to be done?')).toBeVisible();
  });

  test('TC-104: Completing a todo keeps it on All with completed class', async ({ page }) => {
    await openTodoMvc(page);
    await addTodo(page, 'Pay rent');
    await toggleTodoByLabel(page, 'Pay rent');

    await page.getByRole('link', { name: 'All' }).click();
    const row = todoRowByLabel(page, 'Pay rent').first();
    await expect(row).toBeVisible();
    await expect(row).toHaveClass(/completed/);
  });

  test('TC-105: Deleting one active todo does not complete the other', async ({ page }) => {
    await openTodoMvc(page);
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Walk the dog');

    await deleteTodoByLabel(page, 'Buy milk');

    const dog = todoRowByLabel(page, 'Walk the dog').first();
    await expect(dog).toBeVisible();
    await expect(dog).not.toHaveClass(/completed/);
    await expect(dog.locator('.toggle')).not.toBeChecked();
  });
});
