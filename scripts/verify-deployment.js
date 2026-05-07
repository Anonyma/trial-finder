#!/usr/bin/env node
/**
 * Deployment verification script
 * Checks that a website loads without errors and contains expected content
 *
 * Usage:
 *   node scripts/verify-deployment.js https://trial-finder-demo.netlify.app
 */

const https = require('https');
const http = require('http');

const URL = process.argv[2] || 'https://trial-finder-demo.netlify.app';
const TIMEOUT = 30000;

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m';

let errors = 0;

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, { timeout: TIMEOUT }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function checkStatus(url, expected, description) {
  process.stdout.write(`Checking ${description}... `);
  try {
    const { status } = await fetch(url);
    if (status === expected) {
      console.log(`${GREEN}✓ ${status}${NC}`);
      return true;
    } else {
      console.log(`${RED}✗ Got ${status} (expected ${expected})${NC}`);
      errors++;
      return false;
    }
  } catch (err) {
    console.log(`${RED}✗ Error: ${err.message}${NC}`);
    errors++;
    return false;
  }
}

async function checkContent(url, pattern, description, shouldExist = true) {
  process.stdout.write(`Checking ${description}... `);
  try {
    const { data } = await fetch(url);
    const found = data.toLowerCase().includes(pattern.toLowerCase());
    
    if (shouldExist) {
      if (found) {
        console.log(`${GREEN}✓ Found${NC}`);
        return true;
      } else {
        console.log(`${RED}✗ Not found${NC}`);
        errors++;
        return false;
      }
    } else {
      if (!found) {
        console.log(`${GREEN}✓ Not found (good)${NC}`);
        return true;
      } else {
        console.log(`${RED}✗ Found (should not exist)${NC}`);
        errors++;
        return false;
      }
    }
  } catch (err) {
    console.log(`${YELLOW}⚠ Error: ${err.message}${NC}`);
    return false;
  }
}

async function main() {
  console.log(`🔍 Verifying deployment: ${URL}`);
  console.log('='.repeat(50));
  console.log();

  console.log('HTTP Status Checks:');
  console.log('-'.repeat(30));
  await checkStatus(URL, 200, 'Home page loads (200)');
  await checkStatus(`${URL}/about`, 200, 'About page (200)');
  await checkStatus(`${URL}/match`, 200, 'Match page (200)');
  await checkStatus(`${URL}/api/search`, 200, 'Search API (200)');
  await checkStatus(`${URL}/nonexistent-page-test`, 404, '404 handling');

  console.log();
  console.log('Content Checks (should exist):');
  console.log('-'.repeat(30));
  await checkContent(URL, 'Trial Finder', 'Page title');
  await checkContent(URL, 'cancer clinical trials', 'Description text');
  await checkContent(URL, 'Browse', 'Navigation link');
  await checkContent(URL, 'Find a match', 'Match link');

  console.log();
  console.log('Error Checks (should NOT exist):');
  console.log('-'.repeat(30));
  await checkContent(URL, '__next_error__', 'Next.js error boundary', false);
  await checkContent(URL, '500 Internal Server Error', '500 error', false);
  await checkContent(URL, 'DATABASE_URL', 'Env var leak', false);

  console.log();
  console.log('='.repeat(50));
  if (errors === 0) {
    console.log(`${GREEN}✅ All checks passed!${NC}`);
    process.exit(0);
  } else {
    console.log(`${RED}❌ ${errors} check(s) failed${NC}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
