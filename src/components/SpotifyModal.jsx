import React, { useState, useEffect } from 'react';
import spotifyService from '../services/spotifyService';

const SpotifyModal = ({
  isOpen = false,
  onClose = () => {},
  onAddTrack = () => {},
  onLoadDeck = () => {},
}) => {
  const [activeTab, setActiveTab] = useState('link'); // 'link' | 'search' | 'settings'

  // Link import state
  const [linkInput, setLinkInput] = useState('');
  const [isFetchingLink, setIsFetchingLink] = useState(false);
  const [linkResult, setLinkResult] = useState(null);
  const [linkError, setLinkError] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');

  // Settings state
  const [clientId, setClientId] = useState(spotifyService.clientId);
  const [clientSecret, setClientSecret] = useState(spotifyService.clientSecret);
  const [savedSettingsMsg, setSavedSettingsMsg] = useState('');

  // Pre-populate popular EDM/House sample tracks for instant searching if credentials exist
  const popularDJSongs = [
    'Titanium David Guetta',
    'One More Time Daft Punk',
    'Levels Avicii',
    'Animals Martin Garrix',
    'Clarity Zedd',
  ];

  if (!isOpen) return null;

  // Handle Link Import
  const handleImportLink = async (e) => {
    e.preventDefault();
    if (!linkInput.trim()) return;

    setIsFetchingLink(true);
    setLinkError('');
    setLinkResult(null);

    try {
      const parsed = spotifyService.parseSpotifyUrl(linkInput);
      if (!parsed) {
        throw new Error('Please enter a valid Spotify track, album, or playlist link (e.g., https://open.spotify.com/track/...)');
      }

      const meta = await spotifyService.fetchOembedMetadata(parsed.url);

      const trackObj = {
        id: `spotify-${parsed.id || Date.now()}`,
        spotifyId: parsed.id,
        title: meta.title,
        artist: meta.artist,
        genre: 'Spotify Stream',
        thumbnail: meta.thumbnail,
        duration: 180, // estimated 3 minutes if not provided by oEmbed
        bpm: 126, // default dance tempo for oEmbed import
        key: '8A / Am',
        spotifyUrl: parsed.url,
        isSpotify: true,
      };

      setLinkResult(trackObj);
    } catch (err) {
      setLinkError(err.message || 'Failed to import Spotify link.');
    } finally {
      setIsFetchingLink(false);
    }
  };

  // Add Link Track to DJ Playlist
  const handleConfirmAddLinkTrack = async () => {
    if (!linkResult) return;
    // Generate audio buffer so it's ready to mix
    const audioBuffer = await spotifyService.loadTrackAudioBuffer(linkResult);
    const readyTrack = { ...linkResult, audioBuffer };
    onAddTrack(readyTrack);
    setLinkResult(null);
    setLinkInput('');
    onClose();
  };

  // Handle Search
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const results = await spotifyService.searchTracks(searchQuery, 8);
      setSearchResults(results);
    } catch (err) {
      setSearchError(err.message || 'Spotify search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  // Add Searched Track to Playlist
  const handleAddSearchResult = async (track) => {
    const audioBuffer = await spotifyService.loadTrackAudioBuffer(track);
    const readyTrack = { ...track, audioBuffer };
    onAddTrack(readyTrack);
  };

  // Direct load to Deck from Search
  const handleLoadDeckResult = async (deckId, track) => {
    const audioBuffer = await spotifyService.loadTrackAudioBuffer(track);
    const readyTrack = { ...track, audioBuffer };
    onLoadDeck(deckId, readyTrack);
    onClose();
  };

  // Save Settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    spotifyService.setCredentials(clientId, clientSecret);
    setSavedSettingsMsg('Credentials saved! You can now search Spotify directly.');
    setTimeout(() => setSavedSettingsMsg(''), 3000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 10, 0.85)',
        backdropFilter: 'blur(8px)',
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
          width: '100%',
          maxWidth: '680px',
          background: 'linear-gradient(180deg, #141822 0%, #0d1017 100%)',
          borderRadius: '12px',
          border: '1px solid #1db954',
          boxShadow: '0 0 35px rgba(29, 185, 84, 0.25), 0 8px 30px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderBottom: '1px solid #1f2738',
            background: 'linear-gradient(90deg, #121620 0%, #0e1518 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🟢</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontFamily: 'Orbitron, sans-serif', color: '#1db954', letterSpacing: '1px' }}>
                SPOTIFY INTEGRATION
              </h2>
              <p style={{ margin: 0, fontSize: '11px', color: '#7a8799' }}>
                Import tracks, BPM & Key, and mix Spotify music
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8e9bb0',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', background: '#0e1118', borderBottom: '1px solid #1c2230' }}>
          {[
            { id: 'link', label: '🔗 Paste Spotify Link', badge: 'Zero-Config' },
            { id: 'search', label: '🔍 Search Spotify', badge: 'BPM & Key' },
            { id: 'settings', label: '⚙️ API Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: activeTab === tab.id ? '#171c28' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #1db954' : '2px solid transparent',
                color: activeTab === tab.id ? '#ffffff' : '#7b879b',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {tab.label}
              {tab.badge && (
                <span style={{ fontSize: '9px', background: '#1db95422', color: '#1db954', padding: '1px 5px', borderRadius: '4px' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Modal Content */}
        <div style={{ padding: '18px', overflowY: 'auto', flex: 1 }}>

          {/* TAB 1: PASTE LINK */}
          {activeTab === 'link' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: '#a0acbd', lineHeight: '1.5' }}>
                Paste any song link directly from the Spotify desktop app or web player.
                No developer setup required!
              </div>

              <form onSubmit={handleImportLink} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: '#0a0d13',
                    border: '1px solid #283348',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    color: '#e0e6ed',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={isFetchingLink}
                  style={{
                    background: 'linear-gradient(135deg, #1db954 0%, #158b3e 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#000',
                    fontFamily: 'Orbitron, sans-serif',
                    fontWeight: 900,
                    fontSize: '12px',
                    padding: '0 18px',
                    cursor: 'pointer',
                    boxShadow: '0 0 12px rgba(29, 185, 84, 0.3)',
                  }}
                >
                  {isFetchingLink ? 'FETCHING...' : 'FETCH'}
                </button>
              </form>

              {linkError && (
                <div style={{ background: '#36151c', border: '1px solid #ff3366', color: '#ff6688', padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
                  {linkError}
                </div>
              )}

              {/* Link Preview Card */}
              {linkResult && (
                <div
                  style={{
                    background: '#0d111a',
                    border: '1px solid #1db954',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    boxShadow: '0 0 15px rgba(29, 185, 84, 0.15)',
                  }}
                >
                  {linkResult.thumbnail ? (
                    <img
                      src={linkResult.thumbnail}
                      alt={linkResult.title}
                      style={{ width: '64px', height: '64px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '6px', background: '#1c2230', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                      🎵
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#f0f4f8' }}>
                      {linkResult.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#1db954', marginTop: '2px' }}>
                      {linkResult.artist}
                    </div>
                    <div style={{ fontSize: '11px', color: '#7a8799', marginTop: '4px' }}>
                      ⚡ Ready to mix on Deck A or Deck B with EQ and Auto-DJ!
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmAddLinkTrack}
                    style={{
                      background: 'linear-gradient(135deg, #1db954 0%, #17853d 100%)',
                      border: 'none',
                      color: '#000',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontWeight: 900,
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    + ADD TO MIX
                  </button>
                </div>
              )}

              {/* Sample Spotify Track Links */}
              <div style={{ marginTop: '8px', borderTop: '1px solid #1a202d', paddingTop: '10px' }}>
                <div style={{ fontSize: '11px', color: '#6d7b8f', marginBottom: '6px' }}>Try one of these sample Spotify links:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    { name: 'Avicii - Levels', url: 'https://open.spotify.com/track/5UqCQaDAbikUsLMr4AhkcQ' },
                    { name: 'Daft Punk - One More Time', url: 'https://open.spotify.com/track/0DiWol3AO6WpXZgp0goxAV' },
                    { name: 'Martin Garrix - Animals', url: 'https://open.spotify.com/track/622hA0uE9PspT0mD1PFFhW' },
                  ].map((sample) => (
                    <button
                      key={sample.name}
                      type="button"
                      onClick={() => setLinkInput(sample.url)}
                      style={{
                        background: '#161b26',
                        border: '1px solid #283244',
                        color: '#9aa7b8',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      {sample.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SEARCH SPOTIFY */}
          {activeTab === 'search' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {!spotifyService.hasCredentials() && (
                <div style={{ background: '#1c2115', border: '1px solid #b38600', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: '#ffcc00', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>To enable live Spotify catalog search with BPM & Key features, add your free Spotify Developer keys.</span>
                  <button
                    onClick={() => setActiveTab('settings')}
                    style={{ background: '#ffcc00', border: 'none', color: '#000', padding: '4px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}
                  >
                    Setup in 1 Min
                  </button>
                </div>
              )}

              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Search tracks, DJs, artists (e.g. David Guetta, Calvin Harris)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: '#0a0d13',
                    border: '1px solid #283348',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    color: '#e0e6ed',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  style={{
                    background: 'linear-gradient(135deg, #1db954 0%, #158b3e 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#000',
                    fontFamily: 'Orbitron, sans-serif',
                    fontWeight: 900,
                    fontSize: '12px',
                    padding: '0 18px',
                    cursor: 'pointer',
                  }}
                >
                  {isSearching ? 'SEARCHING...' : 'SEARCH'}
                </button>
              </form>

              {searchError && (
                <div style={{ background: '#36151c', border: '1px solid #ff3366', color: '#ff6688', padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
                  {searchError}
                </div>
              )}

              {/* Search Results List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                {searchResults.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      background: '#0f121a',
                      border: '1px solid #1f2533',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    {t.thumbnail ? (
                      <img src={t.thumbnail} alt={t.title} style={{ width: '44px', height: '44px', borderRadius: '4px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '44px', height: '44px', borderRadius: '4px', background: '#191e2b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        🎵
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0f4f8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#1db954' }}>
                        {t.artist}
                      </div>
                    </div>

                    {/* BPM & Key badges */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, background: '#00ff8822', color: '#00ff88', padding: '2px 6px', borderRadius: '4px', border: '1px solid #00ff8844' }}>
                        {t.bpm} BPM
                      </span>
                      <span style={{ fontSize: '10px', fontFamily: 'monospace', background: '#ffcc0022', color: '#ffcc00', padding: '2px 6px', borderRadius: '4px', border: '1px solid #ffcc0044' }}>
                        {t.key}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => handleAddSearchResult(t)}
                        style={{
                          background: '#1a2233',
                          border: '1px solid #364460',
                          color: '#e0e6ed',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                        }}
                        title="Add to library playlist"
                      >
                        + Playlist
                      </button>
                      <button
                        onClick={() => handleLoadDeckResult('A', t)}
                        style={{
                          background: '#122533',
                          border: '1px solid #00f0ff',
                          color: '#00f0ff',
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                        }}
                      >
                        DECK A
                      </button>
                      <button
                        onClick={() => handleLoadDeckResult('B', t)}
                        style={{
                          background: '#331222',
                          border: '1px solid #ff0077',
                          color: '#ff0077',
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                        }}
                      >
                        DECK B
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: '#9daab8', lineHeight: '1.5' }}>
                Entering your free Spotify Developer credentials unlocks direct track search and automatic BPM/Key detection via Spotify Web API.
              </div>

              <div style={{ background: '#0a0d13', border: '1px solid #1f2738', padding: '12px', borderRadius: '6px', fontSize: '11px', color: '#8a97a8' }}>
                <div style={{ fontWeight: 700, color: '#f0f4f8', marginBottom: '4px' }}>How to get free Spotify keys:</div>
                <ol style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <li>Go to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" style={{ color: '#1db954' }}>developer.spotify.com/dashboard</a> and log in with your free or premium Spotify account.</li>
                  <li>Click <strong>Create App</strong> (App name: DJ Mixer, Redirect URI: <code>http://localhost:5173/</code>).</li>
                  <li>Go to <strong>Settings</strong> to copy your <strong>Client ID</strong> and <strong>Client Secret</strong>.</li>
                </ol>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#7a8799', display: 'block', marginBottom: '4px' }}>
                  SPOTIFY CLIENT ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4cOdK2wGLETKBW3Pvg..."
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0a0d13',
                    border: '1px solid #283348',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#e0e6ed',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#7a8799', display: 'block', marginBottom: '4px' }}>
                  SPOTIFY CLIENT SECRET
                </label>
                <input
                  type="password"
                  placeholder="e.g. 9bF39kd18..."
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0a0d13',
                    border: '1px solid #283348',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#e0e6ed',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              {savedSettingsMsg && (
                <div style={{ background: '#12251a', border: '1px solid #00ff88', color: '#00ff88', padding: '8px 12px', borderRadius: '4px', fontSize: '12px' }}>
                  {savedSettingsMsg}
                </div>
              )}

              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #1db954 0%, #158b3e 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#000',
                  fontFamily: 'Orbitron, sans-serif',
                  fontWeight: 900,
                  fontSize: '12px',
                  padding: '10px 18px',
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                }}
              >
                SAVE SPOTIFY CREDENTIALS
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default SpotifyModal;
