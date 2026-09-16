// High-performance Web Audio DJ Engine with dual decks, 3-band EQ, bi-directional filters,
// real-time analysers, BPM detection, and synth demo track generators.

class DJAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.masterAnalyser = null;
    this.crossfadeValue = 0.5; // 0 = Deck A, 1 = Deck B
    this.crossfadeCurve = 'equalPower'; // 'equalPower' | 'linear' | 'cut'

    this.decks = {
      A: this._createDeckState('A'),
      B: this._createDeckState('B'),
    };

    this.recorderNode = null;
    this.recordedChunks = [];
    this.isRecording = false;
  }

  _createDeckState(id) {
    return {
      id,
      audioBuffer: null,
      sourceNode: null,
      trackInfo: null,
      isPlaying: false,
      isPaused: false,
      startTime: 0,
      pauseOffset: 0,
      playbackRate: 1.0,
      pitchPercent: 0,
      bpm: 120,
      originalBpm: 120,
      
      // Audio nodes
      gainNode: null,
      eqLow: null,
      eqMid: null,
      eqHigh: null,
      filterNode: null,
      analyserNode: null,
      pflGainNode: null,

      // EQ settings (-24dB to +6dB)
      eqGains: { low: 0, mid: 0, high: 0 },
      eqKills: { low: false, mid: false, high: false },
      filterVal: 0, // -1 (full lowpass) to 0 (neutral) to +1 (full highpass)
      gainVal: 1.0,
      volumeFader: 0.85,

      // Cues & Loops
      cuePoint: 0,
      hotCues: [null, null, null, null],
      isLooping: false,
      loopStart: 0,
      loopEnd: 0,
      loopLengthBeats: 4,

      // Scratching / Nudge
      isScratching: false,
      reverse: false,
    };
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass({ latencyHint: 'interactive' });

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;

    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 1024;
    this.masterAnalyser.smoothingTimeConstant = 0.8;

    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);

    // Init decks audio pipelines
    this._initDeckAudioNodes('A');
    this._initDeckAudioNodes('B');

    this.updateCrossfader(0.5);
  }

  async resumeContext() {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  _initDeckAudioNodes(deckId) {
    const deck = this.decks[deckId];

    // 3-Band Equalizer
    // Low: Low-shelf at 250Hz
    deck.eqLow = this.ctx.createBiquadFilter();
    deck.eqLow.type = 'lowshelf';
    deck.eqLow.frequency.value = 250;
    deck.eqLow.gain.value = 0;

    // Mid: Peaking at 1000Hz
    deck.eqMid = this.ctx.createBiquadFilter();
    deck.eqMid.type = 'peaking';
    deck.eqMid.frequency.value = 1000;
    deck.eqMid.Q.value = 1.0;
    deck.eqMid.gain.value = 0;

    // High: High-shelf at 3500Hz
    deck.eqHigh = this.ctx.createBiquadFilter();
    deck.eqHigh.type = 'highshelf';
    deck.eqHigh.frequency.value = 3500;
    deck.eqHigh.gain.value = 0;

    // Bi-directional Filter (Lowpass / Highpass combo)
    deck.filterNode = this.ctx.createBiquadFilter();
    deck.filterNode.type = 'allpass';
    deck.filterNode.frequency.value = 1000;

    // Channel Volume Gain
    deck.gainNode = this.ctx.createGain();
    deck.gainNode.gain.value = deck.volumeFader;

    // Deck Analyser for VU & visualizer
    deck.analyserNode = this.ctx.createAnalyser();
    deck.analyserNode.fftSize = 512;
    deck.analyserNode.smoothingTimeConstant = 0.75;

    // Crossfader connection gain
    deck.crossfadeGain = this.ctx.createGain();

    // Node routing:
    // Source -> eqLow -> eqMid -> eqHigh -> filterNode -> deck.gainNode -> deck.analyserNode -> crossfadeGain -> masterGain
    deck.eqLow.connect(deck.eqMid);
    deck.eqMid.connect(deck.eqHigh);
    deck.eqHigh.connect(deck.filterNode);
    deck.filterNode.connect(deck.gainNode);
    deck.gainNode.connect(deck.analyserNode);
    deck.analyserNode.connect(deck.crossfadeGain);
    deck.crossfadeGain.connect(this.masterGain);
  }

  // Crossfader curves
  updateCrossfader(value) {
    this.crossfadeValue = Math.max(0, Math.min(1, value));
    if (!this.decks.A.crossfadeGain || !this.decks.B.crossfadeGain) return;

    let gainA = 1.0;
    let gainB = 1.0;

    if (this.crossfadeCurve === 'equalPower') {
      // Equal power curve maintains constant energy across mix
      gainA = Math.cos(this.crossfadeValue * 0.5 * Math.PI);
      gainB = Math.sin(this.crossfadeValue * 0.5 * Math.PI);
    } else if (this.crossfadeCurve === 'linear') {
      gainA = 1 - this.crossfadeValue;
      gainB = this.crossfadeValue;
    } else if (this.crossfadeCurve === 'cut') {
      // Scratch/cut curve: full volume until extreme ends
      gainA = this.crossfadeValue > 0.95 ? 0 : 1;
      gainB = this.crossfadeValue < 0.05 ? 0 : 1;
    }

    const now = this.ctx ? this.ctx.currentTime : 0;
    this.decks.A.crossfadeGain.gain.setValueAtTime(gainA, now);
    this.decks.B.crossfadeGain.gain.setValueAtTime(gainB, now);
  }

  setCrossfadeCurve(curve) {
    this.crossfadeCurve = curve;
    this.updateCrossfader(this.crossfadeValue);
  }

  // EQ Controls
  setEQ(deckId, band, gainDb) {
    const deck = this.decks[deckId];
    if (!deck) return;
    deck.eqGains[band] = gainDb;
    this._applyEQ(deckId, band);
  }

  toggleKill(deckId, band) {
    const deck = this.decks[deckId];
    if (!deck) return false;
    deck.eqKills[band] = !deck.eqKills[band];
    this._applyEQ(deckId, band);
    return deck.eqKills[band];
  }

  _applyEQ(deckId, band) {
    const deck = this.decks[deckId];
    const targetNode = band === 'low' ? deck.eqLow : band === 'mid' ? deck.eqMid : deck.eqHigh;
    if (!targetNode) return;

    const isKilled = deck.eqKills[band];
    const gainValue = isKilled ? -48 : deck.eqGains[band]; // -48dB acts as complete frequency kill
    const now = this.ctx ? this.ctx.currentTime : 0;
    targetNode.gain.setTargetAtTime(gainValue, now, 0.02);
  }

  // Filter sweep: val between -1 (LPF) and +1 (HPF), 0 is bypass
  setFilter(deckId, val) {
    const deck = this.decks[deckId];
    if (!deck || !deck.filterNode) return;
    deck.filterVal = Math.max(-1, Math.min(1, val));
    const now = this.ctx ? this.ctx.currentTime : 0;

    if (Math.abs(deck.filterVal) < 0.03) {
      deck.filterNode.type = 'allpass';
    } else if (deck.filterVal < 0) {
      // Low-pass filter: sweeps from 20000Hz down to 200Hz
      deck.filterNode.type = 'lowpass';
      const normalized = 1 + deck.filterVal; // 0 to 1
      const freq = 200 * Math.pow(20000 / 200, normalized);
      deck.filterNode.frequency.setTargetAtTime(freq, now, 0.02);
      deck.filterNode.Q.setTargetAtTime(1.8, now, 0.02);
    } else {
      // High-pass filter: sweeps from 20Hz up to 5000Hz
      deck.filterNode.type = 'highpass';
      const freq = 20 * Math.pow(5000 / 20, deck.filterVal);
      deck.filterNode.frequency.setTargetAtTime(freq, now, 0.02);
      deck.filterNode.Q.setTargetAtTime(1.8, now, 0.02);
    }
  }

  setVolume(deckId, val) {
    const deck = this.decks[deckId];
    if (!deck || !deck.gainNode) return;
    deck.volumeFader = Math.max(0, Math.min(1, val));
    const now = this.ctx ? this.ctx.currentTime : 0;
    deck.gainNode.gain.setTargetAtTime(deck.volumeFader, now, 0.015);
  }

  setMasterVolume(val) {
    if (!this.masterGain) return;
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1.2, val)), now, 0.02);
  }

  // Tempo / Pitch
  setPitchPercent(deckId, percent) {
    const deck = this.decks[deckId];
    if (!deck) return;
    deck.pitchPercent = percent;
    // playbackRate multiplier: e.g. +8% = 1.08, -8% = 0.92
    deck.playbackRate = 1.0 + (percent / 100);
    deck.bpm = Math.round(deck.originalBpm * deck.playbackRate * 10) / 10;

    if (deck.sourceNode && deck.sourceNode.playbackRate) {
      const now = this.ctx ? this.ctx.currentTime : 0;
      deck.sourceNode.playbackRate.setTargetAtTime(deck.playbackRate, now, 0.02);
    }
  }

  pitchBend(deckId, delta) {
    const deck = this.decks[deckId];
    if (!deck || !deck.sourceNode) return;
    const tempRate = deck.playbackRate + delta;
    const now = this.ctx ? this.ctx.currentTime : 0;
    deck.sourceNode.playbackRate.setValueAtTime(tempRate, now);
    deck.sourceNode.playbackRate.setTargetAtTime(deck.playbackRate, now + 0.25, 0.1);
  }

  // Sync deck to other deck BPM
  syncDecks(targetDeckId, sourceDeckId) {
    const target = this.decks[targetDeckId];
    const source = this.decks[sourceDeckId];
    if (!target || !source || !target.originalBpm) return;

    // Desired BPM is source's current effective BPM
    const targetBpm = source.bpm || 120;
    const neededRate = targetBpm / target.originalBpm;
    const neededPercent = (neededRate - 1.0) * 100;
    this.setPitchPercent(targetDeckId, neededPercent);

    // Beat phase alignment
    if (target.isPlaying && source.isPlaying) {
      const beatDuration = 60 / targetBpm;
      const sourcePos = this.getCurrentTime(sourceDeckId);
      const targetPos = this.getCurrentTime(targetDeckId);
      const phaseDiff = (sourcePos % beatDuration) - (targetPos % beatDuration);
      if (Math.abs(phaseDiff) > 0.01) {
        this.seek(targetDeckId, targetPos + phaseDiff);
      }
    }
  }

  // Resolve real audio stream URL from high-resolution audio CDN (CORS enabled)
  async resolveRealAudioStream(track) {
    if (!track) return null;
    if (track.previewUrl && typeof track.previewUrl === 'string' && track.previewUrl.startsWith('http')) {
      return track.previewUrl;
    }

    const title = track.title || track.name || '';
    const artist = track.artist || (track.artists ? track.artists.map((a) => a.name).join(' ') : '');
    const cleanQuery = `${title} ${artist}`.replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanQuery) return null;

    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=song&limit=1`);
      if (res.ok) {
        const data = await res.json();
        const url = data.results?.[0]?.previewUrl;
        if (url) return url;
      }
    } catch (e) {
      console.warn('Real audio stream resolver query failed:', e);
    }

    // Try with title alone if composite search didn't match
    if (title) {
      try {
        const cleanTitle = title.replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim();
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitle)}&entity=song&limit=1`);
        if (res.ok) {
          const data = await res.json();
          const url = data.results?.[0]?.previewUrl;
          if (url) return url;
        }
      } catch (e) {}
    }

    return null;
  }

  // Seamlessly extends an AudioBuffer to at least minDurationSec (default: 300s = 5 minutes)
  // using professional equal-power crossfading at each loop boundary to prevent audio clicks
  extendAudioBuffer(inputBuffer, minDurationSec = 300) {
    if (!inputBuffer) return inputBuffer;
    if (inputBuffer.duration >= minDurationSec) {
      return inputBuffer;
    }

    try {
      const sampleRate = inputBuffer.sampleRate;
      const numChannels = inputBuffer.numberOfChannels;
      const origLength = inputBuffer.length;
      const targetLength = Math.floor(minDurationSec * sampleRate);
      const xfadeSamples = Math.min(Math.floor(sampleRate * 0.05), Math.floor(origLength * 0.1)); // 50ms smooth crossfade
      const extended = this.ctx.createBuffer(numChannels, targetLength, sampleRate);

      for (let ch = 0; ch < numChannels; ch++) {
        const src = inputBuffer.getChannelData(ch);
        const dest = extended.getChannelData(ch);

        let outPos = 0;
        let repeatCount = 0;

        while (outPos < targetLength) {
          const copyLen = Math.min(origLength, targetLength - outPos);

          for (let i = 0; i < copyLen; i++) {
            const destIdx = outPos + i;
            if (destIdx >= targetLength) break;

            if (repeatCount > 0 && i < xfadeSamples) {
              const t = i / xfadeSamples;
              const fadeIn = Math.sin(t * Math.PI * 0.5);
              const fadeOut = Math.cos(t * Math.PI * 0.5);
              dest[destIdx] = (src[i] * fadeIn) + (dest[destIdx] * fadeOut);
            } else {
              dest[destIdx] = src[i];
            }
          }

          outPos += origLength - xfadeSamples;
          repeatCount++;
        }
      }

      return extended;
    } catch (err) {
      console.warn('Could not extend audio buffer', err);
      return inputBuffer;
    }
  }

  // Load track buffer
  async loadTrack(deckId, track) {
    this.resumeContext();
    const deck = this.decks[deckId];
    if (!deck) return null;

    // Stop current playback
    this.stop(deckId);
    deck.isLoading = true;

    let audioBuffer = null;
    let isRealAudio = false;

    if (track.audioBuffer) {
      audioBuffer = track.audioBuffer;
      isRealAudio = true;
    } else if (track.file) {
      try {
        const arrayBuffer = await track.file.arrayBuffer();
        audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        isRealAudio = true;
      } catch (e) {
        console.warn('Could not decode local file audio', e);
      }
    } else {
      // Find real audio stream URL
      let streamUrl = track.previewUrl;
      if (!streamUrl || typeof streamUrl !== 'string' || !streamUrl.startsWith('http')) {
        streamUrl = await this.resolveRealAudioStream(track);
        if (streamUrl) track.previewUrl = streamUrl;
      }

      if (streamUrl) {
        try {
          const res = await fetch(streamUrl);
          if (res.ok) {
            const ab = await res.arrayBuffer();
            audioBuffer = await this.ctx.decodeAudioData(ab);
            isRealAudio = true;
          }
        } catch (e) {
          console.warn('Could not fetch or decode real audio stream', e);
        }
      }
    }

    // Fallback synth track only if real audio could not be resolved (minimum 5 minutes)
    if (!audioBuffer) {
      const targetBpm = track.bpm || 124;
      const genre = (track.genre || '').toLowerCase();
      const style = genre.includes('techno') ? 'dnb' : genre.includes('bass') ? 'bass' : 'house';
      audioBuffer = this._generateSynthTrack(targetBpm, 300, style);
      isRealAudio = false;
    }

    // Extend buffer to at least 5 minutes (300 seconds) so track never cuts out early
    if (audioBuffer && audioBuffer.duration < 300) {
      audioBuffer = this.extendAudioBuffer(audioBuffer, 300);
    }

    deck.audioBuffer = audioBuffer;
    deck.isRealAudio = isRealAudio;
    deck.isLoading = false;
    deck.trackInfo = {
      ...track,
      duration: audioBuffer.duration,
      isRealAudio,
    };
    deck.pauseOffset = 0;
    deck.cuePoint = 0;
    deck.hotCues = [null, null, null, null];
    deck.isLooping = false;

    // Calculate BPM
    if (track.bpm) {
      deck.originalBpm = track.bpm;
    } else {
      deck.originalBpm = await this.detectBPM(audioBuffer);
    }
    deck.bpm = deck.originalBpm;
    this.setPitchPercent(deckId, 0);

    return {
      duration: audioBuffer.duration,
      bpm: deck.bpm,
      isRealAudio,
    };
  }

  // Play / Pause / Cue Transport
  play(deckId) {
    this.resumeContext();
    const deck = this.decks[deckId];
    if (!deck || !deck.audioBuffer || deck.isPlaying) return;

    deck.sourceNode = this.ctx.createBufferSource();
    deck.sourceNode.buffer = deck.audioBuffer;
    deck.sourceNode.playbackRate.value = deck.playbackRate;
    deck.sourceNode.connect(deck.eqLow);

    // Looping if enabled
    if (deck.isLooping && deck.loopEnd > deck.loopStart) {
      deck.sourceNode.loop = true;
      deck.sourceNode.loopStart = deck.loopStart;
      deck.sourceNode.loopEnd = deck.loopEnd;
    }

    const offset = Math.min(deck.pauseOffset, deck.audioBuffer.duration);
    deck.startTime = this.ctx.currentTime - (offset / deck.playbackRate);
    deck.sourceNode.start(0, offset);
    deck.isPlaying = true;
    deck.isPaused = false;

    deck.sourceNode.onended = () => {
      if (deck.isPlaying && !deck.isLooping) {
        deck.isPlaying = false;
        deck.isPaused = false;
        deck.pauseOffset = 0;
      }
    };
  }

  pause(deckId) {
    const deck = this.decks[deckId];
    if (!deck || !deck.isPlaying) return;

    deck.pauseOffset = this.getCurrentTime(deckId);
    if (deck.sourceNode) {
      deck.sourceNode.onended = null;
      try { deck.sourceNode.stop(); } catch(e) {}
      deck.sourceNode.disconnect();
      deck.sourceNode = null;
    }
    deck.isPlaying = false;
    deck.isPaused = true;
  }

  stop(deckId) {
    const deck = this.decks[deckId];
    if (!deck) return;
    if (deck.sourceNode) {
      deck.sourceNode.onended = null;
      try { deck.sourceNode.stop(); } catch(e) {}
      deck.sourceNode.disconnect();
      deck.sourceNode = null;
    }
    deck.isPlaying = false;
    deck.isPaused = false;
    deck.pauseOffset = 0;
  }

  seek(deckId, timeSeconds) {
    const deck = this.decks[deckId];
    if (!deck || !deck.audioBuffer) return;
    const clamped = Math.max(0, Math.min(deck.audioBuffer.duration, timeSeconds));
    const wasPlaying = deck.isPlaying;

    if (wasPlaying) {
      this.pause(deckId);
      deck.pauseOffset = clamped;
      this.play(deckId);
    } else {
      deck.pauseOffset = clamped;
    }
  }

  cue(deckId) {
    const deck = this.decks[deckId];
    if (!deck || !deck.audioBuffer) return;

    if (deck.isPlaying) {
      // Jumping back to cue point and pause
      this.pause(deckId);
      deck.pauseOffset = deck.cuePoint;
    } else {
      // If paused at current pos, set cue point here
      deck.cuePoint = deck.pauseOffset;
    }
  }

  // Hot Cues (pad 0-3)
  setHotCue(deckId, index) {
    const deck = this.decks[deckId];
    if (!deck) return;
    const pos = this.getCurrentTime(deckId);
    deck.hotCues[index] = pos;
    return pos;
  }

  jumpHotCue(deckId, index) {
    const deck = this.decks[deckId];
    if (!deck || deck.hotCues[index] === null) return;
    this.seek(deckId, deck.hotCues[index]);
  }

  deleteHotCue(deckId, index) {
    const deck = this.decks[deckId];
    if (!deck) return;
    deck.hotCues[index] = null;
  }

  // Looping
  toggleAutoLoop(deckId, beats) {
    const deck = this.decks[deckId];
    if (!deck || !deck.audioBuffer) return false;

    if (deck.isLooping && deck.loopLengthBeats === beats) {
      // Exit loop
      this.exitLoop(deckId);
      return false;
    }

    const currentPos = this.getCurrentTime(deckId);
    const bpm = deck.bpm || 120;
    const secondsPerBeat = 60 / bpm;
    const loopDuration = beats * secondsPerBeat;

    deck.loopStart = currentPos;
    deck.loopEnd = Math.min(deck.audioBuffer.duration, currentPos + loopDuration);
    deck.loopLengthBeats = beats;
    deck.isLooping = true;

    if (deck.sourceNode) {
      deck.sourceNode.loop = true;
      deck.sourceNode.loopStart = deck.loopStart;
      deck.sourceNode.loopEnd = deck.loopEnd;
    }
    return true;
  }

  exitLoop(deckId) {
    const deck = this.decks[deckId];
    if (!deck) return;
    deck.isLooping = false;
    if (deck.sourceNode) {
      deck.sourceNode.loop = false;
    }
  }

  getCurrentTime(deckId) {
    const deck = this.decks[deckId];
    if (!deck || !deck.audioBuffer) return 0;
    if (!deck.isPlaying) return deck.pauseOffset;
    const elapsed = (this.ctx.currentTime - deck.startTime) * deck.playbackRate;
    return Math.min(deck.audioBuffer.duration, Math.max(0, elapsed));
  }

  // Audio Visualiser & VU Levels
  getDeckLevels(deckId) {
    const deck = this.decks[deckId];
    if (!deck || !deck.analyserNode) return { peak: 0, rms: 0 };

    const buffer = new Uint8Array(deck.analyserNode.frequencyBinCount);
    deck.analyserNode.getByteTimeDomainData(buffer);

    let sumSquares = 0;
    let peak = 0;
    for (let i = 0; i < buffer.length; i++) {
      const norm = (buffer[i] - 128) / 128;
      const abs = Math.abs(norm);
      if (abs > peak) peak = abs;
      sumSquares += norm * norm;
    }
    const rms = Math.sqrt(sumSquares / buffer.length);
    return { peak, rms };
  }

  getMasterLevels() {
    if (!this.masterAnalyser) return { peak: 0, rms: 0 };
    const buffer = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    this.masterAnalyser.getByteTimeDomainData(buffer);

    let sumSquares = 0;
    let peak = 0;
    for (let i = 0; i < buffer.length; i++) {
      const norm = (buffer[i] - 128) / 128;
      const abs = Math.abs(norm);
      if (abs > peak) peak = abs;
      sumSquares += norm * norm;
    }
    const rms = Math.sqrt(sumSquares / buffer.length);
    return { peak, rms };
  }

  // BPM Detection using peak interval histogram & energy analysis
  async detectBPM(audioBuffer) {
    try {
      const sampleRate = audioBuffer.sampleRate;
      const channelData = audioBuffer.getChannelData(0);
      // Analyze up to 60 seconds of track
      const length = Math.min(channelData.length, sampleRate * 60);

      // Downsample to ~22050Hz for faster processing
      const downsampleFactor = Math.floor(sampleRate / 22050) || 1;
      const downsampledLength = Math.floor(length / downsampleFactor);
      const stepRate = sampleRate / downsampleFactor;

      // Extract low frequency energy (bass beats: kicks/snares)
      const buffer = new Float32Array(downsampledLength);
      for (let i = 0; i < downsampledLength; i++) {
        buffer[i] = channelData[i * downsampleFactor];
      }

      // Energy calculation in ~20ms frames
      const frameSize = Math.floor(stepRate * 0.02);
      const numFrames = Math.floor(downsampledLength / frameSize);
      const energies = new Float32Array(numFrames);

      for (let i = 0; i < numFrames; i++) {
        let sum = 0;
        const start = i * frameSize;
        for (let j = 0; j < frameSize; j++) {
          const s = buffer[start + j];
          sum += s * s;
        }
        energies[i] = sum;
      }

      // Peak thresholding
      const peaks = [];
      const windowSize = 10;
      for (let i = windowSize; i < numFrames - windowSize; i++) {
        let localAvg = 0;
        for (let j = -windowSize; j <= windowSize; j++) {
          localAvg += energies[i + j];
        }
        localAvg /= (windowSize * 2 + 1);

        if (energies[i] > localAvg * 1.35) {
          peaks.push(i);
        }
      }

      // Compute intervals between peaks
      const intervals = {};
      for (let i = 0; i < peaks.length; i++) {
        for (let j = 1; j <= 8 && i + j < peaks.length; j++) {
          const intervalFrames = peaks[i + j] - peaks[i];
          const intervalSeconds = (intervalFrames * frameSize) / stepRate;
          const bpm = 60 / intervalSeconds;

          // Standard DJ tempo range 70 to 180 BPM
          let normalizedBpm = bpm;
          while (normalizedBpm < 75) normalizedBpm *= 2;
          while (normalizedBpm > 175) normalizedBpm /= 2;

          const rounded = Math.round(normalizedBpm);
          intervals[rounded] = (intervals[rounded] || 0) + 1;
        }
      }

      // Find highest scoring BPM
      let bestBpm = 126;
      let maxVotes = 0;
      for (const [bpmStr, votes] of Object.entries(intervals)) {
        const bpmVal = parseInt(bpmStr, 10);
        if (votes > maxVotes && bpmVal >= 80 && bpmVal <= 165) {
          maxVotes = votes;
          bestBpm = bpmVal;
        }
      }
      return bestBpm;
    } catch (e) {
      console.warn('BPM detection fallback to 124', e);
      return 124;
    }
  }

  // High-Quality Synthetic Demo Tracks Generator
  // Produces complete club-ready electronic tracks for instant testing!
  createDemoTracks() {
    this.resumeContext();
    return [
      {
        id: 'demo-1',
        title: 'Neon Tokyo Odyssey',
        artist: 'Cyber DJ',
        bpm: 128,
        key: '8A / Am',
        genre: 'Cyber House',
        duration: 300,
        audioBuffer: this._generateSynthTrack(128, 300, 'house'),
      },
      {
        id: 'demo-2',
        title: 'Sunset Beach Groove',
        artist: 'Ibiza Resident',
        bpm: 124,
        key: '9B / G',
        genre: 'Deep Tech',
        duration: 300,
        audioBuffer: this._generateSynthTrack(124, 300, 'deepTech'),
      },
      {
        id: 'demo-3',
        title: 'Midnight Bass Eclipse',
        artist: 'Sub Zero',
        bpm: 140,
        key: '4A / Fm',
        genre: 'Future Bass',
        duration: 300,
        audioBuffer: this._generateSynthTrack(140, 300, 'bass'),
      },
      {
        id: 'demo-4',
        title: 'Cyberpunk Hyperdrive',
        artist: 'Vektor Pulse',
        bpm: 172,
        key: '11B / A',
        genre: 'Drum & Bass',
        duration: 300,
        audioBuffer: this._generateSynthTrack(172, 300, 'dnb'),
      },
    ];
  }

  // Procedural audio generation of dance music stems rendered into an AudioBuffer
  _generateSynthTrack(bpm, durationSec, style) {
    if (!this.ctx) this.init();
    const sampleRate = this.ctx.sampleRate;
    const totalSamples = Math.floor(sampleRate * durationSec);
    const audioBuffer = this.ctx.createBuffer(2, totalSamples, sampleRate);
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);

    const secondsPerBeat = 60 / bpm;
    const samplesPerBeat = Math.floor(sampleRate * secondsPerBeat);
    const totalBeats = Math.floor(durationSec / secondsPerBeat);

    // Generate drums, bassline, synth chord stab, and risers
    for (let beat = 0; beat < totalBeats; beat++) {
      const beatStartSample = beat * samplesPerBeat;
      const bar = Math.floor(beat / 4);
      const beatInBar = beat % 4;

      // 1. Kick Drum (4-on-the-floor for house/tech, broken for dnb/bass)
      const isKick = style === 'dnb'
        ? (beatInBar === 0 || (beatInBar === 2 && bar % 2 === 1))
        : (style === 'bass' ? (beatInBar === 0 || beatInBar === 2) : true);

      if (isKick) {
        const kickLen = Math.min(Math.floor(sampleRate * 0.35), totalSamples - beatStartSample);
        for (let i = 0; i < kickLen; i++) {
          const t = i / sampleRate;
          // Pitch envelope: drops from 150Hz to 45Hz
          const freq = 45 + 115 * Math.exp(-t * 22);
          const env = Math.exp(-t * 8.5);
          const val = Math.sin(2 * Math.PI * freq * t) * env * 0.7;
          left[beatStartSample + i] += val;
          right[beatStartSample + i] += val;
        }
      }

      // 2. Snare / Clap on beats 1 & 3 (2 & 4 in musical 1-4 counting)
      const isSnare = (beatInBar === 1 || beatInBar === 3);
      if (isSnare) {
        const snareLen = Math.min(Math.floor(sampleRate * 0.22), totalSamples - beatStartSample);
        for (let i = 0; i < snareLen; i++) {
          const t = i / sampleRate;
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 16) * 0.35;
          const tone = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 24) * 0.3;
          const val = noise + tone;
          left[beatStartSample + i] += val * 0.85;
          right[beatStartSample + i] += val * 0.85;
        }
      }

      // 3. Offbeat Hi-Hats (8th notes between beats)
      const offbeatSample = beatStartSample + Math.floor(samplesPerBeat / 2);
      if (offbeatSample < totalSamples) {
        const hatLen = Math.min(Math.floor(sampleRate * 0.08), totalSamples - offbeatSample);
        for (let i = 0; i < hatLen; i++) {
          const t = i / sampleRate;
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 55) * 0.22;
          left[offbeatSample + i] += noise * 0.9;
          right[offbeatSample + i] += noise * 1.1; // stereo width
        }
      }

      // 4. Bassline notes (driving electronic groove)
      const baseFreq = style === 'house' ? 55 : (style === 'bass' ? 43.65 : 65.41);
      const notes = [1, 1, 1.33, 1.5, 1.2, 1, 1.33, 1.78];
      const noteFreq = baseFreq * notes[beat % notes.length];
      const bassLen = Math.min(Math.floor(samplesPerBeat * 0.85), totalSamples - beatStartSample);
      for (let i = 0; i < bassLen; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 3.5);
        // Sawtooth-like bass harmonic
        const val = (Math.sin(2 * Math.PI * noteFreq * t) +
                     0.4 * Math.sin(4 * Math.PI * noteFreq * t) +
                     0.2 * Math.sin(6 * Math.PI * noteFreq * t)) * env * 0.32;
        left[beatStartSample + i] += val;
        right[beatStartSample + i] += val;
      }

      // 5. Synth Pluck / Chord Stab on alternate bars
      if (bar % 2 === 1 && (beatInBar === 0 || beatInBar === 2)) {
        const chordLen = Math.min(Math.floor(samplesPerBeat * 1.8), totalSamples - beatStartSample);
        const chordFreqs = [noteFreq * 2, noteFreq * 2.4, noteFreq * 3.0];
        for (let i = 0; i < chordLen; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 2.2);
          let chordVal = 0;
          chordFreqs.forEach((cf, idx) => {
            chordVal += Math.sin(2 * Math.PI * cf * t + (idx * 0.5));
          });
          chordVal = (chordVal / 3) * env * 0.28;
          left[beatStartSample + i] += chordVal * 1.15;
          right[beatStartSample + i] += chordVal * 0.85;
        }
      }
    }

    // Master normalize & soft clipping to prevent distortion
    let maxVal = 0;
    for (let i = 0; i < totalSamples; i++) {
      const l = Math.abs(left[i]);
      const r = Math.abs(right[i]);
      if (l > maxVal) maxVal = l;
      if (r > maxVal) maxVal = r;
    }
    if (maxVal > 0.95) {
      const factor = 0.92 / maxVal;
      for (let i = 0; i < totalSamples; i++) {
        left[i] = Math.tanh(left[i] * factor);
        right[i] = Math.tanh(right[i] * factor);
      }
    }

    return audioBuffer;
  }
}

export const audioEngine = new DJAudioEngine();
export default audioEngine;
