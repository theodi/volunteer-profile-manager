import { test, expect } from '@playwright/test';
import { loginToLocalCSS, logout, waitForProfileLoaded } from './helpers/auth';
import { SAVE_OPERATION_TIMEOUT, EDITOR_LOAD_TIMEOUT } from './helpers/constants';

/**
 * Test suite for Time/Availability Editor
 * 
 * Tests the functionality of setting volunteer availability (days and times)
 * and verifies that the data persists across logout/login cycles.
 * 
 * The TimeEditor uses a button grid where each time slot is a button with:
 * - aria-label="Day Time" (e.g., "Monday Morning")
 * - aria-pressed="true|false" to indicate selection state
 */

test.describe('Time/Availability Editor', () => {
  test('should set availability and persist after logout/login', async ({ page }) => {
    // Step 1: Login to local CSS
    await loginToLocalCSS(page);
    
    // Wait for profile to finish loading from the pod
    await waitForProfileLoaded(page);
    
    // Step 2: Navigate to Availability tab
    await page.getByRole('button', { name: /🕐.*Availability/i }).click();
    
    // Wait for the availability editor to load by checking for the heading
    await expect(page.getByRole('heading', { name: 'Availability' })).toBeVisible({ 
      timeout: EDITOR_LOAD_TIMEOUT 
    });
    
    // Step 3: Select Monday Morning time slot using button with aria-label
    const mondayMorningButton = page.getByRole('button', { name: 'Monday Morning' });
    await mondayMorningButton.click();
    
    // Verify selection via aria-pressed attribute
    await expect(mondayMorningButton).toHaveAttribute('aria-pressed', 'true');
    
    // Step 4: Wait for profile loading to complete before saving
    // The handleSave function returns early if resource isn't fully loaded
    await expect(page.getByText('Loading profile...')).toBeHidden({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Save changes
    await page.getByRole('button', { name: /save/i }).click();
    
    // Wait for save confirmation - the exact message is "Profile saved successfully!"
    await expect(page.getByText('Profile saved successfully!')).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Step 5: Logout
    await logout(page);
    
    // Step 6: Login again
    await loginToLocalCSS(page);
    
    // Wait for profile to finish loading
    await waitForProfileLoaded(page);
    
    // Step 7: Navigate back to Availability tab
    await page.getByRole('button', { name: /🕐.*Availability/i }).click();
    
    // Wait for the availability editor to load
    await expect(page.getByRole('heading', { name: 'Availability' })).toBeVisible({ 
      timeout: EDITOR_LOAD_TIMEOUT 
    });
    
    // Step 8: Verify Monday Morning is still selected (aria-pressed=true)
    const mondayMorningButtonAfter = page.getByRole('button', { name: 'Monday Morning' });
    await expect(mondayMorningButtonAfter).toHaveAttribute('aria-pressed', 'true');
  });

  test('should set multiple days and times', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Wait for profile to finish loading from the pod
    await waitForProfileLoaded(page);
    
    // Navigate to Availability tab
    await page.getByRole('button', { name: /🕐.*Availability/i }).click();
    await expect(page.getByRole('heading', { name: 'Availability' })).toBeVisible({ 
      timeout: EDITOR_LOAD_TIMEOUT 
    });
    
    // Select multiple time slots
    const tuesdayAfternoon = page.getByRole('button', { name: 'Tuesday Afternoon' });
    const wednesdayAfternoon = page.getByRole('button', { name: 'Wednesday Afternoon' });
    
    await tuesdayAfternoon.click();
    await wednesdayAfternoon.click();
    
    // Verify selections
    await expect(tuesdayAfternoon).toHaveAttribute('aria-pressed', 'true');
    await expect(wednesdayAfternoon).toHaveAttribute('aria-pressed', 'true');
    
    // Save
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Profile saved successfully!')).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Verify selections still present after save
    await expect(tuesdayAfternoon).toHaveAttribute('aria-pressed', 'true');
    await expect(wednesdayAfternoon).toHaveAttribute('aria-pressed', 'true');
  });

  test('should uncheck availability and persist', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Wait for profile to finish loading from the pod
    await waitForProfileLoaded(page);
    
    // Navigate to Availability tab
    await page.getByRole('button', { name: /🕐.*Availability/i }).click();
    await expect(page.getByRole('heading', { name: 'Availability' })).toBeVisible({ 
      timeout: EDITOR_LOAD_TIMEOUT 
    });
    
    const thursdayEvening = page.getByRole('button', { name: 'Thursday Evening' });
    
    // First ensure it's selected
    const isPressed = await thursdayEvening.getAttribute('aria-pressed');
    if (isPressed !== 'true') {
      await thursdayEvening.click();
      await page.getByRole('button', { name: /save/i }).click();
      await expect(page.getByText('Profile saved successfully!')).toBeVisible({ 
        timeout: SAVE_OPERATION_TIMEOUT 
      });
      // Wait for the message to disappear before continuing
      await page.waitForTimeout(500);
    }
    
    // Now click to deselect it
    await thursdayEvening.click();
    await expect(thursdayEvening).toHaveAttribute('aria-pressed', 'false');
    
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
    
    // Verify Thursday Evening is not selected
    await page.getByRole('button', { name: /🕐.*Availability/i }).click();
    await expect(page.getByRole('heading', { name: 'Availability' })).toBeVisible({ 
      timeout: EDITOR_LOAD_TIMEOUT 
    });
    
    const thursdayEveningAfter = page.getByRole('button', { name: 'Thursday Evening' });
    await expect(thursdayEveningAfter).toHaveAttribute('aria-pressed', 'false');
  });
});
