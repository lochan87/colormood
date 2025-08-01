const mongoose = require('mongoose');

const generatedContentSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true
  },
  moodEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MoodEntry',
    required: true
  },
  artPrompt: {
    type: String,
    required: true
  },
  artDescription: {
    type: String,
    required: true
  },
  artStyle: {
    type: String,
    required: true
  },
  colorPalette: [String],
  musicPlaylist: [{
    trackName: String,
    artist: String,
    genre: String,
    mood: String,
    spotifyId: String,
    previewUrl: String
  }],
  journalingPrompts: [{
    prompt: String,
    category: {
      type: String,
      enum: ['reflection', 'gratitude', 'goals', 'creativity', 'processing']
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'deep']
    }
  }],
  userFeedback: {
    artRating: {
      type: Number,
      min: 1,
      max: 5
    },
    musicRating: {
      type: Number,
      min: 1,
      max: 5
    },
    promptsRating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
generatedContentSchema.index({ sessionId: 1, createdAt: -1 });
generatedContentSchema.index({ moodEntryId: 1 });

module.exports = mongoose.model('GeneratedContent', generatedContentSchema);
