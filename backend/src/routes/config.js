import express from 'express';
import * as configService from '../services/configService.js';

const router = express.Router();

/**
 * @route GET /api/config
 * @desc Get current configuration
 * @access Public
 */
router.get('/', (req, res) => {
  try {
    const config = configService.getConfig();
    
    // Remove sensitive data
    const sanitizedConfig = {
      ...config,
      twitter: {
        username: config.twitter.username,
        // Don't send password or email
      }
    };
    
    res.json({
      success: true,
      config: sanitizedConfig
    });
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get configuration'
    });
  }
});

/**
 * @route PUT /api/config/target-accounts
 * @desc Update target accounts
 * @access Public
 */
router.put('/target-accounts', (req, res) => {
  try {
    const { accounts } = req.body;
    
    if (!Array.isArray(accounts)) {
      return res.status(400).json({
        success: false,
        error: 'Accounts must be an array'
      });
    }
    
    configService.updateTargetAccounts(accounts);
    
    res.json({
      success: true,
      message: 'Target accounts updated',
      accounts: configService.getConfig().targetAccounts
    });
  } catch (error) {
    console.error('Error updating target accounts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update target accounts'
    });
  }
});

/**
 * @route PUT /api/config/pinned-tweets
 * @desc Update pinned tweet IDs
 * @access Public
 */
router.put('/pinned-tweets', (req, res) => {
  try {
    const { pinnedTweets } = req.body;
    
    if (typeof pinnedTweets !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Pinned tweets must be an object'
      });
    }
    
    // Clear existing pinned tweets
    const config = configService.getConfig();
    Object.keys(config.pinnedTweetIds).forEach(account => {
      configService.removePinnedTweetId(account);
    });
    
    // Add new pinned tweets
    Object.entries(pinnedTweets).forEach(([account, tweetId]) => {
      configService.addPinnedTweetId(account, tweetId);
    });
    
    res.json({
      success: true,
      message: 'Pinned tweet IDs updated',
      pinnedTweetIds: configService.getConfig().pinnedTweetIds
    });
  } catch (error) {
    console.error('Error updating pinned tweet IDs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update pinned tweet IDs'
    });
  }
});

/**
 * @route PUT /api/config/delays
 * @desc Update delay settings
 * @access Public
 */
router.put('/delays', (req, res) => {
  try {
    const { minDelay, maxDelay } = req.body;
    
    if (minDelay === undefined || maxDelay === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Both minDelay and maxDelay are required'
      });
    }
    
    if (parseInt(minDelay) >= parseInt(maxDelay)) {
      return res.status(400).json({
        success: false,
        error: 'maxDelay must be greater than minDelay'
      });
    }
    
    configService.updateDelays({ minDelay, maxDelay });
    
    res.json({
      success: true,
      message: 'Delay settings updated',
      delays: configService.getConfig().delays
    });
  } catch (error) {
    console.error('Error updating delay settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update delay settings'
    });
  }
});

/**
 * @route PUT /api/config/tweet-text
 * @desc Update tweet text
 * @access Public
 */
router.put('/tweet-text', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Tweet text is required'
      });
    }
    
    configService.updateTweetText(text);
    
    res.json({
      success: true,
      message: 'Tweet text updated',
      tweetText: configService.getConfig().tweetText
    });
  } catch (error) {
    console.error('Error updating tweet text:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update tweet text'
    });
  }
});

/**
 * @route PUT /api/config/tweets-per-account
 * @desc Update tweets per account setting
 * @access Public
 */
router.put('/tweets-per-account', (req, res) => {
  try {
    const { count } = req.body;
    
    if (!count || typeof count !== 'number' || count < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tweets per account value. Must be a positive number.'
      });
    }
    
    configService.updateTweetsPerAccount(count);
    
    res.json({
      success: true,
      message: 'Tweets per account updated successfully',
      config: configService.getConfig()
    });
  } catch (error) {
    console.error('Error updating tweets per account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update tweets per account'
    });
  }
});

/**
 * @route GET /api/config/target-accounts
 * @desc Get all target accounts
 * @access Public
 */
router.get('/target-accounts', (req, res) => {
  try {
    const config = configService.getConfig();
    res.json({
      success: true,
      accounts: config.targetAccounts || []
    });
  } catch (error) {
    console.error('Error getting target accounts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get target accounts'
    });
  }
});

/**
 * @route POST /api/config/target-accounts
 * @desc Add a new target account
 * @access Public
 */
router.post('/target-accounts', (req, res) => {
  try {
    const { account, pinnedTweetId } = req.body;
    
    if (!account) {
      return res.status(400).json({
        success: false,
        error: 'Account name is required'
      });
    }
    
    const config = configService.getConfig();
    const existingAccounts = config.targetAccounts || [];
    
    // Check if account already exists
    if (existingAccounts.some(a => a.account === account)) {
      return res.status(400).json({
        success: false,
        error: 'Account already exists'
      });
    }
    
    // Add new account
    const updatedAccounts = [
      ...existingAccounts, 
      { account, pinnedTweetId: pinnedTweetId || '' }
    ];
    
    configService.updateTargetAccounts(updatedAccounts);
    
    // If pinned tweet ID is provided, update that as well
    if (pinnedTweetId) {
      configService.addPinnedTweetId(account, pinnedTweetId);
    }
    
    res.json({
      success: true,
      message: 'Target account added',
      accounts: configService.getConfig().targetAccounts
    });
  } catch (error) {
    console.error('Error adding target account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add target account'
    });
  }
});

/**
 * @route DELETE /api/config/target-accounts/:accountName
 * @desc Delete a specific target account
 * @access Public
 */
router.delete('/target-accounts/:accountName', (req, res) => {
  try {
    const { accountName } = req.params;
    
    const config = configService.getConfig();
    const existingAccounts = config.targetAccounts || [];
    
    // Filter out the account to delete
    const updatedAccounts = existingAccounts.filter(a => a.account !== accountName);
    
    // If no accounts were removed, the account doesn't exist
    if (updatedAccounts.length === existingAccounts.length) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }
    
    configService.updateTargetAccounts(updatedAccounts);
    
    // Also remove any pinned tweet ID for this account
    configService.removePinnedTweetId(accountName);
    
    res.json({
      success: true,
      message: 'Target account deleted',
      accounts: configService.getConfig().targetAccounts
    });
  } catch (error) {
    console.error('Error deleting target account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete target account'
    });
  }
});

/**
 * @route DELETE /api/config/target-accounts
 * @desc Delete all target accounts
 * @access Public
 */
router.delete('/target-accounts', (req, res) => {
  try {
    // Update with an empty array to clear all accounts
    configService.updateTargetAccounts([]);
    
    // Clear all pinned tweet IDs
    const config = configService.getConfig();
    Object.keys(config.pinnedTweetIds || {}).forEach(account => {
      configService.removePinnedTweetId(account);
    });
    
    res.json({
      success: true,
      message: 'All target accounts deleted',
      accounts: []
    });
  } catch (error) {
    console.error('Error deleting all target accounts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete all target accounts'
    });
  }
});

export default router; 