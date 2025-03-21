#!/usr/bin/env node

/**
 * Twitter AI Automation - Setup Script
 * 
 * This script checks and ensures all required components are properly installed.
 * It also verifies the environment and provides helpful feedback for any issues.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Create a readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main function
async function main() {
  console.log(`\n${colors.bright}${colors.blue}┌────────────────────────────────────────┐${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}│  Twitter AI Automation - Setup Utility  │${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}└────────────────────────────────────────┘${colors.reset}\n`);
  
  console.log(`${colors.cyan}This script will verify your installation and ensure all required components are properly set up.${colors.reset}\n`);
  
  // Step 1: Verify Node.js version
  verifyNodeVersion();
  
  // Step 2: Check if package directories exist
  checkDirectories();
  
  // Step 3: Install dependencies
  await installDependencies();
  
  // Step 4: Verify the installation
  verifyInstallation();
  
  console.log(`\n${colors.green}${colors.bright}Setup completed successfully!${colors.reset}`);
  console.log(`\n${colors.cyan}To start the application:${colors.reset}`);
  console.log(`1. Run ${colors.yellow}npm run dev${colors.reset} to start both backend and frontend`);
  console.log(`2. Access the application at ${colors.yellow}http://localhost:3000${colors.reset}`);
  console.log(`3. Use ${colors.yellow}npm run test-auth${colors.reset} to test Twitter authentication handling\n`);
  
  rl.close();
}

function verifyNodeVersion() {
  console.log(`${colors.cyan}Checking Node.js version...${colors.reset}`);
  
  try {
    const nodeVersion = process.version;
    const versionNum = nodeVersion.substring(1).split('.')[0];
    
    if (parseInt(versionNum) < 14) {
      console.log(`${colors.red}Error: Node.js version ${nodeVersion} is not supported.${colors.reset}`);
      console.log(`${colors.yellow}Please install Node.js 14 or higher.${colors.reset}`);
      process.exit(1);
    } else {
      console.log(`${colors.green}✓ Node.js version ${nodeVersion} is compatible.${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}Error checking Node.js version: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

function checkDirectories() {
  console.log(`\n${colors.cyan}Checking project structure...${colors.reset}`);
  
  const directories = ['backend', 'frontend'];
  
  for (const dir of directories) {
    if (!fs.existsSync(path.join(__dirname, dir))) {
      console.log(`${colors.red}Error: ${dir} directory not found.${colors.reset}`);
      console.log(`${colors.yellow}Make sure you're running this script from the project root and the repository was cloned correctly.${colors.reset}`);
      process.exit(1);
    } else {
      console.log(`${colors.green}✓ ${dir} directory exists.${colors.reset}`);
    }
  }
}

async function installDependencies() {
  console.log(`\n${colors.cyan}Installing dependencies...${colors.reset}`);
  
  try {
    // Install root dependencies
    console.log(`\n${colors.cyan}Installing root dependencies...${colors.reset}`);
    execSync('npm install', { stdio: 'inherit' });
    
    // Install backend dependencies
    console.log(`\n${colors.cyan}Installing backend dependencies...${colors.reset}`);
    execSync('cd backend && npm install', { stdio: 'inherit' });
    
    // Install frontend dependencies
    console.log(`\n${colors.cyan}Installing frontend dependencies...${colors.reset}`);
    execSync('cd frontend && npm install', { stdio: 'inherit' });
    
    console.log(`\n${colors.green}✓ All dependencies installed successfully.${colors.reset}`);
  } catch (error) {
    console.log(`\n${colors.red}Error installing dependencies: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}You can try running npm run install-all manually.${colors.reset}`);
    
    return new Promise((resolve) => {
      rl.question(`${colors.yellow}Do you want to continue with the setup? (y/n) ${colors.reset}`, (answer) => {
        if (answer.toLowerCase() !== 'y') {
          console.log(`${colors.red}Setup aborted.${colors.reset}`);
          process.exit(1);
        }
        resolve();
      });
    });
  }
}

function verifyInstallation() {
  console.log(`\n${colors.cyan}Verifying installation...${colors.reset}`);
  
  // Check if key files exist
  const requiredFiles = [
    'backend/package.json',
    'backend/src/index.js',
    'frontend/package.json',
    'frontend/src/index.js',
    'frontend/src/components/StatusPage.js',
    'backend/src/services/twitterService.js',
    'backend/src/routes/status.js'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(__dirname, file))) {
      console.log(`${colors.red}Warning: ${file} not found.${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ ${file} exists.${colors.reset}`);
    }
  }
  
  // Check if test-auth.js exists
  if (!fs.existsSync(path.join(__dirname, 'test-auth.js'))) {
    console.log(`${colors.yellow}Warning: test-auth.js not found. Twitter authentication testing will not be available.${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ test-auth.js exists.${colors.reset}`);
  }
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Setup failed: ${error.message}${colors.reset}`);
  process.exit(1);
}); 