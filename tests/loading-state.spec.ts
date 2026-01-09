import { test, expect } from '@playwright/test';
import { loginToLocalCSS } from './helpers/auth';

/**
 * Test suite for profile loading state behavior
 * 
 * Verifies that the "Loading profile..." message is properly hidden
 * once the profile has been loaded (or confirmed absent for new users).
 */

test.describe('Profile Loading State', () => {
  test('should hide loading state after profile is loaded', async ({ page }) => {
    // Login to local CSS
    await loginToLocalCSS(page);
    
    // Wait for the page to stabilize after authentication
    await page.waitForLoadState('networkidle');
    
    // Verify the "Loading profile..." text is NOT visible
    // This is the key assertion - the loading message should be hidden
    const loadingText = page.getByText(/loading profile/i);
    await expect(loadingText).not.toBeVisible({ timeout: 5000 });
    
    // Verify that the profile editor UI is visible and interactive
    // Check for tab navigation which should be visible when not loading
    await expect(page.getByRole('tab', { name: /location/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /availability/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /skills.*requirements/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /causes/i })).toBeVisible();
    
    // Verify the save button is visible (should be visible when not loading)
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });
  
  test('should allow interaction with profile editor after loading', async ({ page }) => {
    // Login to local CSS
    await loginToLocalCSS(page);
    
    // Wait for the page to stabilize
    await page.waitForLoadState('networkidle');
    
    // The loading state should be hidden - verify by trying to interact with tabs
    const availabilityTab = page.getByRole('tab', { name: /availability/i });
    
    // Should be able to click the tab (not blocked by loading overlay)
    await availabilityTab.click();
    
    // Verify tab content loaded
    await page.waitForLoadState('networkidle');
    
    // Should see checkboxes for days/times (would be hidden if still loading)
    const mondayCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(mondayCheckbox).toBeVisible();
  });
  
  test('should not show loading state indefinitely for new users', async ({ page }) => {
    // Login to local CSS (which may or may not have a profile created yet)
    await loginToLocalCSS(page);
    
    // Wait for authentication and initial page load
    await page.waitForLoadState('networkidle');
    
    // For new users without a profile (absentReadSuccess status),
    // the loading state should still be hidden and the UI should be interactive
    const loadingText = page.getByText(/loading profile/i);
    
    // Wait a reasonable time and ensure loading is NOT stuck
    await page.waitForTimeout(2000);
    
    // Loading should be hidden
    await expect(loadingText).not.toBeVisible();
    
    // UI should be interactive - check save button is visible
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });
});
