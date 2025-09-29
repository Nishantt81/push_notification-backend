// services/notificationService.js
const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

// Path to Render Secret File
const serviceAccountPath = '/etc/secrets/serviceAccountKey.json';

// Google Cloud project ID (from Firebase project settings)
const PROJECT_ID = "test-flutter-app-532e5";

// FCM endpoint for HTTP v1
const FCM_ENDPOINT = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

/**
 * Generates an access token using the service account JSON
 */
async function getAccessToken() {
  try {
    // Read the service account JSON directly from the secret file
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });

    const client = await auth.getClient();
    const accessTokenResponse = await client.getAccessToken();
    return accessTokenResponse.token;
  } catch (error) {
    console.error('Error getting access token:', error.message);
    throw error;
  }
}

/**
 * Sends a push notification to a specific device token
 */
async function sendNotification(fcmToken, title, body) {
  try {
    const accessToken = await getAccessToken();

    const message = {
      message: {
        token: fcmToken,
        notification: {
          title,
          body,
        },
      },
    };

    const response = await fetch(FCM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();
    console.log('FCM response:', data);

    return data;
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    throw error;
  }
}

module.exports = { sendNotification, getAccessToken };
