@echo off
echo Starting Twitter Scraper Backend...
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Error: Node.js is not installed or not in PATH.
  echo Please install Node.js from https://nodejs.org/
  echo.
  pause
  exit /b 1
)

:: Check if dependencies are installed
if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
)

:: Start the application
echo Starting the server...
node start.js

:: Keep the window open if there was an error
if %ERRORLEVEL% neq 0 pause 