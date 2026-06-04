import fs from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';
import { test as setup } from '@playwright/test';
import { AUTH_STORAGE_PATH } from '../fixtures/auth.constants';
import { LoginPage } from '../pages/login.page';

function requireDidaxisCredentials(): { email: string; password: string } {
  const url = process.env.DIDAXIS_URL?.trim();
  const email = process.env.DIDAXIS_EMAIL?.trim();
  const password = process.env.DIDAXIS_PASSWORD?.trim();

  if (!url || !email || !password) {
    throw new Error(
      'Didaxis credentials are required for authenticated tests. Set DIDAXIS_URL, DIDAXIS_EMAIL, and DIDAXIS_PASSWORD in .env (local) or in the dev1 environment / repository secrets (CI).',
    );
  }

  return { email, password };
}

setup('authenticate', async ({ page }) => {
  const { email, password } = requireDidaxisCredentials();

  const loginPage = new LoginPage(page);
  await loginPage.signInWithCredentials(email, password);

  try {
    await expect(page).not.toHaveURL(/\/login\b/, { timeout: 30_000 });
  } catch {
    if (await loginPage.invalidCredentialsMessage.isVisible().catch(() => false)) {
      throw new Error('Login failed: invalid credentials. Check DIDAXIS_EMAIL / DIDAXIS_PASSWORD in .env.');
    }
    throw new Error('Login failed: still on /login after 30 s (check network or account state).');
  }

  fs.mkdirSync(path.dirname(AUTH_STORAGE_PATH), { recursive: true });
  await page.context().storageState({ path: AUTH_STORAGE_PATH });

  if (!fs.existsSync(AUTH_STORAGE_PATH)) {
    throw new Error(`Auth setup did not write storage state to ${AUTH_STORAGE_PATH}`);
  }
});
