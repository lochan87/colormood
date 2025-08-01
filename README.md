# ColorMood: Emotion-Based Art Generator

A mental wellness app that combines generative AI with creativity to help users express and process their emotions through art, music, and journaling.

## Features

- **Mood Analysis**: Describe your current emotional state
- **AI Art Generation**: Create abstract art based on your mood using Gemini AI
- **Music Playlist**: Get curated music recommendations that match your emotional state
- **Journaling Prompts**: Receive personalized prompts for emotional reflection
- **Progress Tracking**: Log and track your emotional journey over time

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
│   └── music.js
├── services/
│   ├── geminiService.js
│   ├── musicService.js
│   └── artGenerator.js
├── server.js
├── .env  
└── package.json

```
---

## 🎯 How to Use ColorMood

### 1. Describe Your Mood
- Write about how you're feeling in natural language
- Be specific about emotions, causes, and intensity
- Example: "I'm feeling overwhelmed with work stress but excited about my weekend plans"

### 2. Get Your Personalized Content
- **AI Art**: Unique abstract art reflecting your emotional state
- **Music Playlist**: Songs that match your mood and energy
- **Journaling Prompts**: Thoughtful questions for reflection

### 3. Track Your Journey
- **Gallery**: View all your generated artwork
- **Statistics**: See patterns in your emotional journey
- **Rating System**: Help improve recommendations

---