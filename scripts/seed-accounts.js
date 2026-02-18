#!/usr/bin/env node

/**
 * Seed accounts script for Community Solid Server
 * 
 * This script reads seed-config.json and creates accounts in the local CSS instance.
 * It waits for the CSS server to be ready before attempting to create accounts.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const CSS_BASE_URL = process.env.CSS_BASE_URL || 'http://localhost:3001';
const SEED_CONFIG_PATH = path.join(__dirname, '..', 'seed-config.json');
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000; // 1 second

/**
 * Wait for CSS server to be ready
 */
async function waitForServer(url, maxRetries = MAX_RETRIES) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`${url}/.well-known/openid-configuration`, (res) => {
          if (res.statusCode === 200 || res.statusCode === 404) {
            // Server is responding (404 is ok, means server is up)
            resolve();
          } else {
            reject(new Error(`Server returned status ${res.statusCode}`));
          }
        });
        req.on('error', reject);
        req.setTimeout(2000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });
      console.log(`✓ CSS server is ready at ${url}`);
      return true;
    } catch (error) {
      if (i < maxRetries - 1) {
        process.stdout.write(`\rWaiting for CSS server... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        console.error(`\n✗ CSS server did not become ready after ${maxRetries} attempts`);
        return false;
      }
    }
  }
  return false;
}

/**
 * Make HTTP request (compatible with Node.js)
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = httpModule.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          text: () => Promise.resolve(data),
          json: () => Promise.resolve(JSON.parse(data)),
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Check if an account already exists
 */
async function accountExists(email) {
  try {
    const response = await makeRequest(`${CSS_BASE_URL}/.account/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      // Check if account exists in the response
      return data.accounts?.some(acc => acc.email === email) || false;
    }
  } catch (error) {
    // If we can't check, assume it doesn't exist and try to create
    return false;
  }
  return false;
}

/**
 * Create an account in CSS
 * Tries multiple API endpoints to support different CSS versions
 */
async function createAccount(accountConfig) {
  const { email, password, pods } = accountConfig;
  
  // Check if account already exists
  const exists = await accountExists(email);
  if (exists) {
    console.log(`  ⏭️  Account ${email} already exists, skipping`);
    return { success: true, skipped: true };
  }

  // Try different endpoints for account creation
  const endpoints = [
    `${CSS_BASE_URL}/.account/register`,
    `${CSS_BASE_URL}/.account/`,
    `${CSS_BASE_URL}/idp/register/`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          pods: pods || [],
        }),
      });

      if (response.ok || response.status === 201 || response.status === 200) {
        const data = await response.text();
        console.log(`  ✓ Created account: ${email}`);
        if (pods && pods.length > 0) {
          pods.forEach(pod => {
            console.log(`    - Pod: ${pod.name}`);
          });
        }
        return { success: true, skipped: false };
      } else if (response.status === 404) {
        // Endpoint doesn't exist, try next one
        continue;
      } else {
        const errorText = await response.text();
        // Check if account already exists (some CSS versions return 409 or 400)
        if (response.status === 409 || errorText.includes('already exists') || errorText.includes('duplicate')) {
          console.log(`  ⏭️  Account ${email} already exists, skipping`);
          return { success: true, skipped: true };
        }
        // If it's not a 404, this might be the right endpoint but with an error
        if (endpoint === endpoints[endpoints.length - 1]) {
          // Last endpoint, report the error
          console.error(`  ✗ Failed to create account ${email}: ${response.status} ${errorText}`);
          return { success: false, error: `${response.status}: ${errorText}` };
        }
        // Try next endpoint
        continue;
      }
    } catch (error) {
      // If it's the last endpoint, report the error
      if (endpoint === endpoints[endpoints.length - 1]) {
        console.error(`  ✗ Error creating account ${email}:`, error.message);
        return { success: false, error: error.message };
      }
      // Otherwise, try next endpoint
      continue;
    }
  }

  // If we get here, all endpoints failed
  console.error(`  ✗ Failed to create account ${email}: No working endpoint found`);
  return { success: false, error: 'No working account creation endpoint found' };
}

/**
 * Main function to seed accounts
 */
async function seedAccounts() {
  console.log('🌱 Starting account seeding...\n');

  // Check if seed config exists
  if (!fs.existsSync(SEED_CONFIG_PATH)) {
    console.log(`⚠️  Seed config not found at ${SEED_CONFIG_PATH}`);
    console.log('   Skipping account seeding.');
    return;
  }

  // Read seed config
  let seedConfig;
  try {
    const configContent = fs.readFileSync(SEED_CONFIG_PATH, 'utf8');
    seedConfig = JSON.parse(configContent);
  } catch (error) {
    console.error(`✗ Error reading seed config: ${error.message}`);
    process.exit(1);
  }

  if (!Array.isArray(seedConfig) || seedConfig.length === 0) {
    console.log('⚠️  Seed config is empty, no accounts to create.');
    return;
  }

  // Wait for CSS server to be ready
  console.log(`Waiting for CSS server at ${CSS_BASE_URL}...`);
  const serverReady = await waitForServer(CSS_BASE_URL);
  if (!serverReady) {
    console.error('✗ Cannot proceed without CSS server');
    process.exit(1);
  }

  console.log(`\n📝 Creating ${seedConfig.length} account(s)...\n`);

  // Create accounts
  const results = {
    created: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (const account of seedConfig) {
    const result = await createAccount(account);
    if (result.success) {
      if (result.skipped) {
        results.skipped++;
      } else {
        results.created++;
      }
    } else {
      results.failed++;
      results.errors.push({ email: account.email, error: result.error });
    }
  }

  // Summary
  console.log('\n📊 Seeding Summary:');
  console.log(`   Created: ${results.created}`);
  console.log(`   Skipped: ${results.skipped}`);
  console.log(`   Failed:  ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    results.errors.forEach(({ email, error }) => {
      console.log(`   - ${email}: ${error}`);
    });
    console.log('\n💡 Tip: If account creation failed, you may need to:');
    console.log('   1. Ensure CSS account registration is enabled');
    console.log('   2. Manually create accounts at http://localhost:3001/idp/register/');
    console.log('   3. Check CSS configuration for account management settings\n');
  }

  if (results.failed > 0) {
    // Don't exit with error code - allow server to continue
    // process.exit(1);
  }

  console.log('\n✓ Account seeding completed!\n');
}

// Run if called directly
if (require.main === module) {
  seedAccounts().catch((error) => {
    console.error('✗ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { seedAccounts, createAccount, waitForServer };
