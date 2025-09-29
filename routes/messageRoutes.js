const express3 = require('express');
const router3 = express3.Router();
const auth3 = require('../middleware/auth');
const {
  getAllMessages,
  sendMessage,
  searchUsersByUsername, // new controller
} = require('../controllers/messageController');

router3.get('/', auth3, getAllMessages);
router3.post('/send', auth3, sendMessage);

// New route for @username autocomplete
router3.get('/search', auth3, searchUsersByUsername);

module.exports = router3;
