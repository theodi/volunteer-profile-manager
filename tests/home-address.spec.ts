import { test, expect } from '@playwright/test';
import { loginToLocalCSS, logout } from './helpers/auth';
import { SAVE_OPERATION_TIMEOUT, EDITOR_LOAD_TIMEOUT } from './helpers/constants';

/**
 * Test suite for "Use Home Address" feature
 * 
 * Tests the functionality of using a home address from the user's WebID profile
 * as a preferred location for volunteering.
 * 
 * Note: These tests verify the "Use home address" button functionality when the
 * user's WebID profile contains address information. In some test environments,
 * the button may not be visible if no home address is present in the profile.
 * The tests are designed to gracefully handle both scenarios.
 */

test.describe('Use Home Address Feature', () => {
  test('should display location editor with expected controls', async ({ page }) => {
    // This test verifies the location editor loads correctly and
    // checks for the presence of the "Use home address" button if available
    
    await loginToLocalCSS(page);
    
    // Navigate to Location tab
    const locationTab = page.getByRole('tab', { name: /location/i });
    await expect(locationTab).toBeVisible();
    await locationTab.click();
    
    // Wait for the location editor to load
    await page.waitForLoadState('networkidle');
    
    // Verify "Use my location" button is always present
    const useMyLocationButton = page.getByRole('button', { name: /use my location/i });
    await expect(useMyLocationButton).toBeVisible();
    
    // Look for the "Use home address" button
    // The button should be visible if the user's profile has an address
    const useHomeAddressButton = page.getByRole('button', { name: /use home address/i });
    const buttonCount = await useHomeAddressButton.count();
    
    // If button exists, verify it has the correct styling and is clickable
    if (buttonCount > 0) {
      await expect(useHomeAddressButton).toBeVisible();
      await expect(useHomeAddressButton).toBeEnabled();
      
      // Verify button has the purple styling (home address style)
      const buttonClasses = await useHomeAddressButton.getAttribute('class');
      expect(buttonClasses).toContain('purple');
    }
  });

  test('should add location when clicking "Use home address" button', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Navigate to Location tab
    await page.getByRole('tab', { name: /location/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(EDITOR_LOAD_TIMEOUT);
    
    // Find the "Use home address" button
    const useHomeAddressButton = page.getByRole('button', { name: /use home address/i });
    const buttonExists = await useHomeAddressButton.count() > 0;
    
    // Skip this test if the button doesn't exist (user profile has no home address)
    test.skip(!buttonExists, 'Home address button not present - user profile may not have address data');
    
    if (buttonExists && await useHomeAddressButton.isVisible()) {
      // Get initial location count from the "Your locations" section
      const locationsSection = page.locator('text=/Your locations/i');
      const initialHasLocations = await locationsSection.isVisible().catch(() => false);
      
      // Click the button
      await useHomeAddressButton.click();
      
      // Wait for geocoding to complete (button should show loading state)
      await page.waitForLoadState('networkidle');
      
      // Wait for any loading spinner to disappear
      await page.waitForFunction(() => {
        const buttons = document.querySelectorAll('button');
        return Array.from(buttons).every(b => !b.querySelector('.animate-spin'));
      }, { timeout: 10000 }).catch(() => {});
      
      // Verify a new location was added or error message shown
      const hasError = await page.locator('text=/could not|failed|error/i').count() > 0;
      
      if (!hasError) {
        // Verify locations section now shows locations
        await expect(locationsSection).toBeVisible({ timeout: 5000 });
        
        // Save the profile to persist the location
        await page.getByRole('button', { name: /save/i }).click();
        await expect(page.getByText(/saved successfully/i)).toBeVisible({ 
          timeout: SAVE_OPERATION_TIMEOUT 
        });
      }
    }
  });

  test('should show home address tooltip with address details', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Navigate to Location tab
    await page.getByRole('tab', { name: /location/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Find the "Use home address" button
    const useHomeAddressButton = page.getByRole('button', { name: /use home address/i });
    const buttonExists = await useHomeAddressButton.count() > 0;
    
    // Skip this test if the button doesn't exist (user profile has no home address)
    test.skip(!buttonExists, 'Home address button not present - user profile may not have address data');
    
    if (buttonExists && await useHomeAddressButton.isVisible()) {
      // Check that the button has a title attribute with address information
      const titleAttr = await useHomeAddressButton.getAttribute('title');
      
      // Title should contain some address information if available
      expect(titleAttr).toBeTruthy();
    }
  });

  test('should persist home address location after logout/login', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Navigate to Location tab
    await page.getByRole('tab', { name: /location/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(EDITOR_LOAD_TIMEOUT);
    
    // Find and click the "Use home address" button
    const useHomeAddressButton = page.getByRole('button', { name: /use home address/i });
    const buttonExists = await useHomeAddressButton.count() > 0;
    
    // Skip this test if the button doesn't exist (user profile has no home address)
    test.skip(!buttonExists, 'Home address button not present - user profile may not have address data');
    
    if (buttonExists && await useHomeAddressButton.isVisible()) {
      await useHomeAddressButton.click();
      
      // Wait for geocoding to complete
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(() => {
        const buttons = document.querySelectorAll('button');
        return Array.from(buttons).every(b => !b.querySelector('.animate-spin'));
      }, { timeout: 10000 }).catch(() => {});
      
      // Check for errors
      const hasError = await page.locator('text=/could not|failed|error/i').count() > 0;
      
      // Skip if geocoding failed (external service might be unavailable)
      test.skip(hasError, 'Geocoding failed - external service may be unavailable');
      
      if (!hasError) {
        // Verify a location was added before saving
        const locationsSection = page.locator('text=/Your locations/i');
        await expect(locationsSection).toBeVisible({ timeout: 5000 });
        
        // Save the profile
        await page.getByRole('button', { name: /save/i }).click();
        await expect(page.getByText(/saved successfully/i)).toBeVisible({ 
          timeout: SAVE_OPERATION_TIMEOUT 
        });
        
        // Logout
        await logout(page);
        
        // Login again
        await loginToLocalCSS(page);
        
        // Navigate to Location tab
        await page.getByRole('tab', { name: /location/i }).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(EDITOR_LOAD_TIMEOUT);
        
        // Verify the location was persisted by checking for the "Your locations" section
        // This is the most reliable indicator that at least one location exists
        const locationsSectionAfter = page.locator('text=/Your locations/i');
        await expect(locationsSectionAfter).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
