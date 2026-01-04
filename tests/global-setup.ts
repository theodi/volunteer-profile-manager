import { rm, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Global setup for Playwright tests
 * 
 * Clears the CSS data directory to ensure a clean state for seeding.
 * This prevents conflicts when the account seed tries to create pods
 * that already exist from previous test runs.
 */
async function globalSetup() {
  const dataDir = join(process.cwd(), 'data');
  
  console.log('🧹 Cleaning CSS data directory for fresh seeding...');
  
  try {
    // Remove the entire data directory
    await rm(dataDir, { recursive: true, force: true });
    
    // Recreate the empty data directory
    await mkdir(dataDir, { recursive: true });
    
    console.log('✅ CSS data directory cleaned');
  } catch (error) {
    console.error('⚠️ Error cleaning data directory:', error);
    // Don't fail the tests if cleanup fails - the server might still work
  }
}

export default globalSetup;
