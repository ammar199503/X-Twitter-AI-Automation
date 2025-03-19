import { Scraper } from 'agent-twitter-client';
import * as configService from './configService.js';
import * as logService from './logService.js';

let scraper = null;
let isLoggedIn = false;

/**
 * Initialize the Twitter service with credentials
 * @param {object} credentials - Twitter credentials (optional)
 * @returns {Promise<boolean>} Whether login was successful
 */
export const initialize = async (credentials = null) => {
  try {
    // Use provided credentials or load from config
    const creds = credentials || configService.getConfig().twitter;
    
    if (!creds || !creds.username || !creds.password) {
      logService.error('Twitter credentials not provided or incomplete', 'twitter');
      return false;
    }
    
    // Initialize the Twitter scraper
    logService.info(`Initializing Twitter client for ${creds.username}...`, 'twitter');
    scraper = new Scraper();
    
    let loginAttempt = 1;
    const maxAttempts = 3;
    let loginError = null;
    
    // Try logging in with retries
    while (loginAttempt <= maxAttempts && !isLoggedIn) {
      try {
        logService.info(`Login attempt ${loginAttempt}/${maxAttempts}...`, 'twitter');
        await scraper.login(creds.username, creds.password, creds.email);
        
        // Verify login success
        isLoggedIn = await scraper.isLoggedIn();
        
        if (isLoggedIn) {
          logService.info('Login successful!', 'twitter');
          break; // Successfully logged in, exit the retry loop
        } else {
          // Try clearing cookies again and retry
          await scraper.clearCookies();
          loginAttempt++;
          logService.warn(`Login attempt ${loginAttempt}/${maxAttempts} failed, retrying...`, 'twitter');
        }
      } catch (err) {
        loginError = err;
        loginAttempt++;
        logService.error(`Login attempt ${loginAttempt}/${maxAttempts} failed with error: ${err.message}`, 'twitter');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retry
      }
    }
    
    if (!isLoggedIn) {
      throw loginError || new Error("Login failed - isLoggedIn returned false");
    }
    
    try {
      logService.info("Verifying login by getting profile...", 'twitter');
      const profile = await scraper.me();
      logService.info(`Successfully logged in as: ${profile.username}`, 'twitter');
      
      // Update credentials in config if login successful
      if (credentials) {
        configService.updateTwitterCredentials(credentials);
      }
      
      return true;
    } catch (profileError) {
      logService.error(`Error getting profile: ${profileError.message}`, 'twitter');
      throw new Error("Login succeeded but couldn't get profile: " + profileError.message);
    }
  } catch (error) {
    logService.error(`Error initializing Twitter: ${error.message}`, 'twitter');
    
    // Reset state on error
    isLoggedIn = false;
    
    throw error;
  }
};

/**
 * Get the current login status
 * @returns {boolean} Whether the user is logged in
 */
export const getLoginStatus = () => {
  return isLoggedIn;
};

/**
 * Get user tweets from a specific Twitter account
 * @param {string|object} accountHandle - Twitter handle or account object to fetch tweets from
 * @param {number} limit - Number of tweets to fetch
 * @returns {Array} List of tweet objects
 */
export const getUserTweets = async (accountHandle, limit = 10) => {
  if (!scraper || !isLoggedIn) {
    throw new Error('Not logged in to Twitter');
  }
  
  try {
    // Ensure accountHandle is a string
    const username = typeof accountHandle === 'object' 
      ? accountHandle.account || accountHandle.username 
      : accountHandle;
    
    if (!username || typeof username !== 'string') {
      throw new Error(`Invalid account handle: ${JSON.stringify(accountHandle)}`);
    }
    
    logService.info(`Fetching tweets from @${username}...`, 'twitter');
    
    // Debug profile information but don't rely on it to determine if tweets exist
    try {
      const profile = await scraper.getProfile(username);
      if (!profile) {
        logService.warn(`User profile not found for @${username}, but will still try to fetch tweets`, 'twitter');
      } else {
        // Log profile data for debugging
        const tweetCount = profile.tweetCount || profile.statuses_count || 'unknown';
        logService.info(`Profile for @${username} found, reported tweet count: ${tweetCount}`, 'twitter');
        
        // Log more profile details to debug what's available
        const profileKeys = Object.keys(profile).join(', ');
        logService.info(`Profile contains keys: ${profileKeys}`, 'twitter');
      }
    } catch (profileError) {
      logService.warn(`Could not verify profile for @${username}: ${profileError.message}, but will still try to fetch tweets`, 'twitter');
    }
    
    // Always try to fetch tweets, regardless of profile check
    logService.info(`Attempting to fetch tweets directly for @${username}...`, 'twitter');
    
    // The agent-twitter-client library expects getTweets to be called with just the username
    // and it returns an async generator that we need to consume
    const tweetGenerator = scraper.getTweets(username);
    const tweets = [];
    
    try {
      // Collect tweets up to the limit
      let count = 0;
      for await (const tweet of tweetGenerator) {
        tweets.push(tweet);
        count++;
        
        // Log details of the first tweet for debugging
        if (count === 1) {
          const tweetKeys = Object.keys(tweet).join(', ');
          logService.info(`First tweet contains keys: ${tweetKeys}`, 'twitter');
        }
        
        if (count >= limit) break;
      }
      
      if (tweets.length > 0) {
        logService.info(`Successfully found ${tweets.length} tweets from @${username}`, 'twitter');
      } else {
        logService.warn(`No tweets found for @${username} after direct attempt`, 'twitter');
      }
      
      return tweets;
    } catch (generatorError) {
      // Handle specific errors from the generator
      logService.error(`Error processing tweets from @${username}: ${generatorError.message}`, 'twitter');
      
      // Log additional details for debugging
      if (generatorError.response) {
        logService.error(`Response status: ${generatorError.response.status}`, 'twitter');
        logService.error(`Response data: ${JSON.stringify(generatorError.response.data || {})}`, 'twitter');
      }
      
      // Try an alternative approach - using the profile Timeline API if available
      try {
        logService.info(`Attempting alternative method to fetch tweets for @${username}...`, 'twitter');
        
        // Some versions of the library might have a getUserTimeline method
        if (typeof scraper.getUserTimeline === 'function') {
          const timeline = await scraper.getUserTimeline(username, { count: limit });
          if (timeline && timeline.length > 0) {
            logService.info(`Found ${timeline.length} tweets using alternative method`, 'twitter');
            return timeline;
          }
        }
      } catch (altError) {
        logService.error(`Alternative method also failed: ${altError.message}`, 'twitter');
      }
      
      // If no tweets found, return empty array instead of throwing
      logService.warn(`No tweets could be retrieved for @${username} after all attempts`, 'twitter');
      return [];
    }
  } catch (error) {
    // Handle general errors
    logService.error(`Error fetching tweets from @${username}: ${error.message}`, 'twitter');
    
    // Log additional details for debugging
    if (error.response) {
      logService.error(`Response status: ${error.response.status}`, 'twitter');
      logService.error(`Response data: ${JSON.stringify(error.response.data || {})}`, 'twitter');
    }
    
    // Always return an empty array instead of throwing to allow the process to continue
    return [];
  }
};

/**
 * Send a tweet with media
 * @param {Buffer} imageBuffer - Image data buffer
 * @param {string} mediaType - MIME type of the media
 * @param {string} text - Tweet text content
 */
export const sendTweetWithMedia = async (imageBuffer, mediaType, text) => {
  if (!scraper || !isLoggedIn) {
    throw new Error('Not logged in to Twitter');
  }
  
  try {
    logService.info("Posting tweet with media...", 'twitter');
    
    // Prepare media data
    const mediaData = [{
      data: imageBuffer,
      mediaType: mediaType
    }];
    
    // Send the tweet
    await scraper.sendTweet(text, undefined, mediaData);
    logService.info("Tweet posted successfully", 'twitter');
    return true;
  } catch (error) {
    logService.error("Error posting tweet: " + error.message, 'twitter');
    throw error;
  }
}; 