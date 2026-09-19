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
    this.styleReason = 'Analyzing song harmonic & acoustic DNA...';
    this.harmonicScore = 1.0;

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
      styleReason: this.styleReason,
      harmonicScore: this.harmonicScore,
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

  // Evaluates harmonic compatibility between two Camelot keys (e.g. "8A / Am" and "9A / Em" or "8A" and "8B")
  _evaluateHarmonicCompatibility(keyA, keyB) {
    if (!keyA || !keyB) return { compatible: true, score: 0.6, label: 'Harmonic Bridge' };

    const parseCamelot = (str) => {
      const match = String(str).match(/(\d{1,2})\s*([AB])/i);
      if (!match) return null;
      return { num: parseInt(match[1], 10), letter: match[2].toUpperCase() };
    };

    const cA = parseCamelot(keyA);
    const cB = parseCamelot(keyB);
    if (!cA || !cB) return { compatible: true, score: 0.6, label: 'Harmonic Bridge' };

    // Exact Match (e.g. 8A -> 8A)
    if (cA.num === cB.num && cA.letter === cB.letter) {
      return { compatible: true, score: 1.0, label: `Exact Key Match (${cA.num}${cA.letter})` };
    }

    // Relative Major/Minor (e.g. 8A -> 8B)
    if (cA.num === cB.num && cA.letter !== cB.letter) {
      return { compatible: true, score: 0.95, label: `Relative Mode (${cA.num}${cA.letter} ➔ ${cB.num}${cB.letter})` };
    }

    // Adjacent on the Camelot 12-hour wheel (e.g. 8A -> 9A or 8A -> 7A)
    const diff = Math.abs(cA.num - cB.num);
    const isAdjacent = diff === 1 || diff === 11;
    if (isAdjacent && cA.letter === cB.letter) {
      return { compatible: true, score: 0.90, label: `Adjacent Harmonic (${cA.num}${cA.letter} ➔ ${cB.num}${cB.letter})` };
    }

    // Energy Lift (+2 on wheel, e.g. 8A -> 10A)
    const isLift = (cB.num - cA.num + 12) % 12 === 2;
    if (isLift && cA.letter === cB.letter) {
      return { compatible: true, score: 0.75, label: `Energy Boost (+2 Key)` };
    }

    // Diagonal shift (+1 and flip A/B)
    if (isAdjacent && cA.letter !== cB.letter) {
      return { compatible: true, score: 0.70, label: `Diagonal Harmonic Blend` };
    }

    // Clashing keys
    return { compatible: false, score: 0.20, label: `Key Modulation (${cA.num}${cA.letter} ➔ ${cB.num}${cB.letter})` };
  }

  // Intelligently selects the optimal mixing technique based on the songs' BPM delta, harmonic key, energy & acoustic profile (NEVER random!)
  _pickNextDynamicStyle() {
    const currentDeck = audioEngine.decks[this.activeDeckId];
    let nextIndex = this.currentTrackIndex + 1;
    if (nextIndex >= this.playlist.length && this.loopPlaylist) {
      nextIndex = 0;
    }
    const currentTrack = this.playlist[this.currentTrackIndex] || currentDeck?.trackInfo || null;
    const nextTrack = this.playlist[nextIndex] || null;

    const currentBpm = currentDeck?.bpm || currentTrack?.bpm || 120;
    const nextBpm = nextTrack?.bpm || 120;
    const bpmDiff = Math.abs(currentBpm - nextBpm);

    const keyA = currentTrack?.key || currentDeck?.trackInfo?.key || '8A';
    const keyB = nextTrack?.key || '8A';
    const harmonic = this._evaluateHarmonicCompatibility(keyA, keyB);
    this.harmonicScore = harmonic.score;

    const energyA = currentTrack?.energy !== undefined ? currentTrack.energy : 0.8;
    const energyB = nextTrack?.energy !== undefined ? nextTrack.energy : 0.8;
    const avgEnergy = (energyA + energyB) / 2;

    // Musically ranked candidate techniques derived directly from the two songs' musical parameters
    const rankedTechniques = [];

    // Rule 1: Wide Tempo Jump (BPM difference > 8)
    if (bpmDiff > 8) {
      rankedTechniques.push({
        style: 'vinylBrake',
        reason: `Tempo Jump: ${Math.round(currentBpm)} ➔ ${Math.round(nextBpm)} BPM (Turntable Motor Brake)`,
      });
      rankedTechniques.push({
        style: 'dropCut',
        reason: `Tempo Jump: ${Math.round(currentBpm)} ➔ ${Math.round(nextBpm)} BPM (Fast Downbeat Slam)`,
      });
      rankedTechniques.push({
        style: 'filterSweep',
        reason: `Tempo Bridge: ${Math.round(currentBpm)} ➔ ${Math.round(nextBpm)} BPM (Resonant Washout)`,
      });
    }
    // Rule 2: Harmonically Compatible Keys & Close Tempos (Harmonic Match)
    else if (harmonic.compatible && harmonic.score >= 0.85 && bpmDiff <= 4) {
      rankedTechniques.push({
        style: 'harmonicBlend',
        reason: `${harmonic.label} (Silky Harmonic Phrase Blend)`,
      });
      rankedTechniques.push({
        style: 'filterSweep',
        reason: `${harmonic.label} (Melodic Filter Riser)`,
      });
      rankedTechniques.push({
        style: 'bassSwap',
        reason: `${harmonic.label} (Sub-Bass Frequency Swap)`,
      });
    }
    // Rule 3: High Energy Peak-Time Dance / Bass Grooves (EDM, House, Techno, Afrobeats)
    else if (avgEnergy >= 0.75 && bpmDiff <= 6) {
      rankedTechniques.push({
        style: 'bassSwap',
        reason: `Club Peak Energy: ${Math.round(currentBpm)} BPM (Sub-Bass Punch)`,
      });
      rankedTechniques.push({
        style: 'beatRoll',
        reason: `Peak Energy: ${Math.round(currentBpm)} BPM (Rhythmic Stutter Buildup)`,
      });
      rankedTechniques.push({
        style: 'filterSweep',
        reason: `Energy Riser: ${Math.round(currentBpm)} BPM (High-Pass Sweep)`,
      });
    }
    // Rule 4: Harmonic Clash (Unrelated keys where overlapping melodies would sound dissonant)
    else if (!harmonic.compatible || harmonic.score <= 0.3) {
      rankedTechniques.push({
        style: 'echoFade',
        reason: `${harmonic.label} (High-Pass Echo Out to Clean Key)`,
      });
      rankedTechniques.push({
        style: 'filterSweep',
        reason: `${harmonic.label} (Resonant Filter Decouple)`,
      });
      rankedTechniques.push({
        style: 'dropCut',
        reason: `${harmonic.label} (Sharp Downbeat Cut to New Key)`,
      });
    }
    // Rule 5: Moderate Tempo Shift (4 < BPM Diff <= 8)
    else if (bpmDiff > 4) {
      rankedTechniques.push({
        style: 'filterSweep',
        reason: `Tempo Shift: ${Math.round(currentBpm)} ➔ ${Math.round(nextBpm)} BPM (Filter Sweep)`,
      });
      rankedTechniques.push({
        style: 'beatRoll',
        reason: `Tempo Shift: ${Math.round(currentBpm)} ➔ ${Math.round(nextBpm)} BPM (Quantized Roll)`,
      });
      rankedTechniques.push({
        style: 'bassSwap',
        reason: `Tempo Shift: ${Math.round(currentBpm)} ➔ ${Math.round(nextBpm)} BPM (Bass Swap)`,
      });
    }
    // Rule 6: Default balanced musical transition
    else {
      rankedTechniques.push({
        style: 'bassSwap',
        reason: `Seamless Sub-Bass Swap (${Math.round(currentBpm)} BPM)`,
      });
      rankedTechniques.push({
        style: 'harmonicBlend',
        reason: `Harmonic Mid/High Layering`,
      });
      rankedTechniques.push({
        style: 'filterSweep',
        reason: `Resonant Filter Riser`,
      });
    }

    // Select the highest-ranked technique that was NOT used on the immediately preceding song
    let chosen = rankedTechniques[0];
    if (chosen.style === this.lastUsedStyle && rankedTechniques.length > 1) {
      chosen = rankedTechniques[1];
    } else if (chosen.style === this.lastUsedStyle && rankedTechniques.length > 2) {
      chosen = rankedTechniques[2];
    }

    this.activeExecutingStyle = chosen.style;
    this.styleReason = chosen.reason;
    return chosen.style;
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

    const bpm = currentDeck.bpm || 120;
    const effectiveDuration = this._getStyleDuration(this.activeExecutingStyle, bpm);
    const secondsBeforeTrigger = Math.max(0, Math.round(timeLeft - effectiveDuration));
    this.secondsUntilMix = secondsBeforeTrigger;
    this.beatsUntilMix = Math.round((secondsBeforeTrigger * bpm) / 60);

    const triggerThreshold = effectiveDuration + 1.0;
    if (timeLeft <= triggerThreshold && timeLeft > 0.3) {
      this.triggerTransition();
    } else {
      this.notify();
    }
  }

  // Returns tailored duration for each distinct style quantized to the song's BPM and phrase structure
  _getStyleDuration(style, bpm = 120) {
    const secPerBeat = 60 / (bpm || 120);
    const barSec = secPerBeat * 4;

    switch (style) {
      case 'dropCut':
        // Exactly 1 or 2 bars before drop downbeat
        return Math.round(Math.min(5, Math.max(3, barSec * 2)) * 10) / 10;
      case 'beatRoll':
        // Exactly 2 bars (8 beats) stutter roll
        return Math.round(Math.max(4, barSec * 2) * 10) / 10;
      case 'vinylBrake':
        // 2 bars (8 beats) physical platter deceleration
        return Math.round(Math.max(4, barSec * 2.5) * 10) / 10;
      case 'echoFade':
        // 3 bars (12 beats) resonant decay
        return Math.round(Math.max(5, barSec * 3) * 10) / 10;
      case 'filterSweep':
        // 4 bars (16 beats) full phrase riser
        return Math.round(Math.max(6, barSec * 4) * 10) / 10;
      case 'harmonicBlend':
        // 8 bars (32 beats) double phrase harmonic layering
        return Math.round(Math.max(10, barSec * 8) * 10) / 10;
      case 'bassSwap':
      default:
        // Phrased aligned based on user setting or 4/8 bars
        return Math.round(Math.max(6, Math.min(32, this.transitionDurationSec)) * 10) / 10;
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
    const durationSec = this._getStyleDuration(activeStyle, incomingDeck.bpm || outgoingDeck.bpm || 120);
    const durationMs = durationSec * 1000;

    // Automatically select the pro crossfader curve tailored to this transition
    if (activeStyle === 'harmonicBlend') {
      audioEngine.setCrossfadeCurve('slowBlend');
    } else if (activeStyle === 'dropCut' || activeStyle === 'beatRoll') {
      audioEngine.setCrossfadeCurve('cut');
    } else if (activeStyle === 'bassSwap') {
      audioEngine.setCrossfadeCurve('dip');
    } else if (activeStyle === 'vinylBrake' || activeStyle === 'echoFade') {
      audioEngine.setCrossfadeCurve('linear');
    } else {
      audioEngine.setCrossfadeCurve('equalPower');
    }

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
    audioEngine.setCrossfadeCurve('equalPower');

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
