#!/usr/bin/env node

/**
 * Command-line interface for the Twitter scraper
 * Replaces main.py functionality for running the scraper from the command line
 */

import dotenv from 'dotenv';
import axios from 'axios';
import * as configService from './services/configService.js';
import * as twitterService from './services/twitterService.js';
import * as scrapingService from './services/scrapingService.js';
import { setupFolders, loadProcessedLinks, saveProcessedLink } from './utils/fileUtils.js';
import { captureScreenshot } from './services/screenshotService.js';
import readline from 'readline';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize environment variables
dotenv.config();

// Setup necessary folders
setupFolders();

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️ Received interrupt signal. Cleaning up...');
  scrapingService.stopScraping();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Received termination signal. Cleaning up...');
  scrapingService.stopScraping();
  process.exit(0);
});

/**
 * Check if the Twitter server is running
 */
const checkServerRunning = async () => {
  try {
    const response = await axios.get('http://localhost:3000/health');
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

/**
 * Main function for standalone operation
 */
const main = async () => {
  console.log('🚀 Starting Twitter scraper CLI...');
  
  // Check if Twitter is properly configured
  if (!twitterService.getLoginStatus()) {
    console.log('⚠️ Not logged in to Twitter. Attempting to login...');
    try {
      await twitterService.login();
      console.log('✅ Logged in to Twitter successfully');
    } catch (error) {
      console.error('❌ Failed to login to Twitter:', error.message);
      process.exit(1);
    }
  }
  
  // Get configuration
  const config = configService.getConfig();
  console.log(`ℹ️ Delay configuration: ${config.delays.min}-${config.delays.max} seconds`);
  console.log(`ℹ️ Target accounts: ${config.targetAccounts.map(account => account.account).join(', ')}`);
  
  // Start the scraping process
  try {
    await scrapingService.startScraping();
    console.log('✅ Scraping process started');
    
    // Keep the process running
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('ℹ️ Press Enter to stop scraping and exit...');
    rl.question('', () => {
      scrapingService.stopScraping();
      console.log('✅ Scraping stopped');
      rl.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error starting scraper:', error.message);
    process.exit(1);
  }
};

// Run the main function if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('❌ Uncaught error:', error);
    process.exit(1);
  });
}

export { main }; 