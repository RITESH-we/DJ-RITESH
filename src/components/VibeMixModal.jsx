import React, { useState } from 'react';
import spotifyService from '../services/spotifyService';

const VibeMixModal = ({
  isOpen = false,
  onClose = () => {},
  onLoadMix = () => {},
}) => {
  const [mood, setMood] = useState('Late Night Club');
  const [genre, setGenre] = useState('All Genres');
  const [language, setLanguage] = useState('Any / Global');
  const [targetBpm, setTargetBpm] = useState(125);
  const [energy, setEnergy] = useState(85);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTracks, setGeneratedTracks] = useState([]);

  if (!isOpen) return null;

  const moods = [
    { id: 'Festival Mainstage', icon: '⚡', desc: 'Peak-hour electro & big-room anthems' },
    { id: 'Late Night Club', icon: '🌙', desc: 'Driving basslines & tech house heaters' },
    { id: 'Sunset Lounge', icon: '🌅', desc: 'Melodic deep house & warm golden-hour beats' },
    { id: 'Dark Cyber Underground', icon: '🏎️', desc: '135+ BPM raw techno & industrial energy' },
    { id: 'Euphoric Workout', icon: '🔥', desc: 'Uplifting high-BPM motivational rhythms' },
    { id: 'Beach Pool Party', icon: '🏖️', desc: 'Vibrant Latin, Afrobeats & tropical groove' },
  ];

  const genres = [
    'All Genres',
    'EDM / House',
    'Hip-Hop & Trap',
    'Afrobeats & Amapiano',
    'Bollywood & Punjabi',
    'Latin & Reggaeton',
    'Techno / Trance',
  ];

  const languages = [
    'Any / Global',
    'English',
    'Hindi / Punjabi',
    'Spanish',
    'Global / Instrumental',
  ];

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    setIsGenerating(true);

    try {
      const mix = await spotifyService.generateVibeMix({
        mood,
        genre,
        language,
        energy: energy / 100,
        targetBpm,
      });

      // Prepare audio buffers for the tracks
      const prepared = [];
      for (const t of mix) {
        const audioBuffer = await spotifyService.loadTrackAudioBuffer(t);
        prepared.push({ ...t, audioBuffer });
      }

      setGeneratedTracks(prepared);
    } catch (err) {
      console.error('Failed to generate vibe mix:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadSet = () => {
    if (generatedTracks.length > 0) {
      onLoadMix(generatedTracks);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 10, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '740px',
          background: 'linear-gradient(180deg, #131722 0%, #0c0f16 100%)',
          borderRadius: '14px',
          border: '1px solid #ff0077',
          boxShadow: '0 0 40px rgba(255, 0, 119, 0.25), 0 8px 32px rgba(0,0,0,0.85)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 22px',
            borderBottom: '1px solid #232938',
            background: 'linear-gradient(90deg, #161a26 0%, #1e1220 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>✨</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontFamily: 'Orbitron, sans-serif', color: '#ff0077', letterSpacing: '1px' }}>
                AI VIBE MIX GENERATOR
              </h2>
              <p style={{ margin: 0, fontSize: '11px', color: '#8b97a8' }}>
                Curate a harmonically-blended DJ set tailored to your mood, genre, language & tempo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8e9bb0',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '2px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* 1. Mood / Vibe Selector */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: '#f0f4f8', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              1. SELECT VIBE / MOOD
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {moods.map((m) => {
                const isSelected = mood === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMood(m.id)}
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, rgba(255, 0, 119, 0.25) 0%, #1a1e2b 100%)' : '#10131c',
                      border: `1px solid ${isSelected ? '#ff0077' : '#222838'}`,
                      borderRadius: '8px',
                      padding: '10px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 0 12px rgba(255, 0, 119, 0.3)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px' }}>{m.icon}</span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: isSelected ? '#ffffff' : '#b0bccd' }}>
                        {m.id}
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#6d7b8f' }}>
                      {m.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Genre & Language Row */}
          <div style={{ display: 'flex', gap: '14px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#f0f4f8', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                2. GENRE
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0d1017',
                  border: '1px solid #283348',
                  borderRadius: '6px',
                  padding: '9px 12px',
                  color: '#e0e6ed',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {genres.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#f0f4f8', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                3. LANGUAGE / REGION
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0d1017',
                  border: '1px solid #283348',
                  borderRadius: '6px',
                  padding: '9px 12px',
                  color: '#e0e6ed',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {languages.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Sliders: Target BPM & Energy Level */}
          <div style={{ display: 'flex', gap: '14px', background: '#0e1118', padding: '12px 16px', borderRadius: '8px', border: '1px solid #1c2230' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#00f0ff' }}>TARGET TEMPO (BPM)</span>
                <span style={{ fontSize: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, color: '#00f0ff' }}>{targetBpm} BPM</span>
              </div>
              <input
                type="range"
                min="90"
                max="175"
                step="1"
                value={targetBpm}
                onChange={(e) => setTargetBpm(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#00f0ff', cursor: 'pointer' }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#ff0077' }}>ENERGY LEVEL</span>
                <span style={{ fontSize: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, color: '#ff0077' }}>{energy}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="5"
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#ff0077', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              background: 'linear-gradient(135deg, #ff0077 0%, #7b00ff 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              color: '#ffffff',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 900,
              fontSize: '13px',
              letterSpacing: '1px',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(255, 0, 119, 0.4)',
              transition: 'transform 0.15s',
            }}
          >
            {isGenerating ? '⚡ CURATING HARMONIC MIX...' : '⚡ GENERATE TAILORED DJ SET'}
          </button>

          {/* Generated Mix Tracklist Preview */}
          {generatedTracks.length > 0 && (
            <div style={{ background: '#0a0d14', border: '1px solid #1db954', borderRadius: '8px', padding: '14px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#1db954' }}>
                    HARMONIC DJ MIX COMPILED
                  </span>
                  <span style={{ fontSize: '11px', color: '#7a8799', marginLeft: '8px' }}>
                    ({generatedTracks.length} Tracks • Sorted in Key for Smooth Transitions)
                  </span>
                </div>
                <button
                  onClick={handleLoadSet}
                  style={{
                    background: '#1db954',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontWeight: 900,
                    fontSize: '11px',
                    cursor: 'pointer',
                    boxShadow: '0 0 12px rgba(29, 185, 84, 0.4)',
                  }}
                >
                  🎧 LOAD INTO MIXER & PLAY
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {generatedTracks.map((t, idx) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: '#11141e',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ color: '#687588', width: '18px', fontWeight: 700 }}>{idx + 1}</span>
                    {t.thumbnail && (
                      <img src={t.thumbnail} alt={t.title} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#f0f4f8' }}>{t.title}</div>
                      <div style={{ fontSize: '10px', color: '#8e9aa8' }}>{t.artist}</div>
                    </div>
                    <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: '#00ff88', fontSize: '11px' }}>
                      {t.bpm} BPM
                    </span>
                    <span style={{ fontFamily: 'monospace', color: '#ffcc00', fontSize: '10px', background: '#ffcc0018', padding: '1px 5px', borderRadius: '3px' }}>
                      {t.key}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VibeMixModal;
