const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
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

module.exports = mongoose.model('User', userSchema);
