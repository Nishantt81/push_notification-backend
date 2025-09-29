const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');

// Use environment variable for service account JSON
// Fallback for local development (optional)
const serviceAccount = process.env.SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.SERVICE_ACCOUNT_KEY)
  : require('../etc/secrets/serviceAccountKey.json'); // only for local dev

// Google Cloud project ID (from Firebase project settings)
const PROJECT_ID = "test-flutter-app-532e5";

// FCM endpoint for HTTP v1
const FCM_ENDPOINT = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

/**
 * Generates an access token using the service account JSON
 */
async function getAccessToken() {
  try {
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
        notification: { title, body },
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
