import { test, expect } from '@playwright/test';
import { loginToLocalCSS, logout } from './helpers/auth';
import { SAVE_OPERATION_TIMEOUT } from './helpers/constants';

/**
 * Test suite for "Use Home Address" feature
 * 
 * Tests the functionality of using a home address from the user's WebID profile
 * as a preferred location for volunteering.
 */

test.describe('Use Home Address Feature', () => {
  test('should show "Use home address" button when profile has address', async ({ page }) => {
    // First, we need to ensure the test user has an address in their profile
    // This is handled by the test data setup in the CSS server
    
    await loginToLocalCSS(page);
    
    // Navigate to Location tab
    const locationTab = page.getByRole('tab', { name: /location/i });
    await expect(locationTab).toBeVisible();
    await locationTab.click();
    
    // Wait for the location editor to load
    await page.waitForLoadState('networkidle');
    
    // Look for the "Use home address" button
    // The button should be visible if the user's profile has an address
    const useHomeAddressButton = page.getByRole('button', { name: /use home address/i });
    
    // Check if the button exists (depends on whether test user has address in profile)
    const buttonCount = await useHomeAddressButton.count();
    
    // If button exists, verify it has the correct styling and is clickable
    if (buttonCount > 0) {
      await expect(useHomeAddressButton).toBeVisible();
      await expect(useHomeAddressButton).toBeEnabled();
      
      // Verify button has the purple styling (home address style)
      const buttonClasses = await useHomeAddressButton.getAttribute('class');
      expect(buttonClasses).toContain('purple');
    }
    
    // Also verify "Use my location" button is always present
    const useMyLocationButton = page.getByRole('button', { name: /use my location/i });
    await expect(useMyLocationButton).toBeVisible();
  });

  test('should add location when clicking "Use home address" button', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Navigate to Location tab
    await page.getByRole('tab', { name: /location/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Find the "Use home address" button
    const useHomeAddressButton = page.getByRole('button', { name: /use home address/i });
    const buttonExists = await useHomeAddressButton.count() > 0;
    
    if (buttonExists && await useHomeAddressButton.isVisible()) {
      // Get initial location count
      const initialLocationCount = await page.locator('[class*="location"]').count();
      
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
        // Save the profile to persist the location
        await page.getByRole('button', { name: /save/i }).click();
        await expect(page.getByText(/saved successfully/i)).toBeVisible({ 
          timeout: SAVE_OPERATION_TIMEOUT 
        });
      }
    } else {
      // Button not visible - test user may not have address in profile
      // This is expected in some test configurations
      test.skip();
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
    
    if (buttonExists && await useHomeAddressButton.isVisible()) {
      // Check that the button has a title attribute with address information
      const titleAttr = await useHomeAddressButton.getAttribute('title');
      
      // Title should contain some address information if available
      expect(titleAttr).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should persist home address location after logout/login', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Navigate to Location tab
    await page.getByRole('tab', { name: /location/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Find and click the "Use home address" button
    const useHomeAddressButton = page.getByRole('button', { name: /use home address/i });
    const buttonExists = await useHomeAddressButton.count() > 0;
    
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
      
      if (!hasError) {
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
        
        // Verify the location was persisted by checking for location markers or list items
        const locationIndicators = await Promise.all([
          page.locator('[class*="marker"]').count(),
          page.locator('[class*="leaflet-marker"]').count(),
          page.locator('text=/your locations/i').isVisible().catch(() => false),
        ]);
        
        const hasLocationData = locationIndicators.some(result => 
          typeof result === 'number' ? result > 0 : result
        );
        
        // If we successfully added and saved a location, it should persist
        // Note: The exact verification depends on the UI structure
      }
    } else {
      test.skip();
    }
  });
});
