import express from 'express';
import * as twitterService from '../services/twitterService.js';
import * as scrapingService from '../services/scrapingService.js';
import * as configService from '../services/configService.js';
import { loadProcessedLinks } from '../utils/fileUtils.js';

const router = express.Router();

/**
 * @route GET /api/status
 * @desc Get the overall application status
 * @access Public
 */
router.get('/', (req, res) => {
  try {
    const config = configService.getConfig();
    const scrapingStatus = scrapingService.getStatus();
    const processedLinks = loadProcessedLinks(true);
    
    // Ensure delays are formatted with both property naming conventions
    const delays = {
      min: config.delays.minDelay,
      max: config.delays.maxDelay,
      minDelay: config.delays.minDelay,
      maxDelay: config.delays.maxDelay
    };
    
    res.json({
      success: true,
      status: {
        isLoggedIn: twitterService.getLoginStatus(),
        username: config.twitter.username,
        isRunning: scrapingStatus.isRunning,
        targetAccounts: config.targetAccounts,
        processedCount: processedLinks.size,
        tweetText: config.tweetText,
        delays: delays,
        tweetsPerAccount: config.tweetsPerAccount
      }
    });
  } catch (error) {
    console.error('Error getting application status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get application status'
    });
  }
});

/**
 * @route GET /api/status/twitter
 * @desc Get Twitter-specific status
 * @access Public
 */
router.get('/twitter', (req, res) => {
  try {
    res.json({
      success: true,
      isLoggedIn: twitterService.getLoginStatus(),
      username: configService.getConfig().twitter.username
    });
  } catch (error) {
    console.error('Error getting Twitter status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get Twitter status'
    });
  }
});

/**
 * @route GET /api/status/scraper
 * @desc Get scraper-specific status
 * @access Public
 */
router.get('/scraper', (req, res) => {
  try {
    const status = scrapingService.getStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Error getting scraper status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get scraper status'
    });
  }
});

export default router; 