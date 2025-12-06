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
    required: false
  },
  artDescription: {
    type: String,
    required: false
  },
  artStyle: {
    type: String,
    required: false
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
  affirmations: [{
    text: String,
    tone: {
      type: String,
      enum: ['calming', 'energizing', 'grounding', 'uplifting']
    }
  }],
  inspirationalQuote: {
    text: String,
    author: String
  },
  selfCareActivities: [{
    title: String,
    description: String,
    duration: String,
    category: {
      type: String,
      enum: ['physical', 'creative', 'social', 'relaxation', 'mindfulness']
    },
    icon: String
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
    affirmationsRating: {
      type: Number,
      min: 1,
      max: 5
    },
    selfCareRating: {
      type: Number,
      min: 1,
      max: 5
    },
    overallRating: {
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
