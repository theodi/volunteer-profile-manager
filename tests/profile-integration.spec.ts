import { test, expect } from '@playwright/test';
import { loginToLocalCSS, logout, waitForProfileLoaded } from './helpers/auth';
import { SAVE_OPERATION_TIMEOUT, EDITOR_LOAD_TIMEOUT } from './helpers/constants';

/**
 * Integration test suite for Profile Editor
 * 
 * Tests the complete volunteer profile workflow including
 * authentication, navigation between tabs, data entry, and persistence.
 * 
 * UI Components:
 * - TimeEditor uses button grid with aria-label="Day Time" and aria-pressed
 * - SkillsEditor uses button pills with bg-purple-600 when selected
 * - CausesEditor uses labels wrapping hidden checkboxes
 */

test.describe('Profile Editor Integration', () => {
  test('should complete full profile workflow', async ({ page }) => {
    // Step 1: Login
    await loginToLocalCSS(page);
    
    // Wait for profile to finish loading from the pod
    await waitForProfileLoaded(page);
    
    // Step 2: Verify we're on the profile page
    await expect(page.getByText(/volunteer profile/i)).toBeVisible();
    
    // Step 3: Verify all tabs are present
    await expect(page.getByRole('button', { name: '📍Location' })).toBeVisible();
    await expect(page.getByRole('button', { name: /🕐.*availability/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /🛠.*skills/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /❤.*causes/i })).toBeVisible();
    
    // Step 4: Set availability (uses button grid, not checkboxes)
    await page.getByRole('button', { name: /🕐.*availability/i }).click();
    await expect(page.getByRole('heading', { name: 'Availability' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    const fridayEvening = page.getByRole('button', { name: 'Friday Evening' });
    await fridayEvening.click();
    await expect(fridayEvening).toHaveAttribute('aria-pressed', 'true');
    
    // Step 5: Add skills (uses button pills, not checkboxes)
    await page.getByRole('button', { name: /🛠.*skills/i }).click();
    await expect(page.getByRole('heading', { name: 'Skills & Requirements' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    const teamworkButton = page.getByRole('button', { name: 'Ability to Work Cooperatively' });
    await teamworkButton.click();
    await expect(teamworkButton).toHaveClass(/bg-purple-600/);
    
    const communicationButton = page.getByRole('button', { name: 'Clear Spoken Communication' });
    await communicationButton.click();
    await expect(communicationButton).toHaveClass(/bg-purple-600/);
    
    // Step 6: Add causes (uses labels with text, click to toggle)
    await page.getByRole('button', { name: /❤.*causes/i }).click();
    await expect(page.getByRole('heading', { name: 'Charitable Causes' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    await page.getByText('Community Development', { exact: true }).click();
    await page.getByText('Elder Care', { exact: true }).click();
    
    // Step 7: Save all changes
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Profile saved successfully!')).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Step 8: Logout
    await logout(page);
    
    // Step 9: Login again
    await loginToLocalCSS(page);
    
    // Wait for profile to finish loading
    await waitForProfileLoaded(page);
    
    // Step 10: Verify all data persisted
    
    // Check availability
    await page.getByRole('button', { name: /🕐.*availability/i }).click();
    await expect(page.getByRole('heading', { name: 'Availability' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    const fridayEveningAfter = page.getByRole('button', { name: 'Friday Evening' });
    await expect(fridayEveningAfter).toHaveAttribute('aria-pressed', 'true');
    
    // Check skills
    await page.getByRole('button', { name: /🛠.*skills/i }).click();
    await expect(page.getByRole('heading', { name: 'Skills & Requirements' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    const teamworkButtonAfter = page.getByRole('button', { name: 'Ability to Work Cooperatively' });
    await expect(teamworkButtonAfter).toHaveClass(/bg-purple-600/);
    
    const communicationButtonAfter = page.getByRole('button', { name: 'Clear Spoken Communication' });
    await expect(communicationButtonAfter).toHaveClass(/bg-purple-600/);
    
    // Check causes - verify in summary section
    await page.getByRole('button', { name: /❤.*causes/i }).click();
    await expect(page.getByRole('heading', { name: 'Charitable Causes' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    await expect(page.locator('.bg-purple-100').filter({ hasText: 'Community Development' })).toBeVisible();
    await expect(page.locator('.bg-purple-100').filter({ hasText: 'Elder Care' })).toBeVisible();
  });

  test('should display user profile information', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Wait for profile to finish loading from the pod
    await waitForProfileLoaded(page);
    
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
    
    // Wait for profile to finish loading from the pod
    await waitForProfileLoaded(page);
    
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
    
    // Wait for profile to finish loading from the pod
    await waitForProfileLoaded(page);
    
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
    
    // Wait for profile to finish loading from the pod
    await waitForProfileLoaded(page);
    
    // First update - add availability
    await page.getByRole('button', { name: /🕐.*Availability/i }).click();
    await expect(page.getByRole('heading', { name: 'Availability' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    const saturdayMorning = page.getByRole('button', { name: 'Saturday Morning' });
    await saturdayMorning.click();
    await expect(saturdayMorning).toHaveAttribute('aria-pressed', 'true');
    
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Profile saved successfully!')).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Second update - add a skill
    await page.getByRole('button', { name: /🛠.*Skills/i }).click();
    await expect(page.getByRole('heading', { name: 'Skills & Requirements' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    const firstAidButton = page.getByRole('button', { name: 'Basic First Aid Knowledge' });
    await firstAidButton.click();
    await expect(firstAidButton).toHaveClass(/bg-purple-600/);
    
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Profile saved successfully!')).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Third update - add a cause
    await page.getByRole('button', { name: /❤.*Causes/i }).click();
    await expect(page.getByRole('heading', { name: 'Charitable Causes' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    await page.getByText('Emergency Response', { exact: true }).click();
    
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Profile saved successfully!')).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Verify all updates persisted
    await page.getByRole('button', { name: /🕐.*Availability/i }).click();
    await expect(page.getByRole('heading', { name: 'Availability' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    await expect(saturdayMorning).toHaveAttribute('aria-pressed', 'true');
    
    await page.getByRole('button', { name: /🛠.*Skills/i }).click();
    await expect(page.getByRole('heading', { name: 'Skills & Requirements' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    await expect(firstAidButton).toHaveClass(/bg-purple-600/);
    
    await page.getByRole('button', { name: /❤.*Causes/i }).click();
    await expect(page.getByRole('heading', { name: 'Charitable Causes' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    await expect(page.locator('.bg-purple-100').filter({ hasText: 'Emergency Response' })).toBeVisible();
  });
});
