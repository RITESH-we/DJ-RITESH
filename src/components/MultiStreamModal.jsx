import React, { useState } from 'react';
import musicStreamService, { STREAM_PLATFORMS } from '../services/musicStreamService';
import audioEngine from '../audio/audioEngine';

const RADIO_PRESETS = [
  {
    title: 'Defected In The House Radio',
    artist: 'Defected Records',
    genre: 'House & Tech',
    bpm: 125,
    key: '8A / Am',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150',
    url: 'https://ice5.somafm.com/groovesalad-128-mp3',
    platform: 'radio',
    platformLabel: 'Club Radio',
    platformIcon: '📻',
    platformColor: '#00ff88',
  },
  {
    title: 'Ibiza Global Club Sessions',
    artist: 'Ibiza Resident DJs',
    genre: 'Deep Tech & Melodic',
    bpm: 124,
    key: '9B / G',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150',
    url: 'https://ice1.somafm.com/suburbsofgoa-128-mp3',
    platform: 'radio',
    platformLabel: 'Ibiza Stream',
    platformIcon: '🌴',
    platformColor: '#00f0ff',
  },
  {
    title: 'Lofi Girl Beats to Mix & Chill',
    artist: 'Lofi Records',
    genre: 'Chillhop & Lofi',
    bpm: 85,
    key: '4A / Fm',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150',
    url: 'https://ice2.somafm.com/beatblender-128-mp3',
    platform: 'radio',
    platformLabel: 'Lofi Stream',
    platformIcon: '☕',
    platformColor: '#ffcc00',
  },
  {
    title: 'Underground Berlin Techno',
    artist: 'Vault Sessions',
    genre: 'Industrial Techno',
    bpm: 136,
    key: '1A / G#m',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=150',
    url: 'https://ice4.somafm.com/defcon-128-mp3',
    platform: 'radio',
    platformLabel: 'Techno Vault',
    platformIcon: '🏎️',
    platformColor: '#ff0077',
  },
];

const MultiStreamModal = ({
  isOpen = false,
  onClose = () => {},
  onAddTrack = () => {},
  onLoadDeck = () => {},
  defaultPlatform = 'all',
}) => {
  const [activeTab, setActiveTab] = useState('link'); // 'link' | 'search' | 'radio'
  const [selectedPlatform, setSelectedPlatform] = useState(
    (defaultPlatform === 'youtube_music' || defaultPlatform === 'youtube') ? 'youtube' : defaultPlatform
  );

  // Link Tab State
  const [linkInput, setLinkInput] = useState('');
  const [detectedType, setDetectedType] = useState(null);
  const [isParsingLink, setIsParsingLink] = useState(false);
  const [linkTrackResult, setLinkTrackResult] = useState(null);
  const [linkError, setLinkError] = useState('');

  // Search Tab State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');

  // Sync selected platform on open or defaultPlatform change
  useEffect(() => {
    const normalized = (defaultPlatform === 'youtube_music' || defaultPlatform === 'youtube') ? 'youtube' : (defaultPlatform || 'all');
    setSelectedPlatform(normalized);
  }, [defaultPlatform, isOpen]);

  if (!isOpen) return null;

  // Handle URL Typing for auto-detection
  const handleUrlChange = (val) => {
    setLinkInput(val);
    setLinkError('');
    if (!val.trim()) {
      setDetectedType(null);
      return;
    }
    const detected = musicStreamService.detectPlatform(val);
    setDetectedType(detected);
  };

  // 1-Click Quick Test for YouTube & other platforms
  const handleQuickTest = async (testUrl) => {
    setLinkInput(testUrl);
    setDetectedType(musicStreamService.detectPlatform(testUrl));
    setIsParsingLink(true);
    setLinkError('');
    setLinkTrackResult(null);

    try {
      const trackObj = await musicStreamService.parseAnyLink(testUrl);
      setLinkTrackResult(trackObj);
    } catch (err) {
      setLinkError(err.message || 'Failed to import streaming link.');
    } finally {
      setIsParsingLink(false);
    }
  };

  // Parse Link
  const handleParseLink = async (e) => {
    if (e) e.preventDefault();
    if (!linkInput.trim()) return;

    setIsParsingLink(true);
    setLinkError('');
    setLinkTrackResult(null);

    try {
      const trackObj = await musicStreamService.parseAnyLink(linkInput);
      setLinkTrackResult(trackObj);
    } catch (err) {
      setLinkError(err.message || 'Failed to import streaming link.');
    } finally {
      setIsParsingLink(false);
    }
  };

  // Execute Search
  const handleSearch = async (e, forcedPlatform = selectedPlatform) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const results = await musicStreamService.searchAcrossPlatforms(searchQuery, forcedPlatform);
      if (!results || results.length === 0) {
        setSearchError('No matching streaming tracks found. Try broader keywords or artist names.');
      } else {
        setSearchResults(results);
      }
    } catch (err) {
      setSearchError(err.message || 'Search request failed.');
    } finally {
      setIsSearching(false);
    }
  };

  // When changing platform pill, auto-rerun search if query exists
  const handleSelectPlatform = (platformId) => {
    setSelectedPlatform(platformId);
    if (searchQuery.trim()) {
      handleSearch(null, platformId);
    }
  };

  // Action helpers
  const handleLoadTrackToDeck = async (deckId, track) => {
    await audioEngine.resumeContext();
    onLoadDeck(deckId, track);
    onClose();
  };

  const handleAddTrackToPlaylist = (track) => {
    onAddTrack(track);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(4, 7, 14, 0.88)',
        backdropFilter: 'blur(18px)',
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
          background: 'linear-gradient(180deg, #131724 0%, #0a0d16 100%)',
          border: '1px solid #242f46',
          borderRadius: '16px',
          padding: '20px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 35px rgba(0, 240, 255, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f293d', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ff0000 0%, #ff0077 50%, #00f0ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                boxShadow: '0 0 16px rgba(255, 0, 0, 0.5)',
              }}
            >
              🎵
            </div>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Orbitron, sans-serif', fontSize: '15px', fontWeight: 900, color: '#fff', letterSpacing: '0.8px' }}>
                UNIVERSAL MUSIC STREAMING HUB
              </h2>
              <p style={{ margin: 0, fontSize: '11px', color: '#7a8ba3' }}>
                Stream & Mix live from YouTube Music, Spotify, SoundCloud, Apple Music & Audius
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6e7e96',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', margin: '14px 0 10px 0', borderBottom: '1px solid #1c2436', paddingBottom: '8px' }}>
          <button
            onClick={() => setActiveTab('link')}
            style={{
              background: activeTab === 'link' ? 'linear-gradient(135deg, #ff0000 0%, #ff0077 100%)' : '#141824',
              color: activeTab === 'link' ? '#fff' : '#7b8c9f',
              border: `1px solid ${activeTab === 'link' ? '#ff0077' : '#222c3d'}`,
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🔗</span> PASTE ANY MUSIC LINK
          </button>

          <button
            onClick={() => setActiveTab('search')}
            style={{
              background: activeTab === 'search' ? 'linear-gradient(135deg, #00f0ff 0%, #7b00ff 100%)' : '#141824',
              color: activeTab === 'search' ? '#000' : '#7b8c9f',
              border: `1px solid ${activeTab === 'search' ? '#00f0ff' : '#222c3d'}`,
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🔍</span> SEARCH ALL PLATFORMS
          </button>

          <button
            onClick={() => setActiveTab('radio')}
            style={{
              background: activeTab === 'radio' ? 'linear-gradient(135deg, #00ff88 0%, #00b359 100%)' : '#141824',
              color: activeTab === 'radio' ? '#000' : '#7b8c9f',
              border: `1px solid ${activeTab === 'radio' ? '#00ff88' : '#222c3d'}`,
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📻</span> CLUB RADIO & WEB STREAMS
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PASTE ANY MUSIC LINK (YOUTUBE, SPOTIFY, SOUNDCLOUD, APPLE, DIRECT) */}
        {/* ========================================================================= */}
        {activeTab === 'link' && (
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            <form onSubmit={handleParseLink} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#9fb1c7' }}>
                  PASTE ANY SONG, PLAYLIST, OR VIDEO URL:
                </label>
                {detectedType && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: detectedType === 'youtube' || detectedType === 'youtube_music' ? '#ff000022' :
                                  detectedType === 'spotify' ? '#1db95422' :
                                  detectedType === 'soundcloud' ? '#ff770022' : '#00f0ff22',
                      color: detectedType === 'youtube' || detectedType === 'youtube_music' ? '#ff4444' :
                             detectedType === 'spotify' ? '#1db954' :
                             detectedType === 'soundcloud' ? '#ff8822' : '#00f0ff',
                      border: '1px solid currentColor',
                    }}
                  >
                    DETECTED: {detectedType.toUpperCase()}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://music.youtube.com/watch?v=... or https://open.spotify.com/track/... or soundcloud.com/..."
                  style={{
                    flex: 1,
                    background: '#0d111b',
                    border: '1px solid #232c3f',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '10px 14px',
                    fontSize: '12px',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  type="submit"
                  disabled={isParsingLink || !linkInput.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #ff0000 0%, #ff0077 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '11px',
                    fontWeight: 900,
                    padding: '0 18px',
                    cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(255, 0, 0, 0.4)',
                  }}
                >
                  {isParsingLink ? 'ANALYZING...' : '⚡ ANALYZE'}
                </button>
              </div>

              {/* 1-Click Instant Test Buttons for YouTube Music & Streaming */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px', background: '#0e121d', padding: '8px 10px', borderRadius: '8px', border: '1px dashed #273347' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#ff4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🔴</span> 1-CLICK TEST:
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickTest('https://music.youtube.com/watch?v=kJQP7kiw5Fk')}
                  style={{
                    background: '#ff000018',
                    border: '1px solid #ff000044',
                    color: '#ff6666',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '5px',
                    padding: '3px 8px',
                    cursor: 'pointer',
                  }}
                  title="Test YouTube Music link: Despacito (Luis Fonsi)"
                >
                  🌴 Despacito (YT Music)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickTest('https://www.youtube.com/watch?v=60ItHLz5WEA')}
                  style={{
                    background: '#ff000018',
                    border: '1px solid #ff000044',
                    color: '#ff6666',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '5px',
                    padding: '3px 8px',
                    cursor: 'pointer',
                  }}
                  title="Test YouTube link: Faded (Alan Walker)"
                >
                  ⚡ Faded (YouTube)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickTest('https://youtu.be/fJ9rUzIMcZQ')}
                  style={{
                    background: '#ff000018',
                    border: '1px solid #ff000044',
                    color: '#ff6666',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '5px',
                    padding: '3px 8px',
                    cursor: 'pointer',
                  }}
                  title="Test Short YouTube link: Bohemian Rhapsody"
                >
                  👑 Bohemian Rhapsody
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickTest('https://www.youtube.com/watch?v=JGwWNGJdvx8')}
                  style={{
                    background: '#ff000018',
                    border: '1px solid #ff000044',
                    color: '#ff6666',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '5px',
                    padding: '3px 8px',
                    cursor: 'pointer',
                  }}
                  title="Test YouTube link: Shape of You"
                >
                  🎧 Shape of You
                </button>
              </div>

              {/* Supported platform badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#5f7188' }}>SUPPORTED:</span>
                {STREAM_PLATFORMS.filter((p) => p.id !== 'all').map((p) => (
                  <span
                    key={p.id}
                    style={{
                      fontSize: '9px',
                      color: p.color,
                      background: `${p.color}15`,
                      border: `1px solid ${p.color}44`,
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontWeight: 700,
                    }}
                  >
                    {p.icon} {p.label}
                  </span>
                ))}
              </div>
            </form>

            {linkError && (
              <div style={{ marginTop: '12px', padding: '10px', background: '#ff003318', border: '1px solid #ff003344', borderRadius: '6px', color: '#ff4d6d', fontSize: '11px' }}>
                ⚠️ {linkError}
              </div>
            )}

            {/* Parsed Track Card */}
            {linkTrackResult && (
              <div
                style={{
                  marginTop: '16px',
                  background: 'linear-gradient(180deg, #182030 0%, #101522 100%)',
                  border: `1.5px solid ${linkTrackResult.platformColor || '#00f0ff'}`,
                  borderRadius: '10px',
                  padding: '14px',
                  boxShadow: `0 0 20px ${linkTrackResult.platformColor}33`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img
                    src={linkTrackResult.thumbnail}
                    alt={linkTrackResult.title}
                    style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #2d3b55' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px' }}>{linkTrackResult.platformIcon}</span>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: linkTrackResult.platformColor, textTransform: 'uppercase' }}>
                        {linkTrackResult.platformLabel}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {linkTrackResult.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8fa2b8' }}>
                      {linkTrackResult.artist}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#00ff88', fontWeight: 800 }}>
                        {linkTrackResult.bpm} BPM
                      </span>
                      <span style={{ color: '#4a5970' }}>•</span>
                      <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#ff0077', fontWeight: 800 }}>
                        KEY: {linkTrackResult.key}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Parsed Link */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #222d42', paddingTop: '10px' }}>
                  <button
                    onClick={() => handleLoadTrackToDeck('A', linkTrackResult)}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #00f0ff22 0%, #00f0ff11 100%)',
                      border: '1px solid #00f0ff',
                      borderRadius: '6px',
                      color: '#00f0ff',
                      fontWeight: 900,
                      fontSize: '11px',
                      padding: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    🔵 LOAD DECK A
                  </button>
                  <button
                    onClick={() => handleLoadTrackToDeck('B', linkTrackResult)}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #ff007722 0%, #ff007711 100%)',
                      border: '1px solid #ff0077',
                      borderRadius: '6px',
                      color: '#ff0077',
                      fontWeight: 900,
                      fontSize: '11px',
                      padding: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    🔴 LOAD DECK B
                  </button>
                  <button
                    onClick={() => handleAddTrackToPlaylist(linkTrackResult)}
                    style={{
                      flex: 1.2,
                      background: 'linear-gradient(135deg, #00ff88 0%, #00b359 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#000',
                      fontWeight: 900,
                      fontSize: '11px',
                      padding: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 0 10px rgba(0, 255, 136, 0.4)',
                    }}
                  >
                    ➕ ADD TO PLAYLIST
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SEARCH ALL STREAMING PLATFORMS (YOUTUBE, AUDIUS, ITUNES, DEEZER)    */}
        {/* ========================================================================= */}
        {activeTab === 'search' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search artist, song, remix, or festival set..."
                  style={{
                    flex: 1,
                    background: '#0d111b',
                    border: '1px solid #232c3f',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '10px 14px',
                    fontSize: '12px',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #00f0ff 0%, #7b00ff 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000',
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '11px',
                    fontWeight: 900,
                    padding: '0 18px',
                    cursor: 'pointer',
                  }}
                >
                  {isSearching ? 'SEARCHING...' : 'SEARCH'}
                </button>
              </div>

              {/* Platform Filter Pills */}
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
                {STREAM_PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPlatform(p.id)}
                    style={{
                      background: selectedPlatform === p.id ? `${p.color}33` : '#131824',
                      color: selectedPlatform === p.id ? p.color : '#7b8c9f',
                      border: `1px solid ${selectedPlatform === p.id ? p.color : '#222b3d'}`,
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '9px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.icon} {p.label}
                  </button>
                ))}
              </div>
            </form>

            {searchError && (
              <div style={{ padding: '8px 12px', background: '#ffaa0015', border: '1px solid #ffaa0044', borderRadius: '6px', color: '#ffaa00', fontSize: '11px' }}>
                ⚠️ {searchError}
              </div>
            )}

            {/* Results List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
              {searchResults.map((track) => (
                <div
                  key={track.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#121622',
                    border: '1px solid #1e2638',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <img
                      src={track.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150'}
                      alt={track.title}
                      style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '10px' }}>{track.platformIcon}</span>
                        <span style={{ fontSize: '8px', fontWeight: 800, color: track.platformColor }}>
                          {track.platformLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#f0f5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {track.title}
                      </div>
                      <div style={{ fontSize: '10px', color: '#7e8ea2' }}>
                        {track.artist} • <span style={{ color: '#00ff88' }}>{track.bpm} BPM</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleLoadTrackToDeck('A', track)}
                      style={{
                        background: '#00f0ff22',
                        border: '1px solid #00f0ff66',
                        color: '#00f0ff',
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '4px 6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      title="Load to Deck A"
                    >
                      DECK A
                    </button>
                    <button
                      onClick={() => handleLoadTrackToDeck('B', track)}
                      style={{
                        background: '#ff007722',
                        border: '1px solid #ff007766',
                        color: '#ff0077',
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '4px 6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      title="Load to Deck B"
                    >
                      DECK B
                    </button>
                    <button
                      onClick={() => handleAddTrackToPlaylist(track)}
                      style={{
                        background: '#00ff8822',
                        border: '1px solid #00ff8866',
                        color: '#00ff88',
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '4px 6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      title="Add to Auto-DJ Playlist"
                    >
                      + MIX
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CURATED CLUB RADIO & DIRECT STREAM URLS                            */}
        {/* ========================================================================= */}
        {activeTab === 'radio' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '11px', color: '#8fa2b8' }}>
              Select a 24/7 high-bitrate electronic dance radio stream, or paste any Icecast, Shoutcast, or live audio URL:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
              {RADIO_PRESETS.map((station, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#121622',
                    border: '1px solid #232c3f',
                    borderRadius: '8px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <img
                      src={station.thumbnail}
                      alt={station.title}
                      style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>
                        {station.title}
                      </div>
                      <div style={{ fontSize: '10px', color: '#8fa2b8' }}>
                        {station.genre} • <span style={{ color: '#00ff88' }}>{station.bpm} BPM</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleLoadTrackToDeck('A', station)}
                      style={{
                        flex: 1,
                        background: '#00f0ff22',
                        border: '1px solid #00f0ff55',
                        color: '#00f0ff',
                        padding: '5px',
                        fontSize: '9px',
                        fontWeight: 800,
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      🔵 LOAD A
                    </button>
                    <button
                      onClick={() => handleLoadTrackToDeck('B', station)}
                      style={{
                        flex: 1,
                        background: '#ff007722',
                        border: '1px solid #ff007755',
                        color: '#ff0077',
                        padding: '5px',
                        fontSize: '9px',
                        fontWeight: 800,
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      🔴 LOAD B
                    </button>
                    <button
                      onClick={() => handleAddTrackToPlaylist(station)}
                      style={{
                        flex: 1,
                        background: '#00ff8822',
                        border: '1px solid #00ff8855',
                        color: '#00ff88',
                        padding: '5px',
                        fontSize: '9px',
                        fontWeight: 800,
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      ➕ QUEUE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiStreamModal;
