const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');

// Use environment variable for service account JSON
const serviceAccount = process.env.SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.SERVICE_ACCOUNT_KEY)
  : require('../etc/secrets/serviceAccountKey.json'); // only for local dev

const PROJECT_ID = "test-flutter-app-532e5";
const FCM_ENDPOINT = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

// Store users and tokens (replace with DB in production)
let userTokens = {};      // key: userId, value: fcmToken
let usernameToUserId = {}; // key: username, value: userId

async function getAccessToken() {
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token;
}

// Save or update a user's FCM token
function saveUserToken(userId, username, fcmToken) {
  userTokens[userId] = fcmToken;
  usernameToUserId[username] = userId;
  console.log(`Token saved for user ${username} (${userId})`);
}

// Send notification to a specific userId
async function sendNotificationToUser(userId, title, body) {
  const fcmToken = userTokens[userId];
  if (!fcmToken) throw new Error(`No FCM token found for user ${userId}`);

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
  console.log(`Notification sent to user ${userId}:`, data);
  return data;
}

// Search usernames for autocomplete
function searchUsers(query) {
  const lowerQuery = query.toLowerCase();
  const matchedUsernames = Object.keys(usernameToUserId).filter(username =>
    username.toLowerCase().startsWith(lowerQuery)
  );
  return matchedUsernames;
}

// Get userId by username
function getUserIdByUsername(username) {
  return usernameToUserId[username];
}

module.exports = {
  saveUserToken,
  sendNotificationToUser,
  searchUsers,
  getUserIdByUsername,
};
