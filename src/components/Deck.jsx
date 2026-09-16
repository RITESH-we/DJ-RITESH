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
  const [hotCues, setHotCues] = useState([null, null, null, null]);
  const [isLooping, setIsLooping] = useState(false);
  const [loopBeats, setLoopBeats] = useState(4);
  const [levels, setLevels] = useState({ peak: 0, rms: 0 });

  const animFrameRef = useRef(null);

  // Poll real-time audio position & VU levels at 60fps
  useEffect(() => {
    const updateTick = () => {
      const deck = audioEngine.decks[deckId];
      if (deck) {
        setIsPlaying(deck.isPlaying);
        setBpm(deck.bpm || 120);
        setPitchPercent(deck.pitchPercent || 0);
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
      audioEngine.loadTrack(deckId, track).then((res) => {
        if (res) {
          setDuration(res.duration);
          setBpm(res.bpm);
          setCurrentTime(0);
          setCuePoint(0);
          setHotCues([null, null, null, null]);
        }
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

  // Hot Cues
  const handleHotCueClick = (index) => {
    if (hotCues[index] === null) {
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

  // Looping
  const handleLoopToggle = (beats) => {
    const active = audioEngine.toggleAutoLoop(deckId, beats);
    setIsLooping(active);
    setLoopBeats(beats);
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
        minWidth: '380px',
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
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0f4f8', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {track ? track.title : 'No Track Loaded'}
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
              size={180}
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

          {/* Hot Cue Pads (1-4) */}
          <div style={{ background: '#11141c', padding: '6px 8px', borderRadius: '6px', border: '1px solid #1f2533' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#7a8799', letterSpacing: '0.5px' }}>HOT CUES (CLICK SET/JUMP, RIGHT-CLICK DEL)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {hotCues.map((hc, idx) => {
                const padColors = ['#00f0ff', '#ff0077', '#00ff88', '#ffcc00'];
                const padColor = padColors[idx];
                const isSet = hc !== null;
                return (
                  <button
                    key={idx}
                    onClick={() => handleHotCueClick(idx)}
                    onContextMenu={(e) => handleHotCueContextMenu(e, idx)}
                    style={{
                      background: isSet
                        ? `linear-gradient(180deg, ${padColor}44 0%, #161b26 100%)`
                        : '#1a1f2c',
                      border: `1px solid ${isSet ? padColor : '#2b3447'}`,
                      boxShadow: isSet ? `0 0 8px ${padColor}44` : 'none',
                      color: isSet ? padColor : '#7a8799',
                      padding: '6px 2px',
                      borderRadius: '4px',
                      fontWeight: 800,
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    PAD {idx + 1}
                    <div style={{ fontSize: '8px', color: '#8e9aa8', marginTop: '1px' }}>
                      {isSet ? formatTime(hc) : 'EMPTY'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto Loop Buttons (1/2, 1, 2, 4, 8, 16 beats) */}
          <div style={{ background: '#11141c', padding: '6px 8px', borderRadius: '6px', border: '1px solid #1f2533' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#7a8799', marginBottom: '4px', letterSpacing: '0.5px' }}>
              AUTO LOOP
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
              {[0.5, 1, 2, 4, 8, 16].map((beats) => {
                const isActive = isLooping && loopBeats === beats;
                return (
                  <button
                    key={beats}
                    onClick={() => handleLoopToggle(beats)}
                    style={{
                      background: isActive ? '#ffcc00' : '#1a1f2c',
                      color: isActive ? '#000' : '#8e9aa8',
                      border: `1px solid ${isActive ? '#ffcc00' : '#2b3447'}`,
                      borderRadius: '3px',
                      padding: '4px 2px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 0 8px #ffcc0088' : 'none',
                    }}
                  >
                    {beats === 0.5 ? '1/2' : beats}
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
