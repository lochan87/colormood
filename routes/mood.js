const express = require('express');
const router = express.Router();
const MoodEntry = require('../models/MoodEntry');
const User = require('../models/User');
const geminiService = require('../services/geminiService');

// Analyze mood from description
router.post('/analyze', async (req, res) => {
  try {
    const { moodDescription, sessionId } = req.body;

    if (!moodDescription || !sessionId) {
      return res.status(400).json({ 
        error: 'Missing required fields: moodDescription and sessionId' 
      });
    }

    // Analyze mood with AI
    const moodAnalysis = await geminiService.analyzeMood(moodDescription);

    // Create mood entry
    const moodEntry = new MoodEntry({
      sessionId,
      moodDescription,
      ...moodAnalysis
    });

    await moodEntry.save();

    // Update user stats
    await User.findOneAndUpdate(
      { sessionId },
      { 
        $inc: { totalMoodEntries: 1 },
        $set: { lastActive: new Date() }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      moodEntry: {
        id: moodEntry._id,
        ...moodAnalysis,
        timestamp: moodEntry.timestamp
      }
    });

  } catch (error) {
    console.error('Error analyzing mood:', error);
    res.status(500).json({ 
      error: 'Failed to analyze mood',
      message: error.message 
    });
  }
});

// Get mood history for a session
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const skip = (page - 1) * limit;
    
    const moodEntries = await MoodEntry.find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-__v');

    const total = await MoodEntry.countDocuments({ sessionId });

    res.json({
      success: true,
      moodEntries,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + moodEntries.length < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching mood history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch mood history',
      message: error.message 
    });
  }
});

// Get mood statistics
router.get('/stats/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Get mood distribution
    const moodDistribution = await MoodEntry.aggregate([
      { $match: { sessionId } },
      { 
        $group: { 
          _id: '$primaryEmotion', 
          count: { $sum: 1 },
          avgIntensity: { $avg: '$emotionIntensity' }
        } 
      },
      { $sort: { count: -1 } }
    ]);

    // Get energy level trends
    const energyTrends = await MoodEntry.aggregate([
      { $match: { sessionId } },
      {
        $group: {
          _id: '$energyLevel',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get recent mood trends (last 7 entries)
    const recentMoods = await MoodEntry.find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(7)
      .select('primaryEmotion emotionIntensity timestamp');

    // Calculate mood diversity
    const uniqueEmotions = await MoodEntry.distinct('primaryEmotion', { sessionId });
    
    // Get top secondary emotions
    const secondaryEmotionsData = await MoodEntry.aggregate([
      { $match: { sessionId } },
      { $unwind: '$secondaryEmotions' },
      {
        $group: {
          _id: '$secondaryEmotions',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    
    const topSecondaryEmotion = secondaryEmotionsData[0]?._id || null;
    
    // Get average ratings from GeneratedContent (need this before wellness score)
    const GeneratedContent = require('../models/GeneratedContent');
    const ratingsData = await GeneratedContent.aggregate([
      { $match: { sessionId } },
      {
        $group: {
          _id: null,
          avgArtRating: { $avg: '$userFeedback.artRating' },
          avgMusicRating: { $avg: '$userFeedback.musicRating' },
          avgPromptsRating: { $avg: '$userFeedback.promptsRating' },
          avgAffirmationsRating: { $avg: '$userFeedback.affirmationsRating' },
          avgSelfCareRating: { $avg: '$userFeedback.selfCareRating' },
          avgOverallRating: { $avg: '$userFeedback.overallRating' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    const ratings = ratingsData[0] || {
      avgArtRating: 0,
      avgMusicRating: 0,
      avgPromptsRating: 0,
      avgAffirmationsRating: 0,
      avgSelfCareRating: 0,
      avgOverallRating: 0,
      totalRatings: 0
    };
    
    // Calculate wellness score (0-100)
    // Factors: mood diversity (30%), balanced intensity (30%), engagement (20%), positive ratings (20%)
    const totalEntries = await MoodEntry.countDocuments({ sessionId });
    const diversityScore = Math.min((uniqueEmotions.length / 10) * 30, 30); // Max 10 unique emotions
    const avgIntensity = moodDistribution.reduce((sum, mood) => sum + mood.avgIntensity, 0) / moodDistribution.length || 0;
    const intensityScore = (1 - Math.abs(avgIntensity - 5.5) / 5.5) * 30; // Closer to 5.5 is better
    const engagementScore = Math.min((totalEntries / 30) * 20, 20); // Max 30 entries
    
    const avgRating = (
      (ratings.avgArtRating || 0) + 
      (ratings.avgMusicRating || 0) + 
      (ratings.avgPromptsRating || 0) + 
      (ratings.avgAffirmationsRating || 0) + 
      (ratings.avgSelfCareRating || 0) + 
      (ratings.avgOverallRating || 0)
    ) / 6;
    const ratingScore = (avgRating / 5) * 20;
    
    const wellnessScore = Math.round(diversityScore + intensityScore + engagementScore + ratingScore);

    res.json({
      success: true,
      stats: {
        totalEntries: await MoodEntry.countDocuments({ sessionId }),
        moodDistribution,
        energyTrends,
        recentMoods: recentMoods.reverse(),
        moodDiversity: uniqueEmotions.length,
        mostCommonMood: moodDistribution[0]?._id || null,
        topSecondaryEmotion: topSecondaryEmotion,
        wellnessScore: wellnessScore,
        averageIntensity: moodDistribution.reduce((sum, mood) => sum + mood.avgIntensity, 0) / moodDistribution.length || 0,
        ratings: {
          art: ratings.avgArtRating || 0,
          music: ratings.avgMusicRating || 0,
          prompts: ratings.avgPromptsRating || 0,
          affirmations: ratings.avgAffirmationsRating || 0,
          selfCare: ratings.avgSelfCareRating || 0,
          overall: ratings.avgOverallRating || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching mood stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch mood statistics',
      message: error.message 
    });
  }
});

// Delete a mood entry
router.delete('/:moodId', async (req, res) => {
  try {
    const { moodId } = req.params;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    const deletedEntry = await MoodEntry.findOneAndDelete({ 
      _id: moodId, 
      sessionId 
    });

    if (!deletedEntry) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    // Update user stats
    await User.findOneAndUpdate(
      { sessionId },
      { 
        $inc: { totalMoodEntries: -1 }
      }
    );

    res.json({
      success: true,
      message: 'Mood entry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting mood entry:', error);
    res.status(500).json({ 
      error: 'Failed to delete mood entry',
      message: error.message 
    });
  }
});

module.exports = router;
