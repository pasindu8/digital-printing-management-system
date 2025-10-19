const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const stream = require('stream');

// Load service account credentials
const KEYFILE = path.join(__dirname, '../config/service-account-key.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Initialize Google Auth (simple service account auth)
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE,
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Upload file to Google Drive
 * @param {string} filePath - Local file path
 * @param {string} fileName - Name for the file in Drive
 * @param {string} mimeType - MIME type of the file
 * @returns {Object} - File details (id, webViewLink, webContentLink)
 */
async function uploadToDrive(filePath, fileName, mimeType) {
  try {
    console.log('📤 Uploading to Google Drive:', fileName);

    const fileMetadata = {
      name: fileName,
      // No parent folder - upload to service account's root
    };

    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink',
    });

    console.log('✅ File uploaded successfully:', response.data.id);

    // Make file publicly accessible
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    console.log('🔓 File set to public access');

    // Get the direct download link
    const directLink = `https://drive.google.com/uc?export=view&id=${response.data.id}`;

    return {
      id: response.data.id,
      name: response.data.name,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
      directLink: directLink, // For embedding in <img> tags
    };
  } catch (error) {
    console.error('❌ Error uploading to Drive:', error);
    throw error;
  }
}

/**
 * Upload buffer to Google Drive (for memory uploads)
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Name for the file in Drive
 * @param {string} mimeType - MIME type of the file
 * @returns {Object} - File details
 */
async function uploadBufferToDrive(fileBuffer, fileName, mimeType) {
  try {
    console.log('📤 Uploading buffer to Google Drive:', fileName);

    const fileMetadata = {
      name: fileName,
      // No parent folder
    };

    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const media = {
      mimeType: mimeType,
      body: bufferStream,
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink',
    });

    console.log('✅ Buffer uploaded successfully:', response.data.id);

    // Make file publicly accessible
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const directLink = `https://drive.google.com/uc?export=view&id=${response.data.id}`;

    return {
      id: response.data.id,
      name: response.data.name,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
      directLink: directLink,
    };
  } catch (error) {
    console.error('❌ Error uploading buffer to Drive:', error);
    throw error;
  }
}

/**
 * Delete file from Google Drive
 * @param {string} fileId - Google Drive file ID
 */
async function deleteFromDrive(fileId) {
  try {
    console.log('🗑️ Deleting file from Drive:', fileId);
    await drive.files.delete({
      fileId: fileId,
    });
    console.log('✅ File deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting from Drive:', error);
    throw error;
  }
}

/**
 * Get file metadata from Google Drive
 * @param {string} fileId - Google Drive file ID
 * @returns {Object} - File metadata
 */
async function getFileMetadata(fileId) {
  try {
    const response = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, createdTime, webViewLink, webContentLink',
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error getting file metadata:', error);
    throw error;
  }
}

module.exports = {
  uploadToDrive,
  uploadBufferToDrive,
  deleteFromDrive,
  getFileMetadata,
};
