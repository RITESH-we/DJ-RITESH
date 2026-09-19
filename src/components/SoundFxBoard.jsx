import React, { useState, useEffect } from 'react';
import audioEngine from '../audio/audioEngine';

export const CLUB_FX_LIST = [
  { id: 'airhorn', label: '🚨 AIRHORN', keyHint: 'Z', tribe: 'millennial', color: '#ffcc00', desc: 'Classic dancehall reggae club airhorn blast' },
  { id: 'laser', label: '🔫 RAVE LASER', keyHint: 'X', tribe: 'millennial', color: '#00f0ff', desc: '90s/2000s retro space laser dive' },
  { id: 'rewind', label: '⏪ VINYL REWIND', keyHint: 'C', tribe: 'millennial', color: '#ff0077', desc: 'Turntable vinyl spinback & record slip' },
  { id: 'subDrop', label: '💥 808 SUB BOOM', keyHint: 'V', tribe: 'genz', color: '#7000ff', desc: 'Gen Z trap 808 sub-bass room rattler' },
  { id: 'siren', label: '🚨 DUB SIREN', keyHint: 'B', tribe: 'millennial', color: '#00ff88', desc: 'Vintage UK rave analog dub siren with echo' },
  { id: 'riser', label: '⚡ DROP RISER', keyHint: 'N', tribe: 'genz', color: '#ff3366', desc: 'Festival hyper-speed drop riser tension' },
];

const SoundFxBoard = ({ tribeAesthetic = 'hybrid' }) => {
  const [activeFx, setActiveFx] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const triggerFx = (id) => {
    setActiveFx(id);
    audioEngine.playClubFx(id);
    setTimeout(() => {
      setActiveFx((curr) => (curr === id ? null : curr));
    }, 280);
  };

  // Global keyboard shortcuts Z, X, C, V, B, N
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      const key = e.key.toUpperCase();
      const match = CLUB_FX_LIST.find((item) => item.keyHint === key);
      if (match) {
        e.preventDefault();
        triggerFx(match.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={`sound-fx-console ${tribeAesthetic}`}
      style={{
        width: '100%',
        background: tribeAesthetic === 'millennial'
          ? 'linear-gradient(180deg, #181d28 0%, #0e1118 100%)'
          : tribeAesthetic === 'genz'
          ? 'linear-gradient(135deg, rgba(20, 24, 38, 0.85) 0%, rgba(12, 14, 24, 0.85) 100%)'
          : 'linear-gradient(180deg, #131722 0%, #0c0f16 100%)',
        border: tribeAesthetic === 'millennial'
          ? '2px solid #2a3449'
          : tribeAesthetic === 'genz'
          ? '1px solid rgba(0, 240, 255, 0.4)'
          : '1px solid #1f2738',
        borderRadius: '10px',
        padding: '8px 12px',
        boxShadow: tribeAesthetic === 'genz'
          ? '0 0 20px rgba(0, 240, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        backdropFilter: tribeAesthetic === 'genz' ? 'blur(12px)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCollapsed ? 0 : '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>🔥</span>
          <span
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '1.2px',
              background: tribeAesthetic === 'millennial'
                ? 'linear-gradient(90deg, #ffaa00, #ffea00)'
                : tribeAesthetic === 'genz'
                ? 'linear-gradient(90deg, #00f0ff, #ff0077, #7000ff)'
                : 'linear-gradient(90deg, #ffffff, #00f0ff, #ff0077)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {tribeAesthetic === 'millennial'
              ? 'RETRO CLUB SOUNDBOARD'
              : tribeAesthetic === 'genz'
              ? 'VIRAL HYPE SOUNDBOARD'
              : 'CLUB & FESTIVAL FX SOUNDBOARD'}
          </span>
          <span style={{ fontSize: '9px', color: '#68788f', fontWeight: 700, display: typeof window !== 'undefined' && window.innerWidth < 600 ? 'none' : 'inline' }}>
            [KEYBOARD Z • X • C • V • B • N]
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '9px',
              padding: '2px 6px',
              borderRadius: '3px',
              fontWeight: 800,
              background: tribeAesthetic === 'millennial'
                ? 'rgba(255, 170, 0, 0.15)'
                : tribeAesthetic === 'genz'
                ? 'rgba(0, 240, 255, 0.15)'
                : 'rgba(255, 0, 119, 0.15)',
              color: tribeAesthetic === 'millennial' ? '#ffaa00' : tribeAesthetic === 'genz' ? '#00f0ff' : '#ff0077',
              border: `1px solid ${tribeAesthetic === 'millennial' ? '#ffaa0044' : tribeAesthetic === 'genz' ? '#00f0ff44' : '#ff007744'}`,
            }}
          >
            {tribeAesthetic === 'millennial' ? '📼 90s/00s CLUB' : tribeAesthetic === 'genz' ? '✨ GEN Z HYPE' : '🔀 MILLENNIAL × GEN Z'}
          </span>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: '#161a25',
              border: '1px solid #232a3d',
              color: '#8393a8',
              fontSize: '9px',
              padding: '2px 6px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontWeight: 800,
            }}
            title={isCollapsed ? 'Expand Soundboard' : 'Collapse Soundboard'}
          >
            {isCollapsed ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
          {CLUB_FX_LIST.map((fx) => {
            const isFired = activeFx === fx.id;
            return (
              <button
                key={fx.id}
                onClick={() => triggerFx(fx.id)}
                title={`${fx.desc} (Press ${fx.keyHint})`}
                style={{
                  background: isFired
                    ? fx.color
                    : tribeAesthetic === 'millennial'
                    ? 'linear-gradient(180deg, #222a3a 0%, #151923 100%)'
                    : tribeAesthetic === 'genz'
                    ? 'rgba(25, 31, 48, 0.7)'
                    : 'linear-gradient(180deg, #1d2332 0%, #131722 100%)',
                  color: isFired ? '#000000' : '#f0f5fa',
                  border: `1px solid ${isFired ? '#ffffff' : fx.color + '66'}`,
                  borderRadius: '6px',
                  padding: '8px 6px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  boxShadow: isFired
                    ? `0 0 18px ${fx.color}, inset 0 0 10px #ffffff`
                    : `0 2px 6px rgba(0,0,0,0.4)`,
                  transform: isFired ? 'scale(0.96)' : 'scale(1)',
                  transition: 'all 0.08s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.4px' }}>
                    {fx.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '9px',
                      fontWeight: 800,
                      background: isFired ? 'rgba(0,0,0,0.3)' : '#0d1017',
                      color: isFired ? '#000' : fx.color,
                      padding: '1px 5px',
                      borderRadius: '3px',
                      border: `1px solid ${isFired ? 'transparent' : fx.color + '44'}`,
                    }}
                  >
                    [{fx.keyHint}]
                  </span>
                  <span style={{ fontSize: '8px', color: isFired ? '#222' : '#6f7f94', textTransform: 'uppercase' }}>
                    {fx.tribe === 'millennial' ? 'RETRO' : '808 TRAP'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SoundFxBoard;
