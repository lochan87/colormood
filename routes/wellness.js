const express = require('express');
const router = express.Router();
const MoodEntry = require('../models/MoodEntry');
const GeneratedContent = require('../models/GeneratedContent');
const geminiService = require('../services/geminiService');

// Generate affirmations and quotes
router.post('/affirmations', async (req, res) => {
  try {
    const { moodEntryId, sessionId } = req.body;

    if (!moodEntryId || !sessionId) {
      return res.status(400).json({ 
        error: 'Missing required fields: moodEntryId and sessionId' 
      });
    }

    // Get mood entry
    const moodEntry = await MoodEntry.findOne({ 
      _id: moodEntryId, 
      sessionId 
    });

    if (!moodEntry) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    // Generate affirmations with AI
    const affirmationsData = await geminiService.generateAffirmations({
      primaryEmotion: moodEntry.primaryEmotion,
      emotionIntensity: moodEntry.emotionIntensity,
      energyLevel: moodEntry.energyLevel,
      secondaryEmotions: moodEntry.secondaryEmotions
    });

    // Save or update generated content
    let generatedContent = await GeneratedContent.findOne({ 
      moodEntryId, 
      sessionId 
    });

    if (generatedContent) {
      generatedContent.affirmations = affirmationsData.affirmations;
      generatedContent.inspirationalQuote = affirmationsData.inspirationalQuote;
      await generatedContent.save({ validateModifiedOnly: true });
    } else {
      generatedContent = new GeneratedContent({
        sessionId,
        moodEntryId,
        affirmations: affirmationsData.affirmations,
        inspirationalQuote: affirmationsData.inspirationalQuote
      });
      await generatedContent.save({ validateModifiedOnly: true });
    }

    res.json({
      success: true,
      affirmations: affirmationsData.affirmations,
      quote: affirmationsData.inspirationalQuote
    });

  } catch (error) {
    console.error('Error generating affirmations:', error);
    res.status(500).json({ 
      error: 'Failed to generate affirmations',
      message: error.message 
    });
  }
});

// Generate self-care activity suggestions
router.post('/self-care', async (req, res) => {
  try {
    const { moodEntryId, sessionId } = req.body;

    if (!moodEntryId || !sessionId) {
      return res.status(400).json({ 
        error: 'Missing required fields: moodEntryId and sessionId' 
      });
    }

    // Get mood entry
    const moodEntry = await MoodEntry.findOne({ 
      _id: moodEntryId, 
      sessionId 
    });

    if (!moodEntry) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    // Generate self-care activities with AI
    const selfCareData = await geminiService.generateSelfCareActivities({
      primaryEmotion: moodEntry.primaryEmotion,
      emotionIntensity: moodEntry.emotionIntensity,
      energyLevel: moodEntry.energyLevel,
      secondaryEmotions: moodEntry.secondaryEmotions
    });

    // Save or update generated content
    let generatedContent = await GeneratedContent.findOne({ 
      moodEntryId, 
      sessionId 
    });

    if (generatedContent) {
      generatedContent.selfCareActivities = selfCareData.activities;
      await generatedContent.save({ validateModifiedOnly: true });
    } else {
      generatedContent = new GeneratedContent({
        sessionId,
        moodEntryId,
        selfCareActivities: selfCareData.activities
      });
      await generatedContent.save({ validateModifiedOnly: true });
    }

    res.json({
      success: true,
      activities: selfCareData.activities
    });

  } catch (error) {
    console.error('Error generating self-care activities:', error);
    res.status(500).json({ 
      error: 'Failed to generate self-care activities',
      message: error.message 
    });
  }
});

// Get all wellness content for a mood entry
router.get('/:moodEntryId', async (req, res) => {
  try {
    const { moodEntryId } = req.params;
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    const generatedContent = await GeneratedContent.findOne({ 
      moodEntryId, 
      sessionId 
    });

    if (!generatedContent) {
      return res.status(404).json({ error: 'Wellness content not found' });
    }

    res.json({
      success: true,
      affirmations: generatedContent.affirmations || [],
      quote: generatedContent.inspirationalQuote || null,
      selfCareActivities: generatedContent.selfCareActivities || []
    });

  } catch (error) {
    console.error('Error fetching wellness content:', error);
    res.status(500).json({ 
      error: 'Failed to fetch wellness content',
      message: error.message 
    });
  }
});

module.exports = router;
