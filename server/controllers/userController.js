const User = require('../models/User');
const Attempt = require('../models/Attempt');
const generateToken = require('../utils/generateToken');

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id);

    res.status(200).json({
      _id: user._id,
      username: user.username,
      role: user.role,
      zpdNodes: user.zpdNodes,
      avatar: user.avatar,
    });
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  const { username, password, role } = req.body;

  const userExists = await User.findOne({ username });

  if (userExists) {
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  const user = await User.create({
    username,
    password,
    role: role || 'student',
    mastery: {},
    zpdNodes: ['foundation_signs'], // Initial ZPD
    avatar: '🐱',
  });

  if (user) {
    generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role,
      zpdNodes: user.zpdNodes,
      avatar: user.avatar,
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      avatar: user.avatar,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // If password is being updated, check current password
    if (req.body.password) {
      if (!req.body.currentPassword) {
        res.status(400);
        throw new Error('Please provide current password to change password');
      }

      const isMatch = await user.matchPassword(req.body.currentPassword);
      if (!isMatch) {
        res.status(401).json({ message: 'Invalid current password' });
        return;
      }
      user.password = req.body.password;
    }

    user.username = req.body.username || user.username;
    user.avatar = req.body.avatar || user.avatar;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Get user recent activity
// @route   GET /api/users/recent-activity
// @access  Private
const getUserRecentActivity = async (req, res) => {
  const attempts = await Attempt.find({ user: req.user._id })
    .sort({ timestamp: -1 })
    .limit(5);

  res.json(attempts);
};

module.exports = {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUserRecentActivity,
};
