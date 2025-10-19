const express = require('express');
const router = express.Router();
const { getAuthUrl, getTokenFromCode } = require('../utils/driveServiceOAuth');

/**
 * Step 1: Redirect user to Google OAuth consent screen
 */
router.get('/google-drive', (req, res) => {
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
});

/**
 * Step 2: Handle OAuth callback from Google
 */
router.get('/google-drive/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('No authorization code provided');
  }

  try {
    await getTokenFromCode(code);
    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: #4CAF50;">✅ Success!</h1>
          <p style="font-size: 18px;">Google Drive has been authorized successfully!</p>
          <p>You can now close this window and upload images to raw materials.</p>
          <script>
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error getting token:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: #f44336;">❌ Error</h1>
          <p style="font-size: 18px;">Failed to authorize Google Drive</p>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
});

/**
 * Check if Google Drive is authorized
 */
router.get('/google-drive/status', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const TOKEN_PATH = path.join(__dirname, '../config/google-drive-token.json');
  
  if (fs.existsSync(TOKEN_PATH)) {
    res.json({ authorized: true, message: 'Google Drive is authorized' });
  } else {
    res.json({ authorized: false, message: 'Google Drive is not authorized' });
  }
});

module.exports = router;
