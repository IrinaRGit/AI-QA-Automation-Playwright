import { config } from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

// Load `.env` from the project working directory (package root when using npm scripts).
config();

export default defineConfig({
  env: {
    DIDAXIS_URL: process.env.DIDAXIS_URL ?? '',
    DIDAXIS_EMAIL: process.env.DIDAXIS_EMAIL ?? '',
    DIDAXIS_PASSWORD: process.env.DIDAXIS_PASSWORD ?? '',
    DIDAXIS_API_TOKEN: process.env.DIDAXIS_API_TOKEN ?? '',
  },
  testDir: './tests',
  testMatch: ['**/*.spec.ts', '**/*.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.DIDAXIS_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    //{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    //{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
