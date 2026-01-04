import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Volunteer Profile Manager
 * 
 * Tests authenticate against local Community Solid Server (CSS) on port 3001
 * and verify features in the Next.js app on port 3000
 */
export default defineConfig({
  testDir: './tests',
  
  /* Global setup to clean data directory before seeding */
  globalSetup: './tests/global-setup.ts',
  
  /* Default timeout for each test - localhost should be fast */
  timeout: 30000,
  
  /* Timeout for expect() assertions */
  expect: {
    timeout: 5000,
  },
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* 
   * Run tests sequentially in CI to avoid potential race conditions
   * with shared CSS server state and authentication flows.
   * Tests can run in parallel locally where the environment is more controlled.
   */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'blob' : 'html',
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'npm run start:css',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
    },
    {
      command: 'npm run start:next',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
    },
  ],
});
