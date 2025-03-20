import { TwitterApi } from 'twitter-api-v2';
import * as logService from './logService.js';
import * as configService from './configService.js';

let client = null;

/**
 * Initialize the Twitter API service with credentials
 */
export const initialize = async () => {
  try {
    const config = configService.getConfig();
    
    if (!config.twitterApi || !config.twitterApi.apiKey || !config.twitterApi.apiSecret || 
        !config.twitterApi.accessToken || !config.twitterApi.accessSecret) {
      logService.error('Twitter API credentials not configured', 'twitter-api');
      return false;
    }
    
    // Initialize the Twitter client
    client = new TwitterApi({
      appKey: config.twitterApi.apiKey,
      appSecret: config.twitterApi.apiSecret,
      accessToken: config.twitterApi.accessToken,
      accessSecret: config.twitterApi.accessSecret,
    });
    
    logService.info('Twitter API client initialized', 'twitter-api');
    
    // Verify credentials
    const me = await client.v2.me();
    logService.info(`Successfully authenticated as: ${me.data.username}`, 'twitter-api');
    
    return true;
  } catch (error) {
    logService.error(`Error initializing Twitter API: ${error.message}`, 'twitter-api');
    return false;
  }
};

/**
 * Get tweets from a specific user
 * @param {string} username - Twitter username to fetch tweets from
 * @param {number} maxResults - Maximum number of tweets to fetch
 * @returns {Promise<Array>} List of tweets
 */
export const getUserTweets = async (username, maxResults = 10) => {
  try {
    if (!client) {
      await initialize();
    }
    
    logService.info(`Fetching tweets for user: ${username}`, 'twitter-api');
    
    // First get the user ID from username
    const user = await client.v2.userByUsername(username);
    if (!user.data) {
      throw new Error(`User not found: ${username}`);
    }
    
    const userId = user.data.id;
    
    // Fetch recent tweets excluding replies and retweets
    const tweets = await client.v2.userTimeline(userId, {
      max_results: maxResults,
      exclude: ['retweets', 'replies'],
      'tweet.fields': ['created_at', 'text', 'id'],
    });
    
    // Format tweets for our system
    const formattedTweets = tweets.data.data.map(tweet => ({
      id: tweet.id,
      text: tweet.text,
      author: username,
      url: `https://twitter.com/${username}/status/${tweet.id}`,
      created_at: tweet.created_at
    }));
    
    logService.info(`Found ${formattedTweets.length} tweets for ${username}`, 'twitter-api');
    return formattedTweets;
  } catch (error) {
    logService.error(`Error fetching tweets for ${username}: ${error.message}`, 'twitter-api');
    return [];
  }
};

/**
 * Send a tweet
 * @param {string} text - The tweet text
 * @returns {Promise<Object>} The posted tweet
 */
export const sendTweet = async (text) => {
  try {
    if (!client) {
      await initialize();
    }
    
    logService.info(`Posting tweet: ${text.substring(0, 30)}...`, 'twitter-api');
    
    // Truncate tweet if needed
    const tweetText = text.length > 280 ? text.substring(0, 277) + '...' : text;
    
    const result = await client.v2.tweet(tweetText);
    logService.info(`Tweet posted successfully, ID: ${result.data.id}`, 'twitter-api');
    
    return {
      success: true,
      id: result.data.id
    };
  } catch (error) {
    logService.error(`Error posting tweet: ${error.message}`, 'twitter-api');
    throw error;
  }
}; 