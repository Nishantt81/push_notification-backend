const express3 = require('express');
const router3 = express3.Router();
const auth3 = require('../middleware/auth');
const { getAllMessages, sendMessage } = require('../controllers/messageController');


router3.get('/', auth3, getAllMessages);
router3.post('/send', auth3, sendMessage);


module.exports = router3;