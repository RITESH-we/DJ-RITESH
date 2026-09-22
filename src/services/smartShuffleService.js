// Smart Shuffle Engine for Pro DJ & Casual Player
// Intelligently sequences playlists using Camelot harmonic keys, tempo flow,
// and weaves in curated smart recommendations from the 83+ YouTube/Spotify catalog.

import { YOUTUBE_TRENDING_TRACKS } from './youtubeService';

class SmartShuffleService {
  // Camelot wheel numeric extractor (e.g. "8A / Am" -> { num: 8, mode: 'A' })
  parseCamelotKey(keyStr) {
    if (!keyStr || typeof keyStr !== 'string') return { num: 8, mode: 'A' };
    const match = keyStr.match(/(\d{1,2})([AB])/i);
    if (!match) return { num: 8, mode: 'A' };
    return {
      num: parseInt(match[1], 10),
      mode: match[2].toUpperCase(),
    };
  }

  // Harmonic compatibility score between two keys (0 to 100)
  calculateKeyCompatibility(key1, key2) {
    const k1 = this.parseCamelotKey(key1);
    const k2 = this.parseCamelotKey(key2);

    // Exact key match (e.g. 8A to 8A) -> 100
    if (k1.num === k2.num && k1.mode === k2.mode) return 100;

    // Relative Major / Minor (e.g. 8A to 8B) -> 95
    if (k1.num === k2.num && k1.mode !== k2.mode) return 95;

    // Adjacent key on circle of fifths (e.g. 8A to 9A or 7A) -> 90
    const diff = Math.abs(k1.num - k2.num);
    const isAdjacent = diff === 1 || diff === 11;
    if (isAdjacent && k1.mode === k2.mode) return 90;

    // Adjacent key with mode change (e.g. 8A to 9B or 7B) -> 75
    if (isAdjacent && k1.mode !== k2.mode) return 75;

    // Energy boost (+2 semitones, e.g. 8A to 10A) -> 65
    if ((diff === 2 || diff === 10) && k1.mode === k2.mode) return 65;

    // Clashing keys
    return 30;
  }

  // BPM proximity score (0 to 100)
  calculateBpmCompatibility(bpm1, bpm2) {
    const b1 = bpm1 || 124;
    const b2 = bpm2 || 124;
    const diff = Math.abs(b1 - b2);

    if (diff <= 2) return 100;
    if (diff <= 5) return 90;
    if (diff <= 8) return 75;
    if (diff <= 14) return 60;

    // Check half-time / double-time (e.g. 75 BPM to 150 BPM)
    const ratio = b1 / b2;
    if (Math.abs(ratio - 2) < 0.1 || Math.abs(ratio - 0.5) < 0.1) return 80;

    return Math.max(10, 50 - diff);
  }

  // Genre similarity score (0 to 100)
  calculateGenreSimilarity(g1, g2) {
    if (!g1 || !g2) return 50;
    const s1 = g1.toLowerCase();
    const s2 = g2.toLowerCase();

    if (s1 === s2) return 100;

    const clusters = [
      ['house', 'tech', 'edm', 'club', 'electro', 'festival', 'dance'],
      ['hip-hop', 'trap', 'drill', 'rap', 'r&b'],
      ['latin', 'reggaeton', 'guaracha', 'dembow'],
      ['punjabi', 'bollywood', 'desi'],
      ['techno', 'trance', 'synthwave', 'underground'],
      ['pop', 'disco', 'funk', 'nu-disco'],
      ['afrobeats', 'amapiano'],
    ];

    for (const cluster of clusters) {
      const match1 = cluster.some((k) => s1.includes(k));
      const match2 = cluster.some((k) => s2.includes(k));
      if (match1 && match2) return 85;
    }

    return 40;
  }

  // Overall acoustic flow score between two tracks (0 to 100)
  calculateTrackAffinity(trackA, trackB) {
    if (!trackA || !trackB) return 50;
    const keyScore = this.calculateKeyCompatibility(trackA.key, trackB.key);
    const bpmScore = this.calculateBpmCompatibility(trackA.bpm, trackB.bpm);
    const genreScore = this.calculateGenreSimilarity(trackA.genre, trackB.genre);

    // Harmonic flow is weighted highest for seamless listening
    return Math.round(keyScore * 0.45 + bpmScore * 0.35 + genreScore * 0.2);
  }

