import OpenAI from 'openai';
import * as logService from './logService.js';
import * as configService from './configService.js';

let openai = null;

// Default configurations
const DEFAULT_CONFIG = {
  model: "gpt-3.5-turbo",
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: `You are a skilled social media manager for a cryptocurrency news channel. Your objective is to identify and rephrase ALL relevant crypto-related information from tweets into engaging, concise formats that will maximize engagement.

GUIDELINES:
- Focus ONLY on cryptocurrency, blockchain, Web3, or major financial news that impacts crypto markets
- Ignore irrelevant content like giveaways, personal opinions, or non-news items
- Format each piece of content as a separate news announcement, not as a retweet
- Maintain factual accuracy while being concise
- Match the tone of a professional news organization
- Keep each response under 280 characters (Twitter limit)
- Add relevant hashtags like #Crypto #Bitcoin where appropriate, but limit to 2-3 hashtags maximum per tweet
- Return ALL relevant news items, not just the most important one
- You can also use influencer's claims from the tweets and post them as news. Example: @DrProfitCrypto says: "Predicted the crash at $90,000, Predicted $83,000 to be next, Predicted $76,000 to be next, now saying 74,000 is next."
- You can tweet above Example as news like this: "DrProfitCrypto says he prdicted the crash from $90,000 and now predicts $74,000 for Bitcoin, Do you guys agree? -Yes -No #Crypto #Bitcoin #BitcoinNews"
- Whenever adding attribution, make sure to tag the influencer. Example: "@DrProfitCrypto says he predicted the crash from $90,000 and now predicts $74,000 for Bitcoin, Do you guys agree? -Yes -No #Crypto #Bitcoin #BitcoinNews"
- Always use relevent Crypto token tickers instead of full names. Example: $BTC for Bitcoin, $ETH for Ethereum, $BNB for Binance Coin, $USDT for Tether, $XRP for XRP, $SOL for Solana, $DOGE for Dogecoin, $LTC for Litecoin, $DOT for Polkadot, $MATIC for Polygon.
- If no tweets contain relevant crypto news, respond with "No relevant crypto news found in these tweets."
- Format multiple tweets with "---" between them`,
  userPromptTemplate: `As a crypto news social media manager, review these tweets from influencers and identify ALL relevant crypto news items. Rephrase each one as a concise, engaging news tweet:

{tweets}

Remember: Select ALL relevant crypto/financial news, ignore giveaways or non-news content, keep each tweet under 280 characters, and only include attribution when posting someone's personal acheivements or claims.`
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
  return {
    model: config.openai?.model || DEFAULT_CONFIG.model,
    temperature: config.openai?.temperature || DEFAULT_CONFIG.temperature,
    maxTokens: config.openai?.maxTokens || DEFAULT_CONFIG.maxTokens,
    systemPrompt: config.openai?.systemPrompt || DEFAULT_CONFIG.systemPrompt,
    userPromptTemplate: config.openai?.userPromptTemplate || DEFAULT_CONFIG.userPromptTemplate
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
      if (rephrased.includes("No relevant crypto news")) {
        logService.info('No relevant crypto news found in batch', 'openai');
        return null;
      }
      
      // Split multiple tweets by the separator
      const tweets = rephrased.split('---').map(tweet => tweet.trim()).filter(tweet => tweet);
      logService.info(`Successfully processed ${tweets.length} relevant tweets`, 'openai');
      return tweets;
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
      if (rephrased.includes("No relevant crypto news")) {
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