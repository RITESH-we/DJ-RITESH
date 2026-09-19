// Auto-DJ Engine: Multi-Style Adaptive Mixing Engine
// Intelligently rotates and executes multiple club transition techniques:
// - Pro Bass-Swap
// - Filter Sweep Washout
// - Turntable Vinyl Brake
// - Fast Drop Slam
// - Harmonic Long Blend
// - High-Pass Echo Out
// - Stutter Beat Roll

import audioEngine from './audioEngine';

export const TRANSITION_STYLES_INFO = {
  dynamic: {
    id: 'dynamic',
    label: 'DYNAMIC (AUTO-ROTATION)',
    shortLabel: 'DYNAMIC',
    icon: '🔀',
    desc: 'Intelligently rotates creative DJ techniques every mix (Never sticks to one!)',
  },
  bassSwap: {
    id: 'bassSwap',
    label: 'PRO BASS SWAP',
    shortLabel: 'BASS SWAP',
    icon: '⚡',
    desc: 'Sub-bass cuts on outgoing while incoming kick punches through',
  },
  filterSweep: {
    id: 'filterSweep',
    label: 'FILTER SWEEP',
    shortLabel: 'FILTER',
    icon: '🌊',
    desc: 'High-pass filter riser creates tension before incoming drop',
  },
  vinylBrake: {
    id: 'vinylBrake',
    label: 'TURNTABLE BRAKE',
    shortLabel: 'BRAKE',
    icon: '🛑',
    desc: 'Simulates vinyl motor stop / tape stop into incoming beat',
  },
  dropCut: {
    id: 'dropCut',
    label: 'DROP SLAM',
    shortLabel: 'DROP CUT',
    icon: '💥',
    desc: 'Fast 5s build-up with sharp cut right on the incoming chorus drop',
  },
  harmonicBlend: {
    id: 'harmonicBlend',
    label: 'HARMONIC BLEND',
    shortLabel: 'BLEND',
    icon: '✨',
    desc: 'Silky 14s equal-power crossfade with balanced mid layering',
  },
  echoFade: {
    id: 'echoFade',
    label: 'ECHO OUT',
    shortLabel: 'ECHO',
    icon: '🌀',
    desc: 'High-pass resonance with rhythmic decay tail into new track',
  },
  beatRoll: {
    id: 'beatRoll',
    label: 'BEAT ROLL',
    shortLabel: 'ROLL',
    icon: '🥁',
    desc: 'Rhythmic stutter buildup before incoming track drops',
  },
};

class AutoDJEngine {
  constructor() {
    this.enabled = false;
    this.activeDeckId = 'A';
    this.nextDeckId = 'B';
    
    // Default to 'dynamic' so the mixer NEVER sticks to just one style!
    this.transitionStyle = 'dynamic';
    this.activeExecutingStyle = 'bassSwap'; // The specific technique currently queued or running
    this.lastUsedStyle = null;

    this.transitionDurationSec = 10;
    this.autoSyncBpm = true;
    this.smartLooping = true;
    this.isTransitioning = false;
    this.transitionProgress = 0;

    this.playlist = [];
    this.currentTrackIndex = 0;
    this.mixMode = 'smartOutro'; // 'smartOutro' | 'quick60' | 'quick90' | 'full'
    this.loopPlaylist = true;

    this.secondsUntilMix = null;
    this.beatsUntilMix = null;
    this.trackPlayStartTime = 0;

    // React listener callback for deck synchronization
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

    const styleInfo = TRANSITION_STYLES_INFO[this.activeExecutingStyle] || TRANSITION_STYLES_INFO.bassSwap;
    const configuredStyleInfo = TRANSITION_STYLES_INFO[this.transitionStyle] || TRANSITION_STYLES_INFO.dynamic;

    return {
      enabled: this.enabled,
      activeDeckId: this.activeDeckId,
      nextDeckId: this.nextDeckId,
      transitionStyle: this.transitionStyle,
      activeExecutingStyle: this.activeExecutingStyle,
      styleInfo,
      configuredStyleInfo,
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
    if (style !== 'dynamic') {
      this.activeExecutingStyle = style;
    } else {
      this._pickNextDynamicStyle();
    }
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

  // Intelligently picks a creative transition technique that hasn't been used consecutively
  _pickNextDynamicStyle() {
    const allStyles = ['bassSwap', 'filterSweep', 'vinylBrake', 'dropCut', 'harmonicBlend', 'echoFade', 'beatRoll'];
    // Filter out last used style so we NEVER stick to the same technique
    let candidates = allStyles.filter((s) => s !== this.lastUsedStyle);

    const currentDeck = audioEngine.decks[this.activeDeckId];
    let nextIndex = this.currentTrackIndex + 1;
    if (nextIndex >= this.playlist.length && this.loopPlaylist) {
      nextIndex = 0;
    }
    const nextTrack = this.playlist[nextIndex];

    if (currentDeck && nextTrack) {
      const currentBpm = currentDeck.bpm || 120;
      const nextBpm = nextTrack.bpm || 120;
      const bpmDiff = Math.abs(currentBpm - nextBpm);

      // Large tempo jump: prioritize brake, drop cut, or filter sweep
      if (bpmDiff > 8) {
        const tempoJumpStyles = ['vinylBrake', 'dropCut', 'filterSweep'].filter((s) => s !== this.lastUsedStyle);
        if (tempoJumpStyles.length > 0) {
          candidates = tempoJumpStyles;
        }
      }
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)] || 'bassSwap';
    this.activeExecutingStyle = chosen;
    return chosen;
  }

  // Master Launch: Start continuous beat-mix through the entire playlist
  async startPlaylistBeatMix(playlist = null, options = {}) {
    if (playlist && playlist.length > 0) {
      this.playlist = [...playlist];
    }
    if (!this.playlist.length) return false;

    await audioEngine.resumeContext();

    if (options.harmonicSort) {
      this.sortPlaylistHarmonic();
    } else if (options.bpmSort) {
      this.sortPlaylistByBpm(true);
    }

    if (options.mixMode) {
      this.mixMode = options.mixMode;
    }

    if (options.transitionStyle) {
      this.transitionStyle = options.transitionStyle;
    }

    this.enabled = true;
    this.currentTrackIndex = 0;
    this.activeDeckId = 'A';
    this.nextDeckId = 'B';
    this.trackPlayStartTime = performance.now();
    this.secondsUntilMix = null;
    this.beatsUntilMix = null;

    // Pick dynamic style for the first mix
    if (this.transitionStyle === 'dynamic') {
      this._pickNextDynamicStyle();
    } else {
      this.activeExecutingStyle = this.transitionStyle;
    }

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
      if (this.transitionStyle === 'dynamic') {
        this._pickNextDynamicStyle();
      }
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

  async startFirstTrack() {
    if (!this.playlist.length) return;
    const track = this.playlist[0];
    this.activeDeckId = 'A';
    this.nextDeckId = 'B';
    this.currentTrackIndex = 0;
    this.trackPlayStartTime = performance.now();

    if (this.transitionStyle === 'dynamic') {
      this._pickNextDynamicStyle();
    }

    await audioEngine.loadTrack('A', track);
    if (this.onDeckTrackUpdate) {
      this.onDeckTrackUpdate('A', track);
    }
    audioEngine.updateCrossfader(0);
    audioEngine.play('A');

    this._preloadNextDeck();
    this._startMonitoring();
    this.notify();
  }

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

    // Constrain by quick mix modes (60s party cut / 90s festival cut)
    if (this.mixMode === 'quick60' || this.mixMode === 'quick90') {
      const maxPlaySec = this.mixMode === 'quick60' ? 60 : 90;
      const playedSec = (performance.now() - this.trackPlayStartTime) / 1000;
      const quickTimeLeft = maxPlaySec - playedSec;
      if (quickTimeLeft < timeLeft) {
        timeLeft = quickTimeLeft;
      }
    }

    const effectiveDuration = this._getStyleDuration(this.activeExecutingStyle);
    const secondsBeforeTrigger = Math.max(0, Math.round(timeLeft - effectiveDuration));
    this.secondsUntilMix = secondsBeforeTrigger;
    const bpm = currentDeck.bpm || 120;
    this.beatsUntilMix = Math.round((secondsBeforeTrigger * bpm) / 60);

    const triggerThreshold = effectiveDuration + 1.0;
    if (timeLeft <= triggerThreshold && timeLeft > 0.3) {
      this.triggerTransition();
    } else {
      this.notify();
    }
  }

  // Returns tailored duration for each distinct style
  _getStyleDuration(style) {
    switch (style) {
      case 'dropCut':
        return 5;
      case 'beatRoll':
        return 6;
      case 'vinylBrake':
        return 7;
      case 'echoFade':
        return 8;
      case 'filterSweep':
        return 9;
      case 'harmonicBlend':
        return 14;
      case 'bassSwap':
      default:
        return this.transitionDurationSec;
    }
  }

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

  // Force trigger transition right now
  mixNextNow() {
    this.triggerTransition();
  }

  // Executes a beat-matched transition using the active or dynamically selected technique
  async triggerTransition() {
    if (this.isTransitioning) return;

    const outgoingDeckId = this.activeDeckId;
    const incomingDeckId = outgoingDeckId === 'A' ? 'B' : 'A';
    const outgoingDeck = audioEngine.decks[outgoingDeckId];
    const incomingDeck = audioEngine.decks[incomingDeckId];

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

    // Ensure incoming deck has track loaded
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

    // Start incoming deck playing
    if (!incomingDeck.isPlaying) {
      audioEngine.play(incomingDeckId);
    }

    // Determine the transition technique for this mix
    if (this.transitionStyle === 'dynamic') {
      this._pickNextDynamicStyle();
    } else {
      this.activeExecutingStyle = this.transitionStyle;
    }

    const activeStyle = this.activeExecutingStyle;
    const durationSec = this._getStyleDuration(activeStyle);
    const durationMs = durationSec * 1000;

    // Optional smart looping on outgoing track
    if (this.smartLooping && outgoingDeck.isPlaying && activeStyle !== 'vinylBrake') {
      audioEngine.toggleAutoLoop(outgoingDeckId, 8);
    }

    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.notify();

    const startXfade = outgoingDeckId === 'A' ? 0 : 1;
    const targetXfade = outgoingDeckId === 'A' ? 1 : 0;
    const startTime = performance.now();

    const animateTransition = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      this.transitionProgress = progress;

      // Base linear crossfade position
      const linearXfade = startXfade + (targetXfade - startXfade) * progress;

      // Execute specific transition acoustic technique
      switch (activeStyle) {
        case 'bassSwap': {
          audioEngine.updateCrossfader(linearXfade);
          if (progress < 0.5) {
            const inBass = -24 * (1 - progress * 2);
            audioEngine.setEQ(incomingDeckId, 'low', inBass);
            audioEngine.setEQ(outgoingDeckId, 'low', 0);
          } else {
            const outBass = -24 * ((progress - 0.5) * 2);
            audioEngine.setEQ(outgoingDeckId, 'low', outBass);
            audioEngine.setEQ(incomingDeckId, 'low', 0);
          }
          break;
        }

        case 'filterSweep': {
          audioEngine.updateCrossfader(linearXfade);
          const filterVal = Math.min(0.85, progress * 1.1);
          audioEngine.setFilter(outgoingDeckId, filterVal);
          if (progress < 0.4) {
            audioEngine.setEQ(incomingDeckId, 'low', -12 * (1 - progress / 0.4));
          } else {
            audioEngine.setEQ(incomingDeckId, 'low', 0);
          }
          break;
        }

        case 'vinylBrake': {
          // Outgoing track plays until 60%, then motor stops and crossfades rapidly
          if (progress < 0.6) {
            audioEngine.updateCrossfader(startXfade + (targetXfade - startXfade) * (progress / 0.6) * 0.25);
          } else {
            const brakeProgress = (progress - 0.6) / 0.4;
            // Vinyl brake pitch deceleration
            audioEngine.pitchBend(outgoingDeckId, -0.9 * brakeProgress);
            const snapXfade = startXfade + (targetXfade - startXfade) * (0.25 + 0.75 * Math.pow(brakeProgress, 2));
            audioEngine.updateCrossfader(snapXfade);
            audioEngine.setEQ(outgoingDeckId, 'low', -24 * brakeProgress);
          }
          break;
        }

        case 'dropCut': {
          // Holds on outgoing track with building HPF tension until 85%, then sharp slam on the drop!
          if (progress < 0.85) {
            audioEngine.setFilter(outgoingDeckId, progress * 0.6);
            audioEngine.updateCrossfader(startXfade + (targetXfade - startXfade) * 0.15 * (progress / 0.85));
          } else {
            const slamProgress = (progress - 0.85) / 0.15;
            audioEngine.updateCrossfader(startXfade + (targetXfade - startXfade) * (0.15 + 0.85 * slamProgress));
            audioEngine.setEQ(outgoingDeckId, 'low', -24);
            audioEngine.setEQ(outgoingDeckId, 'mid', -24 * slamProgress);
          }
          break;
        }

        case 'harmonicBlend': {
          // Silky smooth sinusoidal equal-power crossfade
          const sinXfade = startXfade + (targetXfade - startXfade) * (Math.sin((progress - 0.5) * Math.PI) * 0.5 + 0.5);
          audioEngine.updateCrossfader(sinXfade);
          if (progress < 0.5) {
            audioEngine.setEQ(incomingDeckId, 'low', -10 * (1 - progress * 2));
          } else {
            audioEngine.setEQ(outgoingDeckId, 'low', -10 * ((progress - 0.5) * 2));
            audioEngine.setEQ(incomingDeckId, 'low', 0);
          }
          break;
        }

        case 'echoFade': {
          audioEngine.updateCrossfader(linearXfade);
          audioEngine.setFilter(outgoingDeckId, Math.min(0.75, progress * 0.9));
          const echoPulse = Math.sin(progress * Math.PI * 6) * 3;
          audioEngine.setEQ(outgoingDeckId, 'high', echoPulse);
          if (progress > 0.5) {
            audioEngine.setEQ(outgoingDeckId, 'low', -24);
          }
          break;
        }

        case 'beatRoll': {
          // Stutter loop modulation on outgoing deck
          audioEngine.updateCrossfader(startXfade + (targetXfade - startXfade) * Math.pow(progress, 2.5));
          if (progress > 0.35 && progress < 0.9) {
            const stutterDucking = Math.sin(progress * Math.PI * 16) > 0 ? 0 : -16;
            audioEngine.setEQ(outgoingDeckId, 'mid', stutterDucking);
          } else if (progress >= 0.9) {
            audioEngine.setEQ(outgoingDeckId, 'low', -24);
          }
          break;
        }

        default:
          audioEngine.updateCrossfader(linearXfade);
          break;
      }

      this.notify();

      if (progress < 1) {
        this.transitionAnimFrame = requestAnimationFrame(animateTransition);
      } else {
        this._completeTransition(outgoingDeckId, incomingDeckId, incomingTrackIndex);
      }
    };

    this.transitionAnimFrame = requestAnimationFrame(animateTransition);
  }

  _completeTransition(outgoingDeckId, incomingDeckId, incomingTrackIndex) {
    this.isTransitioning = false;
    this.transitionProgress = 0;
    this.lastUsedStyle = this.activeExecutingStyle;

    // Stop and reset outgoing deck acoustic parameters
    audioEngine.stop(outgoingDeckId);
    audioEngine.exitLoop(outgoingDeckId);
    audioEngine.resetPlaybackRate(outgoingDeckId);
    audioEngine.setEQ(outgoingDeckId, 'low', 0);
    audioEngine.setEQ(outgoingDeckId, 'mid', 0);
    audioEngine.setEQ(outgoingDeckId, 'high', 0);
    audioEngine.setFilter(outgoingDeckId, 0);

    // Reset incoming deck acoustic parameters to pristine flat state
    audioEngine.setEQ(incomingDeckId, 'low', 0);
    audioEngine.setEQ(incomingDeckId, 'mid', 0);
    audioEngine.setEQ(incomingDeckId, 'high', 0);
    audioEngine.setFilter(incomingDeckId, 0);

    // Switch active master deck
    this.activeDeckId = incomingDeckId;
    this.nextDeckId = outgoingDeckId;
    this.currentTrackIndex = incomingTrackIndex;
    this.trackPlayStartTime = performance.now();

    // In dynamic mode, pre-pick the next technique so the UI immediately reveals it
    if (this.transitionStyle === 'dynamic') {
      this._pickNextDynamicStyle();
    }

    // Preload next track
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

  sortPlaylistByBpm(ascending = true) {
    this.playlist.sort((a, b) => {
      const bpmA = a.bpm || 120;
      const bpmB = b.bpm || 120;
      return ascending ? bpmA - bpmB : bpmB - bpmA;
    });
    this.notify();
  }

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
