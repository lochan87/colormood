const express = require('express');
const router = express.Router();
const MoodEntry = require('../models/MoodEntry');
const GeneratedContent = require('../models/GeneratedContent');
const geminiService = require('../services/geminiService');
const musicService = require('../services/musicService');

// Generate music playlist and journaling prompts
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

    const moodData = {
      primaryEmotion: moodEntry.primaryEmotion,
      emotionIntensity: moodEntry.emotionIntensity,
      secondaryEmotions: moodEntry.secondaryEmotions,
      energyLevel: moodEntry.energyLevel
    };

    // Generate music recommendations and journaling prompts in parallel
    const [musicRecommendations, journalingPromptsData] = await Promise.all([
      geminiService.generateMusicRecommendations(moodData),
      geminiService.generateJournalingPrompts(moodData)
    ]);

    // Enrich music playlist with Spotify data
    let enrichedPlaylist = [];
    try {
      enrichedPlaylist = await musicService.enrichPlaylist(musicRecommendations.playlist);
    } catch (spotifyError) {
      console.warn('Spotify enrichment failed, using AI recommendations only:', spotifyError.message);
      enrichedPlaylist = musicRecommendations.playlist;
    }

    // Save or update generated content
    let generatedContent = await GeneratedContent.findOne({ 
      moodEntryId, 
      sessionId 
    });

    if (generatedContent) {
      generatedContent.musicPlaylist = enrichedPlaylist;
      generatedContent.journalingPrompts = journalingPromptsData.prompts;
      await generatedContent.save();
    } else {
      generatedContent = new GeneratedContent({
        sessionId,
        moodEntryId,
        artPrompt: '',
        artDescription: '',
        artStyle: '',
        colorPalette: [],
        musicPlaylist: enrichedPlaylist,
        journalingPrompts: journalingPromptsData.prompts
      });
      await generatedContent.save();
    }

    res.json({
      success: true,
      content: {
        id: generatedContent._id,
        musicPlaylist: enrichedPlaylist,
        journalingPrompts: journalingPromptsData.prompts,
        mood: {
          emotion: moodEntry.primaryEmotion,
          intensity: moodEntry.emotionIntensity,
          energy: moodEntry.energyLevel
        }
      }
    });

  } catch (error) {
    console.error('Error generating music and prompts:', error);
    res.status(500).json({ 
      error: 'Failed to generate music and journaling prompts',
      message: error.message 
    });
  }
});

// Get music playlist for a mood entry
router.get('/playlist/:moodEntryId', async (req, res) => {
  try {
    const { moodEntryId } = req.params;
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    const generatedContent = await GeneratedContent.findOne({ 
      moodEntryId, 
      sessionId 
    }).populate('moodEntryId', 'primaryEmotion emotionIntensity energyLevel moodDescription');

    if (!generatedContent || !generatedContent.musicPlaylist.length) {
      return res.status(404).json({ error: 'Music playlist not found' });
    }

    res.json({
      success: true,
      playlist: {
        id: generatedContent._id,
        tracks: generatedContent.musicPlaylist,
        mood: {
          emotion: generatedContent.moodEntryId.primaryEmotion,
          intensity: generatedContent.moodEntryId.emotionIntensity,
          energy: generatedContent.moodEntryId.energyLevel,
          description: generatedContent.moodEntryId.moodDescription
        },
        createdAt: generatedContent.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching music playlist:', error);
    res.status(500).json({ 
      error: 'Failed to fetch music playlist',
      message: error.message 
    });
  }
});

// Get journaling prompts for a mood entry
router.get('/prompts/:moodEntryId', async (req, res) => {
  try {
    const { moodEntryId } = req.params;
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    const generatedContent = await GeneratedContent.findOne({ 
      moodEntryId, 
      sessionId 
    }).populate('moodEntryId', 'primaryEmotion emotionIntensity energyLevel moodDescription');

    if (!generatedContent || !generatedContent.journalingPrompts.length) {
      return res.status(404).json({ error: 'Journaling prompts not found' });
    }

    res.json({
      success: true,
      prompts: {
        id: generatedContent._id,
        questions: generatedContent.journalingPrompts,
        mood: {
          emotion: generatedContent.moodEntryId.primaryEmotion,
          intensity: generatedContent.moodEntryId.emotionIntensity,
          energy: generatedContent.moodEntryId.energyLevel,
          description: generatedContent.moodEntryId.moodDescription
        },
        createdAt: generatedContent.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching journaling prompts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch journaling prompts',
      message: error.message 
    });
  }
});

// Get mood-based music recommendations from Spotify
router.post('/spotify-recommendations', async (req, res) => {
  try {
    const { mood, energy, genres } = req.body;

    if (!mood || !energy) {
      return res.status(400).json({ 
        error: 'Missing required fields: mood and energy' 
      });
    }

    const recommendations = await musicService.getMoodBasedRecommendations(
      mood, 
      energy, 
      genres || []
    );

    res.json({
      success: true,
      recommendations,
      mood,
      energy
    });

  } catch (error) {
    console.error('Error getting Spotify recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get Spotify recommendations',
      message: error.message 
    });
  }
});

// Rate music playlist
router.post('/:contentId/rate-music', async (req, res) => {
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
          'userFeedback.musicRating': rating,
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
      message: 'Music rating saved successfully',
      feedback: generatedContent.userFeedback
    });

  } catch (error) {
    console.error('Error rating music:', error);
    res.status(500).json({ 
      error: 'Failed to save music rating',
      message: error.message 
    });
  }
});

// Rate journaling prompts
router.post('/:contentId/rate-prompts', async (req, res) => {
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
          'userFeedback.promptsRating': rating,
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
      message: 'Prompts rating saved successfully',
      feedback: generatedContent.userFeedback
    });

  } catch (error) {
    console.error('Error rating prompts:', error);
    res.status(500).json({ 
      error: 'Failed to save prompts rating',
      message: error.message 
    });
  }
});

module.exports = router;
