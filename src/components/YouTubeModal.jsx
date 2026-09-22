import React, { useState, useMemo } from 'react';
import youtubeService, { YOUTUBE_TRENDING_TRACKS } from '../services/youtubeService';
import audioEngine from '../audio/audioEngine';

const CATEGORIES = [
  { id: 'all', label: '🔥 ALL HITS', icon: '🔥' },
  { id: 'edm', label: '⚡ EDM & FESTIVAL', icon: '⚡' },
  { id: 'house', label: '🏠 TECH HOUSE', icon: '🏠' },
  { id: 'latin', label: '🌴 LATIN & REGGAETON', icon: '🌴' },
  { id: 'hiphop', label: '🎤 HIP-HOP & TRAP', icon: '🎤' },
  { id: 'punjabi', label: '🥁 PUNJABI & BOLLYWOOD', icon: '🥁' },
  { id: 'pop', label: '👑 POP ANTHEMS', icon: '👑' },
  { id: 'techno', label: '🌌 TECHNO & TRANCE', icon: '🌌' },
];

const YouTubeModal = ({
  isOpen = false,
  onClose = () => {},
  onAddTrack = () => {},
  onLoadDeck = () => {},
}) => {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'link'
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState([]);
  const [searchError, setSearchError] = useState('');

  // Link Tab State
  const [linkInput, setLinkInput] = useState('');
  const [isParsingLink, setIsParsingLink] = useState(false);
  const [linkResult, setLinkResult] = useState(null);
  const [linkError, setLinkError] = useState('');

  // Loading indicator for async audio decoding
  const [loadingTrackId, setLoadingTrackId] = useState(null);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: YOUTUBE_TRENDING_TRACKS.length };
    YOUTUBE_TRENDING_TRACKS.forEach((t) => {
      const cat = t.category || 'edm';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, []);

  // Filtered tracks based on selected category and search query
  const displayedTracks = useMemo(() => {
    if (onlineResults.length > 0) {
      return onlineResults;
    }

    let list = YOUTUBE_TRENDING_TRACKS;
    if (selectedCategory !== 'all') {
      list = list.filter((t) => (t.category || '').toLowerCase() === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          (t.genre && t.genre.toLowerCase().includes(q)) ||
          (t.key && t.key.toLowerCase().includes(q)) ||
          (t.bpm && t.bpm.toString().includes(q))
      );
    }

    return list;
  }, [selectedCategory, searchQuery, onlineResults]);

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

  // Load Track to Deck with Pre-Decoded Audio Buffer
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
    } catch (err) {
      console.error('Error queuing YouTube track:', err);
    } finally {
      setLoadingTrackId(null);
    }
  };

  // Online Search Trigger
  const handleOnlineSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setOnlineResults([]);
      return;
    }

    setIsSearchingOnline(true);
    setSearchError('');

    try {
      const results = await youtubeService.searchTracks(searchQuery, 16);
      if (!results || results.length === 0) {
        setSearchError('No matching YouTube tracks found online. Showing curated results.');
        setOnlineResults([]);
      } else {
        setOnlineResults(results);
      }
    } catch (err) {
      setSearchError(err.message || 'Online search request failed.');
      setOnlineResults([]);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const handleClearOnlineSearch = () => {
    setSearchQuery('');
    setOnlineResults([]);
    setSearchError('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.90)',
        backdropFilter: 'blur(20px)',
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
          background: 'linear-gradient(180deg, #151824 0%, #0d0f18 100%)',
          border: '1px solid #3b1822',
          borderRadius: '16px',
          padding: '20px',
          maxWidth: '780px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 50px rgba(255, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #291c24',
            paddingBottom: '12px',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ff0000 0%, #b30000 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 0 20px rgba(255, 0, 0, 0.55)',
              }}
            >
              🔴
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  style={{
                    fontSize: '17px',
                    fontWeight: 900,
                    color: '#fff',
                    letterSpacing: '1px',
                    margin: 0,
                    fontFamily: 'Orbitron, sans-serif',
                  }}
                >
                  YOUTUBE MUSIC CONSOLE
                </h2>
                <span
                  style={{
                    background: 'rgba(255, 0, 0, 0.2)',
                    color: '#ff4444',
                    border: '1px solid rgba(255, 0, 0, 0.4)',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 900,
                    letterSpacing: '0.5px',
                  }}
                >
                  {YOUTUBE_TRENDING_TRACKS.length}+ CLUB HITS
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#9faec2', margin: 0, marginTop: '2px' }}>
                Instant 1-Click Mixing on Deck A & Deck B with BPM & Harmonic Key Match
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
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              fontWeight: 900,
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <button
            onClick={() => {
              setActiveTab('browse');
              setOnlineResults([]);
            }}
            style={{
              flex: 1.2,
              background: activeTab === 'browse' ? 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)' : '#141824',
              color: '#fff',
              border: `1px solid ${activeTab === 'browse' ? '#ff3333' : '#222c3d'}`,
              borderRadius: '8px',
              padding: '9px 14px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'browse' ? '0 0 16px rgba(255, 0, 0, 0.4)' : 'none',
            }}
          >
            <span>🔥</span> BROWSE 80+ CURATED TRACKS
          </button>

          <button
            onClick={() => setActiveTab('link')}
            style={{
              flex: 1,
              background: activeTab === 'link' ? 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)' : '#141824',
              color: '#fff',
              border: `1px solid ${activeTab === 'link' ? '#ff3333' : '#222c3d'}`,
              borderRadius: '8px',
              padding: '9px 14px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'link' ? '0 0 16px rgba(255, 0, 0, 0.4)' : 'none',
            }}
          >
            <span>🔗</span> PASTE YOUTUBE LINK
          </button>
        </div>

        {/* TAB 1: BROWSE & SEARCH */}
        {activeTab === 'browse' && (
          <div style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Search Input Bar */}
            <form onSubmit={handleOnlineSearch} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (onlineResults.length > 0) setOnlineResults([]);
                  }}
                  placeholder="Filter by song, artist, genre (e.g. Fisher, Diljit, Martin Garrix, 128 BPM)..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#0d111b',
                    border: '1px solid #2f2229',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '9px 34px 9px 12px',
                    fontSize: '12px',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearOnlineSearch}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#888',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSearchingOnline || !searchQuery.trim()}
                style={{
                  background: 'linear-gradient(135deg, #ff0000 0%, #b30000 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '11px',
                  fontWeight: 900,
                  padding: '0 16px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {isSearchingOnline ? 'SEARCHING...' : '🔍 SEARCH WEB'}
              </button>
            </form>

            {/* Category Filter Pills (When not viewing online search results) */}
            {onlineResults.length === 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  paddingBottom: '4px',
                  scrollbarWidth: 'none',
                }}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const count = categoryCounts[cat.id] || 0;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        background: isSelected ? 'linear-gradient(135deg, #ff000033 0%, #ff00001a 100%)' : '#10141f',
                        border: `1px solid ${isSelected ? '#ff3344' : '#232b3d'}`,
                        color: isSelected ? '#ffffff' : '#8e9eaf',
                        borderRadius: '20px',
                        padding: '4px 10px',
                        fontSize: '10px',
                        fontWeight: isSelected ? 900 : 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: isSelected ? '0 0 10px rgba(255, 0, 0, 0.3)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{cat.label}</span>
                      <span
                        style={{
                          fontSize: '9px',
                          background: isSelected ? '#ff3344' : '#1c2434',
                          color: isSelected ? '#fff' : '#738399',
                          borderRadius: '10px',
                          padding: '1px 5px',
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {searchError && (
              <div
                style={{
                  padding: '8px 12px',
                  background: '#ffaa0015',
                  border: '1px solid #ffaa0044',
                  borderRadius: '6px',
                  color: '#ffaa00',
                  fontSize: '11px',
                }}
              >
                ⚠️ {searchError}
              </div>
            )}

            {onlineResults.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#17121b',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #3d1c2a',
                }}
              >
                <span style={{ fontSize: '11px', color: '#ff7799', fontWeight: 700 }}>
                  Showing {onlineResults.length} online results for "{searchQuery}"
                </span>
                <button
                  onClick={handleClearOnlineSearch}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#00f0ff',
                    fontSize: '10px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Back to Curated 80+ Hits
                </button>
              </div>
            )}

            {/* Track Counter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' }}>
              <span style={{ fontSize: '10px', color: '#7e8ea3', fontWeight: 800 }}>
                READY TO MIX: <span style={{ color: '#00ff88' }}>{displayedTracks.length} TRACKS</span>
              </span>
              <span style={{ fontSize: '10px', color: '#7e8ea3' }}>
                All tracks include instant Web Audio decoding & stems
              </span>
            </div>

            {/* Results List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                paddingRight: '4px',
              }}
            >
              {displayedTracks.map((track) => (
                <div
                  key={track.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#12141c',
                    border: '1px solid #231c26',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        border: '1px solid #2e1d28',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#fff',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {track.title}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#a0aab8',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {track.artist}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            color: '#ff4444',
                            fontWeight: 900,
                            background: '#ff000018',
                            padding: '1px 5px',
                            borderRadius: '3px',
                          }}
                        >
                          🔴 {track.genre || 'Club Track'}
                        </span>
                        <span style={{ color: '#3d475a' }}>•</span>
                        <span
                          style={{
                            fontSize: '9px',
                            color: '#00ff88',
                            fontFamily: 'monospace',
                            fontWeight: 800,
                          }}
                        >
                          {track.bpm} BPM
                        </span>
                        <span style={{ color: '#3d475a' }}>•</span>
                        <span
                          style={{
                            fontSize: '9px',
                            color: '#ff0077',
                            fontFamily: 'monospace',
                            fontWeight: 800,
                          }}
                        >
                          {track.key}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3 Action Buttons */}
                  <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                    <button
                      disabled={loadingTrackId !== null}
                      onClick={() => handleLoadDeck('A', track)}
                      style={{
                        background: loadingTrackId === `${track.id}-A` ? '#00f0ff44' : '#00f0ff1a',
                        border: '1px solid #00f0ff',
                        color: '#00f0ff',
                        padding: '6px 9px',
                        fontSize: '10px',
                        fontWeight: 900,
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontFamily: 'Orbitron, sans-serif',
                      }}
                    >
                      {loadingTrackId === `${track.id}-A` ? 'LOADING...' : '🔵 DECK A'}
                    </button>
                    <button
                      disabled={loadingTrackId !== null}
                      onClick={() => handleLoadDeck('B', track)}
                      style={{
                        background: loadingTrackId === `${track.id}-B` ? '#ff007744' : '#ff00771a',
                        border: '1px solid #ff0077',
                        color: '#ff0077',
                        padding: '6px 9px',
                        fontSize: '10px',
                        fontWeight: 900,
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontFamily: 'Orbitron, sans-serif',
                      }}
                    >
                      {loadingTrackId === `${track.id}-B` ? 'LOADING...' : '🔴 DECK B'}
                    </button>
                    <button
                      disabled={loadingTrackId !== null}
                      onClick={() => handleAddToPlaylist(track)}
                      style={{
                        background: loadingTrackId === `${track.id}-queue` ? '#00ff8844' : '#00ff881a',
                        border: '1px solid #00ff88',
                        color: '#00ff88',
                        padding: '6px 9px',
                        fontSize: '10px',
                        fontWeight: 900,
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontFamily: 'Orbitron, sans-serif',
                      }}
                    >
                      {loadingTrackId === `${track.id}-queue` ? 'QUEUING...' : '➕ QUEUE'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PASTE YOUTUBE LINK */}
        {activeTab === 'link' && (
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleParseLink();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#9fb1c7' }}>
                PASTE ANY YOUTUBE OR YOUTUBE MUSIC LINK:
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

              {/* 1-Click Instant Test Chips */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                  marginTop: '4px',
                  background: '#120f16',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px dashed #3f1e28',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 900,
                    color: '#ff4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>🔴</span> 1-CLICK POPULAR EXAMPLES:
                </span>
                {YOUTUBE_TRENDING_TRACKS.slice(0, 8).map((track) => (
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
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px',
                  background: '#ff003318',
                  border: '1px solid #ff003344',
                  borderRadius: '6px',
                  color: '#ff4d6d',
                  fontSize: '11px',
                }}
              >
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
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '1px solid #3d1f27',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px' }}>🔴</span>
                      <span style={{ fontSize: '9px', fontWeight: 900, color: '#ff4444', textTransform: 'uppercase' }}>
                        YouTube Music Ready
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 900,
                        color: '#fff',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {linkResult.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#a0aab8' }}>{linkResult.artist}</div>
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
      </div>
    </div>
  );
};

export default YouTubeModal;
