const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// Replace with your Salesforce Connected App's Consumer Secret
// const CONSUMER_SECRET = 'YOUR_CONSUMER_SECRET_FROM_SALESFORCE';
const consumerSecret = process.env.CONSUMER_SECRET;

// Middleware to parse POST requests
app.use(bodyParser.urlencoded({ extended: true }));

// Serve a simple homepage
app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Canvas App</h1><p>POST a signed request to /canvas</p>');
});

// Canvas endpoint to handle Signed Request
app.post('/canvas', (req, res) => {
  const signedRequest = req.body.signed_request;

  if (!signedRequest) {
    return res.status(400).send('No signed request provided');
  }

  // Split the signed request into signature and payload
  const [encodedSig, encodedPayload] = signedRequest.split('.', 2);

  // Verify the signature
  const expectedSig = crypto
    .createHmac('sha256', CONSUMER_SECRET)
    .update(encodedPayload)
    .digest('base64');

  if (expectedSig !== encodedSig) {
    return res.status(401).send('Invalid signature');
  }

  // Decode the payload (Base64)
  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64').toString('utf-8'));
  const userFirstName = payload.context.user.firstName || 'Guest';

  // Render a simple HTML response
  const html = `
    <html>
      <head><title>Canvas App</title></head>
      <body>
        <h1>Hello, ${userFirstName}!</h1>
        <p>Welcome to your Salesforce Canvas-integrated app.</p>
      </body>
    </html>
  `;

  res.send(html);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
