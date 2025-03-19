import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as twitterService from './twitterService.js';
import * as configService from './configService.js';
import * as logService from './logService.js';
import { loadProcessedLinks, saveProcessedLink } from '../utils/fileUtils.js';
import { captureScreenshot } from './screenshotService.js';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Global state
let isRunning = false;
let scrapingInterval = null;
let processedLinks = new Set();

/**
 * Clean tweet URL to a standard format
 * @param {string} url - Raw tweet URL
 * @returns {string} Cleaned standard URL
 */
const cleanTweetUrl = (url) => {
  if (url && url.includes("/status/")) {
    const baseUrl = url.split("?")[0]; // Remove URL parameters
    for (const suffix of ["/photo/", "/video/", "/gif/", "/analytics", "/retweets", "/likes", "/replies", "/bookmarks", "/context"]) {
      if (baseUrl.includes(suffix)) {
        return baseUrl.split(suffix)[0];
      }
    }
    return baseUrl;
  }
  return null;
};

/**
 * Extract tweets directly using Twitter API
 * @returns {Array} List of tweet URLs
 */
const scrapeTweetsAPI = async () => {
  const config = configService.getConfig();
  const { targetAccounts, pinnedTweetIds, tweetsPerAccount } = config;
  const allTweets = [];
  
  if (!targetAccounts || targetAccounts.length === 0) {
    logService.warn('No target accounts configured', 'scraper');
    return [];
  }
  
  try {
    for (const accountObj of targetAccounts) {
      if (!isRunning) break;
      
      // Extract account name from object or use directly if it's a string
      const accountName = typeof accountObj === 'object' ? accountObj.account : accountObj;
      
      logService.info(`Scraping tweets for account: ${accountName}`, 'scraper');
      
      // Fetch tweets via Twitter API - use the configured number of tweets per account
      const tweets = await twitterService.getUserTweets(accountName, tweetsPerAccount);
      
      // Get pinned tweet ID for this account
      const pinnedTweetId = typeof accountObj === 'object' && accountObj.pinnedTweetId 
        ? accountObj.pinnedTweetId 
        : pinnedTweetIds[accountName];
      
      // Process each tweet
      for (const tweet of tweets) {
        const tweetUrl = `https://twitter.com/${accountName}/status/${tweet.id}`;
        const tweetId = tweet.id;
        
        // Skip pinned tweet if configured
        if (pinnedTweetId && tweetId === pinnedTweetId) {
          logService.info(`Skipping pinned tweet for ${accountName}: ${tweetUrl}`, 'scraper');
          continue;
        }
        
        // Add to results if not already processed
        if (!processedLinks.has(tweetUrl)) {
          allTweets.push({
            url: tweetUrl,
            id: tweetId,
            text: tweet.text,
            author: accountName
          });
        }
      }
      
      // Add delay between accounts
      if (isRunning && targetAccounts.indexOf(accountObj) < targetAccounts.length - 1) {
        logService.info(`Waiting 5 seconds before processing next account`, 'scraper');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    return allTweets;
  } catch (error) {
    logService.error(`Error scraping tweets via API: ${error.message}`, 'scraper');
    throw error;
  }
};

/**
 * Initialize the scraping service
 */
export const initialize = () => {
  // Load processed links from file
  processedLinks = loadProcessedLinks();
  logService.info(`Loaded ${processedLinks.size} processed tweet links`, 'scraper');
};

/**
 * Start the scraping process
 */
export const startScraping = async () => {
  if (isRunning) {
    logService.warn("Scraping already in progress", 'scraper');
    return false;
  }
  
  // Ensure we're logged in
  if (!twitterService.getLoginStatus()) {
    logService.error("Not logged in to Twitter, cannot start scraping", 'scraper');
    return false;
  }
  
  // Initialize if needed
  if (processedLinks.size === 0) {
    initialize();
  }
  
  const config = configService.getConfig();
  const { delays, tweetText } = config;
  
  isRunning = true;
  logService.info("Starting scraping process", 'scraper');
  
  // Function to perform one scraping cycle
  const performScrapingCycle = async () => {
    if (!isRunning) return;
    
    try {
      logService.info("Beginning scraping cycle", 'scraper');
      
      // Get tweets from all accounts
      const tweets = await scrapeTweetsAPI();
      logService.info(`Found ${tweets.length} new tweets to process`, 'scraper');
      
      // Process each new tweet
      for (const tweet of tweets) {
        if (!isRunning) break;
        
        logService.info(`Processing tweet: ${tweet.url}`, 'scraper');
        
        // Skip if already processed
        if (processedLinks.has(tweet.url)) {
          logService.info(`Skipping already processed tweet: ${tweet.url}`, 'scraper');
          continue;
        }
        
        try {
          // Capture screenshot
          const screenshotPath = await captureScreenshot(tweet.url);
          
          if (screenshotPath) {
            logService.info(`Screenshot captured: ${screenshotPath}`, 'scraper');
            
            // Read image file
            const imageBuffer = fs.readFileSync(screenshotPath);
            const ext = path.extname(screenshotPath).toLowerCase();
            const mediaType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
            
            // Post tweet with image
            await twitterService.sendTweetWithMedia(imageBuffer, mediaType, tweetText);
            
            // Mark as processed
            saveProcessedLink(tweet.url);
            processedLinks.add(tweet.url);
            
            logService.info(`Successfully processed tweet: ${tweet.url}`, 'scraper');
            
            // Wait random delay before next tweet
            if (isRunning && tweets.indexOf(tweet) < tweets.length - 1) {
              const { minDelay, maxDelay } = config.delays;
              // Ensure we're using the correct values and calculation
              const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
              logService.info(`Waiting ${delay/1000} seconds before next tweet...`, 'scraper');
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } else {
            logService.error(`Failed to capture screenshot for: ${tweet.url}`, 'scraper');
          }
        } catch (tweetError) {
          logService.error(`Error processing tweet ${tweet.url}: ${tweetError.message}`, 'scraper');
          // Continue with next tweet
        }
      }
      
      logService.info("Scraping cycle completed", 'scraper');
    } catch (error) {
      logService.error(`Error during scraping cycle: ${error.message}`, 'scraper');
    }
  };
  
  // Perform first cycle immediately
  await performScrapingCycle();
  
  // Schedule periodic scraping
  const cycleDelay = Math.max(60000, delays.maxDelay); // At least 1 minute between cycles
  scrapingInterval = setInterval(performScrapingCycle, cycleDelay);
  
  return true;
};

/**
 * Stop the scraping process
 */
export const stopScraping = () => {
  if (!isRunning) {
    logService.warn("No scraping in progress", 'scraper');
    return false;
  }
  
  logService.info("Stopping scraping process", 'scraper');
  isRunning = false;
  
  if (scrapingInterval) {
    clearInterval(scrapingInterval);
    scrapingInterval = null;
  }
  
  return true;
};

/**
 * Get the current scraping status
 */
export const getStatus = () => {
  return {
    isRunning,
    processedCount: processedLinks.size
  };
}; 