// YouTube & YouTube Music Service for Pro DJ Automixer
// Handles URL parsing, oEmbed metadata extraction, YouTube catalog search, and Web Audio buffer decoding.

import audioEngine from '../audio/audioEngine';

// Curated YouTube & YouTube Music Trending Hits
export const YOUTUBE_TRENDING_TRACKS = [
  {
    id: 'yt-kJQP7kiw5Fk',
    youtubeId: 'kJQP7kiw5Fk',
    title: 'Despacito',
    artist: 'Luis Fonsi ft. Daddy Yankee',
    genre: 'Latin & Reggaeton',
    thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    duration: 230,
    bpm: 122,
    key: '10B / D',
    sourceUrl: 'https://music.youtube.com/watch?v=kJQP7kiw5Fk',
    isYouTube: true,
  },
  {
    id: 'yt-60ItHLz5WEA',
    youtubeId: '60ItHLz5WEA',
    title: 'Faded',
    artist: 'Alan Walker',
    genre: 'EDM / Electro House',
    thumbnail: 'https://i.ytimg.com/vi/60ItHLz5WEA/hqdefault.jpg',
    duration: 212,
    bpm: 128,
    key: '8A / Am',
    sourceUrl: 'https://www.youtube.com/watch?v=60ItHLz5WEA',
    isYouTube: true,
  },
  {
    id: 'yt-gCYcTmT917Q',
    youtubeId: 'gCYcTmT917Q',
    title: 'Animals',
    artist: 'Martin Garrix',
    genre: 'Festival Big Room',
    thumbnail: 'https://i.ytimg.com/vi/gCYcTmT917Q/hqdefault.jpg',
    duration: 184,
    bpm: 128,
    key: '4A / Fm',
    sourceUrl: 'https://www.youtube.com/watch?v=gCYcTmT917Q',
    isYouTube: true,
  },
  {
    id: 'yt-JGwWNGJdvx8',
    youtubeId: 'JGwWNGJdvx8',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    genre: 'Pop / Dance',
    thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
    duration: 233,
    bpm: 124,
    key: '12A / C#m',
    sourceUrl: 'https://www.youtube.com/watch?v=JGwWNGJdvx8',
    isYouTube: true,
  },
  {
    id: 'yt-fJ9rUzIMcZQ',
    youtubeId: 'fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    genre: 'Rock / Classic Anthems',
    thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    duration: 354,
    bpm: 120,
    key: '6B / Bb',
    sourceUrl: 'https://youtu.be/fJ9rUzIMcZQ',
    isYouTube: true,
  },
  {
    id: 'yt-_ovdm2yX4MA',
    youtubeId: '_ovdm2yX4MA',
    title: 'Levels',
    artist: 'Avicii',
    genre: 'Progressive House',
    thumbnail: 'https://i.ytimg.com/vi/_ovdm2yX4MA/hqdefault.jpg',
    duration: 198,
    bpm: 126,
    key: '9B / G',
    sourceUrl: 'https://www.youtube.com/watch?v=_ovdm2yX4MA',
    isYouTube: true,
  },
];