  // Find the top smart recommendations from the curated 83+ library matching current track & playlist
  findSmartRecommendations(currentTrack, existingQueue, count = 4) {
    const existingIds = new Set(existingQueue.map((t) => t.id || t.title));
    const currentArtist = (currentTrack?.artist || '').toLowerCase();

    const candidates = YOUTUBE_TRENDING_TRACKS.filter((t) => {
      // Don't recommend songs already in queue
      if (existingIds.has(t.id) || existingIds.has(t.title)) return false;
      // Don't recommend the same artist immediately
      if (currentArtist && (t.artist || '').toLowerCase().includes(currentArtist)) return false;
      return true;
    });

    // Score all candidate tracks based on acoustic affinity to currentTrack
    const scored = candidates.map((cand) => ({
      track: {
        ...cand,
        isSmartPick: true,
        smartReason: this.getSmartReason(currentTrack, cand),
      },
      score: this.calculateTrackAffinity(currentTrack, cand),
    }));

    // Sort by affinity descending
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, count).map((s) => s.track);
  }

  // Generate human-friendly rationale for Smart Shuffle pick
  getSmartReason(source, target) {
    if (!source || !target) return 'Vibe matched recommendation';
    const keyMatch = this.calculateKeyCompatibility(source.key, target.key) >= 90;
    const bpmDiff = Math.abs((source.bpm || 124) - (target.bpm || 124));

    if (keyMatch && bpmDiff <= 4) {
      return `Harmonic Match (${target.key}) • Tempo Sync (${target.bpm} BPM)`;
    }
    if (keyMatch) {
      return `Harmonic Wheel Flow (${source.key} ➔ ${target.key})`;
    }
    if (bpmDiff <= 3) {
      return `BPM Groove Matched (${target.bpm} BPM)`;
    }
    return `Genre Flow (${target.genre || 'Club'})`;
  }

  // Standard Random Shuffle (Fisher-Yates)
  standardShuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Build complete Smart Shuffled queue:
  // 1. Keeps the current track at index 0
  // 2. Orders the remaining user tracks using harmonic & tempo flow (greedy nearest neighbor)
  // 3. Weaves in recommended smart tracks every 2-3 songs
  generateSmartQueue(currentTrack, basePlaylist = []) {
    if (!basePlaylist || basePlaylist.length === 0) {
      // If playlist is empty, seed with 5 smart picks
      return this.findSmartRecommendations(currentTrack, [], 5);
    }

    // Separate active track from the pool
    const activeId = currentTrack?.id || currentTrack?.title;
    const remaining = basePlaylist.filter((t) => (t.id || t.title) !== activeId && !t.isSmartPick);

    if (remaining.length === 0) {
      const picks = this.findSmartRecommendations(currentTrack, basePlaylist, 4);
      return currentTrack ? [currentTrack, ...picks] : picks;
    }

    // Acoustically order remaining user tracks
    const orderedUserTracks = [];
    let lastTrack = currentTrack || remaining[0];
    const pool = [...remaining];

    while (pool.length > 0) {
      let bestIdx = 0;
      let bestScore = -1;

      for (let i = 0; i < pool.length; i++) {
        const score = this.calculateTrackAffinity(lastTrack, pool[i]);
        // Slight penalty if consecutive songs share the same artist
        const sameArtistPenalty =
          lastTrack?.artist && pool[i]?.artist && lastTrack.artist === pool[i].artist ? 25 : 0;
        const finalScore = score - sameArtistPenalty;

        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestIdx = i;
        }
      }

      const nextTrack = pool.splice(bestIdx, 1)[0];
      orderedUserTracks.push(nextTrack);
      lastTrack = nextTrack;
    }

    // Find smart recommendations based on the whole playlist
    const smartPicks = this.findSmartRecommendations(currentTrack || orderedUserTracks[0], basePlaylist, 4);

    // Weave smart picks into the queue every 2 user songs
    const finalQueue = currentTrack ? [currentTrack] : [];
    let pickIndex = 0;

    orderedUserTracks.forEach((userTrack, idx) => {
      finalQueue.push(userTrack);
      // After every 2 user songs, insert 1 smart pick if available
      if ((idx + 1) % 2 === 0 && pickIndex < smartPicks.length) {
        finalQueue.push(smartPicks[pickIndex]);
        pickIndex++;
      }
    });

    // If remaining smart picks haven't been inserted, append them
    while (pickIndex < smartPicks.length) {
      finalQueue.push(smartPicks[pickIndex]);
      pickIndex++;
    }

    return finalQueue;
  }
}

export const smartShuffleService = new SmartShuffleService();
export default smartShuffleService;
