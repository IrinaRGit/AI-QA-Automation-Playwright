import { test as setup } from '@playwright/test';
import { AUTH_STORAGE_PATH } from '../fixtures/auth.constants';
import { login } from '../fixtures/ds1-program.helpers';

setup('authenticate', async ({ page }) => {
  setup.skip(!process.env.DIDAXIS_URL, 'Set DIDAXIS_URL in .env');
  setup.skip(
    !process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD,
    'Set DIDAXIS_EMAIL and DIDAXIS_PASSWORD in .env',
  );

  await login(page);
  await page.context().storageState({ path: AUTH_STORAGE_PATH });
});
