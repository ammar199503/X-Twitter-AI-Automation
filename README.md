# Twitter-AI-Automation 🚀

A Node.js-based tool that automatically captures tweets from specified Twitter accounts, processes them using OpenAI to extract relevant news, and reposts them to your Twitter account. This application uses your Twitter credentials for browsing and posting tweets. **NO TWITTER API KEY REQUIRED.**
Support for other AI models will be added later.

![Dashboard](screenshots/dashboard.png)

## Features

- All you need is Target Twitter/X accounts to scrape for your relevant topic and OpenAI API and you are good to go.
- Automatically scrapes tweets from specified Twitter accounts **without Twitter API**
- Processes tweets using OpenAI to identify relevant content 🤖
- Posts processed tweets with proper formatting and attribution
- Maintains a record of processed tweets to avoid duplicates
- Configurable delay between posts
- RESTful API for all functionality
- Web-based dashboard for monitoring and configuration
- Secure login system
- Target accounts management
- Comprehensive configuration settings
- Multiple model options for OpenAI processing

## Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Target Accounts Management
![Target Accounts](screenshots/Target-account-settings.png)

### Scraper & Delay Settings
![Scraper Settings](screenshots/Scrapper-and-delay-settings.png)

### API Configuration
![API Settings](screenshots/API-Settings.png)

## Prerequisites

Here's what you need to get started:

- **Node.js 18 or higher**
  
  Node.js is the platform that powers this application. To check if you have it installed, open your terminal and type:
  ```bash
  node -v
  ```
  
  If you see a version number (like v18.x.x), you're set. If not, install it:
  
  **For macOS (using Homebrew):**
  1. Open Terminal
  2. Paste this command and press Enter:
  ```bash
  brew install node
  ```
  
  **For Windows:**
  1. Go to https://nodejs.org/
  2. Download the LTS (Long Term Support) version
  3. Run the downloaded installer and follow the prompts
  4. After installation, open Command Prompt to verify with `node -v`

- **Twitter/X Account**
  - You only need a standard Twitter/X account (free)
  - **NO Twitter Developer Account or API keys needed**
  - Have your Twitter username, password, and email ready for login
  - For maximum security, set your account to "automated" in Twitter/X Settings

- **OpenAI API Key**
  - Sign up at [OpenAI](https://platform.openai.com/)
  - Navigate to the API section and create a new API key
  - Copy this key somewhere safe - you'll need to paste it into the application
  - Make sure you have credits available on your OpenAI account

- **Git** (for cloning the repository)
  
  **For macOS:**
  1. Open Terminal
  2. Paste this command and press Enter:
  ```bash
  brew install git
  ```
  
  **For Windows:**
  1. Download Git from https://git-scm.com/download/win
  2. Run the installer with default options
  3. After installation, open Command Prompt and type `git --version` to verify

- **Modern Web Browser** 
  - Chrome, Firefox, Safari, or Edge (latest version recommended)

## Installation

Follow these steps carefully:

1. **Open your terminal or command prompt**
   - On macOS: Open the Terminal app (find it in Applications > Utilities)
   - On Windows: Open Command Prompt (search for "cmd" in the Start menu)

2. **Clone this repository:**
   - Copy and paste this command into your terminal and press Enter:
   ```bash
   git clone https://github.com/ammar199503/Twitter-AI-Automation.git
   ```
   - This will download all the project files to your computer

3. **Navigate to the project folder:**
   - Type this command and press Enter:
   ```bash
   cd Twitter-AI-Automation
   ```

4. **Install dependencies:**
   - Type this command and press Enter:
   ```bash
   npm install
   ```
   - This might take a few minutes as it downloads all necessary components
   - You should see a progress bar and eventually a completion message

## Usage

### Running the Application

1. **Start the application:**
   - Make sure you're in the project directory
   - Type this command and press Enter:
   ```bash
   npm run dev
   ```
   - You should see messages indicating that both the backend and frontend are starting

2. **Access the web dashboard:**
   - Open your web browser
   - Type `http://localhost:3000` in the address bar and press Enter
   - The login page should appear

This will start:
- The backend server on port 3002 
- The frontend development server on port 3000

## Step-by-Step Guide

1. **Initial Setup**
   - Complete the installation steps above
   - Start the application with `npm run dev`

2. **Access the Web Interface**
   - Open your browser and go to http://localhost:3000

3. **Login**
   - Enter your Twitter username, password, and email
   - Check the Terms of Service agreement box
   - Your credentials are used only for authentication with X/Twitter on your local computer and are not stored or sent to any developer or server
   - Click "Sign In"

4. **Configure Target Accounts** 🐦
   - After login, you'll be directed to the Target Accounts page
   - Add Twitter accounts you want to monitor (e.g., @cz_binance, @VitalikButerin)
   - Optionally specify pinned tweet IDs to skip when scraping
   - Click "Continue to Configuration" when done

5. **Configure Settings**
   - Set the Minimum and Maximum Delay between posts (in seconds)
   - Configure how many tweets per account to scrape (default is typically 30)
   - Click "Save Configuration"

6. **OpenAI Configuration**
   - Select your preferred OpenAI model (e.g., gpt-4o, gpt-3.5-turbo)
   - Configure temperature (0.3-0.7 is a good starting point)
   - Set max tokens (1000 is usually sufficient)
   - Customize the system prompt (guidelines for AI) using the provided examples or create your own
   - Customize the user prompt template using the provided examples or create your own
   - Click "Save Configuration"

7. **Dashboard & Monitoring** 📊
   - Start the scraping process by clicking "Start Scraping"
   - Monitor the process status, logs, and recent activity
   - Use "Clear History" to reset the list of processed tweets
   - View application logs with filtering options for better troubleshooting

8. **Stopping the Application**
   - Click "Stop Scraping" to halt the process
   - You can safely close the browser window and the backend will continue running
   - To completely stop the application, go back to your terminal and press Ctrl+C
   - Confirm the shutdown if prompted

## Configuration Options

### Basic Configuration
- **Target Accounts**: List of Twitter accounts to monitor
- **Pinned Tweet IDs**: Tweet IDs to skip during scraping
- **Delay Settings**: Minimum and maximum delay between posts (in seconds)
- **Tweets Per Account**: Number of tweets to fetch from each target account

### OpenAI Configuration
- **Model Selection**: Choose from models like gpt-4o, gpt-4o-mini, gpt-3.5-turbo, and others
- **Temperature**: Controls randomness (lower values = more deterministic outputs)
- **Max Tokens**: Maximum length of generated responses
- **System Prompt**: Guidelines for how the AI should process tweets
- **User Prompt Template**: Format for how tweets are presented to the AI

## News Bot Functionality

This application by default functions as a news aggregator and reporter for various topics. You can change the Guidelines and Prompt to your liking. It:

1. Scrapes tweets from specified Twitter accounts and influencers
2. Uses OpenAI to identify and extract relevant news
3. Rephrases the content into engaging, professional news posts
4. Automatically posts these updates to your Twitter account ⚡


### Best Practices

- Include a diverse mix of sources (news sites, industry leaders, analysts)
- Set reasonable delays between posts (5-15 minutes recommended)
- Use modern OpenAI models (like gpt-4o) for better understanding of content
- Monitor your posts regularly to ensure quality and relevance
- Avoid including too many target accounts to prevent rate limiting
- Customize your prompts based on your specific use case (examples are provided in the UI)
- Start with default examples, then customize them as you learn what works best

## Troubleshooting

- **Connection Issues**: Ensure your Twitter credentials are correct and you have internet access
- **Login Problems**: Make sure you're using the email associated with your Twitter account
- **Scraping Not Starting**: Check that you've added at least one target account
- **No Tweets Being Posted**: If no relevant content is found, try adjusting your system prompt to be more inclusive
- **Rate Limiting**: Twitter may limit requests if you make too many in a short time; increase delay between cycles
- **Backend Not Starting**: Verify port 3002 is available and not in use by another application
- **OpenAI Errors**: Confirm your API key is valid and you have sufficient credits
- **Empty Responses**: Adjust your system prompt to be more inclusive or change target accounts

## Disclaimer

**IMPORTANT:** The developer does not endorse or encourage using this tool to scrape Twitter/X data without proper API access 😉. This tool is provided for educational and research purposes only. By using this application:

- You accept full responsibility for any violations of Twitter/X's Terms of Service
- You understand that your account may be suspended or banned by Twitter/X
- The developer is not responsible for any consequences including account restrictions, data loss, or legal issues
- You agree to use this tool ethically and in compliance with all applicable laws and regulations
- The developer makes no warranties about the tool's reliability, accuracy, or legality in your jurisdiction

Use at your own risk. This tool is meant for personal use only, not for mass data collection or commercial purposes.

## Credits

This project builds upon and was inspired by:
- [agent-twitter-client](https://github.com/elizaOS/agent-twitter-client)
- [tweetcapture](https://github.com/xacnio/tweetcapture)

## License

MIT
