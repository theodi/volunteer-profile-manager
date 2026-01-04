import { Page, expect } from '@playwright/test';
import { 
  TEST_CREDENTIALS, 
  LOCAL_CSS_ISSUER, 
  AUTH_FLOW_TIMEOUT,
  CSS_LOGIN_TIMEOUT,
  OAUTH_REDIRECT_TIMEOUT 
} from './constants';

/**
 * Login to local Community Solid Server (CSS)
 * 
 * This function handles the OAuth flow for authentication against
 * the local CSS instance. The Next.js app (port 3000) acts as the OIDC
 * issuer, which then communicates with CSS (port 3001).
 * 
 * Note: Test account (test@example.com / test123) must exist in the local CSS.
 * Create it by navigating to http://localhost:3001/idp/register/ if needed.
 * 
 * @param page - Playwright page object
 * @param email - Email for CSS login
 * @param password - Password for CSS login
 */
export async function loginToLocalCSS(
  page: Page,
  email: string = TEST_CREDENTIALS.email,
  password: string = TEST_CREDENTIALS.password
) {
  // Navigate to the app and wait for initial load
  await page.goto('/', { waitUntil: 'networkidle' });
  
  // Wait for either login page or profile page to appear
  try {
    await page.waitForURL(/\/(login)?$/, { timeout: 5000 });
  } catch {
    // Already might be logged in, check for logout button
    const logoutButton = page.getByRole('button', { name: /logout/i });
    const isVisible = await logoutButton.isVisible().catch(() => false);
    if (isVisible) {
      return; // Already logged in
    }
  }
  
  // Navigate to login page if not already there
  const currentUrl = page.url();
  if (!currentUrl.includes('/login')) {
    await page.goto('/login', { waitUntil: 'networkidle' });
  }
  
  // Wait for the OIDC issuer input to be ready
  await page.waitForSelector('#oidc-issuer', { state: 'visible', timeout: OAUTH_REDIRECT_TIMEOUT });
  
  // Fill in the local CSS issuer URL directly (Local CSS preset button was removed)
  const issuerInput = page.locator('#oidc-issuer');
  await issuerInput.fill(LOCAL_CSS_ISSUER);
  
  // Click the "Next" button to initiate OAuth flow
  await page.click('button[type="submit"]:has-text("Next")');
  
  // Wait for redirect to CSS login/authorize page
  await page.waitForURL(/localhost:3001/, { timeout: CSS_LOGIN_TIMEOUT });
  
  // Wait for page to stabilize and check for login form
  await page.waitForLoadState('networkidle');
  
  // Check if login form is present
  const emailInput = page.locator('input[name="email"]');
  const isLoginFormVisible = await emailInput.isVisible().catch(() => false);
  
  if (isLoginFormVisible) {
    // Need to log in to CSS
    await emailInput.fill(email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    // Wait for either authorize page or redirect back to app
    await page.waitForLoadState('networkidle');
  }
  
  // Check if there's an authorize/consent page
  const authorizeButton = page.locator('button:has-text("Authorize"), button:has-text("Allow")').first();
  const isAuthorizeVisible = await authorizeButton.isVisible().catch(() => false);
  
  if (isAuthorizeVisible) {
    await authorizeButton.click();
  }
  
  // Wait for redirect back to the app
  await page.waitForURL('http://localhost:3000/', { timeout: AUTH_FLOW_TIMEOUT });
  
  // Wait for authentication to complete by checking for profile page elements
  await page.waitForLoadState('networkidle');
  
  // Verify logged in by checking for logout button
  const logoutButton = page.getByRole('button', { name: /logout/i });
  await expect(logoutButton).toBeVisible({ timeout: OAUTH_REDIRECT_TIMEOUT });
}

/**
 * Logout from the application
 * 
 * Clicks the logout button and waits for the login page
 * 
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  // Click logout button
  const logoutButton = page.getByRole('button', { name: /logout/i });
  await logoutButton.click();
  
  // Wait for redirect to login page using deterministic URL wait
  await page.waitForURL(/\/login(?:\?|$)/, { timeout: OAUTH_REDIRECT_TIMEOUT });
  
  // Verify we're on login page by waiting for the issuer input
  await page.waitForSelector('#oidc-issuer', { state: 'visible', timeout: 5000 });
}
