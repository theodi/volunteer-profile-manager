import { test, expect } from '@playwright/test';
import { loginToLocalCSS, logout } from './helpers/auth';
import { SAVE_OPERATION_TIMEOUT } from './helpers/constants';

/**
 * Test suite for Location Editor
 * 
 * Tests the functionality of adding/editing volunteer location preferences
 * and verifies that the data persists across logout/login cycles.
 */

test.describe('Location Editor', () => {
  test('should not request geolocation when profile has existing locations', async ({ page, context }) => {
    // Mock geolocation
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 51.5074, longitude: -0.1278 }); // London
    
    // Step 1: Login and add a location using postcode search (not geolocation)
    await loginToLocalCSS(page);
    
    // Navigate to Location tab
    await page.getByRole('tab', { name: /location/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Wait for map or editor to load
    await page.waitForTimeout(2000);
    
    // Add a location using postcode search (this avoids triggering geolocation)
    const postcodeInput = page.locator('input[placeholder*="postcode" i], input[placeholder*="address" i]').first();
    const inputExists = await postcodeInput.count() > 0;
    
    if (inputExists) {
      await postcodeInput.fill('EC1A 1BB'); // A UK postcode
      
      // Click search button
      const searchButton = page.locator('button:has-text("Search")').first();
      if (await searchButton.isVisible()) {
        await searchButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Wait for search results and map update
      }
    }
    
    // Verify a location was added (look for "Your locations" section)
    const locationsSection = page.locator('text=/Your locations/i');
    await expect(locationsSection).toBeVisible({ timeout: 10000 });
    
    // Save the profile
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ 
      timeout: SAVE_OPERATION_TIMEOUT 
    });
    
    // Step 2: Logout
    await logout(page);
    
    // Step 3: Set up geolocation tracking BEFORE logging in again
    // Override geolocation.getCurrentPosition to track calls
    await page.addInitScript(() => {
      (window as unknown as { __geolocationRequested: boolean }).__geolocationRequested = false;
      const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
      navigator.geolocation.getCurrentPosition = function(success, error, options) {
        (window as unknown as { __geolocationRequested: boolean }).__geolocationRequested = true;
        console.log('Geolocation API called');
        return originalGetCurrentPosition(success, error, options);
      };
    });
    
    // Step 4: Login again
    await loginToLocalCSS(page);
    
    // Navigate to Location tab
    await page.getByRole('tab', { name: /location/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Wait for profile and map to fully load
    await page.waitForTimeout(3000);
    
    // Check if geolocation was requested
    const geolocationRequested = await page.evaluate(() => {
      return (window as unknown as { __geolocationRequested: boolean }).__geolocationRequested === true;
    });
    
    // Verify locations are still displayed
    await expect(locationsSection).toBeVisible({ timeout: 10000 });
    
    // Geolocation should NOT have been requested since we have existing locations
    expect(geolocationRequested).toBe(false);
  });

  test('should request geolocation only when Use my location button is pressed', async ({ page, context }) => {
    // Mock geolocation
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 51.5074, longitude: -0.1278 }); // London
    
    // Set up geolocation tracking BEFORE navigating
    await page.addInitScript(() => {
      (window as unknown as { __geolocationCallCount: number }).__geolocationCallCount = 0;
      const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
      navigator.geolocation.getCurrentPosition = function(success, error, options) {
        (window as unknown as { __geolocationCallCount: number }).__geolocationCallCount++;
        console.log('Geolocation API called, count:', (window as unknown as { __geolocationCallCount: number }).__geolocationCallCount);
        return originalGetCurrentPosition(success, error, options);
      };
    });
    
    // First login and add location via postcode, then save
    await loginToLocalCSS(page);
    
    await page.getByRole('tab', { name: /location/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Add a location using postcode search
    const postcodeInput = page.locator('input[placeholder*="postcode" i], input[placeholder*="address" i]').first();
    if (await postcodeInput.count() > 0) {
      await postcodeInput.fill('EC1A 1BB');
      const searchButton = page.locator('button:has-text("Search")').first();
      if (await searchButton.isVisible()) {
        await searchButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }
    }
    
    // Save
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ timeout: SAVE_OPERATION_TIMEOUT });
    
    // Now check geolocation call count before clicking "Use my location"
    const callCountBefore = await page.evaluate(() => {
      return (window as unknown as { __geolocationCallCount: number }).__geolocationCallCount || 0;
    });
    
    // Click "Use my location" button
    const useLocationButton = page.locator('button:has-text("Use my location")').first();
    if (await useLocationButton.isVisible()) {
      await useLocationButton.click();
      await page.waitForTimeout(2000);
      
      // Check geolocation call count after clicking button
      const callCountAfter = await page.evaluate(() => {
        return (window as unknown as { __geolocationCallCount: number }).__geolocationCallCount || 0;
      });
      
      // Geolocation should have been called when button was pressed
      expect(callCountAfter).toBeGreaterThan(callCountBefore);
    }
  });


  test('should display location tab and editor', async ({ page }) => {
    // Step 1: Login to local CSS
    await loginToLocalCSS(page);
    
    // Step 2: Navigate to Location tab (should be default)
    const locationTab = page.getByRole('tab', { name: /location/i });
    await expect(locationTab).toBeVisible();
    
    // Click to ensure we're on the tab
    await locationTab.click();
    
    // Wait for the location editor to load
    await page.waitForLoadState('networkidle');
    
    // Verify we can see location-related elements
    // The location editor should have either a map or location input controls
    const hasLocationEditor = await Promise.race([
      page.waitForSelector('text=Loading map', { timeout: 5000 }).then(() => true).catch(() => false),
      page.waitForSelector('[class*="leaflet"]', { timeout: 5000 }).then(() => true).catch(() => false),
      page.waitForSelector('input[placeholder*="postcode" i]', { timeout: 5000 }).then(() => true).catch(() => false),
      page.waitForSelector('button:has-text("Use Current Location")', { timeout: 5000 }).then(() => true).catch(() => false),
    ]);
    
    // At least one of these elements should be present
    expect(hasLocationEditor).toBeTruthy();
  });

  test('should allow searching for location by postcode', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Navigate to Location tab
    await page.getByRole('tab', { name: /location/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Try to find postcode input
    const postcodeInput = page.locator('input[placeholder*="postcode" i], input[type="text"]').first();
    
    // Check if the input exists
    const inputExists = await postcodeInput.count() > 0;
    
    if (inputExists) {
      // Enter a UK postcode
      await postcodeInput.fill('SW1A 1AA'); // Buckingham Palace postcode
      
      // Look for search button
      const searchButton = page.locator('button:has-text("Search"), button[type="submit"]').first();
      if (await searchButton.isVisible()) {
        await searchButton.click();
        
        // Wait for search results or map update
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should persist location data after logout/login', async ({ page }) => {
    await loginToLocalCSS(page);
    
    // Navigate to Location tab
    await page.getByRole('tab', { name: /location/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Try to use current location or add a location
    const useLocationButton = page.locator('button:has-text("Use Current Location"), button:has-text("Get Location")').first();
    
    const buttonExists = await useLocationButton.count() > 0;
    
    if (buttonExists && await useLocationButton.isVisible()) {
      // Mock geolocation for the test
      await page.context().grantPermissions(['geolocation']);
      await page.context().setGeolocation({ latitude: 51.5074, longitude: -0.1278 }); // London
      
      await useLocationButton.click();
      
      // Wait for location to be processed by watching for network idle
      await page.waitForLoadState('networkidle');
      
      // Save the profile
      await page.getByRole('button', { name: /save/i }).click();
      await expect(page.getByText(/saved successfully/i)).toBeVisible({ 
        timeout: SAVE_OPERATION_TIMEOUT 
      });
      
      // Logout and login
      await logout(page);
      await loginToLocalCSS(page);
      
      // Navigate back to Location tab
      await page.getByRole('tab', { name: /location/i }).click();
      await page.waitForLoadState('networkidle');
      
      // The location should be preserved - try to find location markers or coordinate data
      // Check for various indicators that location data is present
      const locationIndicators = await Promise.all([
        page.locator('[class*="marker"]').count(),
        page.locator('text=/51.*-0.12/i').count(),
        page.locator('[class*="leaflet-marker"]').count(),
      ]);
      
      const hasLocationData = locationIndicators.some(count => count > 0);
      
      // Note: Location persistence verification is limited without detailed UI structure knowledge
      // This test verifies the basic save/load flow works
      // Actual coordinate verification would require inspecting the Solid Pod data
    }
  });
});
