import OpenAI from 'openai';
import * as logService from './logService.js';
import * as configService from './configService.js';

let openai = null;

// Default configurations
const DEFAULT_CONFIG = {
  model: "gpt-4o-mini",
  temperature: 0.6,
  maxTokens: 4096,
  systemPrompt: `You are a skilled social media manager for a cryptocurrency news channel. Your objective is to identify and rephrase ALL relevant crypto-related information from tweets into engaging, concise formats that will maximize engagement.

GUIDELINES:
- Focus ONLY on cryptocurrency, blockchain, Web3, or major financial news that impacts crypto markets
- Add one or two non-crypto news from people like Elon Musk, Bill Gates, Donald Trump, etc, but make sure that the tweet genrerated is understandable by the average person.
- Ignore irrelevant content like giveaways, personal opinions
- Format each piece of content as a separate news announcement, not as a retweet
- Maintain factual accuracy while being concise
- Match the tone of a professional news organization
- Keep each response under 280 characters (Twitter limit)
- Do not create more than 15 tweets.
- If many users are reporting the same thing, do not create multiple tweets for same news.
- Add relevant hashtags like #Crypto #Bitcoin where appropriate, but limit to 2-3 hashtags maximum per tweet
- Return ALL relevant news items, not just the most important one
- You can also use influencer's claims from the tweets and post them as news. Example: @DrProfitCrypto says: "Predicted the crash at $90,000, Predicted $83,000 to be next, Predicted $76,000 to be next, now saying 74,000 is next."
- You can tweet above Example as news like this: "DrProfitCrypto says he prdicted the crash from $90,000 and now predicts $74,000 for Bitcoin, Do you guys agree? -Yes -No #Crypto #Bitcoin #BitcoinNews"
- Always use relevent Crypto token tickers instead of full names. Example: $BTC for Bitcoin, $ETH for Ethereum, $BNB for Binance Coin, $USDT for Tether, $XRP for XRP, $SOL for Solana, $DOGE for Dogecoin, $LTC for Litecoin, $DOT for Polkadot, $MATIC for Polygon.
- Examine all tweets to see if overall influencer feeling are bullish or bearish and generate one tweet from your own intelligence and reasoning. Example: If you see bearish content more generate a tweet like "Overall my twitter/X feed seems bearish. Do you guys agree with this? Comment YES or NO." If you see bullish content more generate a tweet like "Overall my twitter/X feed seems bullish. Do you guys agree with this? Comment YES or NO." If you see sideways content more generate a tweet like "Overall my twitter/X feed seems to say market is sideways. Do you guys agree with this? Comment YES or NO."
- If no tweets contain relevant crypto news or something interesting, respond with "No relevant crypto news found in these tweets."
- Format multiple tweets with "---" between them`,
  userPromptTemplate: `As a crypto news social media manager, review these tweets from influencers and identify ALL relevant crypto news items. Rephrase each one as a concise, engaging news tweet:

{tweets}

Remember: Select ALL relevant crypto/financial news and interesting content, ignore giveaways or non-news content, keep each tweet under 280 characters, and only include attribution when posting someone's personal acheivements or claims.`
};

// Export DEFAULT_CONFIG so it can be used by other modules
export { DEFAULT_CONFIG };

/**
 * Initialize the OpenAI service with API key
 */
export const initialize = async () => {
  try {
    const config = configService.getConfig();
    
    if (!config.openai || !config.openai.apiKey) {
      logService.error('OpenAI API key not configured', 'openai');
      return false;
    }
    
    openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    
    logService.info('OpenAI service initialized', 'openai');
    return true;
  } catch (error) {
    logService.error(`Error initializing OpenAI: ${error.message}`, 'openai');
    return false;
  }
};

/**
 * Get OpenAI configuration with defaults
 * @returns {object} OpenAI configuration
 */
const getOpenAIConfig = () => {
  const config = configService.getConfig();
  
  // Get configuration values with fallbacks to defaults
  const model = config.openai?.model || DEFAULT_CONFIG.model;
  const temperature = config.openai?.temperature || DEFAULT_CONFIG.temperature;
  const systemPrompt = config.openai?.systemPrompt || DEFAULT_CONFIG.systemPrompt;
  const userPromptTemplate = config.openai?.userPromptTemplate || DEFAULT_CONFIG.userPromptTemplate;
  
  // Ensure maxTokens is within model limits
  let maxTokens = config.openai?.maxTokens || DEFAULT_CONFIG.maxTokens;
  
  // Enforce maximum token limits based on model
  const MODEL_TOKEN_LIMITS = {
    'gpt-4': 8192,
    'gpt-4o': 16384,
    'gpt-4o-mini': 16384
  };
  
  // Default to 4000 if we don't know the model's limit
  const modelLimit = MODEL_TOKEN_LIMITS[model] || 4000;
  
  // Cap at 50% of the model's limit to leave room for input tokens
  // This allows more output tokens while still ensuring there's room for inputs
  const safeMaxTokens = Math.min(maxTokens, Math.floor(modelLimit * 0.5));
  
  // If we capped the tokens, log this for transparency
  if (safeMaxTokens < maxTokens) {
    logService.info(`User requested ${maxTokens} tokens, but capped at ${safeMaxTokens} tokens (50% of ${model}'s ${modelLimit} token limit) to leave room for input`, 'openai');
  }
  
  return {
    model,
    temperature,
    maxTokens: safeMaxTokens,
    systemPrompt,
    userPromptTemplate
  };
};

/**
 * Process a batch of tweets and select the most relevant for crypto news
 * @param {Array} tweets - Array of tweet objects with text and author
 * @returns {Promise<string>} Selected and rephrased tweet text
 */
export const processTweetBatch = async (tweets) => {
  if (!openai) {
    const initialized = await initialize();
    if (!initialized) {
      throw new Error('OpenAI service not initialized');
    }
  }
  
  try {
    const openaiConfig = getOpenAIConfig();
    
    // Format tweets for the prompt
    const tweetTexts = tweets.map(tweet => `@${tweet.author} says: ${tweet.text}`).join('\n\n');
    
    // Create user prompt with template
    const userPrompt = openaiConfig.userPromptTemplate.replace('{tweets}', tweetTexts);
    
    logService.info(`Processing batch of ${tweets.length} tweets for crypto news relevance`, 'openai');
    logService.info(`Using model: ${openaiConfig.model}, max tokens: ${openaiConfig.maxTokens}`, 'openai');
    
    const response = await openai.chat.completions.create({
      model: openaiConfig.model,
      messages: [
        { role: "system", content: openaiConfig.systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: openaiConfig.maxTokens,
      temperature: openaiConfig.temperature,
    });
    
    if (response.choices && response.choices.length > 0) {
      const rephrased = response.choices[0].message.content.trim();
      
      // Check if OpenAI found any relevant news
      // Only consider it "no news" if that's the ENTIRE response or the only meaningful part
      if (rephrased === "No relevant crypto news found in these tweets." || 
          rephrased === "No relevant crypto news found in these tweets" ||
          (rephrased.length < 100 && rephrased.includes("No relevant crypto news"))) {
        logService.info('No relevant crypto news found in batch', 'openai');
        return null;
      }
      
      // Split multiple tweets by the separator
      const tweets = rephrased.split('---').map(tweet => tweet.trim()).filter(tweet => tweet);
      
      // Filter out any tweet that only says "No relevant crypto news" 
      const filteredTweets = tweets.filter(tweet => 
        !tweet.match(/^No relevant crypto news found in these tweets\.?$/));
      
      logService.info(`Successfully processed ${filteredTweets.length} relevant tweets`, 'openai');
      return filteredTweets.length > 0 ? filteredTweets : null;
    } else {
      throw new Error('No rephrased content received from OpenAI');
    }
  } catch (error) {
    logService.error(`Error processing tweets: ${error.message}`, 'openai');
    throw error;
  }
};

/**
 * Rephrase a single tweet (legacy function, kept for compatibility)
 * @param {string} tweetText - Original tweet text
 * @param {string} author - Author of the original tweet
 * @returns {Promise<string>} Rephrased tweet text
 */
export const rephraseTweet = async (tweetText, author) => {
  if (!openai) {
    const initialized = await initialize();
    if (!initialized) {
      throw new Error('OpenAI service not initialized');
    }
  }
  
  try {
    const openaiConfig = getOpenAIConfig();
    
    // Create user prompt with template for single tweet
    const userPrompt = openaiConfig.userPromptTemplate.replace('{tweets}', `@${author} says: "${tweetText}"`);
    
    logService.info(`Rephrasing tweet from ${author}`, 'openai');
    
    const response = await openai.chat.completions.create({
      model: openaiConfig.model,
      messages: [
        { role: "system", content: openaiConfig.systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: openaiConfig.maxTokens,
      temperature: openaiConfig.temperature,
    });
    
    if (response.choices && response.choices.length > 0) {
      const rephrased = response.choices[0].message.content.trim();
      
      // Check if OpenAI decided this isn't relevant crypto news
      // Only consider it "no news" if that's the ENTIRE response or the only meaningful part
      if (rephrased === "No relevant crypto news found in these tweets." || 
          rephrased === "No relevant crypto news found in these tweets" ||
          (rephrased.length < 100 && rephrased.includes("No relevant crypto news"))) {
        logService.info(`Tweet not relevant for crypto news: @${author}`, 'openai');
        return null; // Return null to indicate this tweet should be skipped
      }
      
      logService.info(`Successfully rephrased tweet: ${rephrased.substring(0, 50)}...`, 'openai');
      return rephrased;
    } else {
      throw new Error('No rephrased content received from OpenAI');
    }
  } catch (error) {
    logService.error(`Error rephrasing tweet: ${error.message}`, 'openai');
    throw error;
  }
}; 