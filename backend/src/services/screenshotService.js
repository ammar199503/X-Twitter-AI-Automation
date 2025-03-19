import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

/**
 * Capture a screenshot of a tweet using Puppeteer directly
 * @param {string} tweetUrl - URL of the tweet to capture
 * @returns {string} Path to the saved screenshot
 */
const captureScreenshotWithPuppeteer = async (tweetUrl) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    console.log(`Capturing screenshot of tweet: ${tweetUrl}`);
    const page = await browser.newPage();
    
    // Set viewport size to suitable dimensions for tweets
    await page.setViewport({
      width: 600,
      height: 1000,
      deviceScaleFactor: 2
    });
    
    // Navigate to the tweet
    await page.goto(tweetUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Wait for the tweet to load
    await page.waitForSelector('article', { timeout: 20000 });
    
    // Get tweet article element
    const tweetElement = await page.$('article');
    if (!tweetElement) {
      throw new Error('Could not find tweet element');
    }
    
    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(__dirname, '../../../screenshots');
    fs.ensureDirSync(screenshotsDir);
    
    // Get tweet ID from URL
    const tweetId = tweetUrl.split('/').pop().split('?')[0];
    const screenshotPath = path.join(screenshotsDir, `${tweetId}.png`);
    
    // Take screenshot of just the tweet
    await tweetElement.screenshot({
      path: screenshotPath,
      omitBackground: true
    });
    
    console.log(`Screenshot saved to: ${screenshotPath}`);
    return screenshotPath;
  } catch (error) {
    console.error('Error capturing screenshot with Puppeteer:', error);
    return null;
  } finally {
    await browser.close();
  }
};

/**
 * Capture a screenshot of a tweet using the tweetcapture CLI
 * @param {string} tweetUrl - URL of the tweet to capture
 * @returns {string} Path to the saved screenshot
 */
const captureScreenshotWithTweetCapture = (tweetUrl) => {
  try {
    console.log(`Capturing screenshot using tweetcapture: ${tweetUrl}`);
    
    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(__dirname, '../../../screenshots');
    fs.ensureDirSync(screenshotsDir);
    
    // Get tweet ID from URL
    const tweetId = tweetUrl.split('/').pop().split('?')[0];
    const screenshotPath = path.join(screenshotsDir, `${tweetId}.png`);
    
    // Build command for tweetcapture
    const command = [
      "tweetcapture",
      tweetUrl,
      "-o", screenshotPath,
      "-hv",        // Hide videos
      "-n", "2",    // Dark mode
      "--overwrite" // Overwrite existing file
    ].join(" ");
    
    // Execute command
    execSync(command);
    
    // Verify screenshot was created
    if (fs.existsSync(screenshotPath)) {
      console.log(`Screenshot saved to: ${screenshotPath}`);
      return screenshotPath;
    } else {
      throw new Error('Screenshot file not created');
    }
  } catch (error) {
    console.error('Error capturing screenshot with tweetcapture:', error);
    return null;
  }
};

/**
 * Capture a screenshot of a tweet using the best available method
 * @param {string} tweetUrl - URL of the tweet to capture
 * @returns {string} Path to the saved screenshot
 */
export const captureScreenshot = async (tweetUrl) => {
  // Try to use tweetcapture CLI first (better quality)
  try {
    const screenshotPath = captureScreenshotWithTweetCapture(tweetUrl);
    if (screenshotPath) {
      return screenshotPath;
    }
  } catch (error) {
    console.warn('tweetcapture failed, falling back to Puppeteer:', error.message);
  }
  
  // Fall back to Puppeteer if tweetcapture fails
  return captureScreenshotWithPuppeteer(tweetUrl);
}; 