import { expect } from '@playwright/test';
import { test as setup } from '@playwright/test';
import { AUTH_STORAGE_PATH } from '../fixtures/auth.constants';
import { LoginPage } from '../pages/login.page';

setup('authenticate', async ({ page }) => {
  setup.skip(!process.env.DIDAXIS_URL, 'Set DIDAXIS_URL in .env');
  setup.skip(
    !process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD,
    'Set DIDAXIS_EMAIL and DIDAXIS_PASSWORD in .env',
  );

  const email = process.env.DIDAXIS_EMAIL!;
  const password = process.env.DIDAXIS_PASSWORD!;

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

  await page.context().storageState({ path: AUTH_STORAGE_PATH });
});
