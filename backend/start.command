#!/bin/bash

# Change to the directory where the script is located
cd "$(dirname "$0")"

echo "Starting Twitter Scraper Backend..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed or not in PATH."
  echo "Please install Node.js from https://nodejs.org/"
  echo
  read -p "Press Enter to exit..."
  exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the application
echo "Starting the server..."
node start.js

# If there was an error, wait for input before closing
if [ $? -ne 0 ]; then
  read -p "Press Enter to exit..."
fi 