import { test, expect } from '@playwright/test';
import { loginToLocalCSS, logout } from './helpers/auth';
import { SAVE_OPERATION_TIMEOUT } from './helpers/constants';

/**
 * Test suite for Causes Editor
 * 
 * Tests the functionality of selecting volunteer causes/interests
 * and verifies that the data persists across logout/login cycles.
 */

test.describe('Causes Editor', () => {
  test('should select causes and persist after logout/login', async ({ page }) => {
    // Step 1: Login to local CSS
    await loginToLocalCSS(page);
    
    // Step 2: Navigate to Causes tab
    await page.getByRole('tab', { name: /causes/i }).click();
    
    // Wait for the causes editor to load
    await page.waitForLoadState('networkidle');
    
    // Step 3: Select a cause - "Mental Health"
    const mentalHealthCheckbox = page.getByLabel(/mental health/i);
    await mentalHealthCheckbox.check();
    await expect(mentalHealthCheckbox).toBeChecked();
    
    // Step 4: Select another cause - "Environmental Conservation"
    const environmentCheckbox = page.getByLabel(/environmental conservation/i);
    await environmentCheckbox.check();
    await expect(environmentCheckbox).toBeChecked();
    
    // Step 5: Save changes
    await page.getByRole('button', { name: /save/i }).click();
    
    // Wait for save confirmation
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Step 6: Logout
    await logout(page);
    
    // Step 7: Login again
    await loginToLocalCSS(page);
    
    // Step 8: Navigate back to Causes tab
    await page.getByRole('tab', { name: /causes/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Step 9: Verify causes are still selected
    const mentalHealthCheckboxAfter = page.getByLabel(/mental health/i);
    await expect(mentalHealthCheckboxAfter).toBeChecked();
    
    const environmentCheckboxAfter = page.getByLabel(/environmental conservation/i);
    await expect(environmentCheckboxAfter).toBeChecked();
  });

  test('should select multiple causes from different categories', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Navigate to Causes tab
    await page.getByRole('tab', { name: /causes/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Select causes from different categories
    const educationCheckbox = page.getByLabel(/^education$/i);
    const homelessnessCheckbox = page.getByLabel(/homelessness/i);
    const animalWelfareCheckbox = page.getByLabel(/^animal welfare$/i);
    
    await educationCheckbox.check();
    await homelessnessCheckbox.check();
    await animalWelfareCheckbox.check();
    
    // Save
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Verify selections persist
    await expect(educationCheckbox).toBeChecked();
    await expect(homelessnessCheckbox).toBeChecked();
    await expect(animalWelfareCheckbox).toBeChecked();
  });

  test('should deselect causes and persist after logout/login', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Navigate to Causes tab
    await page.getByRole('tab', { name: /causes/i }).click();
    await page.waitForLoadState('networkidle');
    
    // First, add "Disaster Relief" if not already added
    const disasterCheckbox = page.getByLabel(/disaster relief/i);
    const isChecked = await disasterCheckbox.isChecked();
    
    if (!isChecked) {
      await disasterCheckbox.check();
      await page.getByRole('button', { name: /save/i }).click();
      await expect(page.getByText(/saved successfully/i)).toBeVisible({ 
        timeout: SAVE_OPERATION_TIMEOUT 
      });
      await page.waitForLoadState('networkidle');
    }
    
    // Now deselect it
    await disasterCheckbox.uncheck();
    await expect(disasterCheckbox).not.toBeChecked();
    
    // Save
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Logout and login
    await logout(page);
    await loginToLocalCSS(page);
    
    // Verify cause is not selected
    await page.getByRole('tab', { name: /causes/i }).click();
    await page.waitForLoadState('networkidle');
    
    const disasterCheckboxAfter = page.getByLabel(/disaster relief/i);
    await expect(disasterCheckboxAfter).not.toBeChecked();
  });

  test('should handle many causes selection', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Navigate to Causes tab
    await page.getByRole('tab', { name: /causes/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Select multiple causes
    const youthCheckbox = page.getByLabel(/youth development/i);
    const climateCheckbox = page.getByLabel(/climate action/i);
    const foodCheckbox = page.getByLabel(/food security/i);
    const artsCheckbox = page.getByLabel(/arts.*culture/i);
    const refugeeCheckbox = page.getByLabel(/refugee support/i);
    
    await youthCheckbox.check();
    await climateCheckbox.check();
    await foodCheckbox.check();
    await artsCheckbox.check();
    await refugeeCheckbox.check();
    
    // Save all at once
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Verify all selections
    await expect(youthCheckbox).toBeChecked();
    await expect(climateCheckbox).toBeChecked();
    await expect(foodCheckbox).toBeChecked();
    await expect(artsCheckbox).toBeChecked();
    await expect(refugeeCheckbox).toBeChecked();
  });
});
