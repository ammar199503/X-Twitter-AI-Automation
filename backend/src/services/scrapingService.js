import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as twitterService from './twitterService.js';
import * as configService from './configService.js';
import * as logService from './logService.js';
import * as openaiService from './openaiService.js';
import { loadProcessedLinks, saveProcessedLink } from '../utils/fileUtils.js';
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
  logService.info("Starting scraping process", 'scraper');
  
  // Function to perform one scraping cycle
  const performScrapingCycle = async () => {
    if (!isRunning) return;
    
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
      
      logService.info(`Processing batch of ${unprocessedTweets.length} unprocessed tweets`, 'scraper');
      
      try {
        // Process tweets in batch to find all relevant crypto news
        const rephrasedTweets = await openaiService.processTweetBatch(unprocessedTweets);
        
        if (rephrasedTweets && rephrasedTweets.length > 0) {
          logService.info(`Found ${rephrasedTweets.length} relevant crypto news tweets`, 'scraper');
          
          // Post each rephrased tweet with configured delays
          for (const tweet of rephrasedTweets) {
            if (!isRunning) break;
            
            try {
              await twitterService.sendTweet(tweet);
              logService.info(`Posted crypto news tweet successfully: ${tweet.substring(0, 50)}...`, 'scraper');
              
              // Add delay between tweets
              if (isRunning && rephrasedTweets.indexOf(tweet) < rephrasedTweets.length - 1) {
                const { minDelay, maxDelay } = config.delays;
                const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
                logService.info(`Waiting ${delay/1000} seconds before next tweet...`, 'scraper');
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            } catch (tweetError) {
              logService.error(`Error posting tweet: ${tweetError.message}`, 'scraper');
              // Continue with next tweet even if one fails
            }
          }
          
          // Mark all tweets as processed after successful posting
          for (const tweet of unprocessedTweets) {
            saveProcessedLink(tweet.url);
            processedLinks.add(tweet.url);
          }
        } else {
          logService.info("No relevant crypto news found in these tweets", 'scraper');
          
          // Mark tweets as processed even if they weren't relevant
          for (const tweet of unprocessedTweets) {
            saveProcessedLink(tweet.url);
            processedLinks.add(tweet.url);
          }
        }
      } catch (batchError) {
        logService.error(`Error processing tweet batch: ${batchError.message}`, 'scraper');
        // Mark tweets as processed even if there was an error
        for (const tweet of unprocessedTweets) {
          saveProcessedLink(tweet.url);
          processedLinks.add(tweet.url);
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
  const cycleDelay = Math.max(60000, config.delays.maxDelay); // At least 1 minute between cycles
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