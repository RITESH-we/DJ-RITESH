import React, { useState, useEffect, useRef } from 'react';
import audioEngine from '../audio/audioEngine';
import smartShuffleService from '../services/smartShuffleService';

const CasualPlayer = ({
  playlist = [],
  setPlaylist = () => {},
  currentTrack = null,
  onTrackChange = () => {},
  tribeAesthetic = 'hybrid',
  onOpenYouTube = () => {},
  onOpenSpotify = () => {},
  onOpenVibeMix = () => {},
}) => {
  // Playback state synchronized with audioEngine
  const [isPlaying, setIsPlaying] = useState(Boolean(audioEngine.decks.A?.isPlaying));
  const [currentTime, setCurrentTime] = useState(audioEngine.getCurrentTime('A') || 0);
  const [duration, setDuration] = useState(
    audioEngine.decks.A?.audioBuffer?.duration || currentTrack?.duration || 300
  );
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);

  // Guard against rapid track-end cascade loops
  const isEndingRef = useRef(false);

  // Shuffle & Repeat modes
  // shuffleMode: 'off' | 'standard' | 'smart'
  const [shuffleMode, setShuffleMode] = useState('smart'); // Default to Smart Shuffle
  // repeatMode: 'off' | 'all' | 'one'
  const [repeatMode, setRepeatMode] = useState('all');

  // Track queue management
  const [originalPlaylist, setOriginalPlaylist] = useState(playlist);
  const [activeQueue, setActiveQueue] = useState(playlist);
  const [showQueue, setShowQueue] = useState(true);

  // Visualizer canvas ref
  const visualizerCanvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Format time mm:ss
  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Sync state and ensure Deck A has audioBuffer loaded when currentTrack changes
  useEffect(() => {
    if (!currentTrack) return;
    const deckA = audioEngine.decks.A;
    if (deckA?.audioBuffer?.duration) {
      setDuration(deckA.audioBuffer.duration);
    } else if (currentTrack.duration) {
      setDuration(currentTrack.duration);
    }

    const isAlreadyLoaded = deckA?.trackInfo?.id === currentTrack.id && deckA?.audioBuffer;
    if (!isAlreadyLoaded) {
      setIsLoadingTrack(true);
      audioEngine.loadTrack('A', currentTrack).then((res) => {
        setIsLoadingTrack(false);
        if (res?.duration) {
          setDuration(res.duration);
        }
      }).catch((e) => {
        console.warn('CasualPlayer loadTrack error:', e);
        setIsLoadingTrack(false);
      });
    }
  }, [currentTrack?.id]);

  // Keep original playlist and smart queue in sync when playlist updates
  useEffect(() => {
    if (playlist.length > 0) {
      setOriginalPlaylist(playlist);
      if (shuffleMode === 'smart') {
        const smartQ = smartShuffleService.generateSmartQueue(currentTrack || playlist[0], playlist);
        setActiveQueue(smartQ);
      } else if (shuffleMode === 'standard') {
        const shuffled = smartShuffleService.standardShuffle(playlist);
        setActiveQueue(shuffled);
      } else {
        setActiveQueue(playlist);
      }
    }
  }, [playlist, shuffleMode]);

  // Periodic poll of playback progress from audioEngine (Deck A is master in casual mode)
  useEffect(() => {
    const interval = setInterval(() => {
      const deckA = audioEngine.decks.A;
      if (deckA) {
        setIsPlaying(deckA.isPlaying);
        if (!isSeeking) {
          const pos = audioEngine.getCurrentTime('A');
          setCurrentTime(pos);

          // Track finished detection (guarded with isEndingRef to avoid skipping multiple tracks)
          const targetDuration = currentTrack?.duration || deckA.audioBuffer?.duration || 300;
          if (deckA.isPlaying && pos > 0 && deckA.audioBuffer && pos >= targetDuration - 0.8 && !isEndingRef.current) {
            isEndingRef.current = true;
            handleTrackEnded();
          }
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isSeeking, activeQueue, repeatMode, currentTrack]);

  // Real-time audio visualizer waveform rendering
  useEffect(() => {
    const canvas = visualizerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      const deckA = audioEngine.decks.A;
      if (!deckA || !deckA.analyserNode) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      const analyser = deckA.analyserNode;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 48;
      const barWidth = (canvas.width / barCount) - 2;
      const step = Math.floor(dataArray.length / barCount);

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * step] || 0;
        const barHeight = Math.max(3, (val / 255) * canvas.height);
        const x = i * (barWidth + 2);
        const y = canvas.height - barHeight;

        const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
        if (shuffleMode === 'smart') {
          grad.addColorStop(0, '#00ffaa');
          grad.addColorStop(0.5, '#00f0ff');
          grad.addColorStop(1, '#ff0077');
        } else {
          grad.addColorStop(0, '#00f0ff');
          grad.addColorStop(1, '#7b00ff');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [shuffleMode]);

  // Master Play / Pause
  const handleTogglePlay = async () => {
    await audioEngine.resumeContext();
    const deckA = audioEngine.decks.A;

    if (!deckA.audioBuffer && currentTrack) {
      setIsLoadingTrack(true);
      try {
        await audioEngine.loadTrack('A', currentTrack);
      } finally {
        setIsLoadingTrack(false);
      }
    }

    if (deckA.isPlaying) {
      audioEngine.pause('A');
      setIsPlaying(false);
    } else {
      audioEngine.updateCrossfader(0.0); // Lock to Deck A for clean casual listening
      audioEngine.play('A');
      setIsPlaying(true);
    }
  };

  // Skip Next Track
  const handleNextTrack = () => {
    if (!activeQueue || activeQueue.length === 0) return;
    const currentIndex = activeQueue.findIndex((t) => (t.id || t.title) === (currentTrack?.id || currentTrack?.title));

    let nextIndex = currentIndex + 1;
    if (nextIndex >= activeQueue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        return; // End of queue
      }
    }

    const nextTrack = activeQueue[nextIndex];
    if (nextTrack) {
      playTrack(nextTrack);
    }
  };

  // Previous Track
  const handlePrevTrack = () => {
    // If more than 3 seconds in, restart the song
    if (currentTime > 3) {
      audioEngine.seek('A', 0);
      setCurrentTime(0);
      return;
    }

    if (!activeQueue || activeQueue.length === 0) return;
    const currentIndex = activeQueue.findIndex((t) => (t.id || t.title) === (currentTrack?.id || currentTrack?.title));

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = activeQueue.length - 1;
    }

    const prevTrack = activeQueue[prevIndex];
    if (prevTrack) {
      playTrack(prevTrack);
    }
  };

  // Play Specific Track with full visual buffering and debounce protection
  const playTrack = async (track) => {
    if (!track) return;
    isEndingRef.current = true;
    setIsLoadingTrack(true);
    await audioEngine.resumeContext();
    audioEngine.updateCrossfader(0.0); // Output Deck A cleanly

    try {
      await onTrackChange(track);
      audioEngine.play('A');
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(track.duration || 300);
    } catch (err) {
      console.error('Failed to play track in CasualPlayer:', err);
    } finally {
      setIsLoadingTrack(false);
      setTimeout(() => {
        isEndingRef.current = false;
      }, 1200);
    }
  };

  // Track Ended event handler
  const handleTrackEnded = () => {
    if (repeatMode === 'one') {
      audioEngine.seek('A', 0);
      audioEngine.play('A');
      setTimeout(() => {
        isEndingRef.current = false;
      }, 1000);
      return;
    }
    handleNextTrack();
  };

  // Scrubber / Seek Handling
  const handleScrubberChange = (e) => {
    const val = parseFloat(e.target.value);
    setSeekTime(val);
    setCurrentTime(val);
  };

  const handleScrubberStart = () => {
    setIsSeeking(true);
  };

  const handleScrubberEnd = () => {
    setIsSeeking(false);
    audioEngine.seek('A', seekTime);
  };

  // Volume Slider
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    audioEngine.setMasterVolume(val);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setMasterVolume(volume > 0 ? volume : 0.85);
    } else {
      setIsMuted(true);
      audioEngine.setMasterVolume(0);
    }
  };

  // Cycle Shuffle Mode: Off -> Standard -> Smart
  const handleCycleShuffle = () => {
    if (shuffleMode === 'off') {
      // Switch to Standard Shuffle
      setShuffleMode('standard');
      const shuffled = smartShuffleService.standardShuffle(originalPlaylist);
      setActiveQueue(shuffled);
    } else if (shuffleMode === 'standard') {
      // Switch to Smart Shuffle
      setShuffleMode('smart');
      const smartQ = smartShuffleService.generateSmartQueue(currentTrack, originalPlaylist);
      setActiveQueue(smartQ);
    } else {
      // Switch to Off (Original Sequential Order)
      setShuffleMode('off');
      // Revert to original playlist (strip recommendations)
      const cleaned = originalPlaylist.filter((t) => !t.isSmartPick);
      setActiveQueue(cleaned);
    }
  };

  // Cycle Repeat Mode: Off -> All -> One
  const handleCycleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  // Progress percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`casual-player-container aesthetic-${tribeAesthetic}`}>
      {/* Dynamic Background Aura */}
      <div
        className="casual-player-aura"
        style={{
          background: shuffleMode === 'smart'
            ? 'radial-gradient(circle at 50% 30%, rgba(0, 255, 170, 0.15) 0%, rgba(0, 240, 255, 0.12) 40%, rgba(255, 0, 119, 0.08) 70%, transparent 100%)'
            : 'radial-gradient(circle at 50% 30%, rgba(0, 240, 255, 0.14) 0%, rgba(123, 0, 255, 0.1) 50%, transparent 100%)',
        }}
      />

      <div className="casual-player-wrapper">
        {/* ========================================================================= */}
        {/* LEFT / CENTER: NOW PLAYING HERO STAGE                                     */}
        {/* ========================================================================= */}
        <div className="casual-player-hero">
          {/* Header Status Bar */}
          <div className="casual-header-status">
            <div className="status-badge-group">
              <span className="source-tag">
                {currentTrack?.isYouTube ? '🔴 YOUTUBE MUSIC' : currentTrack?.isSpotify ? '🟢 SPOTIFY VIP' : '🎵 PRO AUDIO'}
              </span>
              {shuffleMode === 'smart' && (
                <span className="smart-active-badge">
                  <span>✨</span> SMART SHUFFLE ON
                </span>
              )}
              {currentTrack?.isSmartPick && (
                <span className="smart-pick-tag">
                  <span>🔥</span> SMART RECOMMENDATION
                </span>
              )}
            </div>

            <div className="track-stats-pills">
              <span className="pill-bpm">{currentTrack?.bpm || 124} BPM</span>
              <span className="pill-key">KEY: {currentTrack?.key || '8A / Am'}</span>
            </div>
          </div>

          {/* Large Artwork with Vinyl Edge & Glow */}
          <div className="casual-art-container">
            <div className={`casual-art-vinyl ${isPlaying ? 'spinning' : ''}`}>
              <div className="vinyl-grooves" />
            </div>

            <div className="casual-art-cover-wrapper">
              <img
                src={
                  currentTrack?.thumbnail ||
                  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'
                }
                alt={currentTrack?.title || 'Now Playing'}
                className="casual-art-img"
              />
              <div className={`casual-art-glow ${isPlaying ? 'active' : ''}`} />
              {isLoadingTrack && (
                <div className="casual-art-loading-overlay">
                  <div className="casual-spinner" />
                  <span>LOADING AUDIO...</span>
                </div>
              )}
            </div>
          </div>

          {/* Audio Waveform Canvas */}
          <div className="casual-waveform-wrapper">
            <canvas ref={visualizerCanvasRef} width={420} height={40} className="casual-visualizer-canvas" />
          </div>

          {/* Track Metadata (Title, Artist, Genre) */}
          <div className="casual-track-meta">
            <h1 className="casual-track-title">{currentTrack?.title || 'No Track Selected'}</h1>
            <h2 className="casual-track-artist">{currentTrack?.artist || 'Select a track from the queue to start'}</h2>
            {currentTrack?.genre && <div className="casual-track-genre">{currentTrack.genre}</div>}
            {currentTrack?.smartReason && (
              <div className="casual-smart-reason">
                <span>✨</span> {currentTrack.smartReason}
              </div>
            )}
          </div>

          {/* Interactive Scrubber Timeline */}
          <div className="casual-scrubber-section">
            <div className="scrubber-bar-container">
              <div className="scrubber-track-bg">
                <div
                  className="scrubber-track-fill"
                  style={{
                    width: `${progressPercent}%`,
                    background: shuffleMode === 'smart'
                      ? 'linear-gradient(90deg, #00f0ff 0%, #00ffaa 100%)'
                      : 'linear-gradient(90deg, #00f0ff 0%, #7b00ff 100%)',
                  }}
                />
              </div>
              <input
                type="range"
                min="0"
                max={duration || 300}
                step="0.5"
                value={isSeeking ? seekTime : currentTime}
                onChange={handleScrubberChange}
                onMouseDown={handleScrubberStart}
                onTouchStart={handleScrubberStart}
                onMouseUp={handleScrubberEnd}
                onTouchEnd={handleScrubberEnd}
                className="casual-scrubber-input"
              />
            </div>

            <div className="scrubber-time-row">
              <span className="time-elapsed">{formatTime(currentTime)}</span>
              <span className="time-remaining">-{formatTime(Math.max(0, duration - currentTime))}</span>
            </div>
          </div>

          {/* Transport Control Buttons */}
          <div className="casual-controls-row">
            {/* Shuffle Mode Toggle */}
            <button
              onClick={handleCycleShuffle}
              className={`casual-btn-icon ${shuffleMode !== 'off' ? 'active' : ''} ${shuffleMode === 'smart' ? 'smart-glow' : ''}`}
              title={
                shuffleMode === 'smart'
                  ? '✨ Smart Shuffle: Harmonically weaving recommendations into your music'
                  : shuffleMode === 'standard'
                  ? '🔀 Standard Shuffle: Random order'
                  : 'Shuffle Off: Playing sequentially'
              }
            >
              {shuffleMode === 'smart' ? '✨' : '🔀'}
              <span className="sub-badge">
                {shuffleMode === 'smart' ? 'SMART' : shuffleMode === 'standard' ? 'SHUFFLE' : 'OFF'}
              </span>
            </button>

            {/* Previous Track */}
            <button onClick={handlePrevTrack} className="casual-btn-icon" title="Previous Track">
              ⏮️
            </button>

            {/* Big Play / Pause Button */}
            <button
              onClick={handleTogglePlay}
              disabled={isLoadingTrack}
              className={`casual-play-btn ${isLoadingTrack ? 'loading' : ''}`}
              title={isLoadingTrack ? 'Buffering audio...' : isPlaying ? 'Pause' : 'Play'}
            >
              {isLoadingTrack ? '⏳' : isPlaying ? '⏸' : '▶'}
            </button>

            {/* Next Track */}
            <button onClick={handleNextTrack} className="casual-btn-icon" title="Next Track">
              ⏭️
            </button>

            {/* Repeat Mode Toggle */}
            <button
              onClick={handleCycleRepeat}
              className={`casual-btn-icon ${repeatMode !== 'off' ? 'active' : ''}`}
              title={
                repeatMode === 'one'
                  ? 'Repeat One: Repeating current song'
                  : repeatMode === 'all'
                  ? 'Repeat All: Loops entire playlist'
                  : 'Repeat Off'
              }
            >
              {repeatMode === 'one' ? '🔂' : '🔁'}
              <span className="sub-badge">{repeatMode.toUpperCase()}</span>
            </button>
          </div>

          {/* Volume Control Bar */}
          <div className="casual-volume-row">
            <button onClick={handleToggleMute} className="casual-volume-btn" title={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="casual-volume-slider"
            />
            <span className="volume-percent">{isMuted ? '0%' : `${Math.round(volume * 100)}%`}</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT: SMART QUEUE & PLAYLIST DRAWER                                     */}
        {/* ========================================================================= */}
        <div className="casual-player-queue">
          <div className="queue-header">
            <div className="queue-title-group">
              <span className="queue-icon">📜</span>
              <h3 className="queue-title">UP NEXT QUEUE</h3>
              <span className="queue-count-pill">{activeQueue.length} TRACKS</span>
            </div>

            <div className="queue-actions">
              <button
                onClick={() => setShowQueue(!showQueue)}
                className="queue-toggle-btn"
                title="Toggle queue visibility"
              >
                {showQueue ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          {/* Quick Stream Buttons to add songs */}
          <div className="queue-import-bar">
            <button onClick={onOpenYouTube} className="import-chip yt-chip">
              <span>🔴</span> + YouTube (83+ Hits)
            </button>
            <button onClick={onOpenSpotify} className="import-chip sp-chip">
              <span>🟢</span> + Spotify VIP
            </button>
            <button onClick={onOpenVibeMix} className="import-chip ai-chip">
              <span>✨</span> + AI Vibe
            </button>
          </div>

          {/* Smart Shuffle Status Alert Banner */}
          {shuffleMode === 'smart' && (
            <div className="smart-info-banner">
              <div className="banner-icon">✨</div>
              <div className="banner-text">
                <strong>Smart Shuffle Active:</strong> Dynamically weaving harmonic picks from the 83+ YouTube/Spotify catalog into your queue.
              </div>
            </div>
          )}

          {/* Track List */}
          {showQueue && (
            <div className="queue-scroll-list">
              {activeQueue.map((track, idx) => {
                const isCurrent = (track.id || track.title) === (currentTrack?.id || currentTrack?.title);
                return (
                  <div
                    key={`${track.id || track.title}-${idx}`}
                    onClick={() => playTrack(track)}
                    className={`queue-track-item ${isCurrent ? 'active-track' : ''} ${track.isSmartPick ? 'smart-pick-item' : ''}`}
                  >
                    <div className="queue-track-num">
                      {isCurrent && isLoadingTrack ? (
                        <span className="loading-pulse">⏳</span>
                      ) : isCurrent ? (
                        <span className="playing-pulse">▶</span>
                      ) : (
                        idx + 1
                      )}
                    </div>

                    <img
                      src={
                        track.thumbnail ||
                        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&auto=format&fit=crop&q=80'
                      }
                      alt={track.title}
                      className="queue-thumb"
                    />

                    <div className="queue-info">
                      <div className="queue-track-title-row">
                        <span className="queue-title-text">{track.title}</span>
                        {track.isSmartPick && <span className="smart-pill">✨ SMART PICK</span>}
                      </div>
                      <div className="queue-track-sub">
                        <span>{track.artist}</span>
                        <span className="dot">•</span>
                        <span className="bpm-sub">{track.bpm || 124} BPM</span>
                        <span className="dot">•</span>
                        <span className="key-sub">{track.key || '8A'}</span>
                      </div>
                      {track.smartReason && (
                        <div className="queue-reason-text">
                          ↳ {track.smartReason}
                        </div>
                      )}
                    </div>

                    <div className="queue-duration">{formatTime(track.duration || 210)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CasualPlayer;
