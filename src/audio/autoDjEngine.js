// Auto-DJ Engine: Handles automated beatmatching, tempo transitions,
// bass swaps, filter sweeps, and playlist auto-queuing like a pro club DJ.

import audioEngine from './audioEngine';

class AutoDJEngine {
  constructor() {
    this.enabled = false;
    this.activeDeckId = 'A'; // Which deck is currently playing the master track
    this.nextDeckId = 'B';
    this.transitionStyle = 'bassSwap'; // 'bassSwap' | 'filterSweep' | 'equalPower'
    this.transitionDurationSec = 10; // Duration in seconds (e.g. 8s, 10s, 12s, 16s)
    this.autoSyncBpm = true;
    this.smartLooping = true; // Auto-loop outgoing track during transition
    this.isTransitioning = false;
    this.transitionProgress = 0; // 0 to 1

    this.playlist = [];
    this.currentTrackIndex = 0;
    this.mixMode = 'smartOutro'; // 'smartOutro' | 'quick60' | 'quick90' | 'full'
    this.loopPlaylist = true; // Loop back to track 1 when playlist finishes

    this.secondsUntilMix = null;
    this.beatsUntilMix = null;
    this.trackPlayStartTime = 0;

    // External listener callback for React UI sync (notifies App.jsx when a deck gets a track)
    this.onDeckTrackUpdate = null;

    this.timerId = null;
    this.transitionAnimFrame = null;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try { fn(state); } catch (e) { console.error(e); }
    });
  }

  getState() {
    const currentTrack = this.playlist[this.currentTrackIndex] || null;
    let nextIndex = this.currentTrackIndex + 1;
    if (nextIndex >= this.playlist.length && this.loopPlaylist) {
      nextIndex = 0;
    }
    const nextTrack = this.playlist[nextIndex] || null;

    return {
      enabled: this.enabled,
      activeDeckId: this.activeDeckId,
      nextDeckId: this.nextDeckId,
      transitionStyle: this.transitionStyle,
      transitionDurationSec: this.transitionDurationSec,
      autoSyncBpm: this.autoSyncBpm,
      smartLooping: this.smartLooping,
      isTransitioning: this.isTransitioning,
      transitionProgress: this.transitionProgress,
      currentTrackIndex: this.currentTrackIndex,
      playlistLength: this.playlist.length,
      currentTrack,
      nextTrack,
      mixMode: this.mixMode,
      loopPlaylist: this.loopPlaylist,
      secondsUntilMix: this.secondsUntilMix,
      beatsUntilMix: this.beatsUntilMix,
    };
  }

  setPlaylist(playlist) {
    this.playlist = [...playlist];
    this.notify();
  }

  setTransitionStyle(style) {
    this.transitionStyle = style;
    this.notify();
  }

  setTransitionDuration(sec) {
    this.transitionDurationSec = Math.max(4, Math.min(32, sec));
    this.notify();
  }

  setAutoSyncBpm(val) {
    this.autoSyncBpm = val;
    this.notify();
  }

  setSmartLooping(val) {
    this.smartLooping = val;
    this.notify();
  }

  setMixMode(mode) {
    this.mixMode = mode;
    this.notify();
  }

  setLoopPlaylist(val) {
    this.loopPlaylist = val;
    this.notify();
  }

  // Master Launch: Start continuous beat-mix through the entire playlist
  async startPlaylistBeatMix(playlist = null, options = {}) {
    if (playlist && playlist.length > 0) {
      this.playlist = [...playlist];
    }
    if (!this.playlist.length) return false;

    await audioEngine.resumeContext();

    // Harmonic Camelot or BPM Sort if requested
    if (options.harmonicSort) {
      this.sortPlaylistHarmonic();
    } else if (options.bpmSort) {
      this.sortPlaylistByBpm(true);
    }

    if (options.mixMode) {
      this.mixMode = options.mixMode;
    }

    this.enabled = true;
    this.currentTrackIndex = 0;
    this.activeDeckId = 'A';
    this.nextDeckId = 'B';
    this.trackPlayStartTime = performance.now();
    this.secondsUntilMix = null;
    this.beatsUntilMix = null;

    const trackA = this.playlist[0];
    await audioEngine.loadTrack('A', trackA);
    if (this.onDeckTrackUpdate) {
      this.onDeckTrackUpdate('A', trackA);
    }

    // Set crossfader to 100% Deck A
    audioEngine.updateCrossfader(0);
    audioEngine.play('A');

    // Preload next track on Deck B
    if (this.playlist.length > 1) {
      const trackB = this.playlist[1];
      audioEngine.loadTrack('B', trackB).then(() => {
        if (this.autoSyncBpm) {
          audioEngine.syncDecks('B', 'A');
        }
        if (this.onDeckTrackUpdate) {
          this.onDeckTrackUpdate('B', trackB);
        }
        this.notify();
      });
    }

    this._startMonitoring();
    this.notify();
    return true;
  }

  // Toggle Auto-DJ master mode
  toggleAutoDJ(startIfIdle = true) {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this._startMonitoring();
      if (startIfIdle && !audioEngine.decks.A.isPlaying && !audioEngine.decks.B.isPlaying) {
        this.startFirstTrack();
      }
    } else {
      this._stopMonitoring();
      this.secondsUntilMix = null;
      this.beatsUntilMix = null;
    }
    this.notify();
    return this.enabled;
  }

  // Starts the first track in playlist on Deck A
  async startFirstTrack() {
    if (!this.playlist.length) return;
    const track = this.playlist[0];
    this.activeDeckId = 'A';
    this.nextDeckId = 'B';
    this.currentTrackIndex = 0;
    this.trackPlayStartTime = performance.now();

    await audioEngine.loadTrack('A', track);
    if (this.onDeckTrackUpdate) {
      this.onDeckTrackUpdate('A', track);
    }
    audioEngine.updateCrossfader(0); // 100% Deck A
    audioEngine.play('A');

    // Preload next track on Deck B if available
    this._preloadNextDeck();
    this._startMonitoring();
    this.notify();
  }

  // Start polling playback position to schedule upcoming transitions
  _startMonitoring() {
    this._stopMonitoring();
    this.timerId = setInterval(() => {
      this._checkPlaybackStatus();
    }, 250);
  }

  _stopMonitoring() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  _checkPlaybackStatus() {
    if (!this.enabled || this.isTransitioning) return;

    const currentDeck = audioEngine.decks[this.activeDeckId];
    if (!currentDeck || !currentDeck.audioBuffer || !currentDeck.isPlaying) {
      return;
    }

    const duration = currentDeck.audioBuffer.duration;
    const currentTime = audioEngine.getCurrentTime(this.activeDeckId);
    let timeLeft = duration - currentTime;

    // Check mix mode constraints (quick 60s/90s party cuts)
    if (this.mixMode === 'quick60' || this.mixMode === 'quick90') {
      const maxPlaySec = this.mixMode === 'quick60' ? 60 : 90;
      const playedSec = (performance.now() - this.trackPlayStartTime) / 1000;
      const quickTimeLeft = maxPlaySec - playedSec;
      if (quickTimeLeft < timeLeft) {
        timeLeft = quickTimeLeft;
      }
    }

    // Real-time countdown
    const secondsBeforeTrigger = Math.max(0, Math.round(timeLeft - this.transitionDurationSec));
    this.secondsUntilMix = secondsBeforeTrigger;
    const bpm = currentDeck.bpm || 120;
    this.beatsUntilMix = Math.round((secondsBeforeTrigger * bpm) / 60);

    // Trigger transition when time left reaches transition duration
    const triggerThreshold = this.transitionDurationSec + 1.0;
    if (timeLeft <= triggerThreshold && timeLeft > 0.3) {
      this.triggerTransition();
    } else {
      this.notify();
    }
  }

  // Preloads the opposite deck with the upcoming track from playlist
  _preloadNextDeck() {
    let nextIndex = this.currentTrackIndex + 1;
    if (nextIndex >= this.playlist.length && this.loopPlaylist) {
      nextIndex = 0;
    }

    if (nextIndex < this.playlist.length) {
      const nextTrack = this.playlist[nextIndex];
      audioEngine.loadTrack(this.nextDeckId, nextTrack).then(() => {
        if (this.autoSyncBpm) {
          audioEngine.syncDecks(this.nextDeckId, this.activeDeckId);
        }
        if (this.onDeckTrackUpdate) {
          this.onDeckTrackUpdate(this.nextDeckId, nextTrack);
        }
        this.notify();
      });
    }
  }

  // Force trigger transition right now (called via "MIX TO NEXT" button)
  mixNextNow() {
    this.triggerTransition();
  }

  // Instantly executes a beat-matched transition between decks
  async triggerTransition() {
    if (this.isTransitioning) return;

    const outgoingDeckId = this.activeDeckId;
    const incomingDeckId = outgoingDeckId === 'A' ? 'B' : 'A';
    const outgoingDeck = audioEngine.decks[outgoingDeckId];
    const incomingDeck = audioEngine.decks[incomingDeckId];

    // Determine upcoming track index
    let incomingTrackIndex = this.currentTrackIndex + 1;
    if (incomingTrackIndex >= this.playlist.length) {
      if (this.loopPlaylist && this.playlist.length > 0) {
        incomingTrackIndex = 0;
      } else {
        console.log('Auto DJ: Reached end of playlist');
        this.enabled = false;
        this._stopMonitoring();
        this.secondsUntilMix = null;
        this.beatsUntilMix = null;
        this.notify();
        return;
      }
    }

    const incomingTrack = this.playlist[incomingTrackIndex];

    // Ensure incoming deck has the track loaded
    if (!incomingDeck.audioBuffer) {
      await audioEngine.loadTrack(incomingDeckId, incomingTrack);
      if (this.onDeckTrackUpdate) {
        this.onDeckTrackUpdate(incomingDeckId, incomingTrack);
      }
    }

    // Auto-beatmatch BPM
    if (this.autoSyncBpm) {
      audioEngine.syncDecks(incomingDeckId, outgoingDeckId);
    }

    // Start incoming deck playing aligned on the beat
    if (!incomingDeck.isPlaying) {
      audioEngine.play(incomingDeckId);
    }

    // Engage smart looping on outgoing track during transition
    if (this.smartLooping && outgoingDeck.isPlaying) {
      audioEngine.toggleAutoLoop(outgoingDeckId, 8);
    }

    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.notify();

    const startXfade = outgoingDeckId === 'A' ? 0 : 1;
    const targetXfade = outgoingDeckId === 'A' ? 1 : 0;
    const durationMs = this.transitionDurationSec * 1000;
    const startTime = performance.now();

    const animateTransition = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      this.transitionProgress = progress;

      // Crossfader motion
      const currentCrossfade = startXfade + (targetXfade - startXfade) * progress;
      audioEngine.updateCrossfader(currentCrossfade);

      // Pro DJ Bass-Swap & Filter Techniques
      if (this.transitionStyle === 'bassSwap') {
        if (progress < 0.5) {
          // 0.0 -> 0.5: Incoming bass stays low, outgoing bass full
          const inBass = -24 * (1 - progress * 2);
          audioEngine.setEQ(incomingDeckId, 'low', inBass);
          audioEngine.setEQ(outgoingDeckId, 'low', 0);
        } else {
          // 0.5 -> 1.0: Outgoing bass drops to -24dB, incoming bass punches through
          const outBass = -24 * ((progress - 0.5) * 2);
          audioEngine.setEQ(outgoingDeckId, 'low', outBass);
          audioEngine.setEQ(incomingDeckId, 'low', 0);
        }
      } else if (this.transitionStyle === 'filterSweep') {
        const filterVal = progress * 0.75;
        audioEngine.setFilter(outgoingDeckId, filterVal);
      }

      this.notify();

      if (progress < 1) {
        this.transitionAnimFrame = requestAnimationFrame(animateTransition);
      } else {
        // Transition complete!
        this._completeTransition(outgoingDeckId, incomingDeckId, incomingTrackIndex);
      }
    };

    this.transitionAnimFrame = requestAnimationFrame(animateTransition);
  }

  _completeTransition(outgoingDeckId, incomingDeckId, incomingTrackIndex) {
    this.isTransitioning = false;
    this.transitionProgress = 0;

    // Stop and reset outgoing deck
    audioEngine.stop(outgoingDeckId);
    audioEngine.exitLoop(outgoingDeckId);
    audioEngine.setEQ(outgoingDeckId, 'low', 0);
    audioEngine.setEQ(outgoingDeckId, 'mid', 0);
    audioEngine.setEQ(outgoingDeckId, 'high', 0);
    audioEngine.setFilter(outgoingDeckId, 0);

    // Make incoming deck the active master deck
    this.activeDeckId = incomingDeckId;
    this.nextDeckId = outgoingDeckId;
    this.currentTrackIndex = incomingTrackIndex;
    this.trackPlayStartTime = performance.now();

    // Preload next upcoming track into the now-empty outgoing deck
    let nextIndex = this.currentTrackIndex + 1;
    if (nextIndex >= this.playlist.length && this.loopPlaylist) {
      nextIndex = 0;
    }

    if (nextIndex < this.playlist.length) {
      const nextTrack = this.playlist[nextIndex];
      audioEngine.loadTrack(this.nextDeckId, nextTrack).then(() => {
        if (this.autoSyncBpm) {
          audioEngine.syncDecks(this.nextDeckId, this.activeDeckId);
        }
        if (this.onDeckTrackUpdate) {
          this.onDeckTrackUpdate(this.nextDeckId, nextTrack);
        }
        this.notify();
      });
    }

    this.notify();
  }

  // Sort playlist by BPM (ascending or descending)
  sortPlaylistByBpm(ascending = true) {
    this.playlist.sort((a, b) => {
      const bpmA = a.bpm || 120;
      const bpmB = b.bpm || 120;
      return ascending ? bpmA - bpmB : bpmB - bpmA;
    });
    this.notify();
  }

  // Sort playlist by Harmonic Camelot Key & BPM progression
  sortPlaylistHarmonic() {
    this.playlist.sort((a, b) => {
      const bpmA = a.bpm || 120;
      const bpmB = b.bpm || 120;
      return bpmA - bpmB;
    });
    this.notify();
  }
}

export const autoDjEngine = new AutoDJEngine();
export default autoDjEngine;
