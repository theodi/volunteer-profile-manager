import { test, expect } from '@playwright/test';
import { loginToLocalCSS, logout } from './helpers/auth';
import { SAVE_OPERATION_TIMEOUT } from './helpers/constants';

/**
 * Test suite for Time/Availability Editor
 * 
 * Tests the functionality of setting volunteer availability (days and times)
 * and verifies that the data persists across logout/login cycles.
 */

test.describe('Time/Availability Editor', () => {
  test('should set availability and persist after logout/login', async ({ page }) => {
    // Step 1: Login to local CSS
    await loginToLocalCSS(page);
    
    // Step 2: Navigate to Availability tab
    await page.getByRole('tab', { name: /availability/i }).click();
    
    // Wait for the availability editor to load by checking for specific content
    await page.waitForSelector('text=Select your preferred days and times', { 
      state: 'visible',
      timeout: 5000 
    });
    
    // Step 3: Select Monday checkbox using more accessible selector
    // Look for checkbox that contains "Monday" in its value or nearby label
    const mondayCheckbox = page.locator('input[type="checkbox"]').filter({ 
      has: page.locator(':text("Monday")') 
    }).or(page.locator('input[type="checkbox"][value*="Monday"]')).first();
    
    await mondayCheckbox.check();
    await expect(mondayCheckbox).toBeChecked();
    
    // Select morning time slot
    const morningCheckbox = page.locator('input[type="checkbox"]').filter({ 
      has: page.locator(':text("Morning")') 
    }).or(page.locator('input[type="checkbox"][value*="Morning"]')).first();
    
    await morningCheckbox.check();
    await expect(morningCheckbox).toBeChecked();
    
    // Step 4: Save changes
    await page.getByRole('button', { name: /save/i }).click();
    
    // Wait for save confirmation
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Step 5: Logout
    await logout(page);
    
    // Step 6: Login again
    await loginToLocalCSS(page);
    
    // Step 7: Navigate back to Availability tab
    await page.getByRole('tab', { name: /availability/i }).click();
    
    // Wait for the availability editor to load
    await page.waitForSelector('text=Select your preferred days and times', { 
      state: 'visible',
      timeout: 5000 
    });
    
    // Step 8: Verify Monday - Morning is still selected
    const mondayCheckboxAfter = page.locator('input[type="checkbox"]').filter({ 
      has: page.locator(':text("Monday")') 
    }).or(page.locator('input[type="checkbox"][value*="Monday"]')).first();
    await expect(mondayCheckboxAfter).toBeChecked();
    
    const morningCheckboxAfter = page.locator('input[type="checkbox"]').filter({ 
      has: page.locator(':text("Morning")') 
    }).or(page.locator('input[type="checkbox"][value*="Morning"]')).first();
    await expect(morningCheckboxAfter).toBeChecked();
  });

  test('should set multiple days and times', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Navigate to Availability tab
    await page.getByRole('tab', { name: /availability/i }).click();
    await page.waitForSelector('text=Select your preferred days and times', { 
      state: 'visible',
      timeout: 5000 
    });
    
    // Select multiple days using improved selectors
    const tuesdayCheckbox = page.locator('input[type="checkbox"][value*="Tuesday"]').first();
    const wednesdayCheckbox = page.locator('input[type="checkbox"][value*="Wednesday"]').first();
    
    await tuesdayCheckbox.check();
    await wednesdayCheckbox.check();
    
    // Select afternoon time slot
    const afternoonCheckbox = page.locator('input[type="checkbox"][value*="Afternoon"]').first();
    await afternoonCheckbox.check();
    
    // Save
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Verify selections are still checked
    await expect(tuesdayCheckbox).toBeChecked();
    await expect(wednesdayCheckbox).toBeChecked();
    await expect(afternoonCheckbox).toBeChecked();
  });

  test('should uncheck availability and persist', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Navigate to Availability tab
    await page.getByRole('tab', { name: /availability/i }).click();
    await page.waitForSelector('text=Select your preferred days and times', { 
      state: 'visible',
      timeout: 5000 
    });
    
    // Check if Thursday is selected, if so uncheck it
    const thursdayCheckbox = page.locator('input[type="checkbox"][value*="Thursday"]').first();
    
    // First ensure it's checked
    if (!await thursdayCheckbox.isChecked()) {
      await thursdayCheckbox.check();
      await page.getByRole('button', { name: /save/i }).click();
      await expect(page.getByText(/saved successfully/i)).toBeVisible({ 
        timeout: SAVE_OPERATION_TIMEOUT 
      });
      // Wait for save to complete
      await page.waitForLoadState('networkidle');
    }
    
    // Now uncheck it
    await thursdayCheckbox.uncheck();
    await expect(thursdayCheckbox).not.toBeChecked();
    
    // Save
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Logout and login
    await logout(page);
    await loginToLocalCSS(page);
    
    // Verify Thursday is not selected
    await page.getByRole('tab', { name: /availability/i }).click();
    await page.waitForSelector('text=Select your preferred days and times', { 
      state: 'visible',
      timeout: 5000 
    });
    
    const thursdayCheckboxAfter = page.locator('input[type="checkbox"][value*="Thursday"]').first();
    await expect(thursdayCheckboxAfter).not.toBeChecked();
  });
});
