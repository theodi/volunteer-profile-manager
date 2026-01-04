import { test, expect } from '@playwright/test';
import { LOCAL_CSS_ISSUER } from './helpers/constants';

/**
 * Smoke tests to verify basic application functionality
 * These tests run quickly and check that the app is accessible
 */

test.describe('Smoke Tests', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('/login');
    
    // Verify we can see the login page elements
    await expect(page.getByText(/sign in/i)).toBeVisible();
    await expect(page.getByText(/solid identity provider/i)).toBeVisible();
    
    // Verify the OIDC issuer input exists
    await expect(page.locator('#oidc-issuer')).toBeVisible();
    
    // Verify preset provider buttons exist (Local CSS was removed)
    await expect(page.getByRole('button', { name: /solid community/i })).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // The title should be set by Next.js (Playwright will auto-wait)
    await expect(page).toHaveTitle(/volunteer profile/i);
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Wait for redirect to login page using deterministic URL wait
    await page.waitForURL(/\/login(?:\?|$)/, { timeout: 5000 });
    
    // Should be on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should have all preset issuer buttons', async ({ page }) => {
    await page.goto('/login');
    
    // Verify preset issuers are available (Local CSS was removed in PR #10)
    await expect(page.getByRole('button', { name: /solid community/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /inrupt/i })).toBeVisible();
  });

  test('should allow selecting a preset issuer', async ({ page }) => {
    await page.goto('/login');
    
    // Click the Solid Community preset
    await page.click('button:has-text("Solid Community")');
    
    // Verify the input was populated with the Solid Community issuer
    const issuerInput = page.locator('#oidc-issuer');
    await expect(issuerInput).toHaveValue('https://solidcommunity.net/');
  });

  test('should enable Next button when issuer is set', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in a valid local CSS URL
    await page.fill('#oidc-issuer', LOCAL_CSS_ISSUER);
    
    // The Next button should be enabled (not disabled)
    const nextButton = page.getByRole('button', { name: /next/i });
    await expect(nextButton).toBeEnabled();
  });

  test('should accept URL without https:// prefix', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in a URL without https:// prefix
    await page.fill('#oidc-issuer', 'solidcommunity.net');
    
    // Click Next button to trigger validation
    const nextButton = page.getByRole('button', { name: /next/i });
    await nextButton.click();
    
    // Should not show an error message about invalid URL
    // The error message would be visible if the URL was rejected
    const errorMessage = page.locator('text=/please enter a valid url/i');
    await expect(errorMessage).not.toBeVisible();
    
    // The button should be in loading state (showing "Signing in...")
    // indicating that the URL was accepted and login is being attempted
    await expect(page.getByText(/signing in/i)).toBeVisible({ timeout: 3000 });
  });

  test('should accept URL with http:// prefix', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in a URL with explicit http:// prefix (like local dev server)
    await page.fill('#oidc-issuer', 'http://localhost:3001');
    
    // Click Next button to trigger validation
    const nextButton = page.getByRole('button', { name: /next/i });
    await nextButton.click();
    
    // Should not show an error message about invalid URL
    const errorMessage = page.locator('text=/please enter a valid url/i');
    await expect(errorMessage).not.toBeVisible();
    
    // The button should be in loading state
    await expect(page.getByText(/signing in/i)).toBeVisible({ timeout: 3000 });
  });
});