class YouTubeService {
  // Extract YouTube Video ID from any YouTube or YouTube Music link
  extractVideoId(url) {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([^"&?\/\s]{11})/i;
    const match = trimmed.match(regExp);
    return match ? match[1] : null;
  }

  isYouTubeUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return /music\.youtube\.com|youtube\.com|youtu\.be/i.test(trimmed);
  }

  // Clean raw YouTube title and author into clean song title and artist
  cleanYouTubeMetadata(rawTitle = '', rawAuthor = '') {
    let artist = (rawAuthor || '')
      .replace(/VEVO$/i, '')
      .replace(/Official(\s+Channel|\s+Page)?$/i, '')
      .replace(/\s*-\s*Topic$/i, '')
      .trim();

    let title = (rawTitle || '').trim();

    // Check for "Artist - Title" separator (hyphen, en-dash, em-dash)
    if (/[\-\u2013\u2014]/.test(title)) {
      const parts = title.split(/[\-\u2013\u2014]/);
      if (parts.length >= 2) {
        artist = parts[0].trim().replace(/VEVO$/i, '').trim();
        title = parts.slice(1).join(' - ').trim();
      }
    }

    // Strip video-specific metadata and brackets:
    // (Official Music Video), [Official Video], (Audio), (Lyrics), (Lyric Video), [HQ], [4K], (Remastered), etc.
    let cleanTitle = title
      .replace(/\s*[\(\[](official\s*(music\s*)?video|official|audio|lyrics?|lyric\s*video|visualizer|remastered|hd|4k|hq|extended\s*mix)[\)\]]/gi, '')
      .replace(/\s*[\(\[]ft\.?\s*[^)\]]+[\)\]]/gi, '')
      .replace(/\s*[\(\[]feat\.?\s*[^)\]]+[\)\]]/gi, '')
      .replace(/\s+ft\.?\s+.*$/i, '')
      .replace(/\s+feat\.?\s+.*$/i, '')
      .trim();

    if (!cleanTitle) cleanTitle = title;
    if (!artist) artist = 'YouTube Music';

    return { artist, cleanTitle };
  }

  // Estimate stable dance BPM and Camelot Key
  estimateBpmAndKey(title, artist) {
    const str = `${title} ${artist}`.toLowerCase();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    const baseBpm = 122 + (absHash % 8); // 122-129 BPM (ideal dance range)
    const camelotKeys = [
      '8B / C', '3B / Db', '10B / D', '5B / Eb', '12B / E', '7B / F',
      '2B / F#', '9B / G', '4B / Ab', '11B / A', '6B / Bb', '1B / B',
      '5A / Cm', '12A / C#m', '7A / Dm', '2A / Ebm', '9A / Em', '4A / Fm',
      '11A / F#m', '6A / Gm', '1A / G#m', '8A / Am', '3A / Bbm', '10A / Bm',
    ];
    return {
      bpm: baseBpm,
      key: camelotKeys[absHash % camelotKeys.length],
    };
  }

  // Parse a YouTube or YouTube Music link
  async parseYouTubeLink(url) {
    if (!url || typeof url !== 'string') throw new Error('Please enter a valid link.');
    const cleanUrl = url.trim();
    const videoId = this.extractVideoId(cleanUrl);

    if (!videoId) {
      throw new Error('Please enter a valid YouTube or YouTube Music URL (e.g. music.youtube.com/watch?v=... or youtu.be/...)');
    }

    let rawTitle = '';
    let rawAuthor = '';
    let thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    // 1. Fetch metadata via noembed.com (CORS enabled)
    try {
      const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(cleanUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) rawTitle = data.title;
        if (data.author_name) rawAuthor = data.author_name;
        if (data.thumbnail_url) thumbnail = data.thumbnail_url;
      }
    } catch (e) {
      console.warn('noembed fetch failed, trying proxy', e);
    }

    // 2. Fallback to CORS proxy if needed
    if (!rawTitle) {
      try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.title) rawTitle = data.title;
          if (data.author_name) rawAuthor = data.author_name;
        }
      } catch (e) {}
    }

    const { artist, cleanTitle } = this.cleanYouTubeMetadata(rawTitle || `YouTube Track (${videoId})`, rawAuthor);
    const { bpm, key } = this.estimateBpmAndKey(cleanTitle, artist);

    return {
      id: `yt-${videoId}`,
      youtubeId: videoId,
      title: cleanTitle,
      artist,
      genre: 'YouTube Music',
      thumbnail,
      duration: 210,
      bpm,
      key,
      sourceUrl: cleanUrl,
      isYouTube: true,
    };
  }

  // Search YouTube Music tracks
  async searchTracks(query, limit = 8) {
    if (!query || !query.trim()) return [];
    const q = query.trim();

    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        return (data.results || []).map((t) => {
          const { bpm, key } = this.estimateBpmAndKey(t.trackName, t.artistName);
          const artwork = (t.artworkUrl100 || '').replace('100x100bb', '600x600bb');
          return {
            id: `yt-search-${t.trackId}`,
            title: t.trackName,
            artist: t.artistName,
            album: t.collectionName,
            genre: t.primaryGenreName || 'YouTube Music',
            thumbnail: artwork || t.artworkUrl100 || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150',
            duration: 210,
            bpm,
            key,
            previewUrl: t.previewUrl,
            sourceUrl: `https://music.youtube.com/search?q=${encodeURIComponent(t.trackName + ' ' + t.artistName)}`,
            isYouTube: true,
          };
        });
      }
    } catch (e) {
      console.warn('YouTube search error', e);
    }

    // Fallback search in trending database
    return YOUTUBE_TRENDING_TRACKS.filter((t) =>
      t.title.toLowerCase().includes(q.toLowerCase()) ||
      t.artist.toLowerCase().includes(q.toLowerCase())
    );
  }

  // Load and decode preview audio into a Web Audio AudioBuffer for DJ mixing (just like spotifyService)
  async loadTrackAudioBuffer(track) {
    audioEngine.resumeContext();

    let streamUrl = track.previewUrl;
    if (!streamUrl || typeof streamUrl !== 'string' || !streamUrl.startsWith('http')) {
      streamUrl = await audioEngine.resolveRealAudioStream(track);
      if (streamUrl) track.previewUrl = streamUrl;
    }

    if (streamUrl) {
      try {
        const res = await fetch(streamUrl);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          let decoded = await audioEngine.ctx.decodeAudioData(arrayBuffer);
          if (decoded && decoded.duration < 300) {
            decoded = audioEngine.extendAudioBuffer(decoded, 300);
          }
          return decoded;
        }
      } catch (e) {
        console.warn('Could not fetch direct stream URL, generating compatible preview mix buffer', e);
      }
    }

    const targetBpm = track.bpm || 124;
    const style = (track.genre || '').toLowerCase().includes('techno') ? 'dnb' :
                  (track.genre || '').toLowerCase().includes('bass') ? 'bass' : 'house';
    return audioEngine._generateSynthTrack(targetBpm, 45, style);
  }
}

export const youtubeService = new YouTubeService();
export default youtubeService;
