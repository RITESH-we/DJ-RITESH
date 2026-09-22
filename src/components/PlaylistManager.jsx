import React, { useRef, useState, useEffect } from 'react';
import audioEngine from '../audio/audioEngine';
import autoDjEngine, { TRANSITION_STYLES_INFO } from '../audio/autoDjEngine';

const PlaylistManager = ({
  playlist = [],
  setPlaylist = () => {},
  activeTracks = { A: null, B: null },
  onLoadToDeck = () => {},
  onStartPlaylistBeatMix = () => {},
  onOpenSpotify = () => {},
  onOpenVibeMix = () => {},
  onOpenSpotifyAccount = () => {},
  onOpenYouTube = () => {},
}) => {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordedBlobsRef = useRef([]);
  const recordTimerRef = useRef(null);

  // Auto-DJ real-time state subscription
  const [autoDjState, setAutoDjState] = useState(autoDjEngine.getState());
  const [selectedMixMode, setSelectedMixMode] = useState('smartOutro');
  const [selectedSort, setSelectedSort] = useState('none'); // 'none' | 'bpm' | 'harmonic'
  const [selectedStyle, setSelectedStyle] = useState('dynamic'); // 'dynamic' default: cycles multiple styles
  const [transitionSec, setTransitionSec] = useState(10);
  const [loopPlaylist, setLoopPlaylist] = useState(true);

  useEffect(() => {
    const unsub = autoDjEngine.subscribe((state) => {
      setAutoDjState(state);
    });
    return unsub;
  }, []);

  // Multi-File & Folder Upload Handler
  const handleFilesSelected = async (files, autoStart = false) => {
    if (!files || !files.length) return;
    setIsProcessing(true);
    setProcessingStatus(`Analyzing 0 / ${files.length} audio files...`);
    await audioEngine.resumeContext();

    const newTracks = [];
    const validAudioExtensions = /\.(mp3|wav|ogg|flac|m4a|aac|webm)$/i;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Skip non-audio files in folders
      if (!file.type.startsWith('audio/') && !validAudioExtensions.test(file.name)) {
        continue;
      }

      setProcessingStatus(`Analyzing & beat-detecting: ${file.name.slice(0, 24)}... (${i + 1}/${files.length})`);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioEngine.ctx.decodeAudioData(arrayBuffer);
        const detectedBpm = await audioEngine.detectBPM(audioBuffer);

        newTracks.push({
          id: `track-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Local Track',
          genre: 'User Audio',
          duration: audioBuffer.duration,
          bpm: detectedBpm || 124,
          key: 'Auto',
          file: file,
          audioBuffer: audioBuffer,
        });
      } catch (err) {
        console.warn('Could not decode audio file:', file.name, err);
      }
    }

    if (newTracks.length > 0) {
      const updated = [...playlist, ...newTracks];
      setPlaylist(updated);
      autoDjEngine.setPlaylist(updated);

      if (autoStart || updated.length === newTracks.length) {
        // Auto-start continuous beatmix if user requested or if fresh playlist
        handleLaunchContinuousBeatMix(updated);
      }
    }

    setIsProcessing(false);
    setProcessingStatus('');
  };

  // Launch Master Continuous Beatmix
  const handleLaunchContinuousBeatMix = (targetPlaylist = null) => {
    const list = targetPlaylist || playlist;
    if (!list.length) {
      alert('Please upload audio files or load a playlist first!');
      return;
    }

    let finalTracks = [...list];
    if (selectedSort === 'bpm') {
      finalTracks.sort((a, b) => (a.bpm || 120) - (b.bpm || 120));
    }

    autoDjEngine.setTransitionStyle(selectedStyle);
    autoDjEngine.setTransitionDuration(transitionSec);
    autoDjEngine.setMixMode(selectedMixMode);
    autoDjEngine.setLoopPlaylist(loopPlaylist);

    if (onStartPlaylistBeatMix) {
      onStartPlaylistBeatMix(finalTracks, {
        mixMode: selectedMixMode,
        bpmSort: selectedSort === 'bpm',
        harmonicSort: selectedSort === 'harmonic',
        transitionStyle: selectedStyle,
      });
    }
  };

  // Stop / Pause Continuous Beatmix
  const handleStopBeatMix = () => {
    autoDjEngine.toggleAutoDJ(false);
    audioEngine.pause('A');
    audioEngine.pause('B');
  };

  // Curated 1-Click Genre Beatmix Packs
  const handleLoadCuratedMix = (genre) => {
    const demos = audioEngine.createDemoTracks();
    setPlaylist(demos);
    autoDjEngine.setPlaylist(demos);

    let mode = 'smartOutro';
    if (genre === 'quick') mode = 'quick60';
    else if (genre === 'festival') mode = 'quick90';

    setSelectedMixMode(mode);
    handleLaunchContinuousBeatMix(demos);
  };

  // Sort by BPM
  const handleSortBpm = (ascending = true) => {
    const sorted = [...playlist].sort((a, b) => {
      const bpmA = a.bpm || 120;
      const bpmB = b.bpm || 120;
      return ascending ? bpmA - bpmB : bpmB - bpmA;
    });
    setPlaylist(sorted);
    autoDjEngine.setPlaylist(sorted);
  };

  // Remove track
  const handleRemoveTrack = (id) => {
    const updated = playlist.filter((t) => t.id !== id);
    setPlaylist(updated);
    autoDjEngine.setPlaylist(updated);
  };

  // Clear playlist
  const handleClearPlaylist = () => {
    if (autoDjState.enabled) {
      autoDjEngine.toggleAutoDJ(false);
    }
    setPlaylist([]);
    autoDjEngine.setPlaylist([]);
  };

  // Master Record Output
  const handleToggleRecord = () => {
    audioEngine.resumeContext();
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      clearInterval(recordTimerRef.current);
      setIsRecording(false);
    } else {
      try {
        const dest = audioEngine.ctx.createMediaStreamDestination();
        audioEngine.masterGain.connect(dest);

        const recorder = new MediaRecorder(dest.stream);
        recordedBlobsRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedBlobsRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedBlobsRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `DJ_NonStop_Mix_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 100);
        };

        recorder.start(500);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setRecordSeconds(0);

        recordTimerRef.current = setInterval(() => {
          setRecordSeconds((s) => s + 1);
        }, 1000);
      } catch (err) {
        console.error('MediaRecorder failed:', err);
        alert('Recording is not supported in this browser environment.');
      }
    }
  };

  const formatDuration = (sec) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatRecTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentTrack = autoDjState.currentTrack;
  const nextTrack = autoDjState.nextTrack;

  return (
    <div
      style={{
        background: '#10131c',
        borderRadius: '12px',
        border: '1px solid #1f2738',
        padding: '16px',
        marginTop: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Hidden file inputs for audio files and folder uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFilesSelected(e.target.files)}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        webkitdirectory=""
        directory=""
        style={{ display: 'none' }}
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

      {/* ========================================================================= */}
      {/* TOP HERO BANNER: AUTO-BEATMIX PLAYLIST ENGINE                             */}
      {/* ========================================================================= */}
      <div
        style={{
          background: autoDjState.enabled
            ? 'radial-gradient(ellipse at top, rgba(0, 240, 255, 0.16) 0%, rgba(255, 0, 119, 0.08) 60%, #121622 100%)'
            : 'linear-gradient(135deg, #161b29 0%, #0e121a 100%)',
          border: `1.5px solid ${autoDjState.enabled ? '#00f0ff' : '#2d374d'}`,
          borderRadius: '10px',
          padding: '14px 16px',
          marginBottom: '16px',
          boxShadow: autoDjState.enabled
            ? '0 0 25px rgba(0, 240, 255, 0.25), inset 0 0 15px rgba(0, 240, 255, 0.08)'
            : '0 4px 16px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
        }}
      >
        {autoDjState.enabled ? (
          /* LIVE AUTO-BEATMIX ACTIVE VIEW */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', animation: 'pulse 1.5s infinite' }}>🔥</span>
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '13px', fontWeight: 900, color: '#00f0ff', letterSpacing: '1px' }}>
                  AUTO-BEATMIXING PLAYLIST IN PROGRESS
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    background: '#00ff8822',
                    border: '1px solid #00ff88',
                    color: '#00ff88',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  TRACK {autoDjState.currentTrackIndex + 1} OF {playlist.length}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => autoDjEngine.mixNextNow()}
                  style={{
                    background: 'linear-gradient(135deg, #ff0077 0%, #7b00ff 100%)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '7px 14px',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 0 14px rgba(255, 0, 119, 0.4)',
                    letterSpacing: '0.5px',
                  }}
                  title="Force instant beatmatched transition to the next song right now"
                >
                  ⚡ MIX NEXT SONG NOW
                </button>
                <button
                  onClick={handleStopBeatMix}
                  style={{
                    background: '#242b3a',
                    border: '1px solid #4a5975',
                    color: '#ff6688',
                    borderRadius: '6px',
                    padding: '7px 12px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  ⏹ STOP AUTO-MIX
                </button>
              </div>
            </div>

            {/* Deck Flow Tracker: Currently Playing -> Next Preloaded */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '10px',
                marginTop: '12px',
                background: '#0d1017',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #1a2233',
              }}
            >
              {/* Active Playing Deck */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    background: autoDjState.activeDeckId === 'A' ? '#00f0ff22' : '#ff007722',
                    color: autoDjState.activeDeckId === 'A' ? '#00f0ff' : '#ff0077',
                    border: `1px solid ${autoDjState.activeDeckId === 'A' ? '#00f0ff' : '#ff0077'}`,
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontWeight: 900,
                    fontSize: '10px',
                  }}
                >
                  DECK {autoDjState.activeDeckId} (ON AIR)
                </span>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#f0f4f8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {currentTrack ? currentTrack.title : 'Loading audio...'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#8e9cae' }}>
                    {currentTrack ? `${currentTrack.bpm || 128} BPM • ${currentTrack.artist}` : 'Master Deck'}
                  </div>
                </div>
              </div>

              {/* Arrow Indicator & Countdown */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span style={{ color: '#00f0ff', fontSize: '16px' }}>➔</span>
                <div
                  style={{
                    background: '#161c28',
                    border: '1px solid #28334a',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '9px', color: '#8ba0b8', fontWeight: 700 }}>NEXT BEAT-MIX IN</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#00ff88', fontFamily: 'monospace' }}>
                    {autoDjState.secondsUntilMix !== null ? `${autoDjState.secondsUntilMix}s` : '--'}
                    <span style={{ fontSize: '10px', color: '#7a8da3', marginLeft: '4px' }}>
                      (~{autoDjState.beatsUntilMix !== null ? autoDjState.beatsUntilMix : '--'} beats)
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Upcoming Deck */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
                <div style={{ textAlign: 'right', overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#f0f4f8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {nextTrack ? nextTrack.title : 'End of playlist'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#8e9cae' }}>
                    {nextTrack ? `${nextTrack.bpm || 128} BPM (Auto-Matched)` : 'Loops to start'}
                  </div>
                </div>
                <span
                  style={{
                    background: autoDjState.nextDeckId === 'A' ? '#00f0ff22' : '#ff007722',
                    color: autoDjState.nextDeckId === 'A' ? '#00f0ff' : '#ff0077',
                    border: `1px solid ${autoDjState.nextDeckId === 'A' ? '#00f0ff' : '#ff0077'}`,
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontWeight: 900,
                    fontSize: '10px',
                  }}
                >
                  DECK {autoDjState.nextDeckId} (QUEUED)
                </span>
              </div>
            </div>

            {/* Quick Live Mix Controls: Mode, Style, Loop */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#8a99ac', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800 }}>CUT MODE:</span>
                {[
                  { id: 'smartOutro', label: '🎯 Smart Outro' },
                  { id: 'quick60', label: '⚡ 60s Party Cut' },
                  { id: 'quick90', label: '🎪 90s Festival' },
                  { id: 'full', label: '🎵 Full Songs' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => autoDjEngine.setMixMode(m.id)}
                    style={{
                      background: autoDjState.mixMode === m.id ? '#00f0ff22' : '#141824',
                      color: autoDjState.mixMode === m.id ? '#00f0ff' : '#738398',
                      border: `1px solid ${autoDjState.mixMode === m.id ? '#00f0ff' : '#222b3d'}`,
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    const nextVal = !autoDjState.loopPlaylist;
                    autoDjEngine.setLoopPlaylist(nextVal);
                    setLoopPlaylist(nextVal);
                  }}
                  style={{
                    background: autoDjState.loopPlaylist ? '#00ff8818' : '#141824',
                    border: `1px solid ${autoDjState.loopPlaylist ? '#00ff88' : '#2b364a'}`,
                    color: autoDjState.loopPlaylist ? '#00ff88' : '#718094',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🔁 Loop Playlist: {autoDjState.loopPlaylist ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Dynamic Mixing Style & Next Technique Indicator Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginTop: '10px',
                padding: '8px 12px',
                background: '#0d111a',
                borderRadius: '6px',
                border: '1px solid #1c2538',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#7a8ba0' }}>MIX TECHNIQUE:</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 900,
                    background: autoDjState.transitionStyle === 'dynamic'
                      ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(123, 0, 255, 0.2) 100%)'
                      : 'rgba(255, 0, 119, 0.15)',
                    color: autoDjState.transitionStyle === 'dynamic' ? '#00f0ff' : '#ff0077',
                    border: `1px solid ${autoDjState.transitionStyle === 'dynamic' ? '#00f0ff88' : '#ff007788'}`,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {autoDjState.transitionStyle === 'dynamic' ? (
                    <>
                      <span>🔀</span> SONG-BASED SMART ROTATION
                      <span style={{ color: '#88a0bc', fontWeight: 500 }}>• Next Up:</span>
                      <strong style={{ color: '#00ff88' }}>
                        {autoDjState.styleInfo?.icon} {autoDjState.styleInfo?.label}
                      </strong>
                    </>
                  ) : (
                    <>
                      <span>{autoDjState.styleInfo?.icon}</span>
                      <strong>{autoDjState.styleInfo?.label}</strong>
                    </>
                  )}
                </span>
                {autoDjState.styleReason && (
                  <span
                    style={{
                      fontSize: '9px',
                      color: '#00ff88',
                      background: 'rgba(0, 255, 136, 0.1)',
                      border: '1px solid rgba(0, 255, 136, 0.25)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                    title="Why this transition was chosen for these songs"
                  >
                    🎵 {autoDjState.styleReason}
                  </span>
                )}
              </div>

              {/* Style selection pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                {Object.values(TRANSITION_STYLES_INFO).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      autoDjEngine.setTransitionStyle(s.id);
                      setSelectedStyle(s.id);
                    }}
                    title={s.desc}
                    style={{
                      background: autoDjState.transitionStyle === s.id ? '#253247' : '#131822',
                      color: autoDjState.transitionStyle === s.id ? '#00f0ff' : '#6b798e',
                      border: `1px solid ${autoDjState.transitionStyle === s.id ? '#00f0ff' : '#222b3a'}`,
                      borderRadius: '3px',
                      padding: '2px 6px',
                      fontSize: '9px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {s.icon} {s.shortLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* HERO LAUNCH VIEW (WHEN NOT PLAYING) */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🎧</span>
                  <h3 style={{ margin: 0, fontFamily: 'Orbitron, sans-serif', fontSize: '14px', fontWeight: 900, color: '#f0f4f8', letterSpacing: '0.8px' }}>
                    NON-STOP PLAYLIST AUTO-BEATMIX
                  </h3>
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #00f0ff22, #7b00ff22)',
                      border: '1px solid #00f0ff66',
                      color: '#00f0ff',
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    PRO AI DJ
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#8e9cae' }}>
                  Upload any playlist or folder. The engine beatmatches tempos, syncs downbeats, and swaps bass smoothly from song to song non-stop.
                </p>
              </div>

              {/* Master Start Button */}
              <button
                onClick={() => handleLaunchContinuousBeatMix()}
                disabled={playlist.length === 0}
                style={{
                  background: playlist.length > 0
                    ? 'linear-gradient(135deg, #00f0ff 0%, #7b00ff 100%)'
                    : '#1c2230',
                  border: 'none',
                  borderRadius: '6px',
                  color: playlist.length > 0 ? '#000000' : '#576579',
                  fontFamily: 'Orbitron, sans-serif',
                  fontWeight: 900,
                  fontSize: '12px',
                  padding: '10px 18px',
                  cursor: playlist.length > 0 ? 'pointer' : 'not-allowed',
                  boxShadow: playlist.length > 0 ? '0 0 20px rgba(0, 240, 255, 0.4)' : 'none',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'transform 0.1s, box-shadow 0.2s',
                }}
              >
                <span>▶</span>
                <span>START CONTINUOUS BEATMIX ({playlist.length} TRACKS)</span>
              </button>
            </div>

            {/* Launch Options Bar: Mix Mode, Sort, Length */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid #1c2333',
                flexWrap: 'wrap',
              }}
            >
              {/* Mix Cut Style */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#7a8ba0' }}>CUT MODE:</span>
                {[
                  { id: 'smartOutro', label: '🎯 Smart Outro' },
                  { id: 'quick60', label: '⚡ 60s Party Cut' },
                  { id: 'quick90', label: '🎪 90s Festival' },
                  { id: 'full', label: '🎵 Full Songs' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMixMode(m.id);
                      autoDjEngine.setMixMode(m.id);
                    }}
                    style={{
                      background: selectedMixMode === m.id ? '#00f0ff22' : '#141824',
                      color: selectedMixMode === m.id ? '#00f0ff' : '#738398',
                      border: `1px solid ${selectedMixMode === m.id ? '#00f0ff' : '#222b3d'}`,
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Tempo Flow / Ordering */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#7a8ba0' }}>ORDER:</span>
                {[
                  { id: 'none', label: 'Original' },
                  { id: 'bpm', label: '📈 BPM Rise' },
                  { id: 'harmonic', label: '🎵 Harmonic Key' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSort(s.id)}
                    style={{
                      background: selectedSort === s.id ? '#ff007722' : '#141824',
                      color: selectedSort === s.id ? '#ff0077' : '#738398',
                      border: `1px solid ${selectedSort === s.id ? '#ff0077' : '#222b3d'}`,
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Transition Length */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#7a8ba0' }}>BLEND:</span>
                {[8, 10, 12, 16].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => {
                      setTransitionSec(sec);
                      autoDjEngine.setTransitionDuration(sec);
                    }}
                    style={{
                      background: transitionSec === sec ? '#7b00ff22' : '#141824',
                      color: transitionSec === sec ? '#c084fc' : '#738398',
                      border: `1px solid ${transitionSec === sec ? '#7b00ff' : '#222b3d'}`,
                      borderRadius: '4px',
                      padding: '3px 6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Mix Technique Selection Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid #18202f',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#00f0ff', letterSpacing: '0.5px' }}>
                  MIX TECHNIQUE:
                </span>
                <span style={{ fontSize: '9px', color: '#8899aa' }}>
                  (Dynamic rotates techniques every song so your mix never sounds repetitive!)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                {Object.values(TRANSITION_STYLES_INFO).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedStyle(s.id);
                      autoDjEngine.setTransitionStyle(s.id);
                    }}
                    title={s.desc}
                    style={{
                      background: selectedStyle === s.id
                        ? (s.id === 'dynamic' ? 'linear-gradient(135deg, #00f0ff 0%, #7b00ff 100%)' : '#ff0077')
                        : '#141824',
                      color: selectedStyle === s.id ? (s.id === 'dynamic' ? '#000' : '#fff') : '#8ba0b8',
                      border: `1px solid ${selectedStyle === s.id ? (s.id === 'dynamic' ? '#00f0ff' : '#ff0077') : '#222b3d'}`,
                      borderRadius: '4px',
                      padding: '4px 9px',
                      fontSize: '10px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: selectedStyle === s.id && s.id === 'dynamic' ? '0 0 10px rgba(0, 240, 255, 0.4)' : 'none',
                    }}
                  >
                    {s.icon} {s.shortLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECONDARY TOOLBAR: UPLOAD OPTIONS, CLOUD INTEGRATION & CURATED MIXES       */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Upload Files Button */}
          <button
            onClick={() => fileInputRef.current.click()}
            style={{
              background: 'linear-gradient(180deg, #242c3d 0%, #171c28 100%)',
              border: '1px solid #3d4a66',
              color: '#e0e6ed',
              borderRadius: '5px',
              padding: '7px 12px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Select audio files (MP3, WAV, FLAC, M4A, OGG) from your computer"
          >
            <span>📁</span> Upload Audio Files
          </button>

          {/* Upload Entire Folder */}
          <button
            onClick={() => folderInputRef.current.click()}
            style={{
              background: 'linear-gradient(180deg, #1b2638 0%, #121a26 100%)',
              border: '1px solid #2f3e5c',
              color: '#9cc2f7',
              borderRadius: '5px',
              padding: '7px 12px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Upload an entire folder of music songs all at once"
          >
            <span>📂</span> Upload Music Folder
          </button>

          {/* AI Vibe Mix Button */}
          <button
            onClick={onOpenVibeMix}
            style={{
              background: 'linear-gradient(135deg, #ff0077 0%, #7b00ff 100%)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '5px',
              padding: '7px 12px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 10px rgba(255, 0, 119, 0.35)',
            }}
            title="Generate AI DJ set based on mood, genre, or vibe"
          >
            <span>✨</span> AI Vibe Mix
          </button>

          {/* Spotify Account Browser */}
          <button
            onClick={onOpenSpotifyAccount}
            style={{
              background: 'linear-gradient(180deg, #183321 0%, #102417 100%)',
              border: '1px solid #1db954',
              color: '#1db954',
              borderRadius: '5px',
              padding: '7px 12px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Connect your Spotify account to import your playlists directly"
          >
            <span>👤</span> Spotify Library
          </button>

          {/* YouTube Music & YouTube Button */}
          <button
            onClick={onOpenYouTube}
            style={{
              background: 'linear-gradient(180deg, #381515 0%, #200a0a 100%)',
              border: '1px solid #ff0000',
              color: '#ff4d4d',
              borderRadius: '5px',
              padding: '7px 12px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 10px rgba(255, 0, 0, 0.25)',
            }}
            title="Stream & mix 80+ curated songs or paste any link from YouTube Music / YouTube"
          >
            <span>🔴</span> YouTube (80+ Hits)
          </button>

          {/* Spotify Search Button */}
          <button
            onClick={onOpenSpotify}
            style={{
              background: 'linear-gradient(180deg, #122919 0%, #0c1c11 100%)',
              border: '1px solid #1db954',
              color: '#1db954',
              borderRadius: '5px',
              padding: '7px 12px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Search Spotify track catalog or paste Spotify track link"
          >
            <span>🟢</span> Spotify VIP (80+)
          </button>
        </div>

        {/* Right side: REC & Clear */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Record Live Mix Output */}
          <button
            onClick={handleToggleRecord}
            style={{
              background: isRecording ? '#ff2a55' : '#191d28',
              border: `1px solid ${isRecording ? '#ff2a55' : '#452028'}`,
              color: isRecording ? '#ffffff' : '#ff5577',
              borderRadius: '5px',
              padding: '7px 12px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isRecording ? '0 0 12px #ff2a5588' : 'none',
            }}
            title="Record your continuous beatmix output directly to high quality WebM/WAV"
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isRecording ? '#ffffff' : '#ff2a55',
              }}
            />
            {isRecording ? `REC [${formatRecTime(recordSeconds)}]` : 'REC MIX'}
          </button>

          {playlist.length > 0 && (
            <button
              onClick={handleClearPlaylist}
              style={{
                background: 'transparent',
                border: '1px solid #2d3547',
                color: '#6e7b8f',
                borderRadius: '5px',
                padding: '7px 10px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
              title="Clear current playlist"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Processing Status Banner (When decoding files) */}
      {isProcessing && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.15) 0%, rgba(123, 0, 255, 0.15) 100%)',
            border: '1px solid #00f0ff66',
            borderRadius: '6px',
            padding: '8px 12px',
            marginBottom: '12px',
            fontSize: '11px',
            color: '#00f0ff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ animation: 'spin 1s linear infinite' }}>⚡</span>
          <span>{processingStatus}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PLAYLIST TRACKS TABLE OR DRAG & DROP ZONE                                 */}
      {/* ========================================================================= */}
      {playlist.length === 0 ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFilesSelected(e.dataTransfer.files, true);
          }}
          style={{
            border: '2px dashed #283347',
            borderRadius: '10px',
            padding: '40px 20px',
            textAlign: 'center',
            color: '#7b879b',
            background: '#0c0f16',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📁 ➔ 🎧</div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#f0f4f8', marginBottom: '6px' }}>
            DROP YOUR MUSIC PLAYLIST OR FOLDER HERE
          </div>
          <p style={{ fontSize: '12px', maxWidth: '520px', margin: '0 auto 16px', color: '#8898ac', lineHeight: '1.5' }}>
            Drag and drop your audio files (MP3, WAV, FLAC, M4A, AAC) or an entire album folder.
            The system will analyze BPMs and mix every track one-by-one automatically!
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => fileInputRef.current.click()}
              style={{
                background: 'linear-gradient(135deg, #00f0ff 0%, #7b00ff 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '9px 20px',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)',
              }}
            >
              + Select Audio Files
            </button>
            <button
              onClick={() => folderInputRef.current.click()}
              style={{
                background: '#1c2436',
                color: '#00f0ff',
                border: '1px solid #00f0ff66',
                borderRadius: '6px',
                padding: '9px 18px',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              📂 Select Music Folder
            </button>
            <button
              onClick={() => handleLoadCuratedMix('festival')}
              style={{
                background: '#18202e',
                color: '#ff0077',
                border: '1px solid #ff007788',
                borderRadius: '6px',
                padding: '9px 18px',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              ⚡ Load Demo Beatmix Set
            </button>
          </div>
        </div>
      ) : (
        <div style={{ maxHeight: '260px', overflowY: 'auto', borderRadius: '8px', border: '1px solid #1a2233' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#131824', color: '#7a8799', borderBottom: '1px solid #232a3a', position: 'sticky', top: 0, zIndex: 2 }}>
                <th style={{ padding: '8px 12px' }}>#</th>
                <th style={{ padding: '8px 12px' }}>TITLE</th>
                <th style={{ padding: '8px 12px' }}>ARTIST / GENRE</th>
                <th style={{ padding: '8px 12px' }}>BPM</th>
                <th style={{ padding: '8px 12px' }}>KEY</th>
                <th style={{ padding: '8px 12px' }}>DURATION</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {playlist.map((track, idx) => {
                const isLoadedA = activeTracks.A && activeTracks.A.id === track.id;
                const isLoadedB = activeTracks.B && activeTracks.B.id === track.id;
                const isCurrentlyPlaying =
                  autoDjState.enabled &&
                  ((autoDjState.activeDeckId === 'A' && isLoadedA) || (autoDjState.activeDeckId === 'B' && isLoadedB));
                const isQueuedNext =
                  autoDjState.enabled &&
                  ((autoDjState.nextDeckId === 'A' && isLoadedA) || (autoDjState.nextDeckId === 'B' && isLoadedB));

                return (
                  <tr
                    key={track.id}
                    style={{
                      borderBottom: '1px solid #18202d',
                      background: isCurrentlyPlaying
                        ? 'rgba(0, 240, 255, 0.12)'
                        : isQueuedNext
                        ? 'rgba(255, 0, 119, 0.1)'
                        : isLoadedA
                        ? 'rgba(0, 240, 255, 0.05)'
                        : isLoadedB
                        ? 'rgba(255, 0, 119, 0.05)'
                        : idx % 2 === 0
                        ? '#0e1118'
                        : '#10141d',
                      transition: 'background 0.2s',
                    }}
                  >
                    <td style={{ padding: '8px 12px', color: '#667285', width: '30px' }}>
                      {isCurrentlyPlaying ? (
                        <span style={{ color: '#00f0ff', fontWeight: 900 }}>▶</span>
                      ) : isQueuedNext ? (
                        <span style={{ color: '#ff0077', fontWeight: 900 }}>⏳</span>
                      ) : (
                        idx + 1
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#f0f4f8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {track.thumbnail ? (
                          <img
                            src={track.thumbnail}
                            alt={track.title}
                            style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '4px',
                              background: '#19202c',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                            }}
                          >
                            {track.isSpotify ? '🟢' : '🎵'}
                          </div>
                        )}
                        <div>
                          <div>{track.title}</div>
                          <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                            {isCurrentlyPlaying && (
                              <span style={{ fontSize: '8px', color: '#000', background: '#00f0ff', padding: '0 5px', borderRadius: '2px', fontWeight: 800 }}>
                                NOW PLAYING
                              </span>
                            )}
                            {isQueuedNext && (
                              <span style={{ fontSize: '8px', color: '#fff', background: '#ff0077', padding: '0 5px', borderRadius: '2px', fontWeight: 800 }}>
                                NEXT IN LINE
                              </span>
                            )}
                            {track.isSpotify && (
                              <span style={{ fontSize: '8px', color: '#1db954', background: '#1db95422', padding: '0 4px', borderRadius: '2px', border: '1px solid #1db95444' }}>
                                SPOTIFY
                              </span>
                            )}
                            {isLoadedA && !isCurrentlyPlaying && (
                              <span style={{ fontSize: '8px', color: '#00f0ff', background: '#00f0ff22', padding: '0 4px', borderRadius: '2px' }}>
                                DECK A
                              </span>
                            )}
                            {isLoadedB && !isQueuedNext && (
                              <span style={{ fontSize: '8px', color: '#ff0077', background: '#ff007722', padding: '0 4px', borderRadius: '2px' }}>
                                DECK B
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#8a97a8' }}>
                      {track.artist}
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: '#00ff88' }}>
                      {track.bpm ? `${track.bpm} BPM` : '--'}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#ffcc00', fontFamily: 'monospace' }}>
                      {track.key || '8A'}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#8a97a8', fontFamily: 'monospace' }}>
                      {formatDuration(track.duration)}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => onLoadToDeck('A', track)}
                          style={{
                            background: '#122533',
                            border: '1px solid #00f0ff',
                            color: '#00f0ff',
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          LOAD A
                        </button>
                        <button
                          onClick={() => onLoadToDeck('B', track)}
                          style={{
                            background: '#331222',
                            border: '1px solid #ff0077',
                            color: '#ff0077',
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          LOAD B
                        </button>
                        <button
                          onClick={() => handleRemoveTrack(track.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#687487',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px 6px',
                          }}
                          title="Remove track"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PlaylistManager;
