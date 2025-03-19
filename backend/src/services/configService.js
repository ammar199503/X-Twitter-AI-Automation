import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

// In-memory configuration store with defaults
let config = {
  twitter: {
    username: process.env.TWITTER_USERNAME || '',
    password: process.env.TWITTER_PASSWORD || '',
    email: process.env.TWITTER_EMAIL || ''
  },
  targetAccounts: [],
  pinnedTweetIds: {},
  delays: {
    minDelay: parseInt(process.env.MIN_DELAY || '200'),
    maxDelay: parseInt(process.env.MAX_DELAY || '300')
  },
  tweetsPerAccount: parseInt(process.env.TWEETS_PER_ACCOUNT || '10'),
  tweetText: process.env.TWEET_TEXT_CONTENT || '#aixbt_agent_2'
};

// Parse pinned tweet IDs from environment
if (process.env.PINNED_TWEET_IDS) {
  const pinnedIds = process.env.PINNED_TWEET_IDS.split(',');
  pinnedIds.forEach(pair => {
    if (pair.includes('=')) {
      const [account, tweetId] = pair.split('=');
      config.pinnedTweetIds[account.trim()] = tweetId.trim();
    }
  });
}

/**
 * Initialize configuration by loading from .env
 */
export const initConfig = () => {
  // Reload .env file
  dotenv.config();
  
  // Update configuration from environment variables
  if (process.env.TWITTER_USERNAME) config.twitter.username = process.env.TWITTER_USERNAME;
  if (process.env.TWITTER_PASSWORD) config.twitter.password = process.env.TWITTER_PASSWORD;
  if (process.env.TWITTER_EMAIL) config.twitter.email = process.env.TWITTER_EMAIL;
  
  if (process.env.TARGET_ACCOUNTS) {
    config.targetAccounts = process.env.TARGET_ACCOUNTS.split(',').map(a => a.trim());
  }
  
  if (process.env.MIN_DELAY) config.delays.minDelay = parseInt(process.env.MIN_DELAY);
  if (process.env.MAX_DELAY) config.delays.maxDelay = parseInt(process.env.MAX_DELAY);
  
  if (process.env.TWEETS_PER_ACCOUNT) {
    config.tweetsPerAccount = parseInt(process.env.TWEETS_PER_ACCOUNT);
  }
  
  if (process.env.TWEET_TEXT_CONTENT) config.tweetText = process.env.TWEET_TEXT_CONTENT;
  
  // Parse pinned tweet IDs
  config.pinnedTweetIds = {};
  if (process.env.PINNED_TWEET_IDS) {
    const pinnedIds = process.env.PINNED_TWEET_IDS.split(',');
    pinnedIds.forEach(pair => {
      if (pair.includes('=')) {
        const [account, tweetId] = pair.split('=');
        config.pinnedTweetIds[account.trim()] = tweetId.trim();
      }
    });
  }
  
  console.log('Configuration initialized from environment variables');
};

/**
 * Get the current configuration
 * @returns {object} Current configuration
 */
export const getConfig = () => {
  return { ...config };
};

/**
 * Update Twitter credentials
 * @param {object} credentials - Twitter login credentials
 */
export const updateTwitterCredentials = (credentials) => {
  if (credentials.username) config.twitter.username = credentials.username;
  if (credentials.password) config.twitter.password = credentials.password;
  if (credentials.email) config.twitter.email = credentials.email;
};

/**
 * Update target accounts
 * @param {string[]} accounts - Array of Twitter account handles
 */
export const updateTargetAccounts = (accounts) => {
  if (Array.isArray(accounts)) {
    config.targetAccounts = accounts;
  }
};

/**
 * Add a pinned tweet ID for an account
 * @param {string} account - Twitter account handle
 * @param {string} tweetId - Pinned tweet ID to skip
 */
export const addPinnedTweetId = (account, tweetId) => {
  config.pinnedTweetIds[account] = tweetId;
};

/**
 * Remove a pinned tweet ID for an account
 * @param {string} account - Twitter account handle
 */
export const removePinnedTweetId = (account) => {
  delete config.pinnedTweetIds[account];
};

/**
 * Update delay settings
 * @param {object} delays - Delay settings
 */
export const updateDelays = (delays) => {
  if (delays.minDelay) config.delays.minDelay = parseInt(delays.minDelay);
  if (delays.maxDelay) config.delays.maxDelay = parseInt(delays.maxDelay);
};

/**
 * Update tweet text content
 * @param {string} text - Text content for tweets
 */
export const updateTweetText = (text) => {
  config.tweetText = text;
};

/**
 * Update tweets per account setting
 * @param {number} count - Number of tweets to fetch per account
 * @returns {object} Updated configuration
 */
export const updateTweetsPerAccount = (count) => {
  if (typeof count !== 'number' || count < 1) {
    throw new Error('Tweets per account must be a positive number');
  }
  
  config.tweetsPerAccount = count;
  return config;
}; 