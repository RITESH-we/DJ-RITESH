import React, { useState, useEffect, useRef } from 'react';
import audioEngine from '../audio/audioEngine';
import autoDjEngine from '../audio/autoDjEngine';
import Knob from './Knob';
import VuMeter from './VuMeter';

const MixerCenter = ({
  crossfadeValue = 0.5,
  onCrossfadeChange = () => {},
}) => {
  const [masterVol, setMasterVol] = useState(0.85);
  const [curve, setCurve] = useState('equalPower');
  const [masterLevels, setMasterLevels] = useState({ peak: 0, rms: 0 });
  const [autoDjState, setAutoDjState] = useState(autoDjEngine.getState());

  const animFrameRef = useRef(null);

  useEffect(() => {
    const unsub = autoDjEngine.subscribe((state) => {
      setAutoDjState(state);
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
        background: 'linear-gradient(180deg, #13151e 0%, #0d0f15 100%)',
        borderRadius: '10px',
        border: '1px solid #232a3a',
        padding: '12px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
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
                ? `🔀 DYNAMIC (${autoDjState.styleInfo?.shortLabel || 'ROTATING'})`
                : (autoDjState.configuredStyleInfo?.shortLabel || autoDjState.transitionStyle.toUpperCase())}
            </span>
          </div>
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

      {/* Bottom: CROSSFADER & CURVE SELECTOR */}
      <div style={{ width: '100%', borderTop: '1px solid #1f2638', paddingTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '9px', fontWeight: 800, color: '#00f0ff', letterSpacing: '0.5px' }}>◀ DECK A</span>
          <span style={{ fontSize: '9px', fontWeight: 800, color: '#7a8799' }}>CROSSFADER</span>
          <span style={{ fontSize: '9px', fontWeight: 800, color: '#ff0077', letterSpacing: '0.5px' }}>DECK B ▶</span>
        </div>

        {/* Crossfader Slider */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={crossfadeValue}
          onChange={(e) => onCrossfadeChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            height: '14px',
            cursor: 'pointer',
            accentColor: crossfadeValue < 0.45 ? '#00f0ff' : crossfadeValue > 0.55 ? '#ff0077' : '#ffffff',
          }}
        />

        {/* Quick Position Snap Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <button
            onClick={() => onCrossfadeChange(0)}
            style={{ background: '#161922', border: '1px solid #283042', color: '#00f0ff', fontSize: '9px', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer' }}
          >
            A (100%)
          </button>
          <button
            onClick={() => onCrossfadeChange(0.5)}
            style={{ background: '#161922', border: '1px solid #283042', color: '#fff', fontSize: '9px', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer' }}
          >
            CENTER
          </button>
          <button
            onClick={() => onCrossfadeChange(1)}
            style={{ background: '#161922', border: '1px solid #283042', color: '#ff0077', fontSize: '9px', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer' }}
          >
            B (100%)
          </button>
        </div>

        {/* Curve Mode */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
          {[
            { id: 'equalPower', label: 'EQUAL POWER' },
            { id: 'linear', label: 'LINEAR' },
            { id: 'cut', label: 'SCRATCH CUT' },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => handleCurveChange(c.id)}
              style={{
                fontSize: '8px',
                fontWeight: 700,
                padding: '2px 4px',
                background: curve === c.id ? '#2a3346' : 'transparent',
                color: curve === c.id ? '#00f0ff' : '#6b778a',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MixerCenter;
