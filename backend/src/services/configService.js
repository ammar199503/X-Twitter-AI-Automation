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
  twitterApi: {
    apiKey: process.env.TWITTER_API_KEY || '',
    apiSecret: process.env.TWITTER_API_SECRET || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
    bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
  },
  targetAccounts: [],
  pinnedTweetIds: {},
  delays: {
    minDelay: parseInt(process.env.MIN_DELAY || '200'),
    maxDelay: parseInt(process.env.MAX_DELAY || '300')
  },
  tweetsPerAccount: parseInt(process.env.TWEETS_PER_ACCOUNT || '10'),
  tweetText: process.env.TWEET_TEXT_CONTENT || '#aixbt_agent_2',
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    personalityPrompt: process.env.OPENAI_PERSONALITY_PROMPT || "You are a thoughtful social media manager who rephrases tweets to be more engaging while maintaining the original meaning."
  }
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
  
  // Twitter API credentials
  if (process.env.TWITTER_API_KEY) config.twitterApi.apiKey = process.env.TWITTER_API_KEY;
  if (process.env.TWITTER_API_SECRET) config.twitterApi.apiSecret = process.env.TWITTER_API_SECRET;
  if (process.env.TWITTER_ACCESS_TOKEN) config.twitterApi.accessToken = process.env.TWITTER_ACCESS_TOKEN;
  if (process.env.TWITTER_ACCESS_SECRET) config.twitterApi.accessSecret = process.env.TWITTER_ACCESS_SECRET;
  if (process.env.TWITTER_BEARER_TOKEN) config.twitterApi.bearerToken = process.env.TWITTER_BEARER_TOKEN;
  
  if (process.env.TARGET_ACCOUNTS) {
    config.targetAccounts = process.env.TARGET_ACCOUNTS.split(',').map(a => a.trim());
  }
  
  if (process.env.MIN_DELAY) config.delays.minDelay = parseInt(process.env.MIN_DELAY);
  if (process.env.MAX_DELAY) config.delays.maxDelay = parseInt(process.env.MAX_DELAY);
  
  if (process.env.TWEETS_PER_ACCOUNT) {
    config.tweetsPerAccount = parseInt(process.env.TWEETS_PER_ACCOUNT);
  }
  
  if (process.env.TWEET_TEXT_CONTENT) config.tweetText = process.env.TWEET_TEXT_CONTENT;
  
  // OpenAI configuration
  if (process.env.OPENAI_API_KEY) config.openai.apiKey = process.env.OPENAI_API_KEY;
  if (process.env.OPENAI_MODEL) config.openai.model = process.env.OPENAI_MODEL;
  if (process.env.OPENAI_TEMPERATURE) config.openai.temperature = parseFloat(process.env.OPENAI_TEMPERATURE);
  if (process.env.OPENAI_PERSONALITY_PROMPT) config.openai.personalityPrompt = process.env.OPENAI_PERSONALITY_PROMPT;
  
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
  
  return config;
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
  return { ...config };
};

/**
 * Update target accounts
 * @param {string[]} accounts - Array of Twitter account handles
 */
export const updateTargetAccounts = (accounts) => {
  if (Array.isArray(accounts)) {
    config.targetAccounts = accounts;
  }
  return { ...config };
};

/**
 * Add a pinned tweet ID for an account
 * @param {string} account - Twitter account handle
 * @param {string} tweetId - Pinned tweet ID to skip
 */
export const addPinnedTweetId = (account, tweetId) => {
  config.pinnedTweetIds[account] = tweetId;
  return { ...config };
};

/**
 * Remove a pinned tweet ID for an account
 * @param {string} account - Twitter account handle
 */
export const removePinnedTweetId = (account) => {
  delete config.pinnedTweetIds[account];
  return { ...config };
};

/**
 * Update delay settings
 * @param {object} delays - Delay settings
 */
export const updateDelays = (delays) => {
  if (delays.minDelay) config.delays.minDelay = parseInt(delays.minDelay);
  if (delays.maxDelay) config.delays.maxDelay = parseInt(delays.maxDelay);
  return { ...config };
};

/**
 * Update tweet text content
 * @param {string} text - Text content for tweets
 */
export const updateTweetText = (text) => {
  config.tweetText = text;
  return { ...config };
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
  return { ...config };
};

/**
 * Update OpenAI configuration
 * @param {object} openaiConfig - OpenAI configuration options
 * @returns {object} Updated config
 */
export const updateOpenAIConfig = (openaiConfig) => {
  if (openaiConfig.apiKey) config.openai.apiKey = openaiConfig.apiKey;
  if (openaiConfig.model) config.openai.model = openaiConfig.model;
  if (openaiConfig.temperature !== undefined) config.openai.temperature = parseFloat(openaiConfig.temperature);
  if (openaiConfig.maxTokens !== undefined) config.openai.maxTokens = parseInt(openaiConfig.maxTokens);
  if (openaiConfig.systemPrompt) config.openai.systemPrompt = openaiConfig.systemPrompt;
  if (openaiConfig.userPromptTemplate) config.openai.userPromptTemplate = openaiConfig.userPromptTemplate;
  // For backward compatibility
  if (openaiConfig.personalityPrompt) config.openai.personalityPrompt = openaiConfig.personalityPrompt;
  
  return { ...config };
};

/**
 * Update Twitter API configuration
 * @param {object} twitterApiConfig - Twitter API configuration options
 * @returns {object} Updated config
 */
export const updateTwitterApiConfig = (twitterApiConfig) => {
  if (twitterApiConfig.apiKey) config.twitterApi.apiKey = twitterApiConfig.apiKey;
  if (twitterApiConfig.apiSecret) config.twitterApi.apiSecret = twitterApiConfig.apiSecret;
  if (twitterApiConfig.accessToken) config.twitterApi.accessToken = twitterApiConfig.accessToken;
  if (twitterApiConfig.accessSecret) config.twitterApi.accessSecret = twitterApiConfig.accessSecret;
  if (twitterApiConfig.bearerToken) config.twitterApi.bearerToken = twitterApiConfig.bearerToken;
  
  return { ...config };
}; 