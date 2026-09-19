import React, { useState, useEffect, useRef } from 'react';
import audioEngine from '../audio/audioEngine';
import JogWheel from './JogWheel';
import WaveformDisplay from './WaveformDisplay';
import Knob from './Knob';
import VuMeter from './VuMeter';

const Deck = ({
  deckId = 'A',
  track = null,
  otherDeckId = 'B',
  accentColor = '#00f0ff', // cyan for A, magenta for B
  onTrackEnd = () => {},
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bpm, setBpm] = useState(124);
  const [pitchPercent, setPitchPercent] = useState(0);
  const [eqGains, setEqGains] = useState({ low: 0, mid: 0, high: 0 });
  const [eqKills, setEqKills] = useState({ low: false, mid: false, high: false });
  const [filterVal, setFilterVal] = useState(0);
  const [volumeFader, setVolumeFader] = useState(0.85);
  const [cuePoint, setCuePoint] = useState(0);
  const [hotCues, setHotCues] = useState([null, null, null, null, null, null, null, null]);
  const [hotCueLabels, setHotCueLabels] = useState(['INTRO', 'VERSE', 'BUILD', 'DROP 🔥', 'BREAK', 'DROP 2', 'OUTRO', 'END']);
  const [padMode, setPadMode] = useState('hotCue'); // 'hotCue' | 'beatJump' | 'roll'
  const [isLooping, setIsLooping] = useState(false);
  const [loopBeats, setLoopBeats] = useState(4);
  const [levels, setLevels] = useState({ peak: 0, rms: 0 });
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isRealAudio, setIsRealAudio] = useState(false);

  const animFrameRef = useRef(null);

  // Poll real-time audio position & VU levels at 60fps
  useEffect(() => {
    const updateTick = () => {
      const deck = audioEngine.decks[deckId];
      if (deck) {
        setIsPlaying(deck.isPlaying);
        setBpm(deck.bpm || 120);
        setPitchPercent(deck.pitchPercent || 0);
        setIsLooping(Boolean(deck.isLooping));
        if (deck.loopLengthBeats) setLoopBeats(deck.loopLengthBeats);
        if (deck.audioBuffer) {
          setDuration(deck.audioBuffer.duration);
          const t = audioEngine.getCurrentTime(deckId);
          setCurrentTime(t);

          // Check if song reached end
          if (t >= deck.audioBuffer.duration - 0.2 && deck.isPlaying) {
            onTrackEnd();
          }
        }
        setLevels(audioEngine.getDeckLevels(deckId));
      }
      animFrameRef.current = requestAnimationFrame(updateTick);
    };

    animFrameRef.current = requestAnimationFrame(updateTick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [deckId, onTrackEnd]);

  // Handle track prop change
  useEffect(() => {
    if (track) {
      setIsAudioLoading(true);
      audioEngine.loadTrack(deckId, track).then((res) => {
        setIsAudioLoading(false);
        if (res) {
          setDuration(res.duration);
          setBpm(res.bpm);
          setIsRealAudio(Boolean(res.isRealAudio));
          setCurrentTime(0);
          setCuePoint(0);
          const deckCues = audioEngine.decks[deckId]?.hotCues || [null, null, null, null, null, null, null, null];
          setHotCues([...deckCues]);
          if (audioEngine.decks[deckId]?.hotCueLabels) {
            setHotCueLabels([...audioEngine.decks[deckId].hotCueLabels]);
          }
        }
      }).catch(() => {
        setIsAudioLoading(false);
      });
    }
  }, [track, deckId]);

  // Transport handlers
  const handlePlayPause = () => {
    if (isPlaying) {
      audioEngine.pause(deckId);
    } else {
      audioEngine.play(deckId);
    }
  };

  const handleCue = () => {
    audioEngine.cue(deckId);
    setCurrentTime(audioEngine.decks[deckId].cuePoint);
  };

  const handleSeek = (timeSec) => {
    audioEngine.seek(deckId, timeSec);
    setCurrentTime(timeSec);
  };

  const handlePitchChange = (e) => {
    const percent = parseFloat(e.target.value);
    audioEngine.setPitchPercent(deckId, percent);
    setPitchPercent(percent);
  };

  const handlePitchReset = () => {
    audioEngine.setPitchPercent(deckId, 0);
    setPitchPercent(0);
  };

  const handleSync = () => {
    audioEngine.syncDecks(deckId, otherDeckId);
  };

  const handlePitchBend = (delta) => {
    audioEngine.pitchBend(deckId, delta);
  };

  const handleScratch = (deltaSec) => {
    const nextTime = Math.max(0, Math.min(duration, currentTime + deltaSec));
    audioEngine.seek(deckId, nextTime);
    setCurrentTime(nextTime);
  };

  // Pro 8-Pad Hot Cues Handlers
  const handleHotCueClick = (index) => {
    if (hotCues[index] === null || hotCues[index] === undefined) {
      const pos = audioEngine.setHotCue(deckId, index);
      const next = [...hotCues];
      next[index] = pos;
      setHotCues(next);
    } else {
      audioEngine.jumpHotCue(deckId, index);
    }
  };

  const handleHotCueContextMenu = (e, index) => {
    e.preventDefault();
    audioEngine.deleteHotCue(deckId, index);
    const next = [...hotCues];
    next[index] = null;
    setHotCues(next);
  };

  const handleAutoDetectCues = () => {
    const detected = audioEngine.autoDetectHotCues(deckId);
    setHotCues([...detected]);
    if (audioEngine.decks[deckId]?.hotCueLabels) {
      setHotCueLabels([...audioEngine.decks[deckId].hotCueLabels]);
    }
  };

  // Beat Jump (Forward / Backward by musical beats)
  const handleBeatJump = (beats) => {
    audioEngine.beatJump(deckId, beats);
    setCurrentTime(audioEngine.getCurrentTime(deckId));
  };

  // Advanced Looping Handlers
  const handleLoopToggle = (beats) => {
    const active = audioEngine.toggleAutoLoop(deckId, beats);
    setIsLooping(Boolean(active));
    setLoopBeats(beats);
  };

  const handleHalfLoop = () => {
    const active = audioEngine.halfLoop(deckId);
    setIsLooping(Boolean(active));
    setLoopBeats(audioEngine.decks[deckId]?.loopLengthBeats || loopBeats / 2);
  };

  const handleDoubleLoop = () => {
    const active = audioEngine.doubleLoop(deckId);
    setIsLooping(Boolean(active));
    setLoopBeats(audioEngine.decks[deckId]?.loopLengthBeats || loopBeats * 2);
  };

  const handleReloop = () => {
    const active = audioEngine.reloop(deckId);
    setIsLooping(Boolean(active));
  };

  const handleManualLoopIn = () => {
    audioEngine.setManualLoopIn(deckId);
  };

  const handleManualLoopOut = () => {
    audioEngine.setManualLoopOut(deckId);
    setIsLooping(true);
  };

  const handleExitLoop = () => {
    audioEngine.exitLoop(deckId);
    setIsLooping(false);
  };

  // EQ & Filter
  const handleEqChange = (band, val) => {
    audioEngine.setEQ(deckId, band, val);
    setEqGains((prev) => ({ ...prev, [band]: val }));
  };

  const handleToggleKill = (band) => {
    const killed = audioEngine.toggleKill(deckId, band);
    setEqKills((prev) => ({ ...prev, [band]: killed }));
  };

  const handleFilterChange = (val) => {
    audioEngine.setFilter(deckId, val);
    setFilterVal(val);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    audioEngine.setVolume(deckId, val);
    setVolumeFader(val);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
  };

  const remaining = Math.max(0, duration - currentTime);

  return (
    <div
      style={{
        flex: 1,
        background: 'linear-gradient(180deg, #161922 0%, #10121a 100%)',
        borderRadius: '10px',
        border: `1px solid ${isPlaying ? accentColor + '66' : '#232a3a'}`,
        boxShadow: isPlaying ? `0 0 20px ${accentColor}22` : '0 4px 20px rgba(0,0,0,0.5)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
        minWidth: '280px',
        width: '100%',
      }}
    >
      {/* Top Deck Info Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #232a3a', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '14px',
            fontWeight: 900,
            color: accentColor,
            background: `${accentColor}18`,
            padding: '2px 8px',
            borderRadius: '4px',
            border: `1px solid ${accentColor}44`,
          }}>
            DECK {deckId}
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0f4f8', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={track ? track.title : ''}>
                {track ? track.title : 'No Track Loaded'}
              </div>
              {isAudioLoading ? (
                <span style={{ fontSize: '9px', background: '#ffaa0022', color: '#ffaa00', border: '1px solid #ffaa0055', padding: '1px 5px', borderRadius: '3px', fontWeight: 800 }}>
                  ⚡ STREAMING...
                </span>
              ) : isRealAudio ? (
                <span style={{ fontSize: '9px', background: '#00ff8822', color: '#00ff88', border: '1px solid #00ff8855', padding: '1px 5px', borderRadius: '3px', fontWeight: 800 }}>
                  🟢 REAL AUDIO
                </span>
              ) : track ? (
                <span style={{ fontSize: '9px', background: '#88888822', color: '#888888', border: '1px solid #88888855', padding: '1px 5px', borderRadius: '3px' }}>
                  SYNTH BEAT
                </span>
              ) : null}
            </div>
            <div style={{ fontSize: '11px', color: '#7a8799' }}>
              {track ? `${track.artist || 'Unknown'} • ${track.genre || 'Electronic'}` : 'Select or drop a song to mix'}
            </div>
          </div>
        </div>

        {/* BPM and Time Display */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '18px', fontWeight: 700, color: accentColor }}>
            {bpm.toFixed(1)} <span style={{ fontSize: '11px', color: '#9aa5b8' }}>BPM</span>
            <span style={{ fontSize: '11px', marginLeft: '5px', color: pitchPercent >= 0 ? '#00ff88' : '#ff3366' }}>
              ({pitchPercent >= 0 ? `+${pitchPercent.toFixed(1)}` : pitchPercent.toFixed(1)}%)
            </span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#8e9bb0' }}>
            {formatTime(currentTime)} / -{formatTime(remaining)}
          </div>
        </div>
      </div>

      {/* Waveform Display */}
      <WaveformDisplay
        audioBuffer={audioEngine.decks[deckId].audioBuffer}
        currentTime={currentTime}
        duration={duration}
        bpm={bpm}
        cuePoint={cuePoint}
        hotCues={hotCues}
        isLooping={isLooping}
        loopStart={audioEngine.decks[deckId].loopStart}
        loopEnd={audioEngine.decks[deckId].loopEnd}
        color={accentColor}
        onSeek={handleSeek}
        height={65}
      />

      {/* Main Deck Body: Jog Wheel & Controls Left, Channel Mixer Strip Right */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'stretch' }}>
        
        {/* Left Column: Jogwheel & Performance Pads */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Jogwheel & Pitch Slider */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
            <JogWheel
              deckId={deckId}
              isPlaying={isPlaying}
              playbackRate={audioEngine.decks[deckId].playbackRate}
              color={accentColor}
              onScratch={handleScratch}
              size={typeof window !== 'undefined' && window.innerWidth < 450 ? 150 : 180}
            />

            {/* Tempo Pitch Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#11141c', padding: '6px', borderRadius: '6px', border: '1px solid #1f2533' }}>
              <button
                onClick={handleSync}
                style={{
                  background: 'linear-gradient(180deg, #1c2333 0%, #121622 100%)',
                  border: `1px solid ${accentColor}`,
                  color: accentColor,
                  fontWeight: 800,
                  fontSize: '10px',
                  borderRadius: '3px',
                  padding: '4px 6px',
                  cursor: 'pointer',
                  marginBottom: '6px',
                  letterSpacing: '1px',
                  boxShadow: `0 0 8px ${accentColor}33`,
                }}
                title="Sync BPM with other deck"
              >
                SYNC
              </button>

              <button
                onClick={handlePitchReset}
                style={{
                  background: '#191d28',
                  border: '1px solid #2a3346',
                  color: '#8b97a8',
                  fontSize: '9px',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  marginBottom: '6px',
                }}
                title="Reset Pitch to 0%"
              >
                0%
              </button>

              <input
                type="range"
                min="-16"
                max="16"
                step="0.1"
                value={pitchPercent}
                onChange={handlePitchChange}
                style={{
                  writingMode: 'bt-lr', // vertical slider
                  WebkitAppearance: 'slider-vertical',
                  width: '20px',
                  height: '110px',
                  cursor: 'pointer',
                  accentColor: accentColor,
                }}
                title={`Pitch Tempo: ${pitchPercent}%`}
              />

              <div style={{ display: 'flex', gap: '3px', marginTop: '6px' }}>
                <button
                  onClick={() => handlePitchBend(-0.06)}
                  style={{ background: '#191d28', border: '1px solid #2a3346', color: '#fff', fontSize: '9px', padding: '3px 5px', borderRadius: '2px', cursor: 'pointer' }}
                  title="Pitch bend -"
                >
                  -
                </button>
                <button
                  onClick={() => handlePitchBend(0.06)}
                  style={{ background: '#191d28', border: '1px solid #2a3346', color: '#fff', fontSize: '9px', padding: '3px 5px', borderRadius: '2px', cursor: 'pointer' }}
                  title="Pitch bend +"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* PRO RGB PERFORMANCE PADS (HOT CUE / BEAT JUMP / LOOP ROLL) */}
          <div style={{ background: '#11141c', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1f2533' }}>
            {/* Pad Mode Switcher Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '3px' }}>
                {[
                  { id: 'hotCue', label: '🎯 HOT CUE' },
                  { id: 'beatJump', label: '⚡ BEAT JUMP' },
                  { id: 'roll', label: '🥁 ROLL' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setPadMode(mode.id)}
                    style={{
                      background: padMode === mode.id ? accentColor : '#181d28',
                      color: padMode === mode.id ? '#000' : '#8898ab',
                      border: `1px solid ${padMode === mode.id ? accentColor : '#2b3447'}`,
                      borderRadius: '3px',
                      padding: '3px 8px',
                      fontSize: '9px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Auto-detect drops & cues button */}
              {padMode === 'hotCue' && (
                <button
                  onClick={handleAutoDetectCues}
                  style={{
                    background: 'transparent',
                    border: '1px solid #3d4a66',
                    color: '#9cc2f7',
                    borderRadius: '3px',
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Automatically scan track and set cues at Intro, Verse, Buildup, Drop, and Outro"
                >
                  <span>✨</span> Auto-Cue Drops
                </button>
              )}
            </div>

            {/* MODE 1: 8 RGB HOT CUE PADS */}
            {padMode === 'hotCue' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {hotCues.map((hc, idx) => {
                  const padColors = [
                    '#00f0ff', // 1: Cyan (Intro)
                    '#ff0077', // 2: Magenta (Verse)
                    '#00ff88', // 3: Green (Build)
                    '#ffcc00', // 4: Yellow (Drop)
                    '#ff6600', // 5: Orange (Break)
                    '#9900ff', // 6: Purple (Drop 2)
                    '#ff0033', // 7: Red (Outro)
                    '#3399ff', // 8: Sky Blue (End)
                  ];
                  const padColor = padColors[idx % padColors.length];
                  const isSet = hc !== null && hc !== undefined;
                  const label = hotCueLabels[idx] || `PAD ${idx + 1}`;

                  return (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        background: isSet
                          ? `linear-gradient(180deg, ${padColor}33 0%, #151a24 100%)`
                          : '#171c26',
                        border: `1.5px solid ${isSet ? padColor : '#273144'}`,
                        borderRadius: '5px',
                        boxShadow: isSet ? `0 0 10px ${padColor}33, inset 0 0 6px ${padColor}22` : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <button
                        onClick={() => handleHotCueClick(idx)}
                        onContextMenu={(e) => handleHotCueContextMenu(e, idx)}
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          color: isSet ? '#ffffff' : '#6b7a90',
                          padding: '6px 2px 4px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                        title={isSet ? `Jump to ${label} (${formatTime(hc)}). Right-click to clear.` : `Click to set Pad ${idx + 1}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: padColor,
                              display: 'inline-block',
                              boxShadow: isSet ? `0 0 6px ${padColor}` : 'none',
                            }}
                          />
                          <span style={{ fontSize: '9px', fontWeight: 900, color: isSet ? padColor : '#8898aa', letterSpacing: '0.3px' }}>
                            {label}
                          </span>
                        </div>
                        <div style={{ fontSize: '8px', fontFamily: 'monospace', color: isSet ? '#d8e2ed' : '#556477', marginTop: '2px' }}>
                          {isSet ? formatTime(hc) : '--:--'}
                        </div>
                      </button>

                      {/* Small delete X on hover / right corner */}
                      {isSet && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHotCueContextMenu(e, idx);
                          }}
                          style={{
                            position: 'absolute',
                            top: '1px',
                            right: '2px',
                            background: 'transparent',
                            border: 'none',
                            color: '#55657a',
                            fontSize: '9px',
                            cursor: 'pointer',
                            padding: '1px 3px',
                          }}
                          title="Clear Hot Cue"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* MODE 2: BEAT JUMP PADS */}
            {padMode === 'beatJump' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {[
                  { beats: -16, label: '◀ 16B' },
                  { beats: -8, label: '◀ 8B' },
                  { beats: -4, label: '◀ 4B' },
                  { beats: -1, label: '◀ 1B' },
                  { beats: 1, label: '1B ▶' },
                  { beats: 4, label: '4B ▶' },
                  { beats: 8, label: '8B ▶' },
                  { beats: 16, label: '16B ▶' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleBeatJump(item.beats)}
                    style={{
                      background: 'linear-gradient(180deg, #222c3d 0%, #161c28 100%)',
                      border: `1px solid ${item.beats < 0 ? '#00f0ff88' : '#ff007788'}`,
                      color: item.beats < 0 ? '#00f0ff' : '#ff0077',
                      padding: '8px 2px',
                      borderRadius: '4px',
                      fontWeight: 800,
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                    title={`Jump ${item.beats > 0 ? 'forward' : 'backward'} ${Math.abs(item.beats)} beats`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {/* MODE 3: LOOP ROLL / STUTTER PADS */}
            {padMode === 'roll' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {[
                  { beats: 0.0625, label: '1/16' },
                  { beats: 0.125, label: '1/8' },
                  { beats: 0.25, label: '1/4' },
                  { beats: 0.5, label: '1/2' },
                  { beats: 1, label: '1 BEAT' },
                  { beats: 2, label: '2 BEATS' },
                  { beats: 4, label: '4 BEATS' },
                  { beats: 8, label: '8 BEATS' },
                ].map((item, idx) => {
                  const isActive = isLooping && loopBeats === item.beats;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleLoopToggle(item.beats)}
                      style={{
                        background: isActive ? '#00ff88' : '#19202c',
                        color: isActive ? '#000' : '#00ff88',
                        border: `1px solid ${isActive ? '#00ff88' : '#2b384d'}`,
                        boxShadow: isActive ? '0 0 10px #00ff88' : 'none',
                        padding: '8px 2px',
                        borderRadius: '4px',
                        fontWeight: 800,
                        fontSize: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* PRO AUTO LOOP CONSOLE (BEAT LOOPS, HALF/DOUBLE, IN/OUT, RELOOP)           */}
          {/* ========================================================================= */}
          <div
            style={{
              background: isLooping
                ? 'radial-gradient(ellipse at top, rgba(255, 204, 0, 0.12) 0%, #12151f 100%)'
                : '#11141c',
              padding: '8px 10px',
              borderRadius: '8px',
              border: `1px solid ${isLooping ? '#ffcc00' : '#1f2533'}`,
              boxShadow: isLooping ? '0 0 14px rgba(255, 204, 0, 0.2)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Loop Header & Active Banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: isLooping ? '#ffcc00' : '#7a8799', letterSpacing: '0.8px' }}>
                  AUTO LOOP
                </span>
                {isLooping && (
                  <span
                    style={{
                      fontSize: '8px',
                      fontWeight: 800,
                      background: '#ffcc00',
                      color: '#000',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      animation: 'pulse 1s infinite',
                    }}
                  >
                    ACTIVE ({loopBeats}B)
                  </span>
                )}
              </div>

              {/* Loop Halve / Double / Reloop Buttons */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={handleHalfLoop}
                  disabled={!isLooping}
                  style={{
                    background: '#1a1f2b',
                    border: '1px solid #303b4e',
                    color: isLooping ? '#ffcc00' : '#556375',
                    borderRadius: '3px',
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontWeight: 800,
                    cursor: isLooping ? 'pointer' : 'default',
                  }}
                  title="Cut loop length in half (/2)"
                >
                  ½x
                </button>
                <button
                  onClick={handleDoubleLoop}
                  disabled={!isLooping}
                  style={{
                    background: '#1a1f2b',
                    border: '1px solid #303b4e',
                    color: isLooping ? '#ffcc00' : '#556375',
                    borderRadius: '3px',
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontWeight: 800,
                    cursor: isLooping ? 'pointer' : 'default',
                  }}
                  title="Double loop length (2x)"
                >
                  2x
                </button>
                <button
                  onClick={handleManualLoopIn}
                  style={{
                    background: '#1a1f2b',
                    border: '1px solid #303b4e',
                    color: '#00f0ff',
                    borderRadius: '3px',
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                  title="Set Loop IN point at current playback time"
                >
                  IN
                </button>
                <button
                  onClick={handleManualLoopOut}
                  style={{
                    background: '#1a1f2b',
                    border: '1px solid #303b4e',
                    color: '#ff0077',
                    borderRadius: '3px',
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                  title="Set Loop OUT point and engage loop"
                >
                  OUT
                </button>
                <button
                  onClick={handleReloop}
                  style={{
                    background: isLooping ? '#ffcc00' : '#1a1f2b',
                    border: `1px solid ${isLooping ? '#ffcc00' : '#303b4e'}`,
                    color: isLooping ? '#000' : '#ffcc00',
                    borderRadius: '3px',
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                  title="Reloop or Exit active loop"
                >
                  {isLooping ? 'EXIT' : 'RELOOP'}
                </button>
              </div>
            </div>

            {/* Quick Beat Loop Grid (1/8 to 32 Beats) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '3px' }}>
              {[
                { beats: 0.125, label: '1/8' },
                { beats: 0.25, label: '1/4' },
                { beats: 0.5, label: '1/2' },
                { beats: 1, label: '1' },
                { beats: 2, label: '2' },
                { beats: 4, label: '4' },
                { beats: 8, label: '8' },
                { beats: 16, label: '16' },
              ].map((item) => {
                const isActive = isLooping && loopBeats === item.beats;
                return (
                  <button
                    key={item.beats}
                    onClick={() => handleLoopToggle(item.beats)}
                    style={{
                      background: isActive ? '#ffcc00' : '#161a24',
                      color: isActive ? '#000000' : '#8e9aa8',
                      border: `1px solid ${isActive ? '#ffcc00' : '#273142'}`,
                      borderRadius: '3px',
                      padding: '5px 1px',
                      fontSize: '9px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 0 8px #ffcc0088' : 'none',
                      textAlign: 'center',
                    }}
                    title={`Engage ${item.label} Beat Loop`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Big Transport Buttons: CUE & PLAY */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCue}
              style={{
                flex: 1,
                background: 'linear-gradient(180deg, #302410 0%, #181208 100%)',
                border: '2px solid #ff8800',
                color: '#ff8800',
                boxShadow: '0 0 10px rgba(255, 136, 0, 0.3)',
                borderRadius: '6px',
                padding: '10px',
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '14px',
                fontWeight: 900,
                cursor: 'pointer',
                letterSpacing: '1px',
              }}
            >
              CUE
            </button>

            <button
              onClick={handlePlayPause}
              style={{
                flex: 1.6,
                background: isPlaying
                  ? `linear-gradient(180deg, ${accentColor}44 0%, #101622 100%)`
                  : 'linear-gradient(180deg, #1e2838 0%, #121822 100%)',
                border: `2px solid ${isPlaying ? accentColor : '#36435c'}`,
                color: isPlaying ? '#ffffff' : '#9bb0cf',
                boxShadow: isPlaying ? `0 0 16px ${accentColor}66` : 'none',
                borderRadius: '6px',
                padding: '10px',
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '15px',
                fontWeight: 900,
                cursor: 'pointer',
                letterSpacing: '1px',
              }}
            >
              {isPlaying ? 'PAUSE ||' : 'PLAY >'}
            </button>
          </div>

        </div>

        {/* Right Column: Channel Strip (EQs, Filter, Volume Fader, VU Meter) */}
        <div style={{
          width: '105px',
          background: '#0d0f15',
          borderRadius: '8px',
          border: '1px solid #1f2533',
          padding: '8px 6px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
        }}>
          {/* 3-Band Equalizer */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Knob
              label="HIGH"
              value={eqGains.high}
              min={-24}
              max={6}
              color={accentColor}
              onChange={(val) => handleEqChange('high', val)}
              size={36}
            />
            <button
              onClick={() => handleToggleKill('high')}
              style={{
                fontSize: '8px',
                padding: '1px 5px',
                borderRadius: '2px',
                border: `1px solid ${eqKills.high ? '#ff3366' : '#2b3346'}`,
                backgroundColor: eqKills.high ? '#ff3366' : '#141822',
                color: eqKills.high ? '#fff' : '#7b879b',
                cursor: 'pointer',
                marginTop: '-2px',
                marginBottom: '4px',
              }}
            >
              KILL
            </button>

            <Knob
              label="MID"
              value={eqGains.mid}
              min={-24}
              max={6}
              color={accentColor}
              onChange={(val) => handleEqChange('mid', val)}
              size={36}
            />
            <button
              onClick={() => handleToggleKill('mid')}
              style={{
                fontSize: '8px',
                padding: '1px 5px',
                borderRadius: '2px',
                border: `1px solid ${eqKills.mid ? '#ff3366' : '#2b3346'}`,
                backgroundColor: eqKills.mid ? '#ff3366' : '#141822',
                color: eqKills.mid ? '#fff' : '#7b879b',
                cursor: 'pointer',
                marginTop: '-2px',
                marginBottom: '4px',
              }}
            >
              KILL
            </button>

            <Knob
              label="LOW"
              value={eqGains.low}
              min={-24}
              max={6}
              color={accentColor}
              onChange={(val) => handleEqChange('low', val)}
              size={36}
            />
            <button
              onClick={() => handleToggleKill('low')}
              style={{
                fontSize: '8px',
                padding: '1px 5px',
                borderRadius: '2px',
                border: `1px solid ${eqKills.low ? '#ff3366' : '#2b3346'}`,
                backgroundColor: eqKills.low ? '#ff3366' : '#141822',
                color: eqKills.low ? '#fff' : '#7b879b',
                cursor: 'pointer',
                marginTop: '-2px',
                marginBottom: '4px',
              }}
            >
              KILL
            </button>
          </div>

          {/* Filter sweep knob (LPF / HPF) */}
          <div style={{ borderTop: '1px solid #1c2230', paddingTop: '4px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Knob
              label="FILTER"
              value={filterVal}
              min={-1}
              max={1}
              defaultValue={0}
              unit=""
              color="#ffaa00"
              onChange={handleFilterChange}
              size={34}
            />
          </div>

          {/* Volume Fader & Channel VU Meter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', borderTop: '1px solid #1c2230', paddingTop: '8px' }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volumeFader}
              onChange={handleVolumeChange}
              style={{
                writingMode: 'bt-lr',
                WebkitAppearance: 'slider-vertical',
                width: '18px',
                height: '95px',
                cursor: 'pointer',
                accentColor: accentColor,
              }}
              title={`Channel Volume: ${Math.round(volumeFader * 100)}%`}
            />

            <VuMeter level={levels} height={95} width={10} />
          </div>

        </div>

      </div>
    </div>
  );
};

export default Deck;
