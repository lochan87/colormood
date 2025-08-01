const express = require('express');
const router = express.Router();
const MoodEntry = require('../models/MoodEntry');
const GeneratedContent = require('../models/GeneratedContent');
const geminiService = require('../services/geminiService');
const artGenerator = require('../services/artGenerator');

// Generate art based on mood
router.post('/generate', async (req, res) => {
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

    // Generate art prompt with AI
    const artData = await geminiService.generateArtPrompt({
      primaryEmotion: moodEntry.primaryEmotion,
      emotionIntensity: moodEntry.emotionIntensity,
      moodColors: moodEntry.moodColors,
      energyLevel: moodEntry.energyLevel,
      secondaryEmotions: moodEntry.secondaryEmotions
    });

    // Generate actual art
    const generatedArt = artGenerator.generateAbstractArt(artData, {
      primaryEmotion: moodEntry.primaryEmotion,
      emotionIntensity: moodEntry.emotionIntensity,
      energyLevel: moodEntry.energyLevel
    });

    // Save or update generated content
    let generatedContent = await GeneratedContent.findOne({ 
      moodEntryId, 
      sessionId 
    });

    if (generatedContent) {
      generatedContent.artPrompt = artData.artPrompt;
      generatedContent.artDescription = artData.artDescription;
      generatedContent.artStyle = artData.artStyle;
      generatedContent.colorPalette = artData.colorPalette;
      await generatedContent.save();
    } else {
      generatedContent = new GeneratedContent({
        sessionId,
        moodEntryId,
        artPrompt: artData.artPrompt,
        artDescription: artData.artDescription,
        artStyle: artData.artStyle,
        colorPalette: artData.colorPalette,
        musicPlaylist: [],
        journalingPrompts: []
      });
      await generatedContent.save();
    }

    res.json({
      success: true,
      art: {
        id: generatedContent._id,
        prompt: artData.artPrompt,
        description: artData.artDescription,
        style: artData.artStyle,
        colorPalette: artData.colorPalette,
        svg: generatedArt.svg,
        metadata: generatedArt.metadata
      }
    });

  } catch (error) {
    console.error('Error generating art:', error);
    res.status(500).json({ 
      error: 'Failed to generate art',
      message: error.message 
    });
  }
});

// Get generated art for a mood entry
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
      return res.status(404).json({ error: 'Generated art not found' });
    }

    const moodEntry = await MoodEntry.findById(moodEntryId);
    
    // Regenerate SVG if needed
    const generatedArt = artGenerator.generateAbstractArt({
      artStyle: generatedContent.artStyle,
      colorPalette: generatedContent.colorPalette
    }, {
      primaryEmotion: moodEntry.primaryEmotion,
      emotionIntensity: moodEntry.emotionIntensity,
      energyLevel: moodEntry.energyLevel
    });

    res.json({
      success: true,
      art: {
        id: generatedContent._id,
        prompt: generatedContent.artPrompt,
        description: generatedContent.artDescription,
        style: generatedContent.artStyle,
        colorPalette: generatedContent.colorPalette,
        svg: generatedArt.svg,
        metadata: generatedArt.metadata,
        createdAt: generatedContent.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching generated art:', error);
    res.status(500).json({ 
      error: 'Failed to fetch generated art',
      message: error.message 
    });
  }
});

// Rate generated art
router.post('/:contentId/rate', async (req, res) => {
  try {
    const { contentId } = req.params;
    const { sessionId, rating, comments } = req.body;

    if (!sessionId || !rating) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId and rating' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }

    const generatedContent = await GeneratedContent.findOneAndUpdate(
      { _id: contentId, sessionId },
      { 
        $set: { 
          'userFeedback.artRating': rating,
          'userFeedback.comments': comments || ''
        }
      },
      { new: true }
    );

    if (!generatedContent) {
      return res.status(404).json({ error: 'Generated content not found' });
    }

    res.json({
      success: true,
      message: 'Art rating saved successfully',
      feedback: generatedContent.userFeedback
    });

  } catch (error) {
    console.error('Error rating art:', error);
    res.status(500).json({ 
      error: 'Failed to save art rating',
      message: error.message 
    });
  }
});

// Get art gallery for a session
router.get('/gallery/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 12, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const artPieces = await GeneratedContent.find({ 
      sessionId,
      artPrompt: { $exists: true }
    })
    .populate('moodEntryId', 'primaryEmotion emotionIntensity timestamp moodDescription')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .select('artPrompt artDescription artStyle colorPalette userFeedback createdAt moodEntryId');

    const total = await GeneratedContent.countDocuments({ 
      sessionId,
      artPrompt: { $exists: true }
    });

    // Generate thumbnails for each art piece
    const gallery = artPieces.map(piece => {
      const thumbnailArt = artGenerator.generateAbstractArt({
        artStyle: piece.artStyle,
        colorPalette: piece.colorPalette
      }, {
        primaryEmotion: piece.moodEntryId.primaryEmotion,
        emotionIntensity: piece.moodEntryId.emotionIntensity,
        energyLevel: 'moderate' // Default for thumbnail
      });

      return {
        id: piece._id,
        moodId: piece.moodEntryId._id,
        description: piece.artDescription,
        style: piece.artStyle,
        colorPalette: piece.colorPalette,
        mood: piece.moodEntryId.primaryEmotion,
        intensity: piece.moodEntryId.emotionIntensity,
        thumbnail: thumbnailArt.svg.replace(/width="\d+"/, 'width="200"').replace(/height="\d+"/, 'height="150"'),
        rating: piece.userFeedback?.artRating || null,
        createdAt: piece.createdAt
      };
    });

    res.json({
      success: true,
      gallery,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + gallery.length < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching art gallery:', error);
    res.status(500).json({ 
      error: 'Failed to fetch art gallery',
      message: error.message 
    });
  }
});

module.exports = router;
