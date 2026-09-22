import React, { useState } from 'react';
import youtubeService, { YOUTUBE_TRENDING_TRACKS } from '../services/youtubeService';
import audioEngine from '../audio/audioEngine';

const YouTubeModal = ({
  isOpen = false,
  onClose = () => {},
  onAddTrack = () => {},
  onLoadDeck = () => {},
}) => {
  const [activeTab, setActiveTab] = useState('link'); // 'link' | 'search'

  // Link Tab State
  const [linkInput, setLinkInput] = useState('');
  const [isParsingLink, setIsParsingLink] = useState(false);
  const [linkResult, setLinkResult] = useState(null);
  const [linkError, setLinkError] = useState('');

  // Search Tab State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(YOUTUBE_TRENDING_TRACKS);
  const [searchError, setSearchError] = useState('');

  // Loading state for loading to deck
  const [loadingTrackId, setLoadingTrackId] = useState(null);

  if (!isOpen) return null;

  // Handle Link Import
  const handleParseLink = async (urlToParse) => {
    const targetUrl = typeof urlToParse === 'string' ? urlToParse : linkInput;
    if (!targetUrl || !targetUrl.trim()) return;

    setIsParsingLink(true);
    setLinkError('');
    setLinkResult(null);

    try {
      const trackObj = await youtubeService.parseYouTubeLink(targetUrl);
      setLinkResult(trackObj);
    } catch (err) {
      setLinkError(err.message || 'Failed to import YouTube link.');
    } finally {
      setIsParsingLink(false);
    }
  };

  // 1-Click Preset Click
  const handlePresetClick = (preset) => {
    setLinkInput(preset.sourceUrl);
    setLinkResult(preset);
    setLinkError('');
  };

  // Load Track to Deck with Pre-Decoded Audio Buffer (mirrors SpotifyModal)
  const handleLoadDeck = async (deckId, track) => {
    setLoadingTrackId(`${track.id}-${deckId}`);
    try {
      await audioEngine.resumeContext();
      const audioBuffer = await youtubeService.loadTrackAudioBuffer(track);
      const readyTrack = { ...track, audioBuffer };
      onLoadDeck(deckId, readyTrack);
      onClose();
    } catch (err) {
      console.error('Error loading YouTube track to deck:', err);
    } finally {
      setLoadingTrackId(null);
    }
  };

  // Add Track to Playlist with Pre-Decoded Audio Buffer
  const handleAddToPlaylist = async (track) => {
    setLoadingTrackId(`${track.id}-queue`);
    try {
      await audioEngine.resumeContext();
      const audioBuffer = await youtubeService.loadTrackAudioBuffer(track);
      const readyTrack = { ...track, audioBuffer };
      onAddTrack(readyTrack);
      onClose();
    } catch (err) {
      console.error('Error queuing YouTube track:', err);
    } finally {
      setLoadingTrackId(null);
    }
  };

  // Handle Search
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');

    try {
      const results = await youtubeService.searchTracks(searchQuery, 10);
      if (!results || results.length === 0) {
        setSearchError('No matching YouTube tracks found. Try song or artist name.');
      } else {
        setSearchResults(results);
      }
    } catch (err) {
      setSearchError(err.message || 'Search request failed.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.88)',
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
          background: 'linear-gradient(180deg, #141722 0%, #0c0e17 100%)',
          border: '1px solid #2a151b',
          borderRadius: '16px',
          padding: '22px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.85), 0 0 40px rgba(255, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #291c24', paddingBottom: '14px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ff0000 0%, #b30000 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 0 16px rgba(255, 0, 0, 0.5)',
              }}
            >
              🔴
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', letterSpacing: '1px', margin: 0, fontFamily: 'Orbitron, sans-serif' }}>
                YOUTUBE MUSIC CONSOLE
              </h2>
              <p style={{ fontSize: '11px', color: '#a0aab8', margin: 0, marginTop: '2px' }}>
                Stream & Mix Any YouTube or YouTube Music Track on Deck A & Deck B
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#1d2230',
              border: 'none',
              borderRadius: '6px',
              color: '#8e9eaf',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              fontWeight: 900,
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('link')}
            style={{
              flex: 1,
              background: activeTab === 'link' ? 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)' : '#141824',
              color: '#fff',
              border: `1px solid ${activeTab === 'link' ? '#ff3333' : '#222c3d'}`,
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'link' ? '0 0 14px rgba(255, 0, 0, 0.4)' : 'none',
            }}
          >
            <span>🔗</span> PASTE YOUTUBE LINK
          </button>

          <button
            onClick={() => setActiveTab('search')}
            style={{
              flex: 1,
              background: activeTab === 'search' ? 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)' : '#141824',
              color: '#fff',
              border: `1px solid ${activeTab === 'search' ? '#ff3333' : '#222c3d'}`,
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'search' ? '0 0 14px rgba(255, 0, 0, 0.4)' : 'none',
            }}
          >
            <span>🔍</span> SEARCH YOUTUBE TRACKS
          </button>
        </div>

        {/* TAB 1: PASTE LINK */}
        {activeTab === 'link' && (
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            <form onSubmit={(e) => { e.preventDefault(); handleParseLink(); }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#9fb1c7' }}>
                PASTE YOUTUBE OR YOUTUBE MUSIC LINK:
              </label>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="https://music.youtube.com/watch?v=... or https://youtube.com/watch?v=... or youtu.be/..."
                  style={{
                    flex: 1,
                    background: '#0d111b',
                    border: '1px solid #2f2229',
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
                    background: 'linear-gradient(135deg, #ff0000 0%, #b30000 100%)',
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

              {/* 1-Click Instant Test Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px', background: '#120f16', padding: '8px 10px', borderRadius: '8px', border: '1px dashed #3f1e28' }}>
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#ff4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🔴</span> 1-CLICK POPULAR:
                </span>
                {YOUTUBE_TRENDING_TRACKS.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => handlePresetClick(track)}
                    style={{
                      background: linkResult?.id === track.id ? '#ff000033' : '#ff000014',
                      border: `1px solid ${linkResult?.id === track.id ? '#ff0000' : '#ff000033'}`,
                      color: '#ff8888',
                      fontSize: '10px',
                      fontWeight: 700,
                      borderRadius: '5px',
                      padding: '3px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    {track.title}
                  </button>
                ))}
              </div>
            </form>

            {linkError && (
              <div style={{ marginTop: '12px', padding: '10px', background: '#ff003318', border: '1px solid #ff003344', borderRadius: '6px', color: '#ff4d6d', fontSize: '11px' }}>
                ⚠️ {linkError}
              </div>
            )}

            {/* Parsed Track Card */}
            {linkResult && (
              <div
                style={{
                  marginTop: '16px',
                  background: 'linear-gradient(180deg, #1d151c 0%, #110e14 100%)',
                  border: '1.5px solid #ff3333',
                  borderRadius: '10px',
                  padding: '14px',
                  boxShadow: '0 0 24px rgba(255, 0, 0, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img
                    src={linkResult.thumbnail}
                    alt={linkResult.title}
                    style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #3d1f27' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px' }}>🔴</span>
                      <span style={{ fontSize: '9px', fontWeight: 900, color: '#ff4444', textTransform: 'uppercase' }}>
                        YouTube Music Ready
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {linkResult.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#a0aab8' }}>
                      {linkResult.artist}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#00ff88', fontWeight: 800 }}>
                        {linkResult.bpm} BPM
                      </span>
                      <span style={{ color: '#4a5970' }}>•</span>
                      <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#ff0077', fontWeight: 800 }}>
                        KEY: {linkResult.key}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #2d1822', paddingTop: '10px' }}>
                  <button
                    disabled={loadingTrackId !== null}
                    onClick={() => handleLoadDeck('A', linkResult)}
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
                    {loadingTrackId === `${linkResult.id}-A` ? 'LOADING...' : '🔵 LOAD DECK A'}
                  </button>
                  <button
                    disabled={loadingTrackId !== null}
                    onClick={() => handleLoadDeck('B', linkResult)}
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
                    {loadingTrackId === `${linkResult.id}-B` ? 'LOADING...' : '🔴 LOAD DECK B'}
                  </button>
                  <button
                    disabled={loadingTrackId !== null}
                    onClick={() => handleAddToPlaylist(linkResult)}
                    style={{
                      flex: 1,
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
                    {loadingTrackId === `${linkResult.id}-queue` ? 'QUEUING...' : '➕ ADD TO MIX'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SEARCH YOUTUBE */}
        {activeTab === 'search' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any YouTube Music song or artist (e.g. David Guetta, Avicii, Faded)..."
                style={{
                  flex: 1,
                  background: '#0d111b',
                  border: '1px solid #2f2229',
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
                  background: 'linear-gradient(135deg, #ff0000 0%, #b30000 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '11px',
                  fontWeight: 900,
                  padding: '0 18px',
                  cursor: 'pointer',
                }}
              >
                {isSearching ? 'SEARCHING...' : 'SEARCH'}
              </button>
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
                    background: '#131118',
                    border: '1px solid #291820',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {track.title}
                      </div>
                      <div style={{ fontSize: '10px', color: '#a0aab8' }}>
                        {track.artist}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ fontSize: '9px', color: '#ff4444', fontWeight: 800 }}>🔴 YOUTUBE</span>
                        <span style={{ color: '#444' }}>•</span>
                        <span style={{ fontSize: '9px', color: '#00ff88', fontFamily: 'monospace' }}>{track.bpm} BPM</span>
                        <span style={{ color: '#444' }}>•</span>
                        <span style={{ fontSize: '9px', color: '#ff0077', fontFamily: 'monospace' }}>{track.key}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      disabled={loadingTrackId !== null}
                      onClick={() => handleLoadDeck('A', track)}
                      style={{
                        background: '#00f0ff22',
                        border: '1px solid #00f0ff66',
                        color: '#00f0ff',
                        padding: '6px 8px',
                        fontSize: '10px',
                        fontWeight: 900,
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {loadingTrackId === `${track.id}-A` ? '...' : '🔵 LOAD A'}
                    </button>
                    <button
                      disabled={loadingTrackId !== null}
                      onClick={() => handleLoadDeck('B', track)}
                      style={{
                        background: '#ff007722',
                        border: '1px solid #ff007766',
                        color: '#ff0077',
                        padding: '6px 8px',
                        fontSize: '10px',
                        fontWeight: 900,
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {loadingTrackId === `${track.id}-B` ? '...' : '🔴 LOAD B'}
                    </button>
                    <button
                      disabled={loadingTrackId !== null}
                      onClick={() => handleAddToPlaylist(track)}
                      style={{
                        background: '#00ff8822',
                        border: '1px solid #00ff8866',
                        color: '#00ff88',
                        padding: '6px 8px',
                        fontSize: '10px',
                        fontWeight: 900,
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {loadingTrackId === `${track.id}-queue` ? '...' : '➕ QUEUE'}
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

export default YouTubeModal;
