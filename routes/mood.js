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
    
    res.json({
      success: true,
      stats: {
        totalEntries: await MoodEntry.countDocuments({ sessionId }),
        moodDistribution,
        energyTrends,
        recentMoods: recentMoods.reverse(),
        moodDiversity: uniqueEmotions.length,
        mostCommonMood: moodDistribution[0]?._id || null,
        averageIntensity: moodDistribution.reduce((sum, mood) => sum + mood.avgIntensity, 0) / moodDistribution.length || 0
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
