const { getAccessToken } = require('./notificationService');

(async () => {
  try {
    const token = await getAccessToken();
    console.log('Generated Access Token:', token);
  } catch (err) {
    console.error('Error generating token:', err.message);
  }
})();
