const express2 = require('express');
const router = express2.Router();
const { signup, login, logout } = require('../controllers/authController');
const auth = require('../middleware/auth');


router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', auth, logout);


module.exports = router;