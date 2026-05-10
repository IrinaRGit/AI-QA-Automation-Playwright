import { expect, type Locator, type Page } from '@playwright/test';

/** Hash paths (use with baseURL `https://demo.playwright.dev/todomvc/` — avoid leading `/` or the path is lost). */
export const TODOMVC_HASH_ALL = '#/';
export const TODOMVC_HASH_ACTIVE = '#/active';
export const TODOMVC_HASH_COMPLETED = '#/completed';

export const FOUR_TODOS = [
  'Buy milk',
  'Walk the dog',
  'Pay rent',
  'Call dentist — 555-0100',
] as const;

export async function openTodoMvc(page: Page, hash: string = TODOMVC_HASH_ALL) {
  await page.goto(hash);
  await expect(page.locator('h1', { hasText: 'todos' })).toBeVisible();
}

export async function addTodo(page: Page, text: string) {
  const input = page.getByPlaceholder('What needs to be done?');
  await input.fill(text);
  await input.press('Enter');
}

export function todoRows(page: Page): Locator {
  return page.locator('.todo-list li');
}

/** Rows whose visible label matches exactly (use .nth() when duplicates exist). */
export function todoRowByLabel(page: Page, label: string): Locator {
  return page.locator('.todo-list li').filter({
    has: page.getByText(label, { exact: true }),
  });
}

export async function expectRemainingCount(page: Page, count: number) {
  const expected = count === 1 ? '1 item left' : `${count} items left`;
  await expect(page.locator('.todo-count')).toHaveText(expected);
}

export async function deleteTodoByLabel(page: Page, label: string) {
  const row = todoRowByLabel(page, label).first();
  await row.hover();
  await row.locator('.destroy').click();
}

export async function toggleTodoByLabel(page: Page, label: string) {
  const row = todoRowByLabel(page, label).first();
  await row.locator('.toggle').click();
}

export async function labelsInOrder(page: Page): Promise<string[]> {
  return todoRows(page).locator('label').allTextContents();
}
