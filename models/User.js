const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  totalMoodEntries: {
    type: Number,
    default: 0
  },
  preferences: {
    favoriteColors: [String],
    preferredMusicGenres: [String],
    journalingStyle: {
      type: String,
      enum: ['reflective', 'creative', 'analytical', 'brief'],
      default: 'reflective'
    }
  }
}, {
  timestamps: true
});

// Update last active on save
userSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);
