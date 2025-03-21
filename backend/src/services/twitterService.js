import { Scraper } from 'agent-twitter-client';
import * as configService from './configService.js';
import * as logService from './logService.js';

let scraper = null;
let isLoggedIn = false;
let needsReauthentication = false;
let lastActionTime = Date.now();
let loginAttemptCount = 0;

// Get a random delay between min and max milliseconds
const getRandomDelay = (min = 2000, max = 5000) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Add human-like delay between actions
const addHumanDelay = async () => {
  const now = Date.now();
  const timeSinceLastAction = now - lastActionTime;
  
  // If last action was very recent, add a delay
  if (timeSinceLastAction < 1000) {
    const delay = getRandomDelay(1500, 3500);
    logService.info(`Adding human-like delay of ${delay}ms between actions`, 'twitter');
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastActionTime = Date.now();
};

// Determine if error is related to Arkose Labs (bot detection)
const isArkoseError = (error) => {
  if (!error || !error.message) return false;
  
  return error.message.includes('ArkoseLogin') || 
         error.message.includes('arkose') || 
         error.message.includes('subtask') ||
         error.message.includes('captcha') || 
         error.message.includes('human verification');
};

/**
 * Initialize the Twitter service with credentials
 * @param {object} credentials - Twitter credentials (optional)
 * @returns {Promise<boolean>} Whether login was successful
 */
export const initialize = async (credentials = null) => {
  try {
    // Reset the reauthentication flag
    needsReauthentication = false;
    
    // Use provided credentials or load from config
    const creds = credentials || configService.getConfig().twitter;
    
    if (!creds || !creds.username || !creds.password) {
      logService.error('Twitter credentials not provided or incomplete', 'twitter');
      return false;
    }
    
    // Initialize the Twitter scraper
    logService.info(`Initializing Twitter client for ${creds.username}...`, 'twitter');
    
    // Create a new scraper instance
    scraper = new Scraper();
    
    // Increment global login attempt count to track repeated logins
    loginAttemptCount++;
    const currentLoginSession = loginAttemptCount;
    
    let loginAttempt = 1;
    const maxAttempts = 3;
    let loginError = null;
    
    // Try logging in with retries
    while (loginAttempt <= maxAttempts && !isLoggedIn) {
      try {
        logService.info(`Login attempt ${loginAttempt}/${maxAttempts}...`, 'twitter');
        
        // Add random delay before login to avoid rate limits - longer if this is a repeated session
        const initialDelay = currentLoginSession > 1 ? getRandomDelay(5000, 10000) : getRandomDelay(1000, 3000);
        await new Promise(resolve => setTimeout(resolve, initialDelay));
        
        // Use the login method
        await scraper.login(creds.username, creds.password, creds.email);
        
        // Verify login success
        isLoggedIn = await scraper.isLoggedIn();
        
        if (isLoggedIn) {
          logService.info('Login successful!', 'twitter');
          needsReauthentication = false;
          break; // Successfully logged in, exit the retry loop
        } else {
          // Try clearing cookies again and retry
          await scraper.clearCookies();
          loginAttempt++;
          
          // Add increasing delay between attempts
          const retryDelay = getRandomDelay(3000, 5000) * loginAttempt;
          logService.warn(`Login attempt ${loginAttempt}/${maxAttempts} failed, retrying after ${retryDelay}ms...`, 'twitter');
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } catch (err) {
        loginError = err;
        loginAttempt++;
        
        if (isArkoseError(err)) {
          logService.error(`Encountered Arkose Labs bot detection during login: ${err.message}`, 'twitter');
          logService.info('Attempting to bypass bot detection...', 'twitter');
          
          // Try to handle Arkose detection - clear cookies
          await scraper.clearCookies();
          
          // Add a longer delay to prevent rate limiting
          const arkoseDelay = getRandomDelay(8000, 15000);
          logService.info(`Waiting ${arkoseDelay}ms before next attempt...`, 'twitter');
          await new Promise(resolve => setTimeout(resolve, arkoseDelay));
        } else {
          logService.error(`Login attempt ${loginAttempt}/${maxAttempts} failed with error: ${err.message}`, 'twitter');
          await new Promise(resolve => setTimeout(resolve, getRandomDelay(2000, 4000))); // Wait before retry
        }
      }
    }
    
    if (!isLoggedIn) {
      if (isArkoseError(loginError)) {
        throw new Error(`Twitter bot detection triggered: ${loginError.message}. Manual login might be required.`);
      } else {
        throw loginError || new Error("Login failed - isLoggedIn returned false");
      }
    }
    
    try {
      logService.info("Verifying login by getting profile...", 'twitter');
      
      // Add delay before profile check
      await addHumanDelay();
      
      const profile = await scraper.me();
      
      // Added check for profile object structure
      if (!profile) {
        logService.warn("Profile information is empty, but login succeeded", 'twitter');
      } else {
        // Safely access username - it might be in different locations depending on API response
        const username = profile.username || 
                        (profile.user && profile.user.username) || 
                        profile.screen_name || 
                        creds.username || 
                        'unknown';
                        
        logService.info(`Successfully logged in as: ${username}`, 'twitter');
      }
      
      // Continue considering login successful even with profile issues
      isLoggedIn = true;
      
      // Update credentials in config if login successful
      if (credentials) {
        configService.updateTwitterCredentials(credentials);
      }
      
      return true;
    } catch (profileError) {
      logService.error(`Error getting profile: ${profileError.message}`, 'twitter');
      
      // Still consider the login successful even if we can't get the profile
      logService.warn("Continuing with login despite profile error", 'twitter');
      isLoggedIn = true;
      
      // Update credentials in config if login successful
      if (credentials) {
        configService.updateTwitterCredentials(credentials);
      }
      
      return true;
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
    // Add human-like delay before fetching tweets
    await addHumanDelay();
    
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
      await addHumanDelay(); // Add delay before profile check
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
      if (isArkoseError(profileError)) {
        logService.error(`Bot detection triggered when accessing profile for @${username}: ${profileError.message}`, 'twitter');
        needsReauthentication = true;
        return [];
      }
      
      logService.warn(`Could not verify profile for @${username}: ${profileError.message}, but will still try to fetch tweets`, 'twitter');
    }
    
    // Always try to fetch tweets, regardless of profile check
    logService.info(`Attempting to fetch tweets directly for @${username}...`, 'twitter');
    
    // Add delay before fetching tweets
    await addHumanDelay();
    
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
        
        // Add small random delay between fetching tweets to appear more human-like
        if (count % 3 === 0) {
          await new Promise(resolve => setTimeout(resolve, getRandomDelay(500, 1500)));
        }
      }
      
      if (tweets.length > 0) {
        logService.info(`Successfully found ${tweets.length} tweets from @${username}`, 'twitter');
      } else {
        logService.warn(`No tweets found for @${username} after direct attempt`, 'twitter');
      }
      
      return tweets;
    } catch (generatorError) {
      // Check for bot detection
      if (isArkoseError(generatorError)) {
        logService.error(`Bot detection triggered when fetching tweets from @${username}: ${generatorError.message}`, 'twitter');
        needsReauthentication = true;
        return [];
      }
      
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
        
        await addHumanDelay(); // Add delay before alternative method
        
        // Some versions of the library might have a getUserTimeline method
        if (typeof scraper.getUserTimeline === 'function') {
          const timeline = await scraper.getUserTimeline(username, { count: limit });
          if (timeline && timeline.length > 0) {
            logService.info(`Found ${timeline.length} tweets using alternative method`, 'twitter');
            return timeline;
          }
        }
      } catch (altError) {
        if (isArkoseError(altError)) {
          logService.error(`Bot detection triggered in alternative method for @${username}: ${altError.message}`, 'twitter');
          needsReauthentication = true;
          return [];
        }
        
        logService.error(`Alternative method also failed: ${altError.message}`, 'twitter');
      }
      
      // If no tweets found, return empty array instead of throwing
      logService.warn(`No tweets could be retrieved for @${username} after all attempts`, 'twitter');
      return [];
    }
  } catch (error) {
    // Check for bot detection
    if (isArkoseError(error)) {
      logService.error(`Bot detection triggered when fetching tweets: ${error.message}`, 'twitter');
      needsReauthentication = true;
      return [];
    }
    
    // Handle general errors
    logService.error(`Error fetching tweets from @${accountHandle}: ${error.message}`, 'twitter');
    
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
    // Add human-like delay before posting
    await addHumanDelay();
    
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
    if (isArkoseError(error)) {
      logService.error(`Bot detection triggered when posting tweet with media: ${error.message}`, 'twitter');
      needsReauthentication = true;
      throw new Error(`Twitter bot detection: ${error.message}. Manual action may be required.`);
    }
    
    logService.error("Error posting tweet: " + error.message, 'twitter');
    throw error;
  }
};

/**
 * Send a text-only tweet
 * @param {string} text - Tweet text content
 * @returns {Promise<boolean>} Whether the tweet was sent successfully
 */
export const sendTweet = async (text) => {
  if (!scraper || !isLoggedIn) {
    throw new Error('Not logged in to Twitter');
  }
  
  try {
    // Add human-like delay before posting
    await addHumanDelay();
    
    logService.info("Posting tweet...", 'twitter');
    await scraper.sendTweet(text);
    logService.info("Tweet posted successfully", 'twitter');
    return true;
  } catch (error) {
    if (isArkoseError(error)) {
      logService.error(`Bot detection triggered when posting tweet: ${error.message}`, 'twitter');
      needsReauthentication = true;
      throw new Error(`Twitter bot detection: ${error.message}. Manual action may be required.`);
    }
    
    // Check for authentication errors and set flags
    if (error.message.includes('authentication') || error.message.includes('login') || 
        error.message.includes('credentials') || error.message.includes('401') || 
        error.message.includes('403')) {
      needsReauthentication = true;
      logService.error(`Authentication error while posting tweet: ${error.message}`, 'twitter');
      throw new Error(`Twitter authentication error: ${error.message}. Please log in again.`);
    }
    
    logService.error("Error posting tweet: " + error.message, 'twitter');
    throw error;
  }
};

/**
 * Check if reauthentication is needed
 * @returns {boolean} Whether reauthentication is needed
 */
export const needsAuthentication = () => {
  return needsReauthentication || !isLoggedIn;
};

/**
 * Reset the authentication state after user is notified
 */
export const resetAuthenticationState = () => {
  needsReauthentication = false;
};

/**
 * Handle Arkose Labs bot detection
 * @returns {Promise<boolean>} Whether the handling was successful
 */
export const handleBotDetection = async () => {
  if (!scraper) return false;
  
  try {
    logService.info('Attempting to handle bot detection...', 'twitter');
    
    // Clear cookies
    await scraper.clearCookies();
    
    // Add a longer delay
    const delay = getRandomDelay(10000, 20000);
    logService.info(`Waiting ${delay}ms to avoid detection...`, 'twitter');
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return true;
  } catch (error) {
    logService.error(`Error handling bot detection: ${error.message}`, 'twitter');
    return false;
  }
}; 