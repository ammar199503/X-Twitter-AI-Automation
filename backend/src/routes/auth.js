import express from 'express';
import * as twitterService from '../services/twitterService.js';
import * as configService from '../services/configService.js';
import * as logService from '../services/logService.js';

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Login to Twitter
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      logService.warn(`Login attempt missing required fields`, 'auth');
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: username and password are required' 
      });
    }
    
    logService.info(`Login attempt for user: ${username}`, 'auth');
    
    try {
      await twitterService.initialize({ 
        username, 
        password, 
        email: email || '' // Make email optional
      });
      
      // Double-check login status after initialization
      const isLoggedIn = twitterService.getLoginStatus();
      
      if (!isLoggedIn) {
        logService.error(`Login failed for ${username} - Twitter rejected credentials`, 'auth');
        return res.status(401).json({
          success: false,
          error: 'Login failed - Twitter rejected credentials'
        });
      }
      
      logService.info(`Login successful for ${username}`, 'auth');
      res.json({ 
        success: true,
        message: 'Login successful'
      });
    } catch (loginError) {
      // Handle specific login errors
      logService.error(`Login process error for ${username}: ${loginError.message}`, 'auth');
      
      if (loginError.message.includes('Missing Twitter credentials')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid credentials format'
        });
      } else if (loginError.message.includes('captcha') || loginError.message.includes('verification')) {
        return res.status(403).json({
          success: false,
          error: 'Twitter requires captcha verification. Please try again later.'
        });
      } else {
        return res.status(401).json({
          success: false,
          error: loginError.message || 'Authentication failed'
        });
      }
    }
  } catch (error) {
    console.error('Login endpoint error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error during login process'
    });
  }
});

/**
 * @route GET /api/auth/status
 * @desc Check authentication status
 * @access Public
 */
router.get('/status', (req, res) => {
  const isLoggedIn = twitterService.getLoginStatus();
  res.json({ 
    isLoggedIn,
    username: isLoggedIn ? configService.getConfig().twitter.username : null
  });
});

/**
 * @route POST /api/auth/logout
 * @desc Logout from Twitter
 * @access Public
 */
router.post('/logout', async (req, res) => {
  try {
    // Currently, there's no explicit logout in the agent-twitter-client
    // This is a placeholder for future implementation
    res.json({ 
      success: true,
      message: 'Logout successful' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to logout'
    });
  }
});

/**
 * @route POST /api/auth/handle-detection
 * @desc Handle bot detection issues
 * @access Public
 */
router.post('/handle-detection', async (req, res) => {
  try {
    logService.info('Attempting to handle bot detection', 'auth');
    
    // Call the Twitter service method to handle bot detection
    const success = await twitterService.handleBotDetection();
    
    if (success) {
      logService.info('Bot detection handling completed successfully', 'auth');
      res.json({
        success: true,
        message: 'Bot detection handled. Please wait before trying to log in again.'
      });
    } else {
      logService.warn('Bot detection handling completed with unknown result', 'auth');
      res.json({
        success: true,
        message: 'Bot detection handling attempted. Please wait before trying to log in again.'
      });
    }
  } catch (error) {
    logService.error(`Error handling bot detection: ${error.message}`, 'auth');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to handle bot detection'
    });
  }
});

export default router; 