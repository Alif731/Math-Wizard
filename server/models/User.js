const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher'], default: 'student' },
  // Mastery Map: Concept ID -> Mastery Details
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
      lastAttempts: [{ type: Boolean }] // For sliding window (e.g., last 10)
    }, { _id: false })
  },
  // Cache current ZPD nodes for quick access
  zpdNodes: [{ type: String }] 
}, { timestamps: true });

// Match password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
