const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  async analyzeMood(moodDescription) {
    try {
      const prompt = `
        Analyze the following mood description and extract emotional insights:
        "${moodDescription}"
        
        Please respond with a JSON object containing:
        {
          "primaryEmotion": "main emotion (one word)",
          "emotionIntensity": number from 1-10,
          "secondaryEmotions": ["array", "of", "secondary", "emotions"],
          "moodColors": ["color1", "color2", "color3"] (colors that represent this mood),
          "energyLevel": "very-low|low|moderate|high|very-high",
          "triggers": ["possible", "triggers", "or", "causes"],
          "socialMood": "isolated|selective|social|very-social"
        }
        
        Only respond with the JSON object, no additional text.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const cleanedResponse = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error analyzing mood:', error);
      throw new Error('Failed to analyze mood with AI');
    }
  }

  async generateArtPrompt(moodData) {
    try {
      const prompt = `
        Based on this mood analysis, create an abstract art description:
        Primary Emotion: ${moodData.primaryEmotion}
        Intensity: ${moodData.emotionIntensity}/10
        Colors: ${moodData.moodColors.join(', ')}
        Energy: ${moodData.energyLevel}
        Secondary emotions: ${moodData.secondaryEmotions.join(', ')}
        
        Respond with a JSON object:
        {
          "artPrompt": "detailed visual description for abstract art generation",
          "artDescription": "explanation of how the art reflects the mood",
          "artStyle": "artistic style (e.g., expressionist, surreal, minimalist, abstract)",
          "colorPalette": ["#hexcolor1", "#hexcolor2", "#hexcolor3", "#hexcolor4", "#hexcolor5"]
        }
        
        IMPORTANT: Generate 5-7 distinct hex color codes (format: #RRGGBB) that represent the emotion.
        Mix warm and cool tones for visual interest. Use vibrant, varied colors, not just single tones.
        Only respond with the JSON object.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const cleanedResponse = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error generating art prompt:', error);
      throw new Error('Failed to generate art prompt');
    }
  }

  async generateJournalingPrompts(moodData) {
    try {
      const prompt = `
        Create 3 journaling prompts for someone experiencing:
        Primary Emotion: ${moodData.primaryEmotion}
        Intensity: ${moodData.emotionIntensity}/10
        Secondary emotions: ${moodData.secondaryEmotions.join(', ')}
        Energy Level: ${moodData.energyLevel}
        
        Respond with a JSON object:
        {
          "prompts": [
            {
              "prompt": "thoughtful question or writing prompt",
              "category": "reflection|gratitude|goals|creativity|processing",
              "difficulty": "easy|medium|deep"
            }
          ]
        }
        
        Make prompts supportive, non-judgmental, and emotionally appropriate.
        Only respond with the JSON object.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const cleanedResponse = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error generating journaling prompts:', error);
      throw new Error('Failed to generate journaling prompts');
    }
  }

  async generateMusicRecommendations(moodData) {
    try {
      const prompt = `
        Recommend 5 songs that match this emotional state:
        Primary Emotion: ${moodData.primaryEmotion}
        Intensity: ${moodData.emotionIntensity}/10
        Energy Level: ${moodData.energyLevel}
        Secondary emotions: ${moodData.secondaryEmotions.join(', ')}
        
        Respond with a JSON object:
        {
          "playlist": [
            {
              "trackName": "song title",
              "artist": "artist name",
              "genre": "musical genre",
              "mood": "how this song matches the mood",
              "explanation": "why this song fits"
            }
          ]
        }
        
        Choose diverse genres and well-known songs when possible.
        Only respond with the JSON object.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const cleanedResponse = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error generating music recommendations:', error);
      throw new Error('Failed to generate music recommendations');
    }
  }

  async generateAffirmations(moodData) {
    try {
      const prompt = `
        Create 3 personalized affirmations for someone experiencing:
        Primary Emotion: ${moodData.primaryEmotion}
        Intensity: ${moodData.emotionIntensity}/10
        Energy Level: ${moodData.energyLevel}
        Secondary emotions: ${moodData.secondaryEmotions.join(', ')}
        
        Respond with a JSON object:
        {
          "affirmations": [
            {
              "text": "positive, empowering affirmation statement",
              "tone": "calming|energizing|grounding|uplifting"
            }
          ],
          "inspirationalQuote": {
            "text": "relevant inspirational quote",
            "author": "quote author or source"
          }
        }
        
        Make affirmations personal, present-tense, and emotionally validating.
        Choose a quote that resonates with their current emotional state.
        Only respond with the JSON object.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const cleanedResponse = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error generating affirmations:', error);
      throw new Error('Failed to generate affirmations');
    }
  }

  async generateSelfCareActivities(moodData) {
    try {
      const prompt = `
        Suggest 5-6 self-care activities for someone experiencing:
        Primary Emotion: ${moodData.primaryEmotion}
        Intensity: ${moodData.emotionIntensity}/10
        Energy Level: ${moodData.energyLevel}
        Secondary emotions: ${moodData.secondaryEmotions.join(', ')}
        
        Respond with a JSON object:
        {
          "activities": [
            {
              "title": "activity name",
              "description": "brief description",
              "duration": "5 min|10 min|15 min|30 min",
              "category": "physical|creative|social|relaxation|mindfulness",
              "icon": "walk|tea|music|book|chat|stretch|write|breathe"
            }
          ]
        }
        
        Suggest practical, accessible activities appropriate for their energy level.
        Mix quick activities with longer ones. Be specific and actionable.
        Only respond with the JSON object.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const cleanedResponse = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error generating self-care activities:', error);
      throw new Error('Failed to generate self-care activities');
    }
  }
}

module.exports = new GeminiService();
