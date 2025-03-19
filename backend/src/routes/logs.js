import express from 'express';
import * as logService from '../services/logService.js';

const router = express.Router();

/**
 * @route GET /api/logs
 * @desc Get application logs
 * @access Public
 */
router.get('/', (req, res) => {
  try {
    const { limit = 50, level, source } = req.query;
    const logs = logService.getLogs(
      parseInt(limit, 10),
      level || null,
      source || null
    );
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get logs'
    });
  }
});

/**
 * @route DELETE /api/logs
 * @desc Clear all logs
 * @access Public
 */
router.delete('/', (req, res) => {
  try {
    logService.clearLogs();
    
    res.json({
      success: true,
      message: 'Logs cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear logs'
    });
  }
});

export default router; 