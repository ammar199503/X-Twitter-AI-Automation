# Twitter AI Automation

A tool for scraping tweets and posting AI-generated content based on relevant cryptocurrency news.

## Features

- Twitter account monitoring and tweet scraping
- OpenAI integration for intelligent content rephrasing
- Automated tweet posting
- CSV import for target accounts
- Robust authentication error handling
- Dashboard with real-time status monitoring
- Advanced Twitter bot detection protection

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/twitter-ai-automation.git
   cd twitter-ai-automation
   ```

2. Install all dependencies (frontend, backend, and root):
   ```bash
   npm run install-all
   ```

   This will install dependencies for:
   - The root project
   - The backend service
   - The frontend React application

## Running the Application

1. Start both the backend and frontend in development mode:
   ```bash
   npm run dev
   ```

2. Or run them separately:
   ```bash
   # Backend only
   npm run backend
   
   # Frontend only
   npm run frontend
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3002

## Authentication Error Handling

This application includes robust handling for Twitter authentication errors (code 32) and bot detection issues. When authentication or bot detection occurs:

1. The scraping process is automatically paused
2. The system displays a warning on the dashboard
3. A dedicated Status page allows for re-authentication without restarting the process
4. Specific guidance for handling bot detection issues is provided

### Bot Detection Protection

The application implements several strategies to avoid Twitter bot detection:

- Human-like behavior patterns with randomized delays
- Intelligent error handling for Arkose Labs challenges
- Automatic cookie management and session recovery
- User guidance for resolving persistent bot detection issues

For more details on handling bot detection, see [TWITTER_BOT_DETECTION.md](./TWITTER_BOT_DETECTION.md)

### Testing Authentication Error Handling

To test the authentication error handling feature:

1. Run the test server:
   ```bash
   npm run test-auth
   ```

2. Visit http://localhost:3500 for instructions
3. Follow the prompts to simulate authentication errors

For more details, see [TWITTER_AUTH_HANDLING.md](./TWITTER_AUTH_HANDLING.md)

## CSV Import for Target Accounts

The application supports importing target accounts via CSV file:

1. Prepare a CSV file with:
   - Column A: Twitter usernames (with or without @ symbol)
   - Column B: Optional Tweet IDs (any leading single quotes will be cleaned automatically)

2. Navigate to the Target Accounts page
3. Click "Import from CSV" and select your file

## Configuration

### OpenAI Settings

Set up your OpenAI API key and customize the tweet generation settings:

1. Navigate to the OpenAI Settings page
2. Enter your API key
3. Adjust parameters like model, temperature, and max tokens
4. Customize system and user prompts for tweet generation

### Scraper Settings

Configure the scraper behavior:

1. Navigate to the Configuration page
2. Set minimum and maximum delay between tweets
3. Adjust how many tweets to fetch per account

## Troubleshooting

### Authentication Issues

If you encounter Twitter authentication problems:

1. Check the Status page to view detailed authentication state
2. Use the re-authentication form to enter valid credentials
3. Review the logs for specific error messages

### Other Common Issues

- **API Connection Errors**: Ensure the backend server is running
- **Scraping Not Starting**: Verify Twitter credentials and OpenAI API key are set
- **Missing Dependencies**: Run `npm run install-all` to ensure all packages are installed

## License

MIT
