import { test, expect } from '@playwright/test';
import { loginToLocalCSS, logout } from './helpers/auth';

/**
 * Test suite for Storage Selection
 * 
 * Tests the functionality of selecting storage location when users have
 * multiple storages, and verifies that preferences are remembered.
 * 
 * Note: The local CSS typically provides only one storage per user, so these
 * tests focus on verifying the localStorage persistence mechanism and that
 * the single storage case works correctly (no selector shown).
 */

test.describe('Storage Selection', () => {
  test('should not show storage selector when only one storage is available', async ({ page }) => {
    // Login to local CSS (which provides a single storage per user)
    await loginToLocalCSS(page);
    
    // Wait for the main profile editor to load
    await page.waitForLoadState('networkidle');
    
    // The storage selector should NOT be visible when there's only one storage
    const storageSelector = page.locator('text=/Select Storage Location/i');
    await expect(storageSelector).not.toBeVisible();
    
    // The main profile editor tabs should be visible
    const locationTab = page.getByRole('tab', { name: /location/i });
    await expect(locationTab).toBeVisible({ timeout: 10000 });
  });

  test('should save and load profile data with single storage', async ({ page }) => {
    // This test verifies the storage selection doesn't interfere with normal operation
    await loginToLocalCSS(page);
    
    // Navigate to availability tab
    await page.getByRole('tab', { name: /availability/i }).click();
    await page.waitForSelector('text=Select your preferred days and times', { 
      state: 'visible',
      timeout: 5000 
    });
    
    // Select Friday as a test value
    const fridayCheckbox = page.locator('input[type="checkbox"][value*="Friday"]').first();
    await fridayCheckbox.check();
    
    // Save
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ timeout: 10000 });
    
    // Logout and login again
    await logout(page);
    await loginToLocalCSS(page);
    
    // Verify Friday is still selected
    await page.getByRole('tab', { name: /availability/i }).click();
    await page.waitForSelector('text=Select your preferred days and times', { 
      state: 'visible',
      timeout: 5000 
    });
    
    const fridayCheckboxAfter = page.locator('input[type="checkbox"][value*="Friday"]').first();
    await expect(fridayCheckboxAfter).toBeChecked();
  });

  test('should use storage preference from localStorage when available', async ({ page }) => {
    // First, login to establish a session and get the WebID
    await loginToLocalCSS(page);
    await page.waitForLoadState('networkidle');
    
    // Get the current storage from localStorage (it should be saved after first login)
    const storagePreference = await page.evaluate(() => {
      const stored = localStorage.getItem('volunteer-profile-selected-storage');
      return stored ? JSON.parse(stored) : null;
    });
    
    // Verify that a storage preference was saved
    expect(storagePreference).not.toBeNull();
    
    // The preference should have at least one WebID key
    const webIds = Object.keys(storagePreference || {});
    expect(webIds.length).toBeGreaterThan(0);
  });

  test('should remember storage preference after logout and login', async ({ page }) => {
    // Login and verify profile editor works
    await loginToLocalCSS(page);
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the profile editor
    const locationTab = page.getByRole('tab', { name: /location/i });
    await expect(locationTab).toBeVisible({ timeout: 10000 });
    
    // Get the storage preference before logout
    const preferenceBefore = await page.evaluate(() => {
      return localStorage.getItem('volunteer-profile-selected-storage');
    });
    
    // Logout
    await logout(page);
    
    // Verify the localStorage preference persists after logout
    const preferenceAfterLogout = await page.evaluate(() => {
      return localStorage.getItem('volunteer-profile-selected-storage');
    });
    
    expect(preferenceAfterLogout).toBe(preferenceBefore);
    
    // Login again
    await loginToLocalCSS(page);
    await page.waitForLoadState('networkidle');
    
    // The profile editor should load directly (no storage selector)
    // because the preference is remembered
    const storageSelectorAfter = page.locator('text=/Select Storage Location/i');
    await expect(storageSelectorAfter).not.toBeVisible();
    
    // Tabs should be visible
    await expect(locationTab).toBeVisible({ timeout: 10000 });
    
    // Verify the preference is still in localStorage
    const preferenceAfterLogin = await page.evaluate(() => {
      return localStorage.getItem('volunteer-profile-selected-storage');
    });
    
    expect(preferenceAfterLogin).toBe(preferenceBefore);
  });
});
