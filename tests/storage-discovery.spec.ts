import { test, expect } from '@playwright/test';
import { loginToLocalCSS, logout } from './helpers/auth';
import { SAVE_OPERATION_TIMEOUT } from './helpers/constants';

/**
 * Storage Discovery Test Suite
 * 
 * Tests verify that profile URIs are discovered correctly from WebID storage
 * predicates (pim:storage) and that data persists across authentication cycles.
 * 
 * This addresses the storage discovery pattern introduced in PR #27 where
 * profiles are saved to {storage-root}/volunteer/profile instead of being
 * derived from WebID path manipulation.
 */

test.describe('Storage Discovery', () => {
  test('should discover storage and save profile to correct location', async ({ page }) => {
    // Step 1: Login to local CSS
    await loginToLocalCSS(page);
    
    // Step 2: Verify profile page loads successfully (indicates storage discovery worked)
    await expect(page.getByText(/volunteer profile/i)).toBeVisible();
    
    // Step 3: Navigate to availability tab and make a change
    await page.getByRole('tab', { name: /availability/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Select a specific day to verify data can be saved
    const mondayCheckbox = page.locator('input[type="checkbox"][value*="Monday"]').first();
    await mondayCheckbox.check();
    
    // Step 4: Save the profile
    await page.getByRole('button', { name: /save/i }).click();
    
    // Step 5: Verify save succeeded (this confirms storage discovery and write access)
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ timeout: SAVE_OPERATION_TIMEOUT });
    
    // Step 6: Logout
    await logout(page);
    
    // Step 7: Login again
    await loginToLocalCSS(page);
    
    // Step 8: Verify profile loads (storage discovery worked on reload)
    await expect(page.getByText(/volunteer profile/i)).toBeVisible();
    
    // Step 9: Navigate to availability and verify data persisted
    await page.getByRole('tab', { name: /availability/i }).click();
    await page.waitForLoadState('networkidle');
    
    const mondayCheckboxAfter = page.locator('input[type="checkbox"][value*="Monday"]').first();
    await expect(mondayCheckboxAfter).toBeChecked();
  });

  test('should handle storage discovery on initial profile creation', async ({ page }) => {
    // This test verifies that storage discovery works even when no profile exists yet
    // by checking that the app can load without errors
    
    // Step 1: Login to local CSS
    await loginToLocalCSS(page);
    
    // Step 2: Verify the profile editor loads without errors
    // If storage discovery fails, an error message would be shown
    await expect(page.getByText(/volunteer profile/i)).toBeVisible();
    
    // Step 3: Check that no storage discovery error is shown
    const errorMessage = page.getByText(/no storage found|failed to discover storage/i);
    await expect(errorMessage).not.toBeVisible();
    
    // Step 4: Verify all tabs are accessible (indicates profile resource is set up)
    await expect(page.getByRole('tab', { name: /location/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /availability/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /skills.*requirements/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /causes/i })).toBeVisible();
  });

  test('should persist complex profile data across logout/login using discovered storage', async ({ page }) => {
    // Test multiple data types to verify complete persistence via discovered storage
    
    // Step 1: Login
    await loginToLocalCSS(page);
    await expect(page.getByText(/volunteer profile/i)).toBeVisible();
    
    // Step 2: Add availability data
    await page.getByRole('tab', { name: /availability/i }).click();
    await page.waitForLoadState('networkidle');
    
    const tuesdayCheckbox = page.locator('input[type="checkbox"][value*="Tuesday"]').first();
    await tuesdayCheckbox.check();
    
    const morningCheckbox = page.locator('input[type="checkbox"][value*="Morning"]').first();
    await morningCheckbox.check();
    
    // Step 3: Add skills data
    await page.getByRole('tab', { name: /skills.*requirements/i }).click();
    await page.waitForLoadState('networkidle');
    
    const empathySkill = page.getByLabel(/empathy.*compassion/i);
    await empathySkill.check();
    
    // Step 4: Add causes data
    await page.getByRole('tab', { name: /causes/i }).click();
    await page.waitForLoadState('networkidle');
    
    const mentalHealthCause = page.getByLabel(/mental health/i);
    await mentalHealthCause.check();
    
    // Step 5: Save all data
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ timeout: SAVE_OPERATION_TIMEOUT });
    
    // Step 6: Logout
    await logout(page);
    
    // Step 7: Login again
    await loginToLocalCSS(page);
    await expect(page.getByText(/volunteer profile/i)).toBeVisible();
    
    // Step 8: Verify all data persisted correctly
    
    // Check availability
    await page.getByRole('tab', { name: /availability/i }).click();
    await page.waitForLoadState('networkidle');
    
    const tuesdayCheckboxAfter = page.locator('input[type="checkbox"][value*="Tuesday"]').first();
    await expect(tuesdayCheckboxAfter).toBeChecked();
    
    const morningCheckboxAfter = page.locator('input[type="checkbox"][value*="Morning"]').first();
    await expect(morningCheckboxAfter).toBeChecked();
    
    // Check skills
    await page.getByRole('tab', { name: /skills.*requirements/i }).click();
    await page.waitForLoadState('networkidle');
    
    const empathySkillAfter = page.getByLabel(/empathy.*compassion/i);
    await expect(empathySkillAfter).toBeChecked();
    
    // Check causes
    await page.getByRole('tab', { name: /causes/i }).click();
    await page.waitForLoadState('networkidle');
    
    const mentalHealthCauseAfter = page.getByLabel(/mental health/i);
    await expect(mentalHealthCauseAfter).toBeChecked();
  });
});
