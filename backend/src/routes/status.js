import express from 'express';
import * as twitterService from '../services/twitterService.js';
import * as scrapingService from '../services/scrapingService.js';
import * as configService from '../services/configService.js';
import * as logService from '../services/logService.js';
import { loadProcessedLinks } from '../utils/fileUtils.js';

const router = express.Router();

/**
 * @route GET /api/status
 * @desc Get application status
 * @access Public
 */
router.get('/', (req, res) => {
  try {
    const config = configService.getConfig();
    const scraperStatus = scrapingService.getStatus();
    const twitterStatus = {
      isLoggedIn: twitterService.getLoginStatus(),
      needsAuthentication: twitterService.needsAuthentication(),
      username: config.twitter.username
    };
    
    // Get configured target accounts
    const targetAccounts = config.targetAccounts || [];
    
    res.json({
      success: true,
      status: {
        scraper: scraperStatus,
        twitter: twitterStatus,
        targetAccounts,
        twitterLoggedIn: twitterService.getLoginStatus(),
        isLoggedIn: twitterService.getLoginStatus(),
        username: config.twitter.username,
        isRunning: scraperStatus.isRunning,
        delays: {
          min: config.delays.minDelay,
          max: config.delays.maxDelay,
          minDelay: config.delays.minDelay,
          maxDelay: config.delays.maxDelay
        }
      }
    });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get status'
    });
  }
});

/**
 * @route POST /api/status/resume
 * @desc Resume the scraping process
 * @access Public
 */
router.post('/resume', async (req, res) => {
  try {
    const result = await scrapingService.resumeScraping();
    
    if (result) {
      res.json({
        success: true,
        message: 'Scraping resumed',
        status: scrapingService.getStatus()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Could not resume scraping',
        status: scrapingService.getStatus()
      });
    }
  } catch (error) {
    console.error('Error resuming scraping:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resume scraping'
    });
  }
});

/**
 * @route POST /api/status/pause
 * @desc Pause the scraping process
 * @access Public
 */
router.post('/pause', (req, res) => {
  try {
    const { reason } = req.body;
    const result = scrapingService.pauseScraping(reason || 'User requested pause');
    
    if (result) {
      res.json({
        success: true,
        message: 'Scraping paused',
        status: scrapingService.getStatus()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Could not pause scraping',
        status: scrapingService.getStatus()
      });
    }
  } catch (error) {
    console.error('Error pausing scraping:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to pause scraping'
    });
  }
});

/**
 * @route POST /api/status/reauthenticate
 * @desc Handle reauthentication request
 * @access Public
 */
router.post('/reauthenticate', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    // Store the new credentials in config
    configService.updateTwitterCredentials({
      username,
      password,
      email
    });
    
    // Reinitialize the Twitter service with the new credentials
    const success = await twitterService.initialize({
      username,
      password,
      email
    });
    
    if (success) {
      logService.info('Successfully reauthenticated with Twitter', 'system');
      
      // If scraping was paused for authentication, try to resume it
      if (scrapingService.getStatus().isPaused && 
          scrapingService.getStatus().pauseReason.includes('Authentication')) {
        await scrapingService.resumeScraping();
      }
      
      res.json({
        success: true,
        message: 'Reauthentication successful',
        status: {
          scraper: scrapingService.getStatus(),
          twitter: {
            isLoggedIn: twitterService.getLoginStatus(),
            needsAuthentication: twitterService.needsAuthentication(),
            username
          }
        }
      });
    } else {
      logService.error('Failed to reauthenticate with Twitter', 'system');
      res.status(400).json({
        success: false,
        error: 'Twitter authentication failed',
        status: {
          scraper: scrapingService.getStatus(),
          twitter: {
            isLoggedIn: twitterService.getLoginStatus(),
            needsAuthentication: twitterService.needsAuthentication()
          }
        }
      });
    }
  } catch (error) {
    console.error('Error during reauthentication:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reauthenticate'
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