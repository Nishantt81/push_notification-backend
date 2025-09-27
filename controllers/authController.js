const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


async function signup(req, res) {
  try {
    const { username, email, password, fcmToken } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing fields',
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({ username, email, password: hashed });
    if (fcmToken) user.fcmTokens.push(fcmToken);

    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // ✅ Include success and message
    res.status(201).json({
      success: true,
      message: 'Signup successful',
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
}



async function login(req, res) {
  try {
    const { email, password, fcmToken } = req.body;

    // Validate request
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing fields',
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Store FCM token if provided and not already present
    if (fcmToken && !user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Send response with success, message, token, and user data
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
}



async function logout(req, res) {
// On frontend you can simply delete the JWT; optionally you can remove a specific token from user's fcmTokens
const { fcmToken } = req.body;
try {
if (!req.user) return res.json({ ok: true });
if (fcmToken) {
await User.updateOne({ _id: req.user.id }, { $pull: { fcmTokens: fcmToken } });
}
res.json({ ok: true });
} catch (err) {
console.error(err);
res.status(500).json({ message: 'Server error' });
}
}
module.exports = { signup, login, logout };