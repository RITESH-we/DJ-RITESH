// Auto-DJ Engine: Handles automated beatmatching, tempo transitions,
// bass swaps, filter sweeps, and playlist auto-queuing like a pro club DJ.

import audioEngine from './audioEngine';

class AutoDJEngine {
  constructor() {
    this.enabled = false;
    this.activeDeckId = 'A'; // Which deck is currently playing the master track
    this.nextDeckId = 'B';
    this.transitionStyle = 'bassSwap'; // 'bassSwap' | 'filterSweep' | 'equalPower'
    this.transitionDurationSec = 12; // Duration in seconds (e.g. 8s, 12s, 16s, 24s)
    this.autoSyncBpm = true;
    this.smartLooping = true; // Auto-loop outgoing track during transition
    this.isTransitioning = false;
    this.transitionProgress = 0; // 0 to 1

    this.playlist = [];
    this.currentTrackIndex = 0;

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
    };
  }

  setPlaylist(playlist) {
    this.playlist = [...playlist];
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

    await audioEngine.loadTrack('A', track);
    audioEngine.updateCrossfader(0); // 100% Deck A
    audioEngine.play('A');

    // Preload next track on Deck B if available
    this._preloadNextDeck();
    this.notify();
  }

  // Start polling playback position to schedule upcoming transitions
  _startMonitoring() {
    this._stopMonitoring();
    this.timerId = setInterval(() => {
      this._checkPlaybackStatus();
    }, 400);
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
    const timeLeft = duration - currentTime;

    // Trigger transition when time left reaches transition duration plus 2s buffer
    const triggerThreshold = this.transitionDurationSec + 1.5;
    if (timeLeft <= triggerThreshold && timeLeft > 0.5) {
      this.triggerTransition();
    }
  }

  // Preloads the opposite deck with the upcoming track from playlist
  _preloadNextDeck() {
    const nextIndex = this.currentTrackIndex + 1;
    if (nextIndex < this.playlist.length) {
      const nextTrack = this.playlist[nextIndex];
      audioEngine.loadTrack(this.nextDeckId, nextTrack).then(() => {
        if (this.autoSyncBpm) {
          audioEngine.syncDecks(this.nextDeckId, this.activeDeckId);
        }
        this.notify();
      });
    }
  }

  // Instantly triggers a smooth automated transition (called automatically or via "MIX NOW" button)
  async triggerTransition() {
    if (this.isTransitioning) return;

    const outgoingDeckId = this.activeDeckId;
    const incomingDeckId = outgoingDeckId === 'A' ? 'B' : 'A';
    const outgoingDeck = audioEngine.decks[outgoingDeckId];
    const incomingDeck = audioEngine.decks[incomingDeckId];

    // If incoming deck has no track loaded, try to load next track from playlist
    if (!incomingDeck.audioBuffer) {
      const nextIndex = this.currentTrackIndex + 1;
      if (nextIndex >= this.playlist.length) {
        console.log('Auto DJ: reached end of playlist');
        this.enabled = false;
        this._stopMonitoring();
        this.notify();
        return;
      }
      await audioEngine.loadTrack(incomingDeckId, this.playlist[nextIndex]);
    }

    // Auto-beatmatch BPM
    if (this.autoSyncBpm) {
      audioEngine.syncDecks(incomingDeckId, outgoingDeckId);
    }

    // Start incoming deck playing
    if (!incomingDeck.isPlaying) {
      audioEngine.play(incomingDeckId);
    }

    // Engage smart looping on outgoing track during transition if enabled
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

      // Calculate current crossfader position
      const currentCrossfade = startXfade + (targetXfade - startXfade) * progress;
      audioEngine.updateCrossfader(currentCrossfade);

      // Handle DJ EQ & Filter techniques
      if (this.transitionStyle === 'bassSwap') {
        // Pro Bass-Swap:
        // Outgoing bass cuts as incoming bass rises at 50% midpoint to prevent kick clashes!
        if (progress < 0.5) {
          // 0 -> 0.5: Incoming bass stays low (-20dB), outgoing bass stays full (0dB)
          const inBass = -24 * (1 - progress * 2);
          audioEngine.setEQ(incomingDeckId, 'low', inBass);
          audioEngine.setEQ(outgoingDeckId, 'low', 0);
        } else {
          // 0.5 -> 1.0: Outgoing bass drops to -24dB, incoming bass rises to 0dB!
          const outBass = -24 * ((progress - 0.5) * 2);
          audioEngine.setEQ(outgoingDeckId, 'low', outBass);
          audioEngine.setEQ(incomingDeckId, 'low', 0);
        }
      } else if (this.transitionStyle === 'filterSweep') {
        // Sweeps outgoing track high-pass filter upwards (from 0 to 0.75)
        const filterVal = progress * 0.75;
        audioEngine.setFilter(outgoingDeckId, filterVal);
      }

      this.notify();

      if (progress < 1) {
        this.transitionAnimFrame = requestAnimationFrame(animateTransition);
      } else {
        // Transition Completed!
        this._completeTransition(outgoingDeckId, incomingDeckId);
      }
    };

    this.transitionAnimFrame = requestAnimationFrame(animateTransition);
  }

  _completeTransition(outgoingDeckId, incomingDeckId) {
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
    this.currentTrackIndex += 1;

    // Preload next upcoming track into the now-empty outgoing deck
    this._preloadNextDeck();

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
}

export const autoDjEngine = new AutoDJEngine();
export default autoDjEngine;
