import { test, expect } from '@playwright/test';
import { loginToLocalCSS, logout, waitForProfileLoaded } from './helpers/auth';
import { SAVE_OPERATION_TIMEOUT, EDITOR_LOAD_TIMEOUT } from './helpers/constants';

/**
 * Test suite for Causes Editor
 * 
 * Tests the functionality of selecting volunteer causes/interests
 * and verifies that the data persists across logout/login cycles.
 * 
 * CausesEditor uses label elements containing:
 * - A styled div for the checkbox visual
 * - A hidden sr-only input[type="checkbox"]
 * - A span with the cause label text
 */

test.describe('Causes Editor', () => {
  test('should select causes and persist after logout/login', async ({ page }) => {
    // Step 1: Login to local CSS
    await loginToLocalCSS(page);
    
    // Wait for profile to finish loading from the pod
    await waitForProfileLoaded(page);
    
    // Step 2: Navigate to Causes tab
    await page.getByRole('button', { name: /❤.*Causes/i }).click();
    
    // Wait for the causes editor to load
    await expect(page.getByRole('heading', { name: 'Charitable Causes' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    // Step 3: Select a cause - "Mental Health" by clicking the label text
    const mentalHealthLabel = page.getByText('Mental Health', { exact: true });
    await mentalHealthLabel.click();
    
    // Step 4: Select another cause - "Environmental Conservation"
    const environmentLabel = page.getByText('Environmental Conservation', { exact: true });
    await environmentLabel.click();
    
    // Step 5: Save changes
    await page.getByRole('button', { name: /save/i }).click();
    
    // Wait for save confirmation - exact message
    await expect(page.getByText('Profile saved successfully!')).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Step 6: Logout
    await logout(page);
    
    // Step 7: Login again
    await loginToLocalCSS(page);
    
    // Wait for profile to finish loading
    await waitForProfileLoaded(page);
    
    // Step 8: Navigate back to Causes tab
    await page.getByRole('button', { name: /❤.*Causes/i }).click();
    await expect(page.getByRole('heading', { name: 'Charitable Causes' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    // Step 9: Verify causes are still selected by checking they appear in the summary section
    // The selected causes appear as tags in the summary area
    await expect(page.locator('.bg-purple-100').filter({ hasText: 'Mental Health' })).toBeVisible();
    await expect(page.locator('.bg-purple-100').filter({ hasText: 'Environmental Conservation' })).toBeVisible();
  });

  test('should select multiple causes from different categories', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Wait for profile to finish loading from the pod
    await waitForProfileLoaded(page);
    
    // Navigate to Causes tab
    await page.getByRole('button', { name: /❤.*Causes/i }).click();
    await expect(page.getByRole('heading', { name: 'Charitable Causes' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    // Select causes from different categories by clicking label text
    await page.getByText('Education', { exact: true }).first().click();
    await page.getByText('Homelessness', { exact: true }).click();
    await page.getByText('Animal Welfare', { exact: true }).first().click();
    
    // Save
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Profile saved successfully!')).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Verify selections appear in summary
    await expect(page.locator('.bg-purple-100').filter({ hasText: 'Education' })).toBeVisible();
    await expect(page.locator('.bg-purple-100').filter({ hasText: 'Homelessness' })).toBeVisible();
    await expect(page.locator('.bg-purple-100').filter({ hasText: 'Animal Welfare' })).toBeVisible();
  });

  test('should deselect causes and persist after logout/login', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Wait for profile to finish loading from the pod
    await waitForProfileLoaded(page);
    
    // Navigate to Causes tab
    await page.getByRole('button', { name: /❤.*Causes/i }).click();
    await expect(page.getByRole('heading', { name: 'Charitable Causes' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    // First, add "Disaster Relief" if not already in summary
    const disasterLabel = page.getByText('Disaster Relief', { exact: true });
    const summaryTag = page.locator('.bg-purple-100').filter({ hasText: 'Disaster Relief' });
    
    if (!await summaryTag.isVisible().catch(() => false)) {
      await disasterLabel.click();
      await page.getByRole('button', { name: /save/i }).click();
      await expect(page.getByText('Profile saved successfully!')).toBeVisible({ 
        timeout: SAVE_OPERATION_TIMEOUT 
      });
      await page.waitForTimeout(500);
    }
    
    // Now click to deselect it
    await disasterLabel.click();
    
    // Save
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Profile saved successfully!')).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Logout and login
    await logout(page);
    await loginToLocalCSS(page);
    
    // Wait for profile to finish loading
    await waitForProfileLoaded(page);
    
    // Verify cause is not in summary
    await page.getByRole('button', { name: /❤.*Causes/i }).click();
    await expect(page.getByRole('heading', { name: 'Charitable Causes' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    const summaryTagAfter = page.locator('.bg-purple-100').filter({ hasText: 'Disaster Relief' });
    await expect(summaryTagAfter).not.toBeVisible();
  });

  test('should handle many causes selection', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Wait for profile to finish loading from the pod
    await waitForProfileLoaded(page);
    
    // Navigate to Causes tab
    await page.getByRole('button', { name: /❤.*Causes/i }).click();
    await expect(page.getByRole('heading', { name: 'Charitable Causes' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    // Select multiple causes by clicking labels
    await page.getByText('Youth Development', { exact: true }).click();
    await page.getByText('Climate Action', { exact: true }).click();
    await page.getByText('Food Security', { exact: true }).click();
    await page.getByText('Arts and Culture', { exact: true }).click();
    await page.getByText('Refugee Support', { exact: true }).click();
    
    // Save all at once
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Profile saved successfully!')).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Verify all selections appear in summary
    await expect(page.locator('.bg-purple-100').filter({ hasText: 'Youth Development' })).toBeVisible();
    await expect(page.locator('.bg-purple-100').filter({ hasText: 'Climate Action' })).toBeVisible();
    await expect(page.locator('.bg-purple-100').filter({ hasText: 'Food Security' })).toBeVisible();
    await expect(page.locator('.bg-purple-100').filter({ hasText: 'Arts and Culture' })).toBeVisible();
    await expect(page.locator('.bg-purple-100').filter({ hasText: 'Refugee Support' })).toBeVisible();
  });
});
