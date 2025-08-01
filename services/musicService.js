const axios = require('axios');

class MusicService {
  constructor() {
    this.spotifyToken = null;
    this.tokenExpiry = null;
  }

  async getSpotifyToken() {
    if (this.spotifyToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.spotifyToken;
    }

    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
          }
        }
      );

      this.spotifyToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      return this.spotifyToken;
    } catch (error) {
      console.error('Error getting Spotify token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Spotify');
    }
  }

  async searchTrack(trackName, artist) {
    try {
      const token = await this.getSpotifyToken();
      const query = `track:"${trackName}" artist:"${artist}"`;
      
      const response = await axios.get('https://api.spotify.com/v1/search', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          q: query,
          type: 'track',
          limit: 1
        }
      });

      const tracks = response.data.tracks.items;
      if (tracks.length > 0) {
        const track = tracks[0];
        return {
          spotifyId: track.id,
          previewUrl: track.preview_url,
          spotifyUrl: track.external_urls.spotify,
          albumImage: track.album.images[0]?.url
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error searching for track "${trackName}" by "${artist}":`, error.response?.data || error.message);
      return null;
    }
  }

  async enrichPlaylist(playlist) {
    const enrichedPlaylist = [];
    
    for (const track of playlist) {
      try {
        const spotifyData = await this.searchTrack(track.trackName, track.artist);
        
        enrichedPlaylist.push({
          ...track,
          spotifyId: spotifyData?.spotifyId || null,
          previewUrl: spotifyData?.previewUrl || null,
          spotifyUrl: spotifyData?.spotifyUrl || null,
          albumImage: spotifyData?.albumImage || null
        });
        
        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error enriching track: ${track.trackName}`, error);
        enrichedPlaylist.push(track);
      }
    }

    return enrichedPlaylist;
  }

  async getMoodBasedRecommendations(mood, energy, genres = []) {
    try {
      const token = await this.getSpotifyToken();
      
      // Map mood and energy to Spotify audio features
      const audioFeatures = this.mapMoodToAudioFeatures(mood, energy);
      
      const response = await axios.get('https://api.spotify.com/v1/recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          limit: 10,
          seed_genres: genres.length > 0 ? genres.slice(0, 5).join(',') : 'pop,rock,indie',
          target_valence: audioFeatures.valence,
          target_energy: audioFeatures.energy,
          target_danceability: audioFeatures.danceability,
          target_acousticness: audioFeatures.acousticness
        }
      });

      return response.data.tracks.map(track => ({
        trackName: track.name,
        artist: track.artists[0].name,
        genre: track.artists[0].genres?.[0] || 'unknown',
        mood: mood,
        spotifyId: track.id,
        previewUrl: track.preview_url,
        spotifyUrl: track.external_urls.spotify,
        albumImage: track.album.images[0]?.url
      }));
    } catch (error) {
      console.error('Error getting mood-based recommendations:', error.response?.data || error.message);
      return [];
    }
  }

  mapMoodToAudioFeatures(mood, energy) {
    const moodMap = {
      'happy': { valence: 0.8, energy: 0.7, danceability: 0.7, acousticness: 0.3 },
      'sad': { valence: 0.2, energy: 0.3, danceability: 0.3, acousticness: 0.7 },
      'angry': { valence: 0.3, energy: 0.9, danceability: 0.6, acousticness: 0.2 },
      'calm': { valence: 0.5, energy: 0.3, danceability: 0.4, acousticness: 0.8 },
      'excited': { valence: 0.9, energy: 0.9, danceability: 0.8, acousticness: 0.2 },
      'anxious': { valence: 0.3, energy: 0.7, danceability: 0.4, acousticness: 0.5 },
      'peaceful': { valence: 0.6, energy: 0.2, danceability: 0.3, acousticness: 0.9 },
      'energetic': { valence: 0.7, energy: 0.9, danceability: 0.8, acousticness: 0.3 }
    };

    const energyMap = {
      'very-low': 0.1,
      'low': 0.3,
      'moderate': 0.5,
      'high': 0.7,
      'very-high': 0.9
    };

    const baseFeatures = moodMap[mood.toLowerCase()] || moodMap['calm'];
    const energyMultiplier = energyMap[energy] || 0.5;

    return {
      ...baseFeatures,
      energy: Math.min(baseFeatures.energy * energyMultiplier * 1.5, 1.0)
    };
  }
}

module.exports = new MusicService();
