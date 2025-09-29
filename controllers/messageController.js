const Message = require('../models/Message');
const User = require('../models/User');
const { sendNotificationToUser } = require('../services/notificationService');

// send message API: requires auth
async function getAllMessages(req, res) {
  try {
    const messages = await Message.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('senderId', 'username email')
      .populate('receiverId', 'username email');

    res.json({
      success: true,
      message: 'Messages fetched successfully',
      data: messages.reverse(), // oldest first
    });
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

    const sender = await User.findById(senderId);

    // Determine users to notify
    let usersToNotify = [];
    if (receiverId) {
      const user = await User.findById(receiverId);
      if (user && user.fcmTokens && user.fcmTokens.length > 0) {
        usersToNotify.push(user);
      }
    } else {
      usersToNotify = await User.find({
        _id: { $ne: senderId },
        fcmTokens: { $exists: true, $ne: [] },
      });
    }

    const sendResults = [];

    for (const user of usersToNotify) {
      try {
        const result = await sendNotificationToUser(
          user._id.toString(),
          `New message from ${sender.username}`,
          text.length > 100 ? text.slice(0, 97) + '...' : text
        );
        sendResults.push({ userId: user._id.toString(), status: 'sent', result });
      } catch (err) {
        console.error('FCM send error for user', user._id.toString(), err.message || err);
        sendResults.push({ userId: user._id.toString(), status: 'failed', error: err.message });
      }
    }

    res.json({ success: true, message: 'Message sent successfully', data: message, sendResults });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Search users by username for autocomplete
async function searchUsersByUsername(req, res) {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);

    const users = await User.find({
      username: { $regex: `^${query}`, $options: 'i' } // case-insensitive starts with
    }).limit(10).select('username');

    res.json(users.map(u => u.username));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}
module.exports = { getAllMessages, sendMessage, searchUsersByUsername };
