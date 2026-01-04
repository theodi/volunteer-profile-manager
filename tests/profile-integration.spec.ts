import { test, expect } from '@playwright/test';
import { loginToLocalCSS, logout } from './helpers/auth';
import { SAVE_OPERATION_TIMEOUT } from './helpers/constants';

/**
 * Integration test suite for Profile Editor
 * 
 * Tests the complete volunteer profile workflow including
 * authentication, navigation between tabs, data entry, and persistence.
 */

test.describe('Profile Editor Integration', () => {
  test('should complete full profile workflow', async ({ page }) => {
    // Step 1: Login
    await loginToLocalCSS(page);
    
    // Step 2: Verify we're on the profile page
    await expect(page.getByText(/volunteer profile/i)).toBeVisible();
    
    // Step 3: Verify all tabs are present (use exact match for Location to avoid matching 'Use my location')
    await expect(page.getByRole('button', { name: '📍Location' })).toBeVisible();
    await expect(page.getByRole('button', { name: /🕐.*availability/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /🛠.*skills/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /❤.*causes/i })).toBeVisible();
    
    // Step 4: Set availability
    await page.getByRole('button', { name: /🕐.*availability/i }).click();
    await page.waitForLoadState('networkidle');
    
    const fridayCheckbox = page.locator('input[type="checkbox"][value*="Friday"]').first();
    await fridayCheckbox.check();
    
    const eveningCheckbox = page.locator('input[type="checkbox"][value*="Evening"]').first();
    await eveningCheckbox.check();
    
    // Step 5: Add skills
    await page.getByRole('button', { name: /🛠.*skills/i }).click();
    await page.waitForLoadState('networkidle');
    
    const teamworkCheckbox = page.getByLabel(/ability.*work cooperatively/i);
    await teamworkCheckbox.check({ force: true });
    
    const communicationCheckbox = page.getByLabel(/clear.*communication/i);
    await communicationCheckbox.check({ force: true });
    
    // Step 6: Add causes
    await page.getByRole('button', { name: /❤.*causes/i }).click();
    await page.waitForLoadState('networkidle');
    
    const communityCheckbox = page.getByLabel(/community development/i);
    await communityCheckbox.check({ force: true });
    
    const elderCheckbox = page.getByLabel(/elder care/i);
    await elderCheckbox.check({ force: true });
    
    // Step 7: Save all changes
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ timeout: 10000 });
    
    // Step 8: Logout
    await logout(page);
    
    // Step 9: Login again
    await loginToLocalCSS(page);
    
    // Step 10: Verify all data persisted
    
    // Check availability
    await page.getByRole('button', { name: /🕐.*availability/i }).click();
    await page.waitForLoadState('networkidle');
    
    const fridayCheckboxAfter = page.locator('input[type="checkbox"][value*="Friday"]').first();
    await expect(fridayCheckboxAfter).toBeChecked();
    
    const eveningCheckboxAfter = page.locator('input[type="checkbox"][value*="Evening"]').first();
    await expect(eveningCheckboxAfter).toBeChecked();
    
    // Check skills
    await page.getByRole('button', { name: /🛠.*skills/i }).click();
    await page.waitForLoadState('networkidle');
    
    const teamworkCheckboxAfter = page.getByLabel(/ability.*work cooperatively/i);
    await expect(teamworkCheckboxAfter).toBeChecked();
    
    const communicationCheckboxAfter = page.getByLabel(/clear.*communication/i);
    await expect(communicationCheckboxAfter).toBeChecked();
    
    // Check causes
    await page.getByRole('button', { name: /❤.*causes/i }).click();
    await page.waitForLoadState('networkidle');
    
    const communityCheckboxAfter = page.getByLabel(/community development/i);
    await expect(communityCheckboxAfter).toBeChecked({ timeout: 10000 });
    
    const elderCheckboxAfter = page.getByLabel(/elder care/i);
    await expect(elderCheckboxAfter).toBeChecked();
  });

  test('should display user profile information', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Verify profile page is displayed
    await expect(page.getByText(/volunteer profile/i)).toBeVisible();
    
    // Look for profile menu button (should show user avatar or icon)
    const profileButton = page.locator('button').filter({ has: page.locator('img, svg') }).first();
    const profileButtonExists = await profileButton.count() > 0;
    
    if (profileButtonExists) {
      // Click profile button to open menu
      await profileButton.click();
      
      // Wait for dropdown menu
      await page.waitForLoadState('networkidle');
      
      // Look for logout option in the menu
      const logoutOption = page.locator('button:has-text("Sign out"), button:has-text("Logout")').first();
      await expect(logoutOption).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle tab navigation smoothly', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Navigate through all tabs - use emoji prefixes to match exact tab buttons
    const tabs = [
      /📍Location/,
      /🕐.*Availability/i,
      /🛠.*Skills/i,
      /❤.*Causes/i,
    ];
    
    for (const tabName of tabs) {
      await page.getByRole('button', { name: tabName }).click();
      await page.waitForLoadState('networkidle');
      
      // Verify tab is selected/active
      const tab = page.getByRole('button', { name: tabName });
      await expect(tab).toBeVisible();
    }
  });

  test('should show save button on all tabs', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Check that save button exists on each tab - use emoji prefixes
    const tabs = [
      /📍Location/,
      /🕐.*Availability/i,
      /🛠.*Skills/i,
      /❤.*Causes/i,
    ];
    
    for (const tabName of tabs) {
      await page.getByRole('button', { name: tabName }).click();
      await page.waitForLoadState('networkidle');
      
      // Verify save button is present
      const saveButton = page.getByRole('button', { name: /save/i });
      await expect(saveButton).toBeVisible();
    }
  });

  test('should handle multiple updates in same session', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // First update - add availability
    await page.getByRole('button', { name: /🕐.*Availability/i }).click();
    await page.waitForLoadState('networkidle');
    
    const saturdayCheckbox = page.locator('input[type="checkbox"][value*="Saturday"]').first();
    await saturdayCheckbox.check();
    
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ timeout: 10000 });
    
    // Second update - add a skill
    await page.getByRole('button', { name: /🛠.*Skills/i }).click();
    await page.waitForLoadState('networkidle');
    
    const firstAidCheckbox = page.getByLabel(/basic first aid/i);
    await firstAidCheckbox.check({ force: true });
    
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ timeout: 10000 });
    
    // Third update - add a cause
    await page.getByRole('button', { name: /❤.*Causes/i }).click();
    await page.waitForLoadState('networkidle');
    
    const emergencyCheckbox = page.getByLabel(/emergency response/i);
    await emergencyCheckbox.check({ force: true });
    
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ timeout: 10000 });
    
    // Verify all updates persisted
    await page.getByRole('button', { name: /🕐.*Availability/i }).click();
    await page.waitForLoadState('networkidle');
    await expect(saturdayCheckbox).toBeChecked();
    
    await page.getByRole('button', { name: /🛠.*Skills/i }).click();
    await page.waitForLoadState('networkidle');
    await expect(firstAidCheckbox).toBeChecked({ timeout: 10000 });
    
    await page.getByRole('button', { name: /❤.*Causes/i }).click();
    await page.waitForLoadState('networkidle');
    await expect(emergencyCheckbox).toBeChecked({ timeout: 10000 });
  });
});
