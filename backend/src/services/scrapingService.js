import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as twitterService from './twitterService.js';
import * as configService from './configService.js';
import * as logService from './logService.js';
import * as openaiService from './openaiService.js';
import { loadProcessedLinks, saveProcessedLink, clearProcessedLinks as fileUtilsClearProcessedLinks } from '../utils/fileUtils.js';
import path from 'path';
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
let isPaused = false; // Add a flag to track if scraping is paused for auth
let pauseReason = ''; // Track the reason for pausing
let nextCycleTime = null; // Track when the next cycle will run

// Add new variables to store failed tweets
let failedTweetBatches = [];
let lastErrorMessage = '';

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
 * @returns {Array} List of tweet objects
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
export const initialize = async () => {
  // Load processed links from file
  processedLinks = loadProcessedLinks();
  logService.info(`Loaded ${processedLinks.size} processed tweet links`, 'scraper');
  
  // Initialize OpenAI service
  await openaiService.initialize();
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
    await initialize();
  }
  
  const config = configService.getConfig();
  
  isRunning = true;
  isPaused = false;
  pauseReason = '';
  logService.info("Starting scraping process", 'scraper');
  
  // Function to perform one scraping cycle
  const performScrapingCycle = async () => {
    if (isPaused) {
      logService.info(`Scraping is paused: ${pauseReason}`, 'scraper');
      return;
    }
    
    // Check if we need to reauthenticate before proceeding
    if (twitterService.needsAuthentication()) {
      logService.error("Twitter authentication has expired, pausing scraping until re-login", 'scraper');
      pauseScraping("Authentication required. Please re-login to Twitter.");
      // Reset the authentication flag so we don't keep logging the same message
      twitterService.resetAuthenticationState();
      return;
    }
    
    try {
      logService.info("Beginning scraping cycle", 'scraper');
      
      // Get tweets from all accounts
      const tweets = await scrapeTweetsAPI();
      logService.info(`Found ${tweets.length} new tweets to process`, 'scraper');
      
      if (tweets.length === 0) {
        logService.info("No new tweets to process, waiting for next cycle", 'scraper');
        return;
      }
      
      // Filter out tweets we've already processed
      const unprocessedTweets = tweets.filter(tweet => !processedLinks.has(tweet.url));
      
      if (unprocessedTweets.length === 0) {
        logService.info("All tweets have been processed already, waiting for next cycle", 'scraper');
        return;
      }
      
      if (!isRunning) return; // Add early return if scraper was stopped
      
      logService.info(`Processing batch of ${unprocessedTweets.length} unprocessed tweets`, 'scraper');
      
      // Use the new processTwitterBatch function
      await processTwitterBatch(unprocessedTweets);
      
      logService.info("Scraping cycle completed", 'scraper');
    } catch (error) {
      logService.error(`Error during scraping cycle: ${error.message}`, 'scraper');
    }
  };
  
  // Perform first cycle immediately
  await performScrapingCycle();
  
  // Schedule periodic scraping
  const cycleDelay = 1800000; // 30 minutes in milliseconds
  nextCycleTime = Date.now() + cycleDelay;
  logService.info(`Sleeping for 30 minutes before starting the next scraping cycle (at ${new Date(nextCycleTime).toLocaleTimeString()})`, 'scraper');
  scrapingInterval = setInterval(() => {
    performScrapingCycle();
    // Update next cycle time after starting a new cycle
    nextCycleTime = Date.now() + cycleDelay;
  }, cycleDelay);
  
  return true;
};

/**
 * Pause the scraping process
 * @param {string} reason - Reason for pausing
 * @returns {boolean} Whether pause was successful
 */
export const pauseScraping = (reason = "User requested pause") => {
  if (!isRunning) {
    logService.warn("No scraping in progress to pause", 'scraper');
    return false;
  }
  
  logService.info(`Pausing scraping process: ${reason}`, 'scraper');
  isPaused = true;
  pauseReason = reason;
  
  return true;
};

/**
 * Resume the scraping process after a pause
 * @returns {boolean} Whether resume was successful
 */
export const resumeScraping = async () => {
  if (!isRunning) {
    logService.warn("No scraping process to resume", 'scraper');
    return false;
  }
  
  if (!isPaused) {
    logService.warn("Scraping is not paused", 'scraper');
    return false;
  }
  
  // Check if we're paused for auth reasons and verify we're logged in
  if (pauseReason.includes("Authentication") && !twitterService.getLoginStatus()) {
    logService.error("Cannot resume - still not logged in to Twitter", 'scraper');
    return false;
  }
  
  logService.info("Resuming scraping process", 'scraper');
  isPaused = false;
  pauseReason = '';
  
  return true;
};

/**
 * Stop the scraping process
 * @param {boolean} immediate - Whether to stop immediately (true) or finish the current cycle (false)
 */
export const stopScraping = (immediate = true) => {
  if (!isRunning) {
    logService.warn("No scraping in progress", 'scraper');
    return false;
  }
  
  if (immediate) {
    logService.info("Stopping scraping process immediately", 'scraper');
    isRunning = false;
  } else {
    logService.info("Scheduling scraping process to stop after current cycle completes", 'scraper');
    // The current cycle will complete, but no new cycles will be scheduled
    // We'll handle this in the interval
  }
  
  isPaused = false;
  pauseReason = '';
  
  if (scrapingInterval) {
    clearInterval(scrapingInterval);
    scrapingInterval = null;
  }
  
  // If immediate stop was not requested, we'll let current cycle complete
  if (!immediate) {
    // Force isRunning to false after a reasonable timeout to ensure it eventually stops
    setTimeout(() => {
      if (isRunning) {
        logService.info("Forcing scraper to stop after timeout", 'scraper');
        isRunning = false;
      }
    }, 60000); // 1 minute grace period
  }
  
  return true;
};

