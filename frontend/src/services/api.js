import axios from 'axios';

// Configure axios with base URL
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3002/api',
  timeout: 15000, // Increased timeout for login requests
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add response interceptor to handle common errors
API.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

// Helper function to retry a failed request
const retryRequest = async (fn, retries = 1, delay = 2000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryRequest(fn, retries - 1, delay);
  }
};

// API service functions
const ApiService = {
  // Auth endpoints
  auth: {
    login: async (credentials) => {
      // Use retry mechanism for login requests
      return retryRequest(() => API.post('/auth/login', credentials), 1);
    },
    logout: async () => {
      return API.post('/auth/logout');
    },
    getStatus: async () => {
      return API.get('/auth/status');
    },
    handleBotDetection: async () => {
      try {
        console.log('Attempting to handle Twitter bot detection...');
        return await API.post('/auth/handle-detection');
      } catch (error) {
        console.error('Error handling bot detection:', error);
        throw error;
      }
    }
  },
  
  // Scraper endpoints
  scraper: {
    start: async () => {
      return API.post('/scrape/start');
    },
    stop: async (immediate = true) => {
      return API.post('/scrape/stop', { immediate });
    },
    getStatus: async () => {
      return API.get('/scrape/status');
    },
    getProcessedLinks: async () => {
      return API.get('/scrape/processed');
    },
    startScraper: async () => {
      try {
        return await API.post('/scrape/start');
      } catch (error) {
        console.error('Error starting scraper:', error);
        throw error;
      }
    },
    stopScraper: async (immediate = true) => {
      try {
        return await API.post('/scrape/stop', { immediate });
      } catch (error) {
        console.error('Error stopping scraper:', error);
        throw error;
      }
    },
    clearProcessedLinks: async () => {
      try {
        // Use the correct endpoint from scrapings.js route
        const response = await API.post('/scrape/clear-processed');
        return response;
      } catch (error) {
        console.error('Error clearing processed links:', error);
        throw error;
      }
    },
    getFailedBatchInfo: async () => {
      try {
        return await API.get('/scrape/failed-batch-info');
      } catch (error) {
        console.error('Error getting failed batch info:', error);
        throw error;
      }
    },
    retryFailedBatch: async () => {
      try {
        return await API.post('/scrape/retry-failed-batch');
      } catch (error) {
        console.error('Error retrying failed batch:', error);
        throw error;
      }
    }
  },
  
  // Config endpoints
  config: {
    getConfig: async () => {
      try {
        return await API.get('/config');
      } catch (error) {
        console.error('Error getting config:', error);
        throw error;
      }
    },
    getTargetAccounts: async () => {
      try {
        return await API.get('/config/target-accounts');
      } catch (error) {
        console.error('Error getting target accounts:', error);
        throw error;
      }
    },
    addTargetAccount: async (account) => {
      try {
        return await API.post('/config/target-accounts', account);
      } catch (error) {
        console.error('Error adding target account:', error);
        throw error;
      }
    },
    deleteTargetAccount: async (accountName) => {
      try {
        return await API.delete(`/config/target-accounts/${accountName}`);
      } catch (error) {
        console.error('Error deleting target account:', error);
        throw error;
      }
    },
    deleteAllTargetAccounts: async () => {
      try {
        return await API.delete('/config/target-accounts');
      } catch (error) {
        console.error('Error deleting all target accounts:', error);
        throw error;
      }
    },
    setTargetAccounts: async (accounts) => {
      return API.put('/config/target-accounts', { accounts });
    },
    setPinnedTweets: async (pinnedTweets) => {
      return API.put('/config/pinned-tweets', { pinnedTweets });
    },
    setDelays: async (delays) => {
      try {
        // The backend expects minDelay and maxDelay
        return await API.put('/config/delays', {
          minDelay: delays.min,
          maxDelay: delays.max
        });
      } catch (error) {
        console.error('Error updating delays:', error);
        throw error;
      }
    },
    setTweetText: async (text) => {
      try {
        return await API.put('/config/tweet-text', { text });
      } catch (error) {
        console.error('Error updating tweet text:', error);
        throw error;
      }
    },
    setTweetsPerAccount: async (count) => {
      try {
        return await API.put('/config/tweets-per-account', { count });
      } catch (error) {
        console.error('Error updating tweets per account:', error);
        throw error;
      }
    },
    /**
     * Get OpenAI configuration
     * @returns {Promise<Object>} OpenAI configuration
     */
    getOpenAIConfig: async () => {
      try {
        return await API.get('/config/openai');
      } catch (error) {
        console.error('Error getting OpenAI config:', error);
        throw error;
      }
    },
    
    /**
     * Update OpenAI configuration
     * @param {Object} config - OpenAI configuration options
     * @returns {Promise<Object>} Updated OpenAI configuration
     */
    updateOpenAIConfig: async (config) => {
      try {
        return await API.put('/config/openai', config);
      } catch (error) {
        console.error('Error updating OpenAI config:', error);
        throw error;
      }
    },
    
    importTargetAccountsFromCsv: async (formData) => {
      try {
        // Set different content type for FormData
        const response = await API.post('/config/target-accounts/import-csv', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response;
      } catch (error) {
        console.error('Error importing target accounts from CSV:', error);
        throw error;
      }
    }
  },
  
  // Status endpoint
  getAppStatus: async () => {
    try {
      console.log("Fetching app status for routing decision...");
      
      // Get scraper status - contains most of the application state
      const scraperResponse = await API.get('/scrape/status').catch(error => {
        console.error("Error fetching scraper status:", error);
        return { data: { success: false } };
      });
      
      // Get auth status - contains login information
      const authResponse = await API.get('/auth/status').catch(error => {
        console.error("Error fetching auth status:", error);
        return { data: { success: false, isLoggedIn: false } };
      });
      
      // Get config information
      const configResponse = await API.get('/config').catch(error => {
        console.error("Error fetching config:", error);
        return { data: { success: false, config: {} } };
      });
      
      // Fetch OpenAI config specifically to check if API key is configured
      const openAIResponse = await API.get('/config/openai').catch(error => {
        console.error("Error fetching OpenAI config:", error);
        return { data: { success: false, isConfigured: false, openai: {} } };
      });
      
      // Determine if OpenAI is configured using the explicit isConfigured field
      const openAIConfigured = openAIResponse.data?.isConfigured === true;
      
      // Combine all data into a compatible format expected by the dashboard
      return {
        success: true,
        status: {
          // Core status fields
          isRunning: scraperResponse.data?.isRunning || false,
          isPaused: scraperResponse.data?.isPaused || false,
          pauseReason: scraperResponse.data?.pauseReason || null,
          
          // Next cycle time for the countdown
          nextCycleTime: scraperResponse.data?.nextCycleTime || null,
          cycleDelay: scraperResponse.data?.cycleDelay || 1800000, // Default to 30 minutes
          
          // Authentication status
          isLoggedIn: authResponse.data?.isLoggedIn || false,
          username: authResponse.data?.username || null,
          twitterLoggedIn: authResponse.data?.isLoggedIn || false,
          
          // OpenAI status
          openAIConfigured: openAIConfigured,
          
          // Scraper info
          scraperStatus: {
            isRunning: scraperResponse.data?.isRunning || false,
            isPaused: scraperResponse.data?.isPaused || false,
            pauseReason: scraperResponse.data?.pauseReason || null,
            processedLinksCount: scraperResponse.data?.processedLinksCount || 0
          },
          
          // Config data
          targetAccounts: configResponse.data?.config?.targetAccounts || [],
          delays: {
            min: configResponse.data?.config?.delays?.minDelay || 30000,
            max: configResponse.data?.config?.delays?.maxDelay || 60000,
            minDelay: configResponse.data?.config?.delays?.minDelay || 30000,
            maxDelay: configResponse.data?.config?.delays?.maxDelay || 60000
          },
          tweetsPerAccount: configResponse.data?.config?.tweetsPerAccount || 3
        }
      };
    } catch (error) {
      console.error("Error in getAppStatus:", error);
      return {
        success: false,
        error: error.message,
        status: {
          isRunning: false,
          isPaused: false,
          openAIConfigured: false,
          isLoggedIn: false,
          twitterLoggedIn: false
        }
      };
    }
  },
  
  // Health check
  health: async () => {
    return axios.get('http://localhost:3002/health');
  },

  /**
   * Get application logs
   * @param {number} limit - Maximum number of logs to return
   * @param {string} level - Filter by log level (optional)
   * @param {string} source - Filter by source (optional)
   * @returns {Promise<Object>} Response with logs array
   */
  getLogs: async (limit = 50, level = null, source = null) => {
    try {
      console.log('Fetching application logs...');
      const params = new URLSearchParams();
      
      if (limit) params.append('limit', limit);
      if (level) params.append('level', level);
      if (source) params.append('source', source);
      
      const response = await API.get(`/logs?${params.toString()}`);
      console.log('Logs fetched:', response.data.logs.length);
      return response.data;
    } catch (error) {
      console.error('Error fetching logs:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch logs',
        logs: []
      };
    }
  },

  /**
   * Clear all logs
   * @returns {Promise<Object>} Response with success status
   */
  clearLogs: async () => {
    try {
      console.log('Clearing application logs...');
      const response = await API.delete('/logs');
      console.log('Logs cleared successfully');
      return response.data;
    } catch (error) {
      console.error('Error clearing logs:', error);
      return {
        success: false,
        error: error.message || 'Failed to clear logs'
      };
    }
  }
};

export default ApiService; 