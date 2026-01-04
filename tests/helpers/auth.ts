import { Page, expect } from '@playwright/test';
import { 
  TEST_CREDENTIALS, 
  LOCAL_CSS_ISSUER, 
  AUTH_FLOW_TIMEOUT,
  CSS_LOGIN_TIMEOUT,
  OAUTH_REDIRECT_TIMEOUT 
} from './constants';

/**
 * Ensure a test account exists in the local CSS
 * 
 * This function checks if the test account can log in, and if not,
 * registers a new account with the test credentials.
 * 
 * @param page - Playwright page object
 * @param email - Email for the account
 * @param password - Password for the account
 */
async function ensureTestAccountExists(
  page: Page,
  email: string = TEST_CREDENTIALS.email,
  password: string = TEST_CREDENTIALS.password
) {
  // Navigate directly to the CSS registration page
  await page.goto('http://localhost:3001/.account/', { waitUntil: 'networkidle' });
  
  // Check if we're on an account page or need to register
  const currentUrl = page.url();
  
  // If we can access the account page, check if we need to login or register
  // CSS 8.x uses /.account/ as the main account management endpoint
  
  // Look for a "create account" or "register" link/button
  const createAccountLink = page.locator('a:has-text("create"), a:has-text("register"), button:has-text("create"), button:has-text("register")').first();
  const hasCreateOption = await createAccountLink.isVisible().catch(() => false);
  
  if (hasCreateOption) {
    // Click to go to registration
    await createAccountLink.click();
    await page.waitForLoadState('networkidle');
  }
  
  // Check if we're on a registration form
  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[name="password_confirm"]').first();
  
  const hasRegistrationForm = await emailInput.isVisible().catch(() => false);
  
  if (hasRegistrationForm) {
    // Fill in registration form
    await emailInput.fill(email);
    await passwordInput.fill(password);
    
    // Some forms have confirm password field
    const hasConfirmPassword = await confirmPasswordInput.isVisible().catch(() => false);
    if (hasConfirmPassword) {
      await confirmPasswordInput.fill(password);
    }
    
    // Submit registration
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Wait for registration to complete
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Login to local Community Solid Server (CSS)
 * 
 * This function handles the OAuth flow for authentication against
 * the local CSS instance. The CSS at port 3001 is the OIDC identity provider.
 * 
 * Note: If the test account doesn't exist, it will be created automatically.
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
  
  // Fill in the local CSS issuer URL
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
    
    // Wait for either authorize page, error page, or redirect back to app
    await page.waitForLoadState('networkidle');
    
    // Check if login failed (error message or still on login page)
    const errorMessage = page.locator('text=/invalid|incorrect|error|failed/i');
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    if (hasError) {
      // Login failed, need to register the account first
      await ensureTestAccountExists(page, email, password);
      
      // Retry login flow
      await page.goto('/login', { waitUntil: 'networkidle' });
      await page.waitForSelector('#oidc-issuer', { state: 'visible', timeout: OAUTH_REDIRECT_TIMEOUT });
      await page.locator('#oidc-issuer').fill(LOCAL_CSS_ISSUER);
      await page.click('button[type="submit"]:has-text("Next")');
      await page.waitForURL(/localhost:3001/, { timeout: CSS_LOGIN_TIMEOUT });
      await page.waitForLoadState('networkidle');
      
      // Try login again
      const retryEmailInput = page.locator('input[name="email"]');
      const retryLoginVisible = await retryEmailInput.isVisible().catch(() => false);
      if (retryLoginVisible) {
        await retryEmailInput.fill(email);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
      }
    }
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
