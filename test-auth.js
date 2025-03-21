/**
 * Twitter Authentication Test Script
 * 
 * This script can be used to test the authentication error handling in the application.
 * It simulates a Twitter authentication error with code 32, which triggers the pause and 
 * reauthentication process we've implemented.
 * 
 * To use:
 * 1. Run this script with Node.js
 * 2. It will print instructions on how to trigger an auth error simulation
 * 3. Make the API request as instructed to simulate an authentication error
 */

const express = require('express');
const app = express();
const PORT = 3500;

app.use(express.json());

// Endpoint to test authentication failure
app.post('/test-auth-failure', (req, res) => {
  console.log('Simulating Twitter authentication failure...');
  res.status(401).json({
    errors: [
      {
        code: 32,
        message: "Could not authenticate you"
      }
    ]
  });
});

// Simple instructions page
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Twitter Auth Test</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
          .note { background: #fffde7; padding: 15px; border-left: 4px solid #ffd600; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>Twitter Authentication Error Test</h1>
        <p>This server simulates Twitter authentication errors to test the application's error handling.</p>
        
        <h2>How to use:</h2>
        <ol>
          <li>This test server is running on port ${PORT}</li>
          <li>To simulate a Twitter auth error with code 32, send a request to:</li>
          <pre>POST http://localhost:${PORT}/test-auth-failure</pre>
          
          <li>You can use the curl command:</li>
          <pre>curl -X POST http://localhost:${PORT}/test-auth-failure -H "Content-Type: application/json" -d '{}'</pre>
          
          <li>To test in your application, temporarily modify your Twitter API endpoint to point to this server</li>
        </ol>
        
        <div class="note">
          <strong>Note:</strong> This is for testing purposes only. Make sure to revert any code changes after testing.
        </div>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Authentication test server running at http://localhost:${PORT}`);
  console.log(`To test auth failure, make a POST request to http://localhost:${PORT}/test-auth-failure`);
  console.log(`For instructions, visit http://localhost:${PORT} in your browser`);
}); 