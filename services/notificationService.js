const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');
const User = require('../models/User')

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
  // Fetch user directly from DB
  const user = await User.findById(userId).select('fcmTokens username');

  if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
    throw new Error(`No FCM tokens found for user ${userId}`);
  }

  // Fetch access token
  const accessToken = await getAccessToken();

  const sendResults = [];
  for (const token of user.fcmTokens) {
    const message = {
      message: {
        token: token,
        notification: { title, body },
      },
    };

    try {
      const response = await fetch(FCM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const data = await response.json();
      console.log(`Notification sent to ${user.username} (${userId}):`, data);
      sendResults.push({ token, status: 'sent', data });
    } catch (err) {
      console.error(`Failed to send notification to token: ${token}`, err);
      sendResults.push({ token, status: 'failed', error: err.message });
    }
  }

  return sendResults;
}

async function searchUsers(query) {
  if (!query) return [];

  const users = await User.find({
    username: { $regex: `^${query}`, $options: 'i' },
  }).limit(10).select('username');

  return users.map(user => user.username);
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
  getAccessToken
};