/**
 * Get the current scraping status
 */
export const getStatus = () => {
  return {
    isRunning,
    isPaused,
    pauseReason,
    processedCount: processedLinks.size,
    nextCycleTime: isRunning && !isPaused && nextCycleTime ? nextCycleTime : null,
    cycleDelay: 1800000 // 30 minutes in milliseconds
  };
};

// Add this new function to get the failed batch info
export const getFailedBatchInfo = () => {
  return {
    hasFailed: failedTweetBatches.length > 0,
    failedBatchCount: failedTweetBatches.length,
    totalTweets: failedTweetBatches.reduce((count, batch) => count + batch.length, 0),
    lastErrorMessage: lastErrorMessage
  };
};

// Add this new function to retry processing failed tweets
export const retryFailedBatch = async () => {
  if (failedTweetBatches.length === 0) {
    return {
      success: false,
      message: "No failed batches to retry"
    };
  }
  
  if (isPaused) {
    return {
      success: false,
      message: "Scraper is paused. Resume scraping before retrying."
    };
  }
  
  if (!isRunning) {
    return {
      success: false,
      message: "Scraper is not running. Start scraping before retrying."
    };
  }

  try {
    // Take the oldest failed batch
    const batchToRetry = failedTweetBatches.shift();
    
    logService.info(`Retrying batch of ${batchToRetry.length} previously failed tweets`, 'scraper');
    
    // Process the batch like in the main cycle, but with special retry handling
    await processTwitterBatch(batchToRetry, true);
    
    return {
      success: true,
      message: "Successfully retried processing the failed batch."
    };
  } catch (error) {
    logService.error(`Error retrying failed batch: ${error.message}`, 'scraper');
    return {
      success: false,
      message: `Failed to retry: ${error.message}`
    };
  }
};

// Add this new utility function to process a batch of tweets
// This extracts the core processing logic from performScrapingCycle
const processTwitterBatch = async (unprocessedTweets, isRetry = false) => {
  try {
    // Get config for delays between tweets
    const config = configService.getConfig();
    
    // Process tweets in batch to find all relevant crypto news
    const rephrasedTweets = await openaiService.processTweetBatch(unprocessedTweets);
    
    // Add another check after OpenAI processing
    if (!isRunning) {
      logService.info("Scraping was stopped during processing, aborting tweet posting", 'scraper');
      return false;
    }
    
    // Track which tweets we should consider processed
    const tweetsToProcess = new Set();
    
    if (rephrasedTweets && rephrasedTweets.length > 0) {
      logService.info(`Found ${rephrasedTweets.length} relevant crypto news tweets`, 'scraper');
      
      // Post each rephrased tweet with configured delays
      let successfulPostCount = 0;
      for (const tweet of rephrasedTweets) {
        if (!isRunning) break;
        if (isPaused) break; // Don't proceed if we've been paused
        
        try {
          await twitterService.sendTweet(tweet);
          logService.info(`Posted crypto news tweet successfully: ${tweet.substring(0, 50)}...`, 'scraper');
          successfulPostCount++;
          
          // Add delay between tweets
          if (isRunning && !isPaused && rephrasedTweets.indexOf(tweet) < rephrasedTweets.length - 1) {
            const { minDelay, maxDelay } = config.delays;
            const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
            logService.info(`Waiting ${delay/1000} seconds before next tweet...`, 'scraper');
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } catch (tweetError) {
          // Check if this is an authentication error
          if (tweetError.message && tweetError.message.includes("Authentication failed")) {
            logService.error("Twitter authentication issue detected, pausing scraping", 'scraper');
            pauseScraping("Authentication required. Please re-login to Twitter.");
            // Don't mark tweets as processed - we'll retry after reauth
            if (isRetry) {
              // Put the batch back at the front of the queue if this was a retry
              failedTweetBatches.unshift(unprocessedTweets);
            }
            return false;
          } else {
            logService.error(`Error posting tweet: ${tweetError.message}`, 'scraper');
            // Don't mark any tweets as processed when a tweet posting fails
            // We don't know which original tweet corresponds to this rephrased tweet
            if (isRetry) {
              // Put the batch back at the front of the queue if this was a retry
              failedTweetBatches.unshift(unprocessedTweets);
            }
            return false;
          }
        }
      }
      
      // Only mark tweets as processed if ALL tweets were successfully posted
      if (successfulPostCount === rephrasedTweets.length) {
        // Since all tweets were posted successfully, we can mark all the original tweets as processed
        for (const tweet of unprocessedTweets) {
          saveProcessedLink(tweet.url);
          processedLinks.add(tweet.url);
        }
        return true;
      }
    } else {
      logService.info("No relevant crypto news found in these tweets", 'scraper');
      
      // If no tweets were selected for posting, we can safely mark them all as processed
      for (const tweet of unprocessedTweets) {
        saveProcessedLink(tweet.url);
        processedLinks.add(tweet.url);
      }
      return true;
    }
    
    return false;
  } catch (error) {
    logService.error(`Error processing tweet batch: ${error.message}`, 'scraper');
    
    // Store the error message for the dashboard
    lastErrorMessage = error.message;
    
    // Store the failed batch for retry if this isn't already a retry
    if (!isRetry) {
      failedTweetBatches.push(unprocessedTweets);
      logService.info(`Stored failed batch of ${unprocessedTweets.length} tweets for later retry`, 'scraper');
    }
    
    return false;
  }
};

// Get processed links
export const getProcessedLinks = () => {
  return Array.from(processedLinks);
};

// Clear processed links - now using fileUtils implementation
export const clearProcessedLinks = () => {
  processedLinks.clear();
  fileUtilsClearProcessedLinks();
  return true;
}; 