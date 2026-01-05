import { Page, expect } from '@playwright/test';
import { 
  TEST_CREDENTIALS, 
  LOCAL_CSS_ISSUER, 
  AUTH_FLOW_TIMEOUT,
  CSS_LOGIN_TIMEOUT,
  OAUTH_REDIRECT_TIMEOUT,
  PROFILE_LOAD_TIMEOUT
} from './constants';

/**
 * Navigate to the app login page and initiate OAuth flow
 * 
 * @param page - Playwright page object
 * @returns true if redirected to CSS successfully
 */
async function initiateOAuthFlow(page: Page): Promise<boolean> {
  // Navigate to login page
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  
  // Wait for the OIDC issuer input to be ready
  await page.waitForSelector('#oidc-issuer', { state: 'visible', timeout: OAUTH_REDIRECT_TIMEOUT });
  
  // Fill in the local CSS issuer URL
  await page.locator('#oidc-issuer').fill(LOCAL_CSS_ISSUER);
  
  // Click the "Next" button to initiate OAuth flow
  await page.click('button[type="submit"]:has-text("Next")');
  
  // Wait for redirect to CSS login/authorize page
  await page.waitForURL(/localhost:3001/, { timeout: CSS_LOGIN_TIMEOUT });
  
  // Wait for page to stabilize
  await page.waitForLoadState('domcontentloaded');
  
  return true;
}

/**
 * Perform login on CSS login form
 * 
 * @param page - Playwright page object
 * @param email - Email for login
 * @param password - Password for login
 * @returns true if login form was found and filled
 */
async function performCSSLogin(
  page: Page,
  email: string,
  password: string
): Promise<boolean> {
  // Wait for the login form to be visible - use a more robust selector
  const emailInput = page.getByRole('textbox', { name: 'Email' });
  const isLoginFormVisible = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (isLoginFormVisible) {
    await emailInput.fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForLoadState('domcontentloaded');
    return true;
  }
  
  return false;
}

/**
 * Check if login failed with an error message
 * 
 * @param page - Playwright page object
 * @returns true if an error message is visible
 */
async function hasLoginError(page: Page): Promise<boolean> {
  const errorMessage = page
    .locator('[role="alert"], .error, .alert, .notification')
    .filter({ hasText: /invalid|incorrect|credential|password|authentication|login failed/i });
  return await errorMessage.first().isVisible().catch(() => false);
}

/**
 * Ensure a test account exists in the local CSS
 * 
 * This function navigates to the CSS account registration page
 * and creates a new account with the test credentials.
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
  // Navigate directly to the CSS registration page using the constant
  await page.goto(`${LOCAL_CSS_ISSUER}/.account/`, { waitUntil: 'domcontentloaded' });
  
  // Look for a "create account" or "register" link/button (case-insensitive)
  const createAccountLink = page.locator('a, button').filter({ hasText: /create|register/i }).first();
  const hasCreateOption = await createAccountLink.isVisible().catch(() => false);
  
  if (hasCreateOption) {
    // Click to go to registration
    await createAccountLink.click();
    await page.waitForLoadState('domcontentloaded');
  }
  
  // Check if we're on a registration form
  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  // Use .nth(1) for confirm password to avoid matching the same element as passwordInput
  const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[name="password_confirm"]').first()
    .or(page.locator('input[name="password"], input[type="password"]').nth(1));
  
  const hasRegistrationForm = await emailInput.isVisible().catch(() => false);
  
  if (hasRegistrationForm) {
    // Fill in registration form
    await emailInput.fill(email);
    await passwordInput.fill(password);
    
    // Some forms have confirm password field (check for a second password input)
    const hasConfirmPassword = await confirmPasswordInput.isVisible().catch(() => false);
    if (hasConfirmPassword) {
      await confirmPasswordInput.fill(password);
    }
    
    // Submit registration
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Wait for registration to complete
    await page.waitForLoadState('domcontentloaded');
    
    // After submission, verify that registration either succeeded or the account already exists.
    // This makes the registration fallback more robust and avoids silently continuing on failure.
    
    // Possible success indicator messages
    const successMessage = page
      .locator('text=/account created|registration successful|successfully created/i')
      .first();
    
    // Possible "already exists" indicator messages
    const alreadyExistsMessage = page
      .locator('text=/already exists|account exists|email in use/i')
      .first();
    
    const registrationSucceeded = await successMessage.isVisible().catch(() => false);
    const accountAlreadyExists = await alreadyExistsMessage.isVisible().catch(() => false);
    
    // Detect if we were redirected to a login form instead of staying on the registration page
    const loginEmailInput = page.locator('input[name="email"], input[type="email"]').first();
    const loginPasswordInput = page.locator('input[name="password"], input[type="password"]').first();
    const loginSubmitButton = page
      .locator('button[type="submit"], input[type="submit"]')
      .filter({ hasText: /log in|login|sign in/i })
      .first();
    
    const hasLoginEmail = await loginEmailInput.isVisible().catch(() => false);
    const hasLoginPassword = await loginPasswordInput.isVisible().catch(() => false);
    const hasLoginSubmit = await loginSubmitButton.isVisible().catch(() => false);
    
    const redirectedToLoginForm = hasLoginEmail && hasLoginPassword && hasLoginSubmit;
    
    // Also check if we're on an auth-related page by URL
    const currentUrl = page.url();
    const looksLikeAuthPage = /login|signin|account|authorize/i.test(currentUrl);
    
    if (!registrationSucceeded && !accountAlreadyExists && !redirectedToLoginForm && !looksLikeAuthPage) {
      throw new Error(
        'Test account registration outcome could not be determined. ' +
        'No success, "account exists" message, or login form detected after registration submit.'
      );
    }
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
  // Navigate to the app and wait for initial load (don't use domcontentloaded as LDO may maintain connections)
  await page.goto('/');
  
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
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
  }
  
  // Initiate OAuth flow
  await initiateOAuthFlow(page);
  
  // Perform login
  const loginPerformed = await performCSSLogin(page, email, password);
  
  if (loginPerformed) {
    // Give the page a brief moment to render any potential error messages
    await page.waitForTimeout(500);
    
    // Check if login failed (error message visible)
    const hasError = await hasLoginError(page);
    
    if (hasError) {
      // Login failed, need to register the account first
      await ensureTestAccountExists(page, email, password);
      
      // After registration, CSS typically leaves us on a confirmation/account page.
      // Explicitly navigate back to the app login before restarting the OAuth flow
      // so the page state is well-defined and not dependent on prior navigation.
      await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
      
      // Retry login flow
      await initiateOAuthFlow(page);
      await performCSSLogin(page, email, password);

      // After retrying login, verify that it succeeded before proceeding
      const hasRetryError = await hasLoginError(page);
      if (hasRetryError) {
        throw new Error('Login failed even after automatic test account registration. Check test credentials or CSS configuration.');
      }
    }
  }
  
  // Wait for either consent page or redirect back to app
  // The CSS OAuth flow may show a consent/authorize page
  // We need to handle this in a loop since navigation happens asynchronously
  const maxConsentAttempts = 5;
  for (let attempt = 0; attempt < maxConsentAttempts; attempt++) {
    await page.waitForLoadState('domcontentloaded');
    
    const currentUrl = page.url();
    
    // Check if we're already at the app (either home or callback with code)
    if (currentUrl.startsWith('http://localhost:3000')) {
      break;
    }
    
    // Check if we're on the CSS server - could be consent, auth, or oidc page
    // CSS uses various paths: /consent, /authorize, /.oidc/auth/*, etc.
    if (currentUrl.startsWith('http://localhost:3001')) {
      // Look for the Authorize button on any CSS page
      // The button may have text "Authorize", "Allow", "Consent", or just be a submit button
      const authorizeButton = page.locator('button').filter({ hasText: /^Authorize$|^Allow$|^Consent$/i }).first();
      const isVisible = await authorizeButton.isVisible().catch(() => false);
      if (isVisible) {
        await authorizeButton.click();
        await page.waitForLoadState('domcontentloaded');
        continue; // Check if we need to authorize again or if we're done
      }
      
      // Also check for a WebID selection page (CSS shows this for consent)
      // Look for "An application is requesting access" heading
      const requestingAccessHeading = page.locator('h1').filter({ hasText: /requesting access/i });
      const hasRequestingAccess = await requestingAccessHeading.isVisible().catch(() => false);
      if (hasRequestingAccess) {
        // Click Authorize button if present
        const authBtn = page.getByRole('button', { name: 'Authorize' });
        const authVisible = await authBtn.isVisible().catch(() => false);
        if (authVisible) {
          await authBtn.click();
          await page.waitForLoadState('domcontentloaded');
          continue;
        }
      }
    }
    
    // Wait a moment for any pending navigation
    await page.waitForTimeout(500);
  }
  
  // Wait for redirect back to the app - use a pattern that matches both / and /login?code=...
  await page.waitForURL(/http:\/\/localhost:3000/, { timeout: AUTH_FLOW_TIMEOUT });
  
  // If we're on the callback URL with code, wait for it to process
  if (page.url().includes('/login?code=')) {
    // Wait for the app to process the OAuth callback and redirect to home
    await page.waitForURL('http://localhost:3000/', { timeout: AUTH_FLOW_TIMEOUT });
  }
  
  // Verify logged in by checking for the profile editor heading
  // This is more reliable than domcontentloaded which can timeout with persistent connections
  const profileHeading = page.getByRole('heading', { name: /volunteer profile/i });
  await expect(profileHeading).toBeVisible({ timeout: OAUTH_REDIRECT_TIMEOUT });
}

/**
 * Logout from the application
 * 
 * Opens the profile menu dropdown and clicks sign out
 * 
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  // First, click the profile menu button to open the dropdown
  // The profile menu button is the button with a user avatar in the header
  const profileMenuButton = page.locator('header button').filter({ has: page.locator('img, svg') }).last();
  await profileMenuButton.click();
  
  // Wait for dropdown to appear and click sign out
  const signOutButton = page.getByRole('button', { name: /sign out/i });
  await expect(signOutButton).toBeVisible({ timeout: 5000 });
  await signOutButton.click();
  
  // Wait for redirect to login page using deterministic URL wait
  await page.waitForURL(/\/login(?:\?|$)/, { timeout: OAUTH_REDIRECT_TIMEOUT });
  
  // Verify we're on login page by waiting for the issuer input
  await page.waitForSelector('#oidc-issuer', { state: 'visible', timeout: 5000 });
}

/**
 * Wait for the profile to finish loading from the pod
 * 
 * The profile editor shows "Loading profile..." while fetching data.
 * This function waits for the loading to complete by waiting for
 * the save button to become visible, which indicates the UI is ready.
 * 
 * Note: We don't use domcontentloaded as LDO may maintain persistent connections.
 * 
 * For new users, the profile resource may be absent, which is also a valid state.
 * 
 * @param page - Playwright page object
 */
export async function waitForProfileLoaded(page: Page) {
  // Wait for the Save Profile button to be visible, which indicates the UI is ready
  await expect(page.getByRole('button', { name: /save/i })).toBeVisible({ 
    timeout: PROFILE_LOAD_TIMEOUT 
  });
  
  // Give an extra moment for the React state to update
  await page.waitForTimeout(1000);
}
