const express = require('express');
const router = express.Router();
const {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUserRecentActivity,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimitMiddleware');

router.post('/', registerLimiter, registerUser);
router.post('/auth', loginLimiter, authUser);
router.post('/logout', logoutUser);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.get('/recent-activity', protect, getUserRecentActivity);

module.exports = router;
