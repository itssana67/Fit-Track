const express = require('express');
const { getProfile, updateProfile, changePassword } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { profileRules, passwordRules } = require('./rules');

const router = express.Router();
router.use(protect);

router.get('/me', getProfile);
router.put('/me', validateBody(profileRules, { partial: true }), updateProfile);
router.put('/me/password', validateBody(passwordRules), changePassword);

module.exports = router;
