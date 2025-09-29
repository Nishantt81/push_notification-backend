const Message = require('../models/Message');
const User = require('../models/User');
// const { sendNotificationToToken } = require('../utils/sendNotification');
const { sendNotification } = require('../services/notificationService');



// send message API: requires auth
async function getAllMessages(req, res) {
  try {
    // Fetch all messages
    const messages = await Message.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('senderId', 'username email')
      .populate('receiverId', 'username email');

    res.json({ success: true, message: 'Messages fetched successfully', data: messages.reverse() }); // oldest first
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}




async function sendMessage(req, res) {
  try {
    let { receiverId, text } = req.body;
    const senderId = req.user.id;

    if (!text) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    // Check for @username in message
    const regex = /@(\w+)/;
    const match = text.match(regex);
    if (match) {
      const username = match[1];
      const user = await User.findOne({ username });
      if (user) {
        receiverId = user._id.toString(); // override receiverId
      } else {
        return res.status(400).json({ message: `User ${username} not found` });
      }
    }

    // Save message to DB
    const message = new Message({
      senderId,
      receiverId: receiverId || null, // null = broadcast
      text,
    });
    await message.save();

    // Fetch sender info
    const sender = await User.findById(senderId);

    // Determine who to notify
    let usersToNotify = [];
    if (receiverId) {
      // notify only the specified user
      const user = await User.findById(receiverId);
      if (user && user.fcmTokens && user.fcmTokens.length > 0) {
        usersToNotify.push(user);
      }
    } else {
      // broadcast to all except sender
      usersToNotify = await User.find({
        _id: { $ne: senderId },
        fcmTokens: { $exists: true, $ne: [] },
      });
    }

    const sendResults = [];

    for (const user of usersToNotify) {
      for (const token of user.fcmTokens) {
        try {
          await sendNotification(
            token,
            `New message from ${sender.username}`,
            text.length > 100 ? text.slice(0, 97) + '...' : text
          );
          sendResults.push({ token, status: 'sent' });
        } catch (err) {
          console.error('FCM send error for token', token, err.message || err);
          sendResults.push({ token, status: 'failed', error: err.message });
        }
      }
    }

    res.json({ success: true, message: 'Message sent successfully', data: message, sendResults });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}





module.exports = { getAllMessages, sendMessage };