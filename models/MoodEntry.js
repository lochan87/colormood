const mongoose = require('mongoose');

const moodEntrySchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true
  },
  moodDescription: {
    type: String,
    required: true,
    trim: true
  },
  primaryEmotion: {
    type: String,
    required: true
  },
  emotionIntensity: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  secondaryEmotions: [String],
  moodColors: [String],
  triggers: [String],
  energyLevel: {
    type: String,
    enum: ['very-low', 'low', 'moderate', 'high', 'very-high'],
    required: true
  },
  socialMood: {
    type: String,
    enum: ['isolated', 'selective', 'social', 'very-social'],
    default: 'moderate'
  },
  weatherInfluence: {
    type: String,
    enum: ['none', 'slight', 'moderate', 'significant']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
moodEntrySchema.index({ sessionId: 1, timestamp: -1 });
moodEntrySchema.index({ primaryEmotion: 1 });

module.exports = mongoose.model('MoodEntry', moodEntrySchema);
