import { Page, expect } from '@playwright/test';

/**
 * Login to local Community Solid Server (CSS)
 * 
 * This function handles the OAuth flow for authentication against
 * the local CSS instance running on http://localhost:3001
 * 
 * @param page - Playwright page object
 * @param email - Email for CSS login (default: test@example.com)
 * @param password - Password for CSS login (default: test123)
 */
export async function loginToLocalCSS(
  page: Page,
  email: string = 'test@example.com',
  password: string = 'test123'
) {
  // Navigate to the app
  await page.goto('/', { waitUntil: 'networkidle' });
  
  // Wait a bit for redirect to happen if needed
  await page.waitForTimeout(1000);
  
  // Check if we're on the login page
  const currentUrl = page.url();
  if (!currentUrl.includes('/login')) {
    // Already logged in, check for logout button to verify
    const logoutButton = page.getByRole('button', { name: /logout/i });
    const isVisible = await logoutButton.isVisible().catch(() => false);
    if (isVisible) {
      return; // Already logged in
    }
  }
  
  // Navigate to login page if not already there
  if (!currentUrl.includes('/login')) {
    await page.goto('/login');
  }
  
  // Wait for the OIDC issuer input
  await page.waitForSelector('#oidc-issuer', { timeout: 10000 });
  
  // Select "Local CSS" preset button
  await page.click('button:has-text("Local CSS")');
  
  // Verify the input has the correct value
  const issuerInput = page.locator('#oidc-issuer');
  await expect(issuerInput).toHaveValue('http://localhost:3000');
  
  // Click the "Next" button to initiate OAuth flow
  await page.click('button[type="submit"]:has-text("Next")');
  
  // Wait for redirect to CSS login/authorize page
  // CSS may redirect directly to authorize if already logged in
  await page.waitForURL(/localhost:3001/, { timeout: 15000 });
  
  // Handle different CSS auth flows
  const pageContent = await page.content();
  
  if (pageContent.includes('email') && pageContent.includes('password')) {
    // Need to log in to CSS
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    // May need to wait for authorize page after login
    await page.waitForTimeout(2000);
  }
  
  // Check if there's an authorize/consent page
  const currentPageContent = await page.content();
  if (currentPageContent.includes('Authorize') || currentPageContent.includes('consent')) {
    // Click authorize/allow button
    const authorizeButton = page.locator('button:has-text("Authorize"), button:has-text("Allow"), button[type="submit"]').first();
    await authorizeButton.click();
  }
  
  // Wait for redirect back to the app
  await page.waitForURL('http://localhost:3000/', { timeout: 15000 });
  
  // Wait for authentication to complete
  await page.waitForTimeout(2000);
  
  // Verify logged in by checking for logout button or profile content
  const logoutButton = page.getByRole('button', { name: /logout/i });
  await expect(logoutButton).toBeVisible({ timeout: 10000 });
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
  
  // Wait for redirect to login page
  await page.waitForURL(/login/, { timeout: 10000 });
  
  // Verify we're on login page
  const loginButton = page.getByRole('button', { name: /login/i });
  await expect(loginButton).toBeVisible();
}

/**
 * Create a new test account on local CSS
 * 
 * This registers a new account if it doesn't exist
 * 
 * @param page - Playwright page object
 * @param email - Email for new account
 * @param password - Password for new account
 */
export async function createCSSAccount(
  page: Page,
  email: string,
  password: string
) {
  // Navigate to CSS registration page
  await page.goto('http://localhost:3001/idp/register/');
  
  // Fill in registration form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  
  // Submit registration
  await page.click('button[type="submit"]');
  
  // Wait for success or error
  await page.waitForTimeout(2000);
}
