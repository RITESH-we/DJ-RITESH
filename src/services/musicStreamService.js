// Universal Multi-Platform Music Streaming Service
// Supports: YouTube Music, YouTube, Spotify, SoundCloud, Apple Music, Deezer, Audius, and Direct Audio Streams.

import audioEngine from '../audio/audioEngine';
import spotifyService from './spotifyService';

export const STREAM_PLATFORMS = [
  { id: 'all', label: '🌐 ALL PLATFORMS', icon: '🌐', color: '#00f0ff' },
  { id: 'youtube', label: '🔴 YOUTUBE MUSIC', icon: '🔴', color: '#ff0000' },
  { id: 'spotify', label: '🟢 SPOTIFY', icon: '🟢', color: '#1db954' },
  { id: 'soundcloud', label: '🟠 SOUNDCLOUD', icon: '🟠', color: '#ff7700' },
  { id: 'audius', label: '🟣 AUDIUS (FULL SONGS)', icon: '🟣', color: '#cc33ff' },
  { id: 'apple', label: '🍎 APPLE MUSIC', icon: '🍎', color: '#fc3c44' },
  { id: 'direct', label: '📻 DIRECT STREAM / URL', icon: '📻', color: '#00ff88' },
];

class MusicStreamService {
  constructor() {
    this.corsProxies = [
      (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    ];
  }

  // Detect which platform a URL belongs to
  detectPlatform(url) {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();

    if (/music\.youtube\.com/i.test(trimmed)) return 'youtube_music';
    if (/youtube\.com|youtu\.be/i.test(trimmed)) return 'youtube';
    if (/spotify\.com/i.test(trimmed)) return 'spotify';
    if (/soundcloud\.com/i.test(trimmed)) return 'soundcloud';
    if (/audius\.co/i.test(trimmed)) return 'audius';
    if (/apple\.com\/.*\/album|music\.apple\.com/i.test(trimmed)) return 'apple';
    if (/deezer\.com/i.test(trimmed)) return 'deezer';
    if (/\.(mp3|wav|ogg|flac|m4a|aac)(\?.*)?$/i.test(trimmed) || /^(https?:\/\/.*\/stream(\/.*)?)/i.test(trimmed)) {
      return 'direct';
    }
    return 'generic_url';
  }

  // Extract YouTube Video ID from any YouTube or YouTube Music link
  extractYouTubeVideoId(url) {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  }

  // Parse any music link across all platforms
  async parseAnyLink(url) {
    if (!url || typeof url !== 'string') throw new Error('Please enter a valid link.');
    const cleanUrl = url.trim();
    const platform = this.detectPlatform(cleanUrl);

    switch (platform) {
      case 'youtube_music':
      case 'youtube': {
        const videoId = this.extractYouTubeVideoId(cleanUrl);
        if (!videoId) throw new Error('Could not extract a valid YouTube video ID from link.');

        try {
          const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
          if (oembedRes.ok) {
            const data = await oembedRes.json();
            const { cleanTitle, artist } = this._cleanTitleArtist(data.title, data.author_name);
            return {
              id: `yt-${videoId}`,
              title: cleanTitle,
              artist: artist || data.author_name || 'YouTube Music',
              genre: 'YouTube Music Stream',
              platform: 'youtube',
              platformLabel: platform === 'youtube_music' ? 'YouTube Music' : 'YouTube',
              platformIcon: '🔴',
              platformColor: '#ff0000',
              thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              duration: 210,
              bpm: 126,
              key: '8A / Am',
              sourceUrl: cleanUrl,
              youtubeId: videoId,
            };
          }
        } catch (e) {
          console.warn('YouTube oEmbed error', e);
        }

        // Fallback if oEmbed fails
        return {
          id: `yt-${videoId}`,
          title: `YouTube Track (${videoId})`,
          artist: 'YouTube Music',
          genre: 'YouTube Music Stream',
          platform: 'youtube',
          platformLabel: 'YouTube Music',
          platformIcon: '🔴',
          platformColor: '#ff0000',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          duration: 210,
          bpm: 126,
          key: '8A / Am',
          sourceUrl: cleanUrl,
          youtubeId: videoId,
        };
      }

      case 'spotify': {
        const parsed = spotifyService.parseSpotifyUrl(cleanUrl);
        if (!parsed) throw new Error('Invalid Spotify link.');
        const meta = await spotifyService.fetchOembedMetadata(parsed.url);
        return {
          id: `spotify-${parsed.id || Date.now()}`,
          spotifyId: parsed.id,
          title: meta.title,
          artist: meta.artist || 'Spotify Artist',
          genre: 'Spotify Stream',
          platform: 'spotify',
          platformLabel: 'Spotify',
          platformIcon: '🟢',
          platformColor: '#1db954',
          thumbnail: meta.thumbnail,
          duration: 180,
          bpm: 126,
          key: '8A / Am',
          sourceUrl: parsed.url,
        };
      }

      case 'soundcloud': {
        try {
          const res = await fetch(`https://soundcloud.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`);
          if (res.ok) {
            const data = await res.json();
            const { cleanTitle, artist } = this._cleanTitleArtist(data.title, data.author_name);
            return {
              id: `sc-${Date.now()}`,
              title: cleanTitle,
              artist: artist || data.author_name || 'SoundCloud Artist',
              genre: 'SoundCloud Stream',
              platform: 'soundcloud',
              platformLabel: 'SoundCloud',
              platformIcon: '🟠',
              platformColor: '#ff7700',
              thumbnail: data.thumbnail_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150',
              duration: 240,
              bpm: 128,
              key: '9A / Em',
              sourceUrl: cleanUrl,
            };
          }
        } catch (e) {
          console.warn('SoundCloud oEmbed failed', e);
        }
        throw new Error('Could not parse SoundCloud link. Please ensure it is a public track.');
      }

      case 'audius': {
        return {
          id: `audius-${Date.now()}`,
          title: 'Audius Track',
          artist: 'Audius Artist',
          genre: 'Audius Electronic',
          platform: 'audius',
          platformLabel: 'Audius',
          platformIcon: '🟣',
          platformColor: '#cc33ff',
          thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150',
          duration: 180,
          bpm: 128,
          key: '8A / Am',
          sourceUrl: cleanUrl,
        };
      }

      case 'apple': {
        return {
          id: `apple-${Date.now()}`,
          title: 'Apple Music Track',
          artist: 'Apple Music Artist',
          genre: 'Apple Music',
          platform: 'apple',
          platformLabel: 'Apple Music',
          platformIcon: '🍎',
          platformColor: '#fc3c44',
          thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150',
          duration: 200,
          bpm: 124,
          key: '10B / D',
          sourceUrl: cleanUrl,
        };
      }

      case 'direct':
      default: {
        const fileName = cleanUrl.split('/').pop().split('?')[0] || 'Web Audio Stream';
        const cleanTitle = decodeURIComponent(fileName.replace(/\.[^/.]+$/, ''));
        return {
          id: `stream-${Date.now()}`,
          title: cleanTitle || 'Direct Audio Stream',
          artist: 'Web Audio Broadcast',
          genre: 'Direct Stream',
          platform: 'direct',
          platformLabel: 'Direct Stream',
          platformIcon: '📻',
          platformColor: '#00ff88',
          thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150',
          duration: 300,
          bpm: 125,
          key: '8A / Am',
          sourceUrl: cleanUrl,
          previewUrl: cleanUrl,
        };
      }
    }
  }

  // Universal Cross-Platform Search
  async searchAcrossPlatforms(query, platformFilter = 'all') {
    if (!query || !query.trim()) return [];
    const q = query.trim();
    const results = [];

    // 1. Search Audius (100% open, full-length club songs & EDM tracks with CORS)
    if (platformFilter === 'all' || platformFilter === 'audius' || platformFilter === 'youtube') {
      try {
        const res = await fetch(`https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}&app_name=PRO_DJ_MIXER`);
        if (res.ok) {
          const data = await res.json();
          const tracks = (data.data || []).slice(0, 6);
          tracks.forEach((t) => {
            const artwork = t.artwork?.['480x480'] || t.artwork?.['150x150'] || t.user?.profile_picture?.['150x150'] || '';
            results.push({
              id: `audius-${t.id}`,
              title: t.title,
              artist: t.user?.name || 'Audius Producer',
              genre: t.genre || 'Electronic / Club',
              platform: 'audius',
              platformLabel: 'Audius (Full Song)',
              platformIcon: '🟣',
              platformColor: '#cc33ff',
              thumbnail: artwork || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150',
              duration: Math.round(t.duration || 180),
              bpm: Math.round(t.bpm) || 128,
              key: t.musical_key || '8A / Am',
              previewUrl: `https://discoveryprovider.audius.co/v1/tracks/${t.id}/stream?app_name=PRO_DJ_MIXER`,
              isFullSong: true,
            });
          });
        }
      } catch (e) {
        console.warn('Audius search error', e);
      }
    }

    // 2. Search iTunes / Apple Music (Global catalog with high-res audio previews)
    if (platformFilter === 'all' || platformFilter === 'apple' || platformFilter === 'spotify' || platformFilter === 'youtube') {
      try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=6`);
        if (res.ok) {
          const data = await res.json();
          (data.results || []).forEach((item) => {
            results.push({
              id: `apple-${item.trackId}`,
              title: item.trackName,
              artist: item.artistName,
              genre: item.primaryGenreName || 'Dance',
              platform: 'apple',
              platformLabel: 'Apple Music / iTunes',
              platformIcon: '🍎',
              platformColor: '#fc3c44',
              thumbnail: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '300x300bb') : '',
              duration: Math.round(item.trackTimeMillis / 1000) || 180,
              bpm: 125,
              key: '8A / Am',
              previewUrl: item.previewUrl,
            });
          });
        }
      } catch (e) {
        console.warn('iTunes search error', e);
      }
    }

    // 3. Search Deezer (via CORS proxy or direct)
    if (platformFilter === 'all' || platformFilter === 'deezer' || platformFilter === 'soundcloud') {
      try {
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=6`)}`);
        if (res.ok) {
          const data = await res.json();
          (data.data || []).forEach((t) => {
            results.push({
              id: `deezer-${t.id}`,
              title: t.title,
              artist: t.artist?.name || 'Deezer Artist',
              genre: 'Club Pop',
              platform: 'deezer',
              platformLabel: 'Deezer',
              platformIcon: '🎵',
              platformColor: '#ff0055',
              thumbnail: t.album?.cover_medium || t.album?.cover_small || '',
              duration: t.duration || 180,
              bpm: Math.round(t.bpm) || 124,
              key: '9B / G',
              previewUrl: t.preview,
            });
          });
        }
      } catch (e) {
        console.warn('Deezer search error', e);
      }
    }

    return results;
  }

  // Resolve high-resolution real audio stream for any track from any platform
  async resolveAudioStream(track) {
    if (!track) return null;
    if (track.previewUrl && typeof track.previewUrl === 'string' && track.previewUrl.startsWith('http')) {
      return track.previewUrl;
    }

    const title = track.title || track.name || '';
    const artist = track.artist || (track.artists ? track.artists.map((a) => a.name).join(' ') : '');
    const query = `${title} ${artist}`.trim();

    // 1. If Audius track ID or direct audio preview
    if (track.platform === 'audius' && track.id) {
      const cleanId = track.id.replace('audius-', '');
      return `https://discoveryprovider.audius.co/v1/tracks/${cleanId}/stream?app_name=PRO_DJ_MIXER`;
    }

    // 2. Query iTunes API (CORS enabled, instant AAC stream)
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`);
      if (res.ok) {
        const data = await res.json();
        const url = data.results?.[0]?.previewUrl;
        if (url) return url;
      }
    } catch (e) {}

    // 3. Query Audius for matching electronic/dance stem
    try {
      const res = await fetch(`https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(title)}&app_name=PRO_DJ_MIXER`);
      if (res.ok) {
        const data = await res.json();
        const match = data.data?.[0];
        if (match?.id) {
          return `https://discoveryprovider.audius.co/v1/tracks/${match.id}/stream?app_name=PRO_DJ_MIXER`;
        }
      }
    } catch (e) {}

    return null;
  }

  _cleanTitleArtist(rawTitle = '', defaultArtist = '') {
    let cleanTitle = rawTitle;
    let artist = defaultArtist;

    // Split on common " - " delimiter (e.g. "Artist - Title")
    if (rawTitle.includes(' - ')) {
      const parts = rawTitle.split(' - ');
      artist = parts[0].trim();
      cleanTitle = parts.slice(1).join(' - ').trim();
    }

    // Strip common YouTube fluff: "(Official Video)", "[HD]", "4K Remaster", etc.
    cleanTitle = cleanTitle
      .replace(/\((?:Official|Video|Audio|Music Video|Lyric Video|Visualizer|HD|4K Remaster|Remastered).*?\)/gi, '')
      .replace(/\[(?:Official|Video|Audio|Music Video|Lyric Video|Visualizer|HD|4K Remaster|Remastered).*?\]/gi, '')
      .replace(/ft\.?|feat\.?/gi, 'ft.')
      .trim();

    return { cleanTitle, artist };
  }
}

export const musicStreamService = new MusicStreamService();
export default musicStreamService;
