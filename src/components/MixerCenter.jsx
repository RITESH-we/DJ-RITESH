import React, { useState, useEffect, useRef } from 'react';
import audioEngine from '../audio/audioEngine';
import autoDjEngine from '../audio/autoDjEngine';
import Knob from './Knob';
import VuMeter from './VuMeter';

const MixerCenter = ({
  crossfadeValue = 0.5,
  onCrossfadeChange = () => {},
  tribeAesthetic = 'hybrid',
}) => {
  const [masterVol, setMasterVol] = useState(0.85);
  const [curve, setCurve] = useState('equalPower');
  const [masterLevels, setMasterLevels] = useState({ peak: 0, rms: 0 });
  const [autoDjState, setAutoDjState] = useState(autoDjEngine.getState());

  // Pro Crossfader state
  const [slideDuration, setSlideDuration] = useState(2);
  const [isSliding, setIsSliding] = useState(audioEngine.isCrossfadeSliding);
  const [hamsterReverse, setHamsterReverse] = useState(audioEngine.isHamsterReverse);
  const [crossfadeGains, setCrossfadeGains] = useState({ gainA: 0.707, gainB: 0.707 });

  const animFrameRef = useRef(null);

  useEffect(() => {
    const unsub = autoDjEngine.subscribe((state) => {
      setAutoDjState(state);
    });
    return unsub;
  }, []);

  // Listen to crossfader changes from user, auto-glide, or Auto-DJ
  useEffect(() => {
    const unsub = audioEngine.subscribeCrossfade((val, gA, gB) => {
      setCrossfadeGains({ gainA: gA, gainB: gB });
      setIsSliding(audioEngine.isCrossfadeSliding);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const updateTick = () => {
      setMasterLevels(audioEngine.getMasterLevels());
      animFrameRef.current = requestAnimationFrame(updateTick);
    };
    animFrameRef.current = requestAnimationFrame(updateTick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const handleMasterVolChange = (val) => {
    setMasterVol(val);
    audioEngine.setMasterVolume(val);
  };

  const handleCurveChange = (newCurve) => {
    setCurve(newCurve);
    audioEngine.setCrossfadeCurve(newCurve);
  };

  const handleSnap = (val) => {
    audioEngine.cancelCrossfadeSlide();
    setIsSliding(false);
    onCrossfadeChange(val);
  };

  const handleSmoothGlide = (targetVal) => {
    setIsSliding(true);
    audioEngine.smoothSlideCrossfader(targetVal, slideDuration);
  };

  const handleStopGlide = () => {
    audioEngine.cancelCrossfadeSlide();
    setIsSliding(false);
  };

  const handleToggleHamster = () => {
    const newRev = audioEngine.toggleHamsterReverse();
    setHamsterReverse(newRev);
  };

  const handleToggleAutoDj = () => {
    autoDjEngine.toggleAutoDJ(true);
  };

  const handleTriggerTransition = () => {
    autoDjEngine.triggerTransition();
  };

  return (
    <div
      style={{
        minWidth: '260px',
        maxWidth: '360px',
        width: '100%',
        background: tribeAesthetic === 'millennial'
          ? 'linear-gradient(180deg, #181d28 0%, #0e1118 100%)'
          : tribeAesthetic === 'genz'
          ? 'linear-gradient(145deg, rgba(17, 22, 38, 0.88) 0%, rgba(10, 14, 24, 0.88) 100%)'
          : 'linear-gradient(180deg, #13151e 0%, #0d0f15 100%)',
        borderRadius: '10px',
        border: tribeAesthetic === 'millennial'
          ? '2px solid #2d384d'
          : tribeAesthetic === 'genz'
          ? '1px solid rgba(0, 240, 255, 0.35)'
          : '1px solid #232a3a',
        padding: '12px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: tribeAesthetic === 'genz'
          ? '0 0 25px rgba(0, 240, 255, 0.2), 0 4px 20px rgba(0,0,0,0.6)'
          : '0 4px 20px rgba(0,0,0,0.6)',
        backdropFilter: tribeAesthetic === 'genz' ? 'blur(16px)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Top: Master Output Controls & VU Meter */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f2638', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Knob
            label="MASTER"
            value={masterVol}
            min={0}
            max={1.2}
            defaultValue={0.85}
            unit=""
            color="#ffffff"
            onChange={handleMasterVolChange}
            size={40}
          />
        </div>

        {/* Master Stereo Peak LED VUs */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', fontWeight: 800, color: '#7a8799', marginBottom: '2px', letterSpacing: '0.5px' }}>
            MASTER VU
          </span>
          <div style={{ display: 'flex', gap: '3px' }}>
            <VuMeter level={masterLevels} height={60} width={8} />
            <VuMeter level={masterLevels} height={60} width={8} />
          </div>
        </div>
      </div>

      {/* Center: AUTO-DJ SMART CONSOLE */}
      <div
        style={{
          width: '100%',
          margin: '10px 0',
          background: autoDjState.enabled
            ? 'linear-gradient(180deg, rgba(0, 240, 255, 0.08) 0%, rgba(255, 0, 128, 0.08) 100%)'
            : '#11141d',
          border: `1px solid ${autoDjState.enabled ? '#00f0ff' : '#222938'}`,
          borderRadius: '8px',
          padding: '8px',
          boxShadow: autoDjState.enabled ? '0 0 15px rgba(0, 240, 255, 0.15)' : 'none',
          transition: 'all 0.3s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: autoDjState.enabled ? '#00ff88' : '#556075',
                boxShadow: autoDjState.enabled ? '0 0 8px #00ff88' : 'none',
              }}
            />
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '11px', fontWeight: 900, color: autoDjState.enabled ? '#00f0ff' : '#8a97a8', letterSpacing: '1px' }}>
              AUTO-DJ
            </span>
          </div>

          <button
            onClick={handleToggleAutoDj}
            style={{
              background: autoDjState.enabled ? '#00f0ff' : '#202636',
              color: autoDjState.enabled ? '#000000' : '#8e9bb0',
              border: 'none',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.5px',
              transition: 'background 0.2s',
            }}
          >
            {autoDjState.enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Transition Progress Bar */}
        <div style={{ width: '100%', height: '6px', backgroundColor: '#181d28', borderRadius: '3px', overflow: 'hidden', margin: '6px 0' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.round(autoDjState.transitionProgress * 100)}%`,
              background: 'linear-gradient(90deg, #00f0ff, #ff0077)',
              transition: 'width 0.1s linear',
            }}
          />
        </div>

        {/* Auto DJ Status Text with Real-Time Beat Countdown */}
        <div style={{ fontSize: '10px', color: '#a0aab8', textAlign: 'center', marginBottom: '8px', minHeight: '18px' }}>
          {autoDjState.isTransitioning ? (
            <span style={{ color: '#ff0077', fontWeight: 800 }}>
              ⚡ Transitioning Deck {autoDjState.activeDeckId} ➔ {autoDjState.nextDeckId} ({Math.round(autoDjState.transitionProgress * 100)}%)
            </span>
          ) : autoDjState.enabled ? (
            <span>
              Playing Deck <strong style={{ color: autoDjState.activeDeckId === 'A' ? '#00f0ff' : '#ff0077' }}>{autoDjState.activeDeckId}</strong>
              {autoDjState.secondsUntilMix !== null && (
                <>
                  {' '}• Mix in{' '}
                  <strong style={{ color: '#00ff88', fontFamily: 'monospace' }}>
                    {autoDjState.secondsUntilMix}s
                  </strong>{' '}
                  <span style={{ color: '#8899aa', fontSize: '9px' }}>
                    (~{autoDjState.beatsUntilMix} beats)
                  </span>
                </>
              )}
            </span>
          ) : (
            'Auto-DJ Inactive'
          )}
        </div>

        {/* Mix Mode Quick Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
          {[
            { id: 'smartOutro', label: 'OUTRO' },
            { id: 'quick60', label: '60s' },
            { id: 'quick90', label: '90s' },
            { id: 'full', label: 'FULL' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => autoDjEngine.setMixMode(m.id)}
              style={{
                background: autoDjState.mixMode === m.id ? '#00f0ff22' : '#141722',
                color: autoDjState.mixMode === m.id ? '#00f0ff' : '#6b778a',
                border: `1px solid ${autoDjState.mixMode === m.id ? '#00f0ff' : '#232a3a'}`,
                borderRadius: '3px',
                padding: '2px 5px',
                fontSize: '8px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title={`Mix Mode: ${m.label}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* "MIX NOW" One-Touch Transition Button */}
        <button
          onClick={handleTriggerTransition}
          disabled={!autoDjState.enabled && !audioEngine.decks.A.isPlaying && !audioEngine.decks.B.isPlaying}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #ff0077 0%, #7b00ff 100%)',
            border: 'none',
            borderRadius: '6px',
            color: '#ffffff',
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '11px',
            fontWeight: 900,
            padding: '8px 4px',
            cursor: 'pointer',
            letterSpacing: '1px',
            boxShadow: '0 0 12px rgba(255, 0, 119, 0.4)',
            marginBottom: '8px',
          }}
          title="Instantly execute a smooth beatmatched transition right now!"
        >
          {autoDjState.isTransitioning ? 'TRANSITIONING...' : '⚡ MIX TO NEXT NOW'}
        </button>

        {/* Transition Style Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: '#7a8799', fontWeight: 700 }}>
            <span>MIX TECHNIQUE:</span>
            <span style={{ color: '#00f0ff', fontWeight: 800 }}>
              {autoDjState.transitionStyle === 'dynamic'
                ? `🔀 SONG-SMART (${autoDjState.styleInfo?.shortLabel || 'AUTO'})`
                : (autoDjState.configuredStyleInfo?.shortLabel || autoDjState.transitionStyle.toUpperCase())}
            </span>
          </div>
          {autoDjState.styleReason && (
            <div
              style={{
                fontSize: '8px',
                color: '#00ff88',
                background: 'rgba(0, 255, 136, 0.08)',
                border: '1px solid rgba(0, 255, 136, 0.2)',
                borderRadius: '3px',
                padding: '2px 4px',
                textAlign: 'center',
                margin: '2px 0 4px 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 700,
              }}
              title={autoDjState.styleReason}
            >
              🎵 {autoDjState.styleReason}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3px' }}>
            {[
              { id: 'dynamic', label: '🔀 AUTO', title: 'Dynamic Auto-Rotation (Never sticks to one style!)' },
              { id: 'bassSwap', label: '⚡ BASS', title: 'Sub-Bass Swap' },
              { id: 'filterSweep', label: '🌊 FILTER', title: 'High-Pass Filter Sweep' },
              { id: 'vinylBrake', label: '🛑 BRAKE', title: 'Turntable Motor Brake' },
              { id: 'dropCut', label: '💥 SLAM', title: 'Fast Drop Slam Cut' },
              { id: 'harmonicBlend', label: '✨ BLEND', title: 'Harmonic Long Blend' },
              { id: 'echoFade', label: '🌀 ECHO', title: 'Echo Out Riser' },
              { id: 'beatRoll', label: '🥁 ROLL', title: 'Rhythmic Beat Roll Stutter' },
            ].map((style) => (
              <button
                key={style.id}
                onClick={() => autoDjEngine.setTransitionStyle(style.id)}
                title={style.title}
                style={{
                  background: autoDjState.transitionStyle === style.id ? '#2a3449' : '#171a24',
                  color: autoDjState.transitionStyle === style.id ? '#00f0ff' : '#7a8698',
                  border: `1px solid ${autoDjState.transitionStyle === style.id ? '#00f0ff88' : '#232a3a'}`,
                  borderRadius: '3px',
                  padding: '3px 1px',
                  fontSize: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {style.label}
              </button>
            ))}
          </div>

          {/* Duration Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '9px', color: '#7a8799', fontWeight: 700 }}>DURATION:</span>
            <div style={{ display: 'flex', gap: '3px' }}>
              {[8, 12, 16, 24].map((sec) => (
                <button
                  key={sec}
                  onClick={() => autoDjEngine.setTransitionDuration(sec)}
                  style={{
                    background: autoDjState.transitionDurationSec === sec ? '#2a3449' : '#171a24',
                    color: autoDjState.transitionDurationSec === sec ? '#00f0ff' : '#7a8698',
                    border: `1px solid ${autoDjState.transitionDurationSec === sec ? '#00f0ff88' : '#232a3a'}`,
                    borderRadius: '2px',
                    padding: '2px 4px',
                    fontSize: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: PRO CROSSFADER CONSOLE */}
      <div style={{ width: '100%', borderTop: '1px solid #1f2638', paddingTop: '8px' }}>
        {/* Header with Channel Indicators & Hamster Reverse Switch */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 900, color: '#00f0ff', letterSpacing: '0.5px' }}>
              ◀ DECK A
            </span>
            <span style={{ fontSize: '8px', color: '#68778d', fontWeight: 700 }}>
              ({Math.round(crossfadeGains.gainA * 100)}%)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '9px', fontWeight: 900, color: '#8fa0b5', letterSpacing: '0.8px', fontFamily: 'Orbitron, sans-serif' }}>
              CROSSFADER
            </span>
            <button
              onClick={handleToggleHamster}
              title="Hamster Reverse: Inverts Deck A and Deck B fader assignment (Scratch battle standard)"
              style={{
                background: hamsterReverse ? 'linear-gradient(135deg, #ff9900 0%, #ff5500 100%)' : '#181c28',
                color: hamsterReverse ? '#000000' : '#8899aa',
                border: `1px solid ${hamsterReverse ? '#ffaa00' : '#2a3449'}`,
                borderRadius: '3px',
                padding: '2px 5px',
                fontSize: '8px',
                fontWeight: 900,
                cursor: 'pointer',
                letterSpacing: '0.5px',
                boxShadow: hamsterReverse ? '0 0 10px rgba(255, 153, 0, 0.6)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              🐹 {hamsterReverse ? 'REV ON' : 'HAMSTER'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '8px', color: '#68778d', fontWeight: 700 }}>
              ({Math.round(crossfadeGains.gainB * 100)}%)
            </span>
            <span style={{ fontSize: '10px', fontWeight: 900, color: '#ff0077', letterSpacing: '0.5px' }}>
              DECK B ▶
            </span>
          </div>
        </div>

        {/* Real-time Dynamic Balance Display & Dual Energy Bar */}
        <div
          style={{
            background: '#0e111a',
            border: '1px solid #1c2333',
            borderRadius: '5px',
            padding: '4px 6px',
            marginBottom: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontWeight: 800 }}>
            <span style={{ color: '#00f0ff' }}>
              A: {Math.round((1 - crossfadeValue) * 100)}%
            </span>
            <span
              style={{
                color: Math.abs(crossfadeValue - 0.5) < 0.03 ? '#ffffff' : crossfadeValue < 0.5 ? '#00f0ff' : '#ff0077',
                fontFamily: 'monospace',
                fontSize: '9px',
                letterSpacing: '0.5px',
                fontWeight: 900,
              }}
            >
              {Math.abs(crossfadeValue - 0.5) < 0.03
                ? '⚪ CENTER 50 / 50'
                : crossfadeValue < 0.5
                ? `◀ BIAS DECK A (${Math.round((1 - crossfadeValue) * 100)}%)`
                : `BIAS DECK B (${Math.round(crossfadeValue * 100)}%) ▶`}
            </span>
            <span style={{ color: '#ff0077' }}>
              B: {Math.round(crossfadeValue * 100)}%
            </span>
          </div>

          {/* Dual Attenuation Signal Level Bars */}
          <div style={{ display: 'flex', width: '100%', height: '4px', backgroundColor: '#141824', borderRadius: '2px', overflow: 'hidden', gap: '1px' }}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', backgroundColor: '#10141f' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round(crossfadeGains.gainA * 100))}%`,
                  background: 'linear-gradient(90deg, #0088cc, #00f0ff)',
                  boxShadow: '0 0 6px rgba(0, 240, 255, 0.4)',
                  transition: 'width 0.05s ease',
                }}
              />
            </div>
            <div style={{ width: '2px', height: '100%', backgroundColor: '#ffffff' }} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', backgroundColor: '#10141f' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round(crossfadeGains.gainB * 100))}%`,
                  background: 'linear-gradient(90deg, #ff0077, #ff55aa)',
                  boxShadow: '0 0 6px rgba(255, 0, 119, 0.4)',
                  transition: 'width 0.05s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Hardware Fader Track with Center Detent and Tick Markers */}
        <div style={{ position: 'relative', width: '100%', padding: '0 2px' }}>
          {/* Tick Marks */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 6px', marginBottom: '2px' }}>
            {['0%', '25%', '50%', '75%', '100%'].map((t, idx) => (
              <span
                key={t}
                style={{
                  fontSize: '7px',
                  fontWeight: idx === 2 ? 900 : 700,
                  color: idx === 2 ? '#ffffff' : '#57667a',
                  transform: idx === 0 ? 'translateX(-2px)' : idx === 4 ? 'translateX(2px)' : 'none',
                }}
              >
                {t}
              </span>
            ))}
          </div>

          {/* Crossfader Range Input Slider */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.005"
            value={crossfadeValue}
            onChange={(e) => {
              if (audioEngine.isCrossfadeSliding) {
                audioEngine.cancelCrossfadeSlide();
              }
              onCrossfadeChange(parseFloat(e.target.value));
            }}
            className="pro-crossfader-slider"
          />

          {/* Center Detent Marker Notch Indicator */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '21px',
              width: '2px',
              height: '10px',
              backgroundColor: '#ffffff',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              opacity: 0.8,
              boxShadow: '0 0 4px #ffffff',
            }}
          />
        </div>

        {/* Quick Cut & Center Snap Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginTop: '6px' }}>
          <button
            onClick={() => handleSnap(0)}
            style={{
              background: '#151924',
              border: `1px solid ${crossfadeValue === 0 ? '#00f0ff' : '#232c3f'}`,
              color: '#00f0ff',
              fontSize: '9px',
              fontWeight: 800,
              padding: '5px 2px',
              borderRadius: '4px',
              cursor: 'pointer',
              boxShadow: crossfadeValue === 0 ? '0 0 8px rgba(0, 240, 255, 0.4)' : 'none',
            }}
            title="Instant Cut to Deck A (100%)"
          >
            ◀ CUT A
          </button>
          <button
            onClick={() => handleSnap(0.5)}
            style={{
              background: '#151924',
              border: `1px solid ${Math.abs(crossfadeValue - 0.5) < 0.02 ? '#ffffff' : '#232c3f'}`,
              color: '#ffffff',
              fontSize: '9px',
              fontWeight: 800,
              padding: '5px 2px',
              borderRadius: '4px',
              cursor: 'pointer',
              boxShadow: Math.abs(crossfadeValue - 0.5) < 0.02 ? '0 0 8px rgba(255, 255, 255, 0.4)' : 'none',
            }}
            title="Snap to Center Notch (50/50)"
          >
            ⚪ CENTER
          </button>
          <button
            onClick={() => handleSnap(1)}
            style={{
              background: '#151924',
              border: `1px solid ${crossfadeValue === 1 ? '#ff0077' : '#232c3f'}`,
              color: '#ff0077',
              fontSize: '9px',
              fontWeight: 800,
              padding: '5px 2px',
              borderRadius: '4px',
              cursor: 'pointer',
              boxShadow: crossfadeValue === 1 ? '0 0 8px rgba(255, 0, 119, 0.4)' : 'none',
            }}
            title="Instant Cut to Deck B (100%)"
          >
            CUT B ▶
          </button>
        </div>

        {/* Motorized Smooth Auto-Glide */}
        <div
          style={{
            marginTop: '6px',
            background: '#10131c',
            border: '1px solid #1c2333',
            borderRadius: '5px',
            padding: '4px 6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '8px', fontWeight: 800, color: '#7a8799', letterSpacing: '0.5px' }}>
              ⚡ MOTORIZED AUTO-GLIDE:
            </span>
            <div style={{ display: 'flex', gap: '3px' }}>
              {[1, 2, 4, 8].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSlideDuration(sec)}
                  style={{
                    background: slideDuration === sec ? '#00f0ff22' : '#161924',
                    color: slideDuration === sec ? '#00f0ff' : '#6b778a',
                    border: `1px solid ${slideDuration === sec ? '#00f0ff' : '#232a3a'}`,
                    borderRadius: '2px',
                    padding: '1px 4px',
                    fontSize: '8px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                  title={`Glide duration ${sec} seconds`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => handleSmoothGlide(0)}
              disabled={isSliding && crossfadeValue <= 0.01}
              style={{
                flex: 1,
                background: isSliding && crossfadeValue > 0.05 ? 'rgba(0, 240, 255, 0.25)' : '#141824',
                color: '#00f0ff',
                border: '1px solid #00f0ff55',
                borderRadius: '3px',
                fontSize: '8px',
                fontWeight: 800,
                padding: '4px',
                cursor: 'pointer',
              }}
              title={`Smoothly glide crossfader towards Deck A over ${slideDuration}s`}
            >
              ◀ SLIDE TO A
            </button>

            {isSliding && (
              <button
                onClick={handleStopGlide}
                style={{
                  background: '#ff0033',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '8px',
                  fontWeight: 900,
                  padding: '4px 6px',
                  cursor: 'pointer',
                  boxShadow: '0 0 8px rgba(255, 0, 51, 0.6)',
                }}
                title="Stop active glide immediately"
              >
                STOP
              </button>
            )}

            <button
              onClick={() => handleSmoothGlide(1)}
              disabled={isSliding && crossfadeValue >= 0.99}
              style={{
                flex: 1,
                background: isSliding && crossfadeValue < 0.95 ? 'rgba(255, 0, 119, 0.25)' : '#141824',
                color: '#ff0077',
                border: '1px solid #ff007755',
                borderRadius: '3px',
                fontSize: '8px',
                fontWeight: 800,
                padding: '4px',
                cursor: 'pointer',
              }}
              title={`Smoothly glide crossfader towards Deck B over ${slideDuration}s`}
            >
              SLIDE TO B ▶
            </button>
          </div>
        </div>

        {/* Pro Curve Profiles */}
        <div style={{ marginTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
            <span style={{ fontSize: '8px', fontWeight: 800, color: '#7a8799' }}>CURVE PROFILE:</span>
            <span style={{ fontSize: '8px', fontWeight: 800, color: '#00f0ff' }}>
              {curve === 'equalPower'
                ? 'EQUAL PWR'
                : curve === 'linear'
                ? 'LINEAR'
                : curve === 'cut'
                ? 'SCRATCH CUT'
                : curve === 'dip'
                ? 'DIP (-3dB)'
                : curve === 'slowBlend'
                ? 'SLOW BLEND'
                : 'THRU'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
            {[
              { id: 'equalPower', label: 'EQUAL PWR', title: 'Equal Power: Constant acoustic loudness (Industry Standard for EDM/Club)' },
              { id: 'linear', label: 'LINEAR', title: 'Linear: Direct 1-to-1 fader volume fade' },
              { id: 'cut', label: 'SCRATCH', title: 'Scratch Cut: Ultra-sharp 6% cut-in threshold for battle/scratching' },
              { id: 'dip', label: 'DIP / DROP', title: 'Dip / Club Drop: Lowers center loudness to avoid limiter distortion' },
              { id: 'slowBlend', label: 'SLOW BLEND', title: 'Slow Blend: Extended gentle curve for deep/progressive sets' },
              { id: 'thru', label: 'THRU', title: 'Thru / Bypass: Crossfader disabled, both decks at full volume' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => handleCurveChange(c.id)}
                title={c.title}
                style={{
                  fontSize: '8px',
                  fontWeight: 700,
                  padding: '3px 2px',
                  background: curve === c.id ? '#2a3346' : '#141722',
                  color: curve === c.id ? '#00f0ff' : '#6b778a',
                  border: `1px solid ${curve === c.id ? '#00f0ff88' : '#222938'}`,
                  borderRadius: '3px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MixerCenter;
