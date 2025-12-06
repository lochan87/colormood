# ColorMood: Emotion-Based Art Generator

A mental wellness app that combines generative AI with creativity to help users express and process their emotions through art, music, and journaling.

## Features

- **Mood Analysis**: Describe your current emotional state and get AI-powered insights
- **AI Art Generation**: Create unique abstract art based on your mood using Gemini AI
- **Music Playlist**: Get curated music recommendations that match your emotional state (powered by Spotify API)
- **Journaling Prompts**: Receive personalized prompts for emotional reflection
- **Daily Affirmations**: Get uplifting affirmations tailored to your current mood
- **Self-Care Toolkit**: Receive personalized self-care activity suggestions based on your mood and energy levels
- **Progress Tracking**: Log and track your emotional journey over time
- **Art Gallery**: View all your mood-based artwork in one place
- **Comprehensive Statistics**: 
  - Mood distribution and trends
  - Energy level tracking
  - Top secondary emotions
  - Wellness score (0-100)
  - User feedback ratings
  - Recent mood timeline
- **Rating System**: Provide feedback on Art, Music, Prompts, Affirmations, Self-Care, and Overall Experience

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js with Express
- **AI**: Google Gemini API
- **Database**: MongoDB
- **APIs**: Spotify API for music recommendations

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your API keys
4. Start MongoDB service
5. Run the application: `npm run dev`

## Environment Variables

Create a `.env` file in the root directory:

```
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
PORT=3000
```

## Project Structure

```
colormood-app/
├── public/
│   ├── index.html
│   ├── style.css
│   ├── script.js
├── models/
│   ├── User.js
│   ├── MoodEntry.js
│   └── GeneratedContent.js
├── routes/
│   ├── mood.js
│   ├── art.js
│   ├── music.js
│   └── wellness.js
├── services/
│   ├── geminiService.js
│   ├── musicService.js
│   └── artGenerator.js
├── server.js
├── .env  
└── package.json

```

## 🎯 How to Use ColorMood

### 1. Describe Your Mood
- Write about how you're feeling in natural language
- Be specific about emotions, causes, and intensity
- Example: "I'm feeling overwhelmed with work stress but excited about my weekend plans"

### 2. Get Your Personalized Content
- **AI Art**: Unique abstract art reflecting your emotional state with 30-60+ visual elements
- **Music Playlist**: Songs that match your mood and energy with Spotify integration
- **Journaling Prompts**: Thoughtful questions for reflection and personal growth
- **Daily Affirmations**: Personalized positive affirmations and inspirational quotes
- **Self-Care Activities**: Tailored suggestions for physical, creative, social, relaxation, and mindfulness activities

### 3. Track Your Journey
- **Gallery**: View all your generated artwork
- **Statistics Dashboard**: 
  - Total mood entries and unique emotions tracked
  - Average emotional intensity
  - Most common mood and top secondary emotion
  - Wellness score based on mood diversity, intensity balance, engagement, and ratings
  - Energy level distribution trends
  - Recent mood timeline
  - Your feedback ratings across all features
- **Rating System**: Rate your experience with all features to help improve recommendations

---

**🎉 Enjoy exploring your emotions through art and creativity!**

Check it out at [ColorMood](https://colormood-wdnb.onrender.com)

**Happy mood tracking! 🎨✨**