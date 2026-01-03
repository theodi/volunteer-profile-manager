import { test, expect } from '@playwright/test';

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
    
    // Verify preset provider buttons exist
    await expect(page.getByRole('button', { name: /local css/i })).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // The title should be set by Next.js
    await expect(page).toHaveTitle(/volunteer profile/i);
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Wait for redirect
    await page.waitForTimeout(2000);
    
    // Should be on login page
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('should have all preset issuer buttons', async ({ page }) => {
    await page.goto('/login');
    
    // Verify all preset issuers are available
    await expect(page.getByRole('button', { name: /solid community/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /inrupt/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /local css/i })).toBeVisible();
  });

  test('should allow selecting a preset issuer', async ({ page }) => {
    await page.goto('/login');
    
    // Click the Local CSS preset
    await page.click('button:has-text("Local CSS")');
    
    // Verify the input was populated
    const issuerInput = page.locator('#oidc-issuer');
    await expect(issuerInput).toHaveValue('http://localhost:3000');
  });

  test('should enable Next button when issuer is set', async ({ page }) => {
    await page.goto('/login');
    
    // Initially, fill in a valid URL
    await page.fill('#oidc-issuer', 'http://localhost:3000');
    
    // The Next button should be enabled (not disabled)
    const nextButton = page.getByRole('button', { name: /next/i });
    await expect(nextButton).toBeEnabled();
  });
});
