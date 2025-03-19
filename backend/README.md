# Twitter Scraper Backend

A unified Node.js backend for the Twitter scraper and poster application. This service replaces the previous combination of Python and Node.js scripts with a single, cohesive REST API.

## Features

- **Login & Authentication**: Manage Twitter credentials and login session
- **Tweet Scraping**: Automatically fetch tweets from target accounts
- **Screenshot Capture**: Take screenshots of tweets
- **Tweet Posting**: Post screenshots back to Twitter with custom text
- **Configuration Management**: Configure target accounts, delays, and more
- **Status Monitoring**: Monitor the status of the scraping process

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the project root or make sure existing one has these variables:
```
# Twitter API Credentials
TWITTER_USERNAME=your_twitter_username
TWITTER_PASSWORD=your_twitter_password
TWITTER_EMAIL=your_twitter_email

# Target Twitter Accounts to Monitor
TARGET_ACCOUNTS=account1,account2,account3

# Pinned Tweet IDs to Skip
PINNED_TWEET_IDS=account1=tweetid1,account2=tweetid2

# Delay Configuration (in milliseconds)
MIN_DELAY=200000
MAX_DELAY=300000

# Tweet Configuration
TWEET_TEXT_CONTENT=#yourtag
```

## Usage

### For Non-Technical Users

1. Double-click the `start.bat` (Windows) or `start.command` (Mac) file
2. The browser will automatically open to the application dashboard

### For Developers

Start the server:
```bash
npm start
```

Start with auto-restart on file changes (development mode):
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login to Twitter
- `GET /api/auth/status` - Check authentication status

### Configuration
- `GET /api/config` - Get current configuration
- `PUT /api/config/target-accounts` - Update target accounts
- `PUT /api/config/pinned-tweets` - Update pinned tweet IDs
- `PUT /api/config/delays` - Update delay settings
- `PUT /api/config/tweet-text` - Update tweet text

### Scraping
- `POST /api/scrape/start` - Start the scraping process
- `POST /api/scrape/stop` - Stop the scraping process
- `GET /api/scrape/status` - Get current scraping status
- `GET /api/scrape/processed` - Get processed tweet links
- `POST /api/scrape/tweet` - Post a tweet with media

### Status
- `GET /api/status` - Get the overall application status
- `GET /api/status/twitter` - Get Twitter-specific status
- `GET /api/status/scraper` - Get scraper-specific status

## Logs

Logs are written to `backend.log` in the application directory. 