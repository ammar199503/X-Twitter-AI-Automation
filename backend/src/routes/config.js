import express from 'express';
import * as configService from '../services/configService.js';
import * as openaiService from '../services/openaiService.js';
import multer from 'multer';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Filter to accept only CSV files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || 
      file.originalname.toLowerCase().endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB max file size
});

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
    
    if (!accounts || !Array.isArray(accounts)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid target accounts data'
      });
    }
    
    const updatedConfig = configService.updateTargetAccounts(accounts);
    
    res.json({
      success: true,
      targetAccounts: updatedConfig.targetAccounts
    });
  } catch (error) {
    console.error('Error updating target accounts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error updating target accounts'
    });
  }
});

/**
 * @route GET /api/config/target-accounts
 * @desc Get target accounts
 * @access Public
 */
router.get('/target-accounts', (req, res) => {
  try {
    const config = configService.getConfig();
    res.json({
      success: true,
      targetAccounts: config.targetAccounts || []
    });
  } catch (error) {
    console.error('Error getting target accounts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error getting target accounts'
    });
  }
});

/**
 * @route POST /api/config/target-accounts
 * @desc Add a target account
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
    
    // Get current config
    const config = configService.getConfig();
    
    // Check if maximum accounts limit reached (70 accounts)
    if (config.targetAccounts.length >= 70) {
      return res.status(400).json({
        success: false,
        error: 'Maximum limit of 70 target accounts reached. Please remove some accounts before adding new ones.'
      });
    }
    
    // Check if account already exists
    const existingAccount = config.targetAccounts.find(a => {
      if (typeof a === 'string') {
        return a === account;
      }
      return a.account === account;
    });
    
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        error: 'Account already exists in target accounts'
      });
    }
    
    // Add new account with optional pinned tweet ID
    let accountToAdd = account;
    if (pinnedTweetId) {
      accountToAdd = { account, pinnedTweetId };
    }
    
    // Update config with new account
    const newAccounts = [...config.targetAccounts, accountToAdd];
    const updatedConfig = configService.updateTargetAccounts(newAccounts);
    
    res.json({
      success: true,
      targetAccounts: updatedConfig.targetAccounts
    });
  } catch (error) {
    console.error('Error adding target account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error adding target account'
    });
  }
});

/**
 * @route DELETE /api/config/target-accounts/:account
 * @desc Delete a target account
 * @access Public
 */
router.delete('/target-accounts/:account', (req, res) => {
  try {
    const accountToDelete = req.params.account;
    
    // Get current config
    const config = configService.getConfig();
    
    // Filter out the account to delete
    const updatedAccounts = config.targetAccounts.filter(a => {
      if (typeof a === 'string') {
        return a !== accountToDelete;
      }
      return a.account !== accountToDelete;
    });
    
    // Update config with filtered accounts
    const updatedConfig = configService.updateTargetAccounts(updatedAccounts);
    
    res.json({
      success: true,
      targetAccounts: updatedConfig.targetAccounts
    });
  } catch (error) {
    console.error('Error deleting target account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error deleting target account'
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
    // Update config with empty accounts array
    const updatedConfig = configService.updateTargetAccounts([]);
    
    res.json({
      success: true,
      targetAccounts: updatedConfig.targetAccounts
    });
  } catch (error) {
    console.error('Error deleting all target accounts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error deleting all target accounts'
    });
  }
});

/**
 * @route PUT /api/config/pinned-tweets
 * @desc Update pinned tweets
 * @access Public
 */
router.put('/pinned-tweets', (req, res) => {
  try {
    const { pinnedTweets } = req.body;
    
    if (!pinnedTweets || typeof pinnedTweets !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid pinned tweets data'
      });
    }
    
    // Clear existing pinned tweets
    // Assume config.pinnedTweetIds is available directly
    const currentConfig = configService.getConfig();
    Object.keys(currentConfig.pinnedTweetIds).forEach(account => {
      configService.removePinnedTweetId(account);
    });
    
    // Add new pinned tweets
    Object.entries(pinnedTweets).forEach(([account, tweetId]) => {
      configService.addPinnedTweetId(account, tweetId);
    });
    
    const updatedConfig = configService.getConfig();
    
    res.json({
      success: true,
      pinnedTweetIds: updatedConfig.pinnedTweetIds
    });
  } catch (error) {
    console.error('Error updating pinned tweets:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error updating pinned tweets'
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
    
    if (minDelay > maxDelay) {
      return res.status(400).json({
        success: false,
        error: 'minDelay cannot be greater than maxDelay'
      });
    }
    
    const updatedConfig = configService.updateDelays({ minDelay, maxDelay });
    
    res.json({
      success: true,
      delays: updatedConfig.delays
    });
  } catch (error) {
    console.error('Error updating delays:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error updating delays'
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
    
    if (text === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Tweet text is required'
      });
    }
    
    const updatedConfig = configService.updateTweetText(text);
    
    res.json({
      success: true,
      tweetText: updatedConfig.tweetText
    });
  } catch (error) {
    console.error('Error updating tweet text:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error updating tweet text'
    });
  }
});

/**
 * @route PUT /api/config/tweets-per-account
 * @desc Update tweets per account
 * @access Public
 */
router.put('/tweets-per-account', (req, res) => {
  try {
    const { count } = req.body;
    
    if (count === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Tweets per account count is required'
      });
    }
    
    const updatedConfig = configService.updateTweetsPerAccount(count);
    
    res.json({
      success: true,
      tweetsPerAccount: updatedConfig.tweetsPerAccount
    });
  } catch (error) {
    console.error('Error updating tweets per account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error updating tweets per account'
    });
  }
});

// OpenAI Configuration Routes

/**
 * @route GET /api/config/openai
 * @desc Get OpenAI configuration
 * @access Public
 */
router.get('/openai', (req, res) => {
  try {
    const config = configService.getConfig();
    
    // Send back the OpenAI configuration including default values for any missing fields
    res.json({
      success: true,
      openai: {
        apiKey: config.openai?.apiKey ? '••••••••' : '', // Mask the API key if it exists
        model: config.openai?.model || openaiService.DEFAULT_CONFIG.model,
        temperature: config.openai?.temperature !== undefined ? config.openai.temperature : openaiService.DEFAULT_CONFIG.temperature,
        maxTokens: config.openai?.maxTokens || openaiService.DEFAULT_CONFIG.maxTokens,
        systemPrompt: config.openai?.systemPrompt || openaiService.DEFAULT_CONFIG.systemPrompt,
        userPromptTemplate: config.openai?.userPromptTemplate || openaiService.DEFAULT_CONFIG.userPromptTemplate
      }
    });
  } catch (error) {
    console.error('Error getting OpenAI config:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error getting OpenAI configuration'
    });
  }
});

/**
 * @route PUT /api/config/openai
 * @desc Update OpenAI configuration
 */
router.put('/openai', async (req, res) => {
  try {
    const { apiKey, model, temperature, maxTokens, systemPrompt, userPromptTemplate } = req.body;
    
    // Validate model if provided
    const validModels = [
      'gpt-3.5-turbo',
      'gpt-4o-mini',
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-4o',
      'gpt-4o-latest',
      'gpt-4.5-preview'
    ];
    
    if (model && !validModels.includes(model)) {
      console.warn(`Warning: Potentially unsupported model requested: ${model}`);
      // We'll still allow it in case OpenAI adds new models
    }
    
    const updatedConfig = configService.updateOpenAIConfig({
      apiKey,
      model,
      temperature,
      maxTokens,
      systemPrompt,
      userPromptTemplate
    });
    
    // Re-initialize OpenAI service with new config
    await openaiService.initialize();
    
    // Mask API key for response
    const responseConfig = { ...updatedConfig.openai };
    if (responseConfig.apiKey) {
      responseConfig.apiKey = '••••••••'; // Use consistent masking
    }
    
    res.json({
      success: true,
      openai: responseConfig
    });
  } catch (error) {
    console.error('Error updating OpenAI config:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error updating OpenAI configuration'
    });
  }
});

/**
 * @route POST /api/config/target-accounts/import-csv
 * @desc Import target accounts from CSV file
 * @access Public
 */
router.post('/target-accounts/import-csv', upload.single('csvFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No CSV file uploaded'
      });
    }

    const results = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Process each row from the CSV
        const keys = Object.keys(data);
        if (keys.length >= 2) {
          // Get the values from the first and second columns
          // Column names don't matter, just the positions
          const username = data[keys[0]];
          let tweetId = data[keys[1]];
          
          // Skip empty rows
          if (!username) return;
          
          // Clean up the username (remove @ if present)
          const cleanUsername = username.trim().replace(/^@/, '');
          
          // Clean up the tweet ID (remove leading quote if present)
          if (tweetId) {
            tweetId = tweetId.trim().replace(/^'/, '');
          }
          
          // Add the account with optional tweet ID
          if (tweetId) {
            results.push({ account: cleanUsername, pinnedTweetId: tweetId });
          } else {
            results.push({ account: cleanUsername });
          }
        }
      })
      .on('end', () => {
        // Get current config
        const config = configService.getConfig();
        
        // Create a map of existing accounts for easy lookup
        const existingAccountsMap = {};
        config.targetAccounts.forEach(acc => {
          if (typeof acc === 'string') {
            existingAccountsMap[acc] = true;
          } else {
            existingAccountsMap[acc.account] = true;
          }
        });
        
        // Filter out accounts that already exist
        const newAccounts = results.filter(acc => !existingAccountsMap[acc.account]);
        
        // Check if adding new accounts would exceed the 70 accounts limit
        let accountsSkippedDueToLimit = 0;
        let accountsToImport = [...newAccounts];
        
        if (config.targetAccounts.length + newAccounts.length > 70) {
          // Instead of rejecting the import, only take as many accounts as we can fit
          const availableSlots = 70 - config.targetAccounts.length;
          accountsToImport = newAccounts.slice(0, availableSlots);
          accountsSkippedDueToLimit = newAccounts.length - availableSlots;
        }
        
        // Add new accounts to the existing ones
        const updatedAccounts = [...config.targetAccounts, ...accountsToImport];
        const updatedConfig = configService.updateTargetAccounts(updatedAccounts);
        
        // Clean up the temporary file
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting temporary file:', err);
        });
        
        res.json({
          success: true,
          targetAccounts: updatedConfig.targetAccounts,
          totalFound: results.length,
          duplicatesSkipped: results.length - newAccounts.length,
          accountsSkippedDueToLimit: accountsSkippedDueToLimit,
          imported: accountsToImport.length,
          totalAccounts: updatedAccounts.length
        });
      })
      .on('error', (error) => {
        console.error('Error parsing CSV:', error);
        // Clean up the temporary file
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting temporary file:', err);
        });
        
        res.status(500).json({
          success: false,
          error: 'Error parsing CSV file'
        });
      });
  } catch (error) {
    console.error('Error importing target accounts from CSV:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error importing target accounts from CSV'
    });
  }
});

export default router; 