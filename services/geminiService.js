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
          "artStyle": "artistic style (e.g., expressionist, surreal, minimalist)",
          "colorPalette": ["specific", "hex", "colors"]
        }
        
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
}

module.exports = new GeminiService();
