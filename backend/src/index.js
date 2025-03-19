import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { setupFolders } from './utils/fileUtils.js';

// Import routes
import authRoutes from './routes/auth.js';
import scrapingRoutes from './routes/scraping.js';
import configRoutes from './routes/config.js';
import statusRoutes from './routes/status.js';
import logsRoutes from './routes/logs.js';

// Initialize environment variables
dotenv.config();

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Setup necessary folders
setupFolders();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Static folder for screenshots
app.use('/screenshots', express.static(path.join(__dirname, '../../screenshots')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/scrape', scrapingRoutes);
app.use('/api/config', configRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/logs', logsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Catch-all error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Server error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Twitter scraper backend running on port ${PORT}`);
}); 