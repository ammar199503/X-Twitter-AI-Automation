#!/usr/bin/env node

/**
 * Twitter Scraper Backend Launcher
 * 
 * This script starts the Twitter scraper backend service.
 * For non-technical users, this can be made into a double-clickable file.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import open from 'open';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILE = path.join(__dirname, 'backend.log');
const PORT = process.env.PORT || 3002;

console.log('🚀 Starting Twitter Scraper Backend...');
console.log(`📝 Logs will be written to: ${LOG_FILE}`);

// Create log file or clear existing one
fs.writeFileSync(LOG_FILE, `Twitter Scraper Backend - Started at ${new Date().toISOString()}\n\n`);

// Start the server process
const server = spawn('node', ['src/index.js'], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, PORT }
});

// Log handler function
const logOutput = (data, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  const output = data.toString().trim();
  
  if (output) {
    const logEntry = `[${timestamp}] [${type}] ${output}\n`;
    fs.appendFileSync(LOG_FILE, logEntry);
    console.log(output);
  }
};

// Pipe process output to logs
server.stdout.on('data', data => logOutput(data, 'INFO'));
server.stderr.on('data', data => logOutput(data, 'ERROR'));

// Handle process exit
server.on('close', code => {
  const exitMessage = `Server process exited with code ${code}`;
  logOutput(exitMessage, code === 0 ? 'INFO' : 'ERROR');
  
  if (code !== 0) {
    console.error(`❌ ${exitMessage}`);
  }
});

server.on('error', error => {
  logOutput(`Failed to start server: ${error.message}`, 'ERROR');
  console.error(`❌ Failed to start server: ${error.message}`);
});

// Wait a bit and then open the browser
setTimeout(() => {
  const url = `http://localhost:${PORT}/health`;
  
  // Try to connect to the server
  fetch(url)
    .then(response => {
      if (response.ok) {
        console.log(`✅ Server is running at http://localhost:${PORT}`);
        console.log('🌐 Opening dashboard in browser...');
        
        // Open browser to the dashboard URL (if there's a frontend)
        open(`http://localhost:${PORT}`);
      } else {
        console.error('❌ Server is not responding correctly');
      }
    })
    .catch(error => {
      console.error(`❌ Could not connect to server: ${error.message}`);
    });
}, 3000);

console.log(`⏳ Server starting on port ${PORT}...`);
console.log('Press Ctrl+C to stop the server'); 