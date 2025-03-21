# X-Twitter AI Automation

A powerful Node.js application that automates the process of capturing tweets from specified Twitter/X accounts, processing them with OpenAI to extract relevant news, and reposting them to your Twitter account. All of this is accomplished without requiring a Twitter API key - just your regular Twitter credentials.

![Dashboard Screenshot](./screenshots/dashboard.png)

## 🚀 Features

- **Zero API Key Requirement**: Uses your Twitter credentials for browsing and posting tweets - no Twitter API key needed
- **Intelligent Content Processing**: Leverages OpenAI to identify and extract relevant content from tweets
- **Targeted Account Monitoring**: Easily configure which Twitter accounts to monitor
- **Automated Posting**: Automatically posts processed tweets with proper formatting
- **Duplicate Prevention**: Maintains records of processed tweets to avoid duplicates
- **Real-time Monitoring**: Web-based dashboard shows status, logs, and activities
- **Secure Authentication**: Robust error handling for Twitter login and authentication challenges
- **CSV Import Support**: Bulk import target accounts from CSV files
- **Bot Detection Protection**: Advanced strategies to avoid Twitter's automation detection
- **Configurable Settings**: Control delays, tweet volume, and AI parameters

## 📋 Prerequisites

- **Node.js 18+** (Check with `node -v`)
- **Twitter/X Account** (Standard free account)
- **OpenAI API Key** (Sign up at [OpenAI](https://openai.com))
- **Git** (For cloning the repository)

## 🔧 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ammar199503/X-Twitter-AI-Automation.git
   cd X-Twitter-AI-Automation
   ```

2. **Install all dependencies**:
   ```bash
   npm run setup
   ```

   This comprehensive setup script installs all required packages for the frontend, backend, and root project.

## 🚀 Running the Application

1. **Start the complete application**:
   ```bash
   npm run dev
   ```

   This launches both the frontend and backend servers simultaneously.

2. **Or run components individually**:
   ```bash
   # Backend only
   npm run backend
   
   # Frontend only
   npm run frontend
   ```

3. **Access the application**:
   - Frontend interface: http://localhost:3000
   - Backend API: http://localhost:3002

## 🏗️ Architecture

The application consists of two main components:

### Backend (Node.js)
- **REST API**: Handles all Twitter interactions and OpenAI processing
- **Twitter Integration**: Uses agent-twitter-client for browser-based Twitter interaction
- **OpenAI Integration**: Processes tweets to extract relevant information
- **Configuration Management**: Stores and manages application settings
- **Logging System**: Comprehensive logging for troubleshooting

### Frontend (React)
- **Dashboard**: Real-time monitoring of scraper status
- **Configuration Pages**: Easy setup of target accounts and system settings
- **User-friendly Interface**: Modern, responsive design built with Material UI
- **Authentication**: Secure Twitter login management

## 💡 Usage Guide

### Initial Setup

1. Start the application with `npm run dev`
2. Access http://localhost:3000 in your browser
3. Log in with your Twitter credentials (these are used locally and not stored remotely)

### Target Account Configuration

1. After login, add Twitter accounts to monitor (e.g., @elonmusk, @vitalikbuterin)
2. Optionally specify pinned tweet IDs to skip during scraping
3. Save your configuration before proceeding

### Application Settings

1. **Scraper Settings**: Configure delays between posts and tweets per account
2. **OpenAI Configuration**: Set up your API key, model, and customize tweet processing parameters
3. **Dashboard**: Monitor status, view logs, and control the scraping process

### Authentication & Bot Protection

The application includes robust handling for Twitter authentication and bot detection:

- Human-like behavior patterns with randomized delays
- Intelligent error handling for verification challenges
- Automatic cookie management for better session persistence
- Clear guidance when authentication issues occur

## 🔍 Troubleshooting

- **Connection Issues**: Verify your Twitter credentials and internet connection
- **Scraping Not Starting**: Check that target accounts are configured and OpenAI API key is valid
- **No Tweets Posted**: Try adjusting your system prompt to be more inclusive
- **Rate Limiting**: Increase delay between cycles if Twitter limits your requests
- **Authentication Problems**: Follow the guidance on the Dashboard for re-authentication

## ⚠️ Disclaimer

This tool is provided for educational and research purposes only. By using this application:

- You accept full responsibility for any violations of Twitter/X's Terms of Service
- You understand that your account may be suspended or banned by Twitter/X
- The developer makes no warranties about the tool's reliability or legality
- You agree to use this tool ethically and in compliance with applicable laws

## 📜 License

MIT
