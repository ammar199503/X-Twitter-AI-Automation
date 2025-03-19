import express from 'express';
import * as scrapingService from '../services/scrapingService.js';
import { clearProcessedLinks, loadProcessedLinks } from '../utils/fileUtils.js';
import * as logService from '../services/logService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @route POST /api/scrape/start
 * @desc Start the scraping process
 * @access Public
 */
router.post('/start', async (req, res) => {
  try {
    const success = await scrapingService.startScraping();
    
    if (success) {
      res.json({
        success: true,
        message: 'Scraping process started'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to start scraping process'
      });
    }
  } catch (error) {
    console.error('Error starting scraping:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * @route POST /api/scrape/stop
 * @desc Stop the scraping process
 * @access Public
 */
router.post('/stop', (req, res) => {
  try {
    const success = scrapingService.stopScraping();
    
    if (success) {
      res.json({
        success: true,
        message: 'Scraping process stopped'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'No scraping process running'
      });
    }
  } catch (error) {
    console.error('Error stopping scraping:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * @route POST /api/scrape/clear-processed
 * @desc Clear all processed tweet links
 * @access Public
 */
router.post('/clear-processed', (req, res) => {
  try {
    clearProcessedLinks();
    logService.info('Cleared all processed tweet links', 'system');
    
    res.json({
      success: true,
      message: 'All processed tweet links cleared'
    });
  } catch (error) {
    console.error('Error clearing processed links:', error);
    logService.error(`Error clearing processed links: ${error.message}`, 'system');
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear processed links'
    });
  }
});

/**
 * @route GET /api/scrape/processed
 * @desc Get list of processed tweet links
 * @access Public
 */
router.get('/processed', (req, res) => {
  try {
    const processedLinks = loadProcessedLinks(true);
    
    logService.info(`Retrieved ${processedLinks.size} processed links`, 'system');
    
    res.json({
      success: true,
      links: Array.from(processedLinks)
    });
  } catch (error) {
    console.error('Error retrieving processed links:', error);
    logService.error(`Error retrieving processed links: ${error.message}`, 'system');
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve processed links'
    });
  }
});

/**
 * @route GET /api/scrape/processed-links-file
 * @desc Get the raw processed links file for viewing
 * @access Public
 */
router.get('/processed-links-file', (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../../processed_links.txt');
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'inline; filename="processed_links.txt"');
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving processed links file:', error);
    res.status(500).send('Error serving file: ' + error.message);
  }
});

export default router; 