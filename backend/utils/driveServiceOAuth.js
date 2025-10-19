const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// OAuth2 client configuration
const TOKEN_PATH = path.join(__dirname, '../config/google-drive-token.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Google Drive folder IDs (default shared folder)
const RAW_MATERIALS_FOLDER_ID = '1s25BSSpxe9oh4b3n9FazneBOQ9qIBZga';
const ORDER_DESIGN_SAMPLES_FOLDER_ID = '1s25BSSpxe9oh4b3n9FazneBOQ9qIBZga';
const PAYMENT_RECEIPTS_FOLDER_ID = '1s25BSSpxe9oh4b3n9FazneBOQ9qIBZga';

function createOAuth2Client() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:5000/api/auth/google-drive/callback';

  if (!clientId || !clientSecret) {
    throw new Error('Google Drive OAuth credentials are missing. Please set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET in your environment.');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

async function getAuthorizedClient() {
  const oAuth2Client = createOAuth2Client();

  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('Google Drive is not authorized yet. Visit /api/auth/google-drive to authorize.');
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  oAuth2Client.setCredentials(token);

  // Refresh token if needed
  if (token.expiry_date && token.expiry_date < Date.now()) {
    const refreshed = await oAuth2Client.refreshAccessToken();
    oAuth2Client.setCredentials(refreshed.credentials);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(refreshed.credentials, null, 2));
  }

  return oAuth2Client;
}

function getAuthUrl() {
  const oAuth2Client = createOAuth2Client();
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
}

async function getTokenFromCode(code) {
  const oAuth2Client = createOAuth2Client();
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  return oAuth2Client;
}

async function uploadToDrive(filePath, fileName, mimeType, folderType = 'raw-materials') {
  try {
    console.log('📤 Uploading to Google Drive:', fileName, `(${folderType})`);

    const auth = await getAuthorizedClient();
    const drive = google.drive({ version: 'v3', auth });

    let folderId;
    switch (folderType) {
      case 'design-samples':
        folderId = ORDER_DESIGN_SAMPLES_FOLDER_ID;
        break;
      case 'receipts':
        folderId = PAYMENT_RECEIPTS_FOLDER_ID;
        break;
      case 'raw-materials':
      default:
        folderId = RAW_MATERIALS_FOLDER_ID;
        break;
    }

    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    const media = {
      mimeType,
      body: fs.createReadStream(filePath)
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, name, webViewLink, webContentLink'
    });

    console.log('✅ File uploaded successfully:', response.data.id);

    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    console.log('🔓 File set to public access');

    const directLink = `https://drive.google.com/thumbnail?id=${response.data.id}&sz=w1000`;
    const alternateLink = `https://drive.google.com/uc?export=view&id=${response.data.id}`;

    return {
      id: response.data.id,
      name: response.data.name,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
      directLink,
      alternateLink
    };
  } catch (error) {
    console.error('❌ Error uploading to Drive:', error);
    throw error;
  }
}

async function deleteFromDrive(fileId) {
  try {
    console.log('🗑️ Deleting file from Drive:', fileId);

    const auth = await getAuthorizedClient();
    const drive = google.drive({ version: 'v3', auth });

    await drive.files.delete({ fileId });
    console.log('✅ File deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting from Drive:', error);
    throw error;
  }
}

module.exports = {
  uploadToDrive,
  deleteFromDrive,
  getAuthUrl,
  getTokenFromCode
};
