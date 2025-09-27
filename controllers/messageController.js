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
    const { receiverId, text } = req.body;
    const senderId = req.user.id;

    if (!text) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    // Save message to DB
    const message = new Message({
      senderId,
      receiverId: receiverId || null, // allow null if broadcasting to all
      text,
    });
    await message.save();

    // Fetch sender info
    const sender = await User.findById(senderId);

    // Fetch all users to send notifications (except sender)
    const usersToNotify = await User.find({
      _id: { $ne: senderId },
      fcmTokens: { $exists: true, $ne: [] } // only users with at least one token
    });

    const sendResults = [];

    for (const user of usersToNotify) {
      for (const token of user.fcmTokens) {
        try {
          const payload = {
            _id: message._id.toString(),
            senderId: sender._id.toString(),
            senderName: sender.username,
            receiverId: user._id.toString(),
            text,
            createdAt: message.createdAt.toISOString(),
          };

          const r = await sendNotification(
            token,
            `New message from ${sender.username}`,
            text.length > 100 ? text.slice(0, 97) + '...' : text
          );

          console.log('FCM sent for token:', token);
          sendResults.push({ token, result: r });
        } catch (err) {
          console.error('FCM send error for token', token, err.message || err);
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