# Playwright Test Suite

This directory contains end-to-end tests for the Volunteer Profile Manager application using Playwright.

## Prerequisites

Before running tests, ensure you have:

1. Node.js and npm installed
2. Dependencies installed: `npm install`
3. Playwright browsers installed: `npx playwright install chromium`
4. Environment variables set up (copy `.env.example` to `.env`)
5. **Test account created** in local CSS (see [Test Account Setup](#test-account-setup) below)

### Test Account Setup

Tests use a default test account with the following credentials:
- **Email**: `test@example.com`
- **Password**: `test123`

**Important**: You must create this account before running tests:

1. Ensure the CSS server is running: `npm run start:css`
2. Navigate to http://localhost:3001/idp/register/
3. Create an account with the credentials above
4. Alternatively, update the credentials in `tests/helpers/constants.ts` to match an existing account

## Running Tests

### Development Server

Tests require the local development servers to be running. Start them in a separate terminal:

```bash
npm run start:dev
```

This starts:
- Community Solid Server (CSS) on port 3001
- Next.js development server on port 3000
- LDO in watch mode

### Run All Tests

```bash
npm run test:e2e
```

### Run Tests with UI

```bash
npm run test:e2e:ui
```

This opens the Playwright Test UI where you can:
- See all tests
- Run tests individually or in groups
- Watch tests run with step-by-step execution
- Debug failing tests

### Run Tests in Headed Mode

```bash
npm run test:e2e:headed
```

Opens a browser window so you can see the tests running.

### Debug Tests

```bash
npm run test:e2e:debug
```

Opens the Playwright Inspector for debugging.

## Test Structure

```
tests/
├── helpers/
│   └── auth.ts              # Authentication helper functions
├── availability.spec.ts     # Tests for availability/time editor
├── causes.spec.ts           # Tests for causes editor
├── location.spec.ts         # Tests for location editor
├── skills.spec.ts          # Tests for skills & requirements editor
└── profile-integration.spec.ts  # Integration tests for full profile workflow
```

## Test Pattern

All tests follow a consistent pattern based on the data persistence requirement:

```typescript
test('feature data persists after logout/login', async ({ page }) => {
  // 1. Login to local CSS
  await loginToLocalCSS(page);
  
  // 2. Make changes (e.g., set availability)
  await page.getByRole('button', { name: 'Availability' }).click();
  await page.getByLabel('Monday').check();
  await page.getByRole('button', { name: 'Save' }).click();
  
  // 3. Logout
  await logout(page);
  
  // 4. Login again
  await loginToLocalCSS(page);
  
  // 5. Verify data is pre-populated correctly
  await page.getByRole('button', { name: 'Availability' }).click();
  await expect(page.getByLabel('Monday')).toBeChecked();
});
```

## Authentication

Tests authenticate against the local Community Solid Server (CSS) running on `http://localhost:3001`.

The `loginToLocalCSS` helper function handles:
- Navigating to the login page
- Selecting the "Local CSS" provider
- Handling the OAuth flow
- Waiting for successful authentication

The `logout` helper function handles:
- Clicking the logout button
- Waiting for redirect to login page

## Writing New Tests

When adding new features, follow these guidelines:

1. **Test data persistence**: Always verify that data persists across logout/login cycles
2. **Use semantic selectors**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
3. **Wait appropriately**: Use `waitForTimeout` sparingly, prefer `waitForSelector` or expect assertions
4. **Test isolation**: Each test should be independent and not rely on state from other tests
5. **Follow existing patterns**: Look at existing tests for examples

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { loginToLocalCSS, logout } from './helpers/auth';

test.describe('Feature Name', () => {
  test('should do something and persist', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Your test steps here
    
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved successfully/i)).toBeVisible();
    
    await logout(page);
    await loginToLocalCSS(page);
    
    // Verify persistence
  });
});
```

## Troubleshooting

### Tests fail to connect to servers

Ensure `npm run start:dev` is running in another terminal. The servers should be accessible at:
- Next.js: http://localhost:3000
- CSS: http://localhost:3001

### Authentication fails

The local CSS authentication may require account creation. The helper tries to use `test@example.com` with password `test123`. If this fails, you may need to manually create a test account at http://localhost:3001/idp/register/.

### Selectors not found

The UI may have changed. Update selectors to match the current UI structure. Use the Playwright Inspector (`npm run test:e2e:debug`) to find the correct selectors.

### Data not persisting

Check that:
1. The CSS server is running and accessible
2. The `./data/` directory exists and is writable
3. The profile URI convention is correct (should be `{pod-root}/volunteer/profile`)

## CI/CD

Tests can be run in CI environments. The Playwright configuration automatically:
- Starts the necessary servers
- Runs tests in headless mode
- Retries failed tests (2 times on CI)
- Generates HTML reports

## Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

This opens an interactive report showing:
- Test results
- Screenshots of failures
- Test traces for debugging
