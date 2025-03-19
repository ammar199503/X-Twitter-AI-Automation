import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import * as logService from '../services/logService.js';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates necessary folders for the application
 */
export const setupFolders = () => {
  const screenshotsDir = path.join(__dirname, '../../../screenshots');
  fs.ensureDirSync(screenshotsDir);
  logService.info(`Ensured screenshots directory exists at: ${screenshotsDir}`, 'system');
  
  // Create processed_links.txt if it doesn't exist
  const processedLinksPath = path.join(__dirname, '../../../processed_links.txt');
  if (!fs.existsSync(processedLinksPath)) {
    fs.writeFileSync(processedLinksPath, '');
    logService.info(`Created processed_links.txt file at: ${processedLinksPath}`, 'system');
  }
};

/**
 * Load processed tweet links from file
 * @param {boolean} silent - Whether to suppress log messages
 * @returns {Set} Set of processed tweet URLs
 */
export const loadProcessedLinks = (silent = false) => {
  const filePath = path.join(__dirname, '../../../processed_links.txt');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const links = new Set(content.split('\n').filter(line => line.trim()));
    if (!silent) {
      logService.info(`Loaded ${links.size} processed tweet links`, 'system');
    }
    return links;
  } else {
    if (!silent) {
      logService.warn("No processed_links.txt found; creating empty file", 'system');
    }
    fs.writeFileSync(filePath, '');
    return new Set();
  }
};

/**
 * Save a processed tweet link to file
 * @param {string} link - Tweet URL to save
 */
export const saveProcessedLink = (link) => {
  const filePath = path.join(__dirname, '../../../processed_links.txt');
  fs.appendFileSync(filePath, link + '\n');
  logService.info(`Saved processed link: ${link}`, 'system');
};

/**
 * Clear all processed tweet links
 */
export const clearProcessedLinks = () => {
  const filePath = path.join(__dirname, '../../../processed_links.txt');
  fs.writeFileSync(filePath, '');
  logService.info('Cleared all processed tweet links', 'system');
}; 