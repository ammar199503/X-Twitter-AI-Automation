/**
 * Simple logging service to keep track of application logs
 */

// In-memory log storage
const MAX_LOGS = 100; // Maximum number of logs to keep
let logs = [];

/**
 * Add a log entry
 * @param {string} message - The log message
 * @param {string} level - Log level (info, warning, error)
 * @param {string} source - The source of the log (e.g., 'twitter', 'scraper')
 */
export const addLog = (message, level = 'info', source = 'app') => {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, message, level, source };
  
  console.log(`[${source}][${level}] ${message}`);
  
  // Add to beginning of array so newest logs are first
  logs.unshift(logEntry);
  
  // Trim logs if we have too many
  if (logs.length > MAX_LOGS) {
    logs = logs.slice(0, MAX_LOGS);
  }
};

/**
 * Get all logs
 * @param {number} limit - Maximum number of logs to return
 * @param {string} level - Filter by log level (optional)
 * @param {string} source - Filter by source (optional)
 * @returns {Array} Array of log entries
 */
export const getLogs = (limit = MAX_LOGS, level = null, source = null) => {
  let filteredLogs = [...logs];
  
  if (level) {
    filteredLogs = filteredLogs.filter(log => log.level === level);
  }
  
  if (source) {
    filteredLogs = filteredLogs.filter(log => log.source === source);
  }
  
  return filteredLogs.slice(0, limit);
};

/**
 * Clear all logs
 */
export const clearLogs = () => {
  logs = [];
  addLog('Logs cleared', 'info', 'system');
};

// Info level log
export const info = (message, source = 'app') => {
  addLog(message, 'info', source);
};

// Warning level log
export const warn = (message, source = 'app') => {
  addLog(message, 'warning', source);
};

// Error level log
export const error = (message, source = 'app') => {
  addLog(message, 'error', source);
}; 