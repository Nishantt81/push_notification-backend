const fetch = require('node-fetch');


async function sendNotificationToToken(token, title, body, data = {}) {
const serverKey = process.env.FCM_SERVER_KEY;
if (!serverKey) throw new Error('FCM_SERVER_KEY not defined in environment');


const message = {
to: token,
notification: {
title,
body
},
data
};


const res = await fetch('https://fcm.googleapis.com/fcm/send', {
method: 'POST',
headers: {
'Authorization': `key=${serverKey}`,
'Content-Type': 'application/json'
},
body: JSON.stringify(message)
});


return res.json();
}


module.exports = { sendNotificationToToken };