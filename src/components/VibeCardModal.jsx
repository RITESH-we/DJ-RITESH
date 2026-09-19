import React, { useState } from 'react';

const VIBE_SLOGANS_GENZ = [
  '✨ MAIN CHARACTER FESTIVAL ENERGY',
  '🔥 IT\'S GIVING UNHINGED BASS DROP',
  '💀 NO SKIP DJ SET ON GOD',
  '💅 PURR... BEATMATCHED TO PERFECTION',
  '⚡ BOILER ROOM HYPE IN MY LIVING ROOM',
];

const VIBE_SLOGANS_MILLENNIAL = [
  '📼 VINTAGE MIXTAPE • SIDE A (CHROME CrO2)',
  '💿 PIONEER CDJ-1000 RETRO GOLDEN ERA',
  '🎧 2000s CLUB ANTHEM • ALL VINYL FEEL',
  '🔊 ANALOG SOUND SYSTEM • PURE NOSTALGIA',
  '🚨 PEAK-HOUR WAREHOUSE RAVE SELECTOR',
];

const VibeCardModal = ({
  isOpen = false,
  onClose = () => {},
  activeTrack = null,
  tribeAesthetic = 'hybrid',
}) => {
  const [cardStyle, setCardStyle] = useState(tribeAesthetic === 'millennial' ? 'cassette' : 'hologram');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const track = activeTrack || {
    title: 'Neon Tokyo Odyssey',
    artist: 'Cyber DJ',
    bpm: 128,
    key: '8A / Am',
    genre: 'Cyber House',
  };

  const genzSlogan = VIBE_SLOGANS_GENZ[Math.floor(Math.abs(track.bpm * 3) % VIBE_SLOGANS_GENZ.length)];
  const millennialSlogan = VIBE_SLOGANS_MILLENNIAL[Math.floor(Math.abs(track.bpm * 5) % VIBE_SLOGANS_MILLENNIAL.length)];

  const handleCopyStoryText = () => {
    const text = `🎧 Now Live on Pro DJ Automixer:\n🎶 "${track.title}" by ${track.artist}\n⚡ ${track.bpm} BPM • Camelot ${track.key || '8A'}\n${cardStyle === 'cassette' ? '📼 ' + millennialSlogan : '✨ ' + genzSlogan}\n🚀 Mix your music live at https://ritesh-we.github.io/DJ-RITESH/`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.85)',
        backdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #131724 0%, #0c0f18 100%)',
          border: '1px solid #232d42',
          borderRadius: '16px',
          padding: '22px',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(0, 240, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>📸</span>
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '13px', fontWeight: 900, color: '#fff' }}>
              SHARE NOW PLAYING VIBE
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setCardStyle('hologram')}
              style={{
                background: cardStyle === 'hologram' ? 'linear-gradient(135deg, #00f0ff, #ff0077)' : '#19202f',
                color: cardStyle === 'hologram' ? '#000' : '#8a9ab0',
                border: 'none',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: 900,
                padding: '4px 8px',
                cursor: 'pointer',
              }}
            >
              ✨ GEN Z HOLO
            </button>
            <button
              onClick={() => setCardStyle('cassette')}
              style={{
                background: cardStyle === 'cassette' ? 'linear-gradient(135deg, #ffaa00, #ff5500)' : '#19202f',
                color: cardStyle === 'cassette' ? '#000' : '#8a9ab0',
                border: 'none',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: 900,
                padding: '4px 8px',
                cursor: 'pointer',
              }}
            >
              📼 MILLENNIAL TAPE
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#65768d',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '0 4px',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* AESTHETIC VIBE CARD RENDER (READY FOR INSTA STORIES / TIKTOK / SNAP)      */}
        {/* ========================================================================= */}
        <div
          id="vibe-story-card"
          style={{
            width: '100%',
            aspectRatio: '9 / 12',
            maxHeight: '380px',
            borderRadius: '14px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px',
            boxShadow: cardStyle === 'hologram'
              ? '0 0 35px rgba(0, 240, 255, 0.4), inset 0 0 20px rgba(255, 0, 119, 0.2)'
              : '0 10px 30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            background: cardStyle === 'hologram'
              ? 'linear-gradient(145deg, #090e1a 0%, #170d24 50%, #0b1a20 100%)'
              : 'linear-gradient(180deg, #24221d 0%, #151412 100%)',
            border: cardStyle === 'hologram'
              ? '2px solid rgba(0, 240, 255, 0.6)'
              : '2px solid #524733',
          }}
        >
          {/* Holographic / Cassette Header Overlay */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>{cardStyle === 'hologram' ? '💿' : '📼'}</span>
              <span
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '1px',
                  color: cardStyle === 'hologram' ? '#00f0ff' : '#ffaa00',
                }}
              >
                {cardStyle === 'hologram' ? 'PRO DJ AUTOMIXER • Y2K CYBER' : 'RETRO MIXTAPE • TDK CrO2 90'}
              </span>
            </div>

            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '9px',
                padding: '2px 6px',
                borderRadius: '3px',
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              LIVE 60 FPS
            </span>
          </div>

          {/* Center Visual Art: Rotating Vinyl Disc or Vintage Cassette Spool */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 'auto' }}>
            {cardStyle === 'hologram' ? (
              <div
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #ff0077 0%, #0b0f19 35%, #00f0ff 70%, #000 100%)',
                  boxShadow: '0 0 30px rgba(0, 240, 255, 0.6), inset 0 0 15px #000',
                  border: '3px solid rgba(255,255,255,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'spin 6s linear infinite',
                }}
              >
                <div
                  style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    background: '#111',
                    border: '2px solid #00f0ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 900,
                  }}
                >
                  ⚡
                </div>
              </div>
            ) : (
              <div
                style={{
                  width: '200px',
                  height: '100px',
                  background: '#1a1815',
                  borderRadius: '8px',
                  border: '2px solid #66563c',
                  boxShadow: 'inset 0 0 20px #000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  padding: '10px',
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px dashed #ffaa00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffaa00' }} />
                </div>
                <div style={{ width: '60px', height: '26px', background: '#383329', borderRadius: '4px', border: '1px solid #ffaa00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#ffaa00', fontWeight: 800 }}>SIDE A</span>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px dashed #ffaa00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffaa00' }} />
                </div>
              </div>
            )}
          </div>

          {/* Track Details & Hype Quote */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '8px', backdropFilter: 'blur(6px)' }}>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {track.title}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: cardStyle === 'hologram' ? '#00f0ff' : '#ffcc00' }}>
              {track.artist || 'Unknown Artist'} • {track.genre || 'Club Electronic'}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#00ff88', fontWeight: 800 }}>
                {track.bpm} BPM
              </span>
              <span style={{ color: '#556677' }}>•</span>
              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#ff0077', fontWeight: 800 }}>
                KEY: {track.key || '8A'}
              </span>
            </div>

            <div
              style={{
                marginTop: '6px',
                fontSize: '10px',
                fontWeight: 900,
                letterSpacing: '0.5px',
                color: cardStyle === 'hologram' ? '#ff0077' : '#ffaa00',
              }}
            >
              {cardStyle === 'hologram' ? genzSlogan : millennialSlogan}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCopyStoryText}
            style={{
              flex: 1,
              background: copied ? '#00ff88' : 'linear-gradient(135deg, #00f0ff 0%, #7b00ff 100%)',
              color: copied ? '#000' : '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px',
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)',
              transition: 'all 0.2s',
            }}
          >
            {copied ? '✓ COPIED TO CLIPBOARD!' : '📋 COPY STORY CAPTION'}
          </button>

          <button
            onClick={onClose}
            style={{
              background: '#19202f',
              border: '1px solid #28334a',
              color: '#8e9fb5',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};

export default VibeCardModal;
