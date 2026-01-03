import { test, expect } from '@playwright/test';
import { loginToLocalCSS, logout } from './helpers/auth';
import { SAVE_OPERATION_TIMEOUT } from './helpers/constants';

/**
 * Test suite for Skills & Requirements Editor
 * 
 * Tests the functionality of adding/removing volunteer skills and requirements
 * and verifies that the data persists across logout/login cycles.
 */

test.describe('Skills & Requirements Editor', () => {
  test('should add skills and persist after logout/login', async ({ page }) => {
    // Step 1: Login to local CSS
    await loginToLocalCSS(page);
    
    // Step 2: Navigate to Skills & Requirements tab
    await page.getByRole('tab', { name: /skills.*requirements/i }).click();
    
    // Wait for the skills editor to load
    await page.waitForLoadState('networkidle');
    
    // Step 3: Add a skill - "Empathy and Compassion"
    const empathyCheckbox = page.getByLabel(/empathy.*compassion/i);
    await empathyCheckbox.check();
    await expect(empathyCheckbox).toBeChecked();
    
    // Step 4: Add another skill - "Active Listening"
    const listeningCheckbox = page.getByLabel(/active listening/i);
    await listeningCheckbox.check();
    await expect(listeningCheckbox).toBeChecked();
    
    // Step 5: Save changes
    await page.getByRole('button', { name: /save/i }).click();
    
    // Wait for save confirmation
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ timeout: SAVE_OPERATION_TIMEOUT });
    
    // Step 6: Logout
    await logout(page);
    
    // Step 7: Login again
    await loginToLocalCSS(page);
    
    // Step 8: Navigate back to Skills & Requirements tab
    await page.getByRole('tab', { name: /skills.*requirements/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Step 9: Verify skills are still selected
    const empathyCheckboxAfter = page.getByLabel(/empathy.*compassion/i);
    await expect(empathyCheckboxAfter).toBeChecked();
    
    const listeningCheckboxAfter = page.getByLabel(/active listening/i);
    await expect(listeningCheckboxAfter).toBeChecked();
  });

  test('should add requirements and persist', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Navigate to Skills & Requirements tab
    await page.getByRole('tab', { name: /skills.*requirements/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Add a requirement - "Physical Stamina"
    const staminaCheckbox = page.getByLabel(/physical stamina/i);
    await staminaCheckbox.check();
    await expect(staminaCheckbox).toBeChecked();
    
    // Add another requirement - "Sturdy Footwear"
    const footwearCheckbox = page.getByLabel(/sturdy footwear/i);
    await footwearCheckbox.check();
    await expect(footwearCheckbox).toBeChecked();
    
    // Save
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ timeout: SAVE_OPERATION_TIMEOUT });
    
    // Verify selections persist on the same page
    await expect(staminaCheckbox).toBeChecked();
    await expect(footwearCheckbox).toBeChecked();
  });

  test('should remove skills and persist after logout/login', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Navigate to Skills & Requirements tab
    await page.getByRole('tab', { name: /skills.*requirements/i }).click();
    await page.waitForLoadState('networkidle');
    
    // First, add "Calmness Under Pressure" if not already added
    const calmnessCheckbox = page.getByLabel(/calmness.*pressure/i);
    const isChecked = await calmnessCheckbox.isChecked();
    
    if (!isChecked) {
      await calmnessCheckbox.check();
      await page.getByRole('button', { name: /save/i }).click();
      await expect(page.getByText(/saved successfully/i)).toBeVisible({ timeout: SAVE_OPERATION_TIMEOUT });
      await page.waitForLoadState('networkidle');
    }
    
    // Now remove it
    await calmnessCheckbox.uncheck();
    await expect(calmnessCheckbox).not.toBeChecked();
    
    // Save
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ timeout: SAVE_OPERATION_TIMEOUT });
    
    // Logout and login
    await logout(page);
    await loginToLocalCSS(page);
    
    // Verify skill is not selected
    await page.getByRole('tab', { name: /skills.*requirements/i }).click();
    await page.waitForLoadState('networkidle');
    
    const calmnessCheckboxAfter = page.getByLabel(/calmness.*pressure/i);
    await expect(calmnessCheckboxAfter).not.toBeChecked();
  });

  test('should handle multiple skills and requirements simultaneously', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Navigate to Skills & Requirements tab
    await page.getByRole('tab', { name: /skills.*requirements/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Add multiple skills
    const patienceCheckbox = page.getByLabel(/patience.*understanding/i);
    const reliabilityCheckbox = page.getByLabel(/reliability.*trustworthiness/i);
    const culturalCheckbox = page.getByLabel(/cultural sensitivity/i);
    
    await patienceCheckbox.check();
    await reliabilityCheckbox.check();
    await culturalCheckbox.check();
    
    // Add multiple requirements
    const outdoorCheckbox = page.getByLabel(/ability.*work outdoors/i);
    const phoneCheckbox = page.getByLabel(/phone.*power bank/i);
    
    await outdoorCheckbox.check();
    await phoneCheckbox.check();
    
    // Save all at once
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ timeout: SAVE_OPERATION_TIMEOUT });
    
    // Verify all selections
    await expect(patienceCheckbox).toBeChecked();
    await expect(reliabilityCheckbox).toBeChecked();
    await expect(culturalCheckbox).toBeChecked();
    await expect(outdoorCheckbox).toBeChecked();
    await expect(phoneCheckbox).toBeChecked();
  });
});
