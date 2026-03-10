const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
    required() {
      return this.authProvider === 'local';
    },
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  role: { type: String, enum: ['student', 'teacher'], default: 'student' },
  mastery: {
    type: Map,
    of: new mongoose.Schema({
      status: {
        type: String,
        enum: ['locked', 'unlocked', 'mastered'],
        default: 'locked'
      },
      successCount: { type: Number, default: 0 },
      attemptCount: { type: Number, default: 0 },
      lastAttempts: [{ type: Boolean }]
    }, { _id: false })
  },
  zpdNodes: [{ type: String }],
  avatar: { type: String, default: '🐱' }
}, { timestamps: true });

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    return false;
  }

  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
  if (!this.password || !this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
