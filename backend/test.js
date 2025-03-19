#!/usr/bin/env node

/**
 * Twitter Scraper Backend API Test
 * 
 * This script tests the various API endpoints of the Twitter scraper backend.
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE = 'http://localhost:3002/api';
const TWITTER_USERNAME = process.env.TWITTER_USERNAME || '';
const TWITTER_PASSWORD = process.env.TWITTER_PASSWORD || '';
const TWITTER_EMAIL = process.env.TWITTER_EMAIL || '';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Testing functions
async function testHealthCheck() {
  console.log(`${colors.blue}Testing Health Check Endpoint${colors.reset}`);
  try {
    const response = await fetch('http://localhost:3002/health');
    const data = await response.json();
    
    if (response.ok && data.status === 'ok') {
      console.log(`${colors.green}✓ Health check successful${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Health check failed: ${JSON.stringify(data)}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}✗ Health check error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testLogin() {
  console.log(`\n${colors.blue}Testing Login Endpoint${colors.reset}`);
  
  // Skip if credentials are missing
  if (!TWITTER_USERNAME || !TWITTER_PASSWORD || !TWITTER_EMAIL) {
    console.log(`${colors.yellow}⚠ Skipping login test - missing credentials in .env file${colors.reset}`);
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: TWITTER_USERNAME,
        password: TWITTER_PASSWORD,
        email: TWITTER_EMAIL
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`${colors.green}✓ Login successful${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Login failed: ${JSON.stringify(data)}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}✗ Login error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testAuthStatus() {
  console.log(`\n${colors.blue}Testing Auth Status Endpoint${colors.reset}`);
  try {
    const response = await fetch(`${API_BASE}/auth/status`);
    const data = await response.json();
    
    console.log(`${colors.cyan}Current auth status: ${JSON.stringify(data)}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Auth status error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testUpdateConfig() {
  console.log(`\n${colors.blue}Testing Config Endpoints${colors.reset}`);
  
  try {
    // Get current config
    const getResponse = await fetch(`${API_BASE}/config`);
    const config = await getResponse.json();
    
    if (!getResponse.ok) {
      console.log(`${colors.red}✗ Failed to get config: ${JSON.stringify(config)}${colors.reset}`);
      return false;
    }
    
    console.log(`${colors.cyan}Current config: ${JSON.stringify(config)}${colors.reset}`);
    
    // Update target accounts
    const accounts = ['elonmusk', 'twitter'];
    const accountsResponse = await fetch(`${API_BASE}/config/target-accounts`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accounts })
    });
    
    const accountsData = await accountsResponse.json();
    
    if (accountsResponse.ok && accountsData.success) {
      console.log(`${colors.green}✓ Updated target accounts${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Failed to update target accounts: ${JSON.stringify(accountsData)}${colors.reset}`);
    }
    
    // Update delays
    const delaysResponse = await fetch(`${API_BASE}/config/delays`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minDelay: 300, maxDelay: 600 })
    });
    
    const delaysData = await delaysResponse.json();
    
    if (delaysResponse.ok && delaysData.success) {
      console.log(`${colors.green}✓ Updated delay settings${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Failed to update delay settings: ${JSON.stringify(delaysData)}${colors.reset}`);
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Config test error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testScraper() {
  console.log(`\n${colors.blue}Testing Scraper Endpoints${colors.reset}`);
  
  try {
    // Get scraper status
    const statusResponse = await fetch(`${API_BASE}/scrape/status`);
    const statusData = await statusResponse.json();
    
    console.log(`${colors.cyan}Scraper status: ${JSON.stringify(statusData)}${colors.reset}`);
    
    // Start scraping if not already running
    if (!statusData.isRunning) {
      const startResponse = await fetch(`${API_BASE}/scrape/start`, {
        method: 'POST'
      });
      
      const startData = await startResponse.json();
      
      if (startResponse.ok && startData.success) {
        console.log(`${colors.green}✓ Started scraping process${colors.reset}`);
        
        // Wait a bit and then stop
        console.log(`${colors.yellow}Waiting 5 seconds...${colors.reset}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Stop scraping
        const stopResponse = await fetch(`${API_BASE}/scrape/stop`, {
          method: 'POST'
        });
        
        const stopData = await stopResponse.json();
        
        if (stopResponse.ok && stopData.success) {
          console.log(`${colors.green}✓ Stopped scraping process${colors.reset}`);
        } else {
          console.log(`${colors.red}✗ Failed to stop scraping: ${JSON.stringify(stopData)}${colors.reset}`);
        }
      } else {
        console.log(`${colors.red}✗ Failed to start scraping: ${JSON.stringify(startData)}${colors.reset}`);
      }
    } else {
      console.log(`${colors.yellow}⚠ Scraper is already running${colors.reset}`);
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Scraper test error: ${error.message}${colors.reset}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log(`${colors.magenta}==== Twitter Scraper Backend API Tests ====${colors.reset}\n`);
  
  // First check if server is running
  const serverRunning = await testHealthCheck();
  
  if (!serverRunning) {
    console.error(`${colors.red}✗ Server is not running. Please start the server first.${colors.reset}`);
    process.exit(1);
  }
  
  // Run login tests
  const loggedIn = await testLogin();
  
  // Other tests - will work even if login failed
  await testAuthStatus();
  await testUpdateConfig();
  
  // Only test scraping if login succeeded
  if (loggedIn) {
    await testScraper();
  }
  
  console.log(`\n${colors.magenta}==== Tests Completed ====${colors.reset}`);
}

// Run the tests
runAllTests().catch(error => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  process.exit(1);
}); 