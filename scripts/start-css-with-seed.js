#!/usr/bin/env node

/**
 * Start CSS server and seed accounts
 * 
 * This script starts the Community Solid Server and then seeds accounts
 * from seed-config.json once the server is ready.
 */

const { spawn } = require('child_process');
const { seedAccounts, waitForServer } = require('./seed-accounts');

const CSS_BASE_URL = process.env.CSS_BASE_URL || 'http://localhost:3001';
const CSS_PORT = process.env.CSS_PORT || '3001';

// Start CSS server
console.log('🚀 Starting Community Solid Server...\n');

const cssProcess = spawn(
  'npx',
  [
    'community-solid-server',
    '--port', CSS_PORT,
    '--loggingLevel', 'debug',
    '--config', '.cssconfig.json',
    '--rootFilePath', 'data/'
  ],
  {
    stdio: 'inherit',
    shell: true,
  }
);

// Handle CSS process errors
cssProcess.on('error', (error) => {
  console.error('✗ Failed to start CSS server:', error);
  process.exit(1);
});

// Wait for CSS to be ready, then seed accounts
let seeded = false;
const seedOnce = async () => {
  if (seeded) return;
  seeded = true;

  try {
    // Wait for server to be ready
    const serverReady = await waitForServer(CSS_BASE_URL, 60); // Give it more time on startup
    if (serverReady) {
      // Small delay to ensure server is fully initialized
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Seed accounts
      await seedAccounts();
    }
  } catch (error) {
    console.error('⚠️  Error during seeding:', error.message);
    // Don't exit - let CSS continue running
  }
};

// Start seeding after a short delay to let CSS start
setTimeout(seedOnce, 3000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down CSS server...');
  cssProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down CSS server...');
  cssProcess.kill('SIGTERM');
  process.exit(0);
});

// Exit if CSS process exits unexpectedly
cssProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\n✗ CSS server exited with code ${code}`);
    process.exit(code || 1);
  }
});
