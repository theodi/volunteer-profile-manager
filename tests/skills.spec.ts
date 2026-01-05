import { test, expect } from '@playwright/test';
import { loginToLocalCSS, logout, waitForProfileLoaded } from './helpers/auth';
import { SAVE_OPERATION_TIMEOUT, EDITOR_LOAD_TIMEOUT } from './helpers/constants';

/**
 * Test suite for Skills & Requirements Editor
 * 
 * Tests the functionality of adding/removing volunteer skills and requirements
 * and verifies that the data persists across logout/login cycles.
 * 
 * SkillsEditor uses button elements styled as pills for selection.
 * Selected buttons have class "bg-purple-600" while unselected have "bg-gray-100".
 * There are two sub-tabs: "Skills" and "Equipment & Resources".
 */

test.describe('Skills & Requirements Editor', () => {
  test('should add skills and persist after logout/login', async ({ page }) => {
    // Step 1: Login to local CSS
    await loginToLocalCSS(page);
    
    // Wait for profile to finish loading from the pod
    await waitForProfileLoaded(page);
    
    // Step 2: Navigate to Skills & Requirements tab
    await page.getByRole('button', { name: /🛠.*Skills/i }).click();
    
    // Wait for the skills editor to load
    await expect(page.getByRole('heading', { name: 'Skills & Requirements' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    // Step 3: Add a skill - "Empathy and Compassion" by clicking the button
    const empathyButton = page.getByRole('button', { name: 'Empathy and Compassion' });
    await empathyButton.click();
    
    // Verify selection by checking it has the selected style class
    await expect(empathyButton).toHaveClass(/bg-purple-600/);
    
    // Step 4: Add another skill - "Active Listening"
    const listeningButton = page.getByRole('button', { name: 'Active Listening' });
    await listeningButton.click();
    await expect(listeningButton).toHaveClass(/bg-purple-600/);
    
    // Step 5: Save changes
    await page.getByRole('button', { name: /save/i }).click();
    
    // Wait for save confirmation
    await expect(page.getByText('Profile saved successfully!')).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Step 6: Logout
    await logout(page);
    
    // Step 7: Login again
    await loginToLocalCSS(page);
    
    // Wait for profile to finish loading
    await waitForProfileLoaded(page);
    
    // Step 8: Navigate back to Skills & Requirements tab
    await page.getByRole('button', { name: /🛠.*Skills/i }).click();
    await expect(page.getByRole('heading', { name: 'Skills & Requirements' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    // Step 9: Verify skills are still selected (have purple bg)
    const empathyButtonAfter = page.getByRole('button', { name: 'Empathy and Compassion' });
    await expect(empathyButtonAfter).toHaveClass(/bg-purple-600/);
    
    const listeningButtonAfter = page.getByRole('button', { name: 'Active Listening' });
    await expect(listeningButtonAfter).toHaveClass(/bg-purple-600/);
  });

  test('should add requirements and persist', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Wait for profile to finish loading from the pod
    await waitForProfileLoaded(page);
    
    // Navigate to Skills & Requirements tab
    await page.getByRole('button', { name: /🛠.*Skills/i }).click();
    await expect(page.getByRole('heading', { name: 'Skills & Requirements' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    // Switch to Equipment & Resources sub-tab
    await page.getByRole('button', { name: /Equipment & Resources/i }).click();
    
    // Add requirements by clicking buttons
    const staminaButton = page.getByRole('button', { name: 'Physical Stamina' });
    await staminaButton.click();
    await expect(staminaButton).toHaveClass(/bg-purple-600/);
    
    const footwearButton = page.getByRole('button', { name: 'Sturdy Footwear' });
    await footwearButton.click();
    await expect(footwearButton).toHaveClass(/bg-purple-600/);
    
    // Save
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Profile saved successfully!')).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Verify selections persist on the same page
    await expect(staminaButton).toHaveClass(/bg-purple-600/);
    await expect(footwearButton).toHaveClass(/bg-purple-600/);
  });

  test('should remove skills and persist after logout/login', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Wait for profile to finish loading from the pod
    await waitForProfileLoaded(page);
    
    // Navigate to Skills & Requirements tab
    await page.getByRole('button', { name: /🛠.*Skills/i }).click();
    await expect(page.getByRole('heading', { name: 'Skills & Requirements' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    // First, add "Calmness Under Pressure" if not already selected
    const calmnessButton = page.getByRole('button', { name: 'Calmness Under Pressure' });
    const classes = await calmnessButton.getAttribute('class') || '';
    
    if (!classes.includes('bg-purple-600')) {
      await calmnessButton.click();
      await page.getByRole('button', { name: /save/i }).click();
      await expect(page.getByText('Profile saved successfully!')).toBeVisible({ 
        timeout: SAVE_OPERATION_TIMEOUT 
      });
      await page.waitForTimeout(500);
    }
    
    // Now click to remove it (toggle off)
    await calmnessButton.click();
    await expect(calmnessButton).toHaveClass(/bg-gray-100/);
    
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
    
    // Verify skill is not selected
    await page.getByRole('button', { name: /🛠.*Skills/i }).click();
    await expect(page.getByRole('heading', { name: 'Skills & Requirements' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    const calmnessButtonAfter = page.getByRole('button', { name: 'Calmness Under Pressure' });
    await expect(calmnessButtonAfter).toHaveClass(/bg-gray-100/);
  });

  test('should handle multiple skills and requirements simultaneously', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Wait for profile to finish loading from the pod
    await waitForProfileLoaded(page);
    
    // Navigate to Skills & Requirements tab
    await page.getByRole('button', { name: /🛠.*Skills/i }).click();
    await expect(page.getByRole('heading', { name: 'Skills & Requirements' })).toBeVisible({
      timeout: EDITOR_LOAD_TIMEOUT
    });
    
    // Add multiple skills
    await page.getByRole('button', { name: 'Patience and Understanding' }).click();
    await page.getByRole('button', { name: 'Reliability and Trustworthiness' }).click();
    await page.getByRole('button', { name: 'Cultural Sensitivity' }).click();
    
    // Switch to Equipment & Resources and add requirements
    await page.getByRole('button', { name: /Equipment & Resources/i }).click();
    await page.getByRole('button', { name: 'Ability to Work Outdoors' }).click();
    await page.getByRole('button', { name: 'Phone and Power Bank' }).click();
    
    // Save all at once
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Profile saved successfully!')).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Verify requirement selections
    await expect(page.getByRole('button', { name: 'Ability to Work Outdoors' })).toHaveClass(/bg-purple-600/);
    await expect(page.getByRole('button', { name: 'Phone and Power Bank' })).toHaveClass(/bg-purple-600/);
    
    // Switch back to Skills and verify those selections
    await page.getByRole('button', { name: /Skills \(\d+\)/i }).click();
    await expect(page.getByRole('button', { name: 'Patience and Understanding' })).toHaveClass(/bg-purple-600/);
    await expect(page.getByRole('button', { name: 'Reliability and Trustworthiness' })).toHaveClass(/bg-purple-600/);
    await expect(page.getByRole('button', { name: 'Cultural Sensitivity' })).toHaveClass(/bg-purple-600/);
  });
});
