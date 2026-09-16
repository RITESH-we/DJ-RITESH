import React, { useState, useEffect } from 'react';
import spotifyService from '../services/spotifyService';

const SpotifyAccountBrowser = ({
  isOpen = false,
  onClose = () => {},
  onLoadPlaylist = () => {},
  onLoadDeck = () => {},
}) => {
  const [profile, setProfile] = useState(spotifyService.userProfile);
  const [activeTab, setActiveTab] = useState('playlists'); // 'playlists' | 'top' | 'liked' | 'search'
  const [playlists, setPlaylists] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [likedTracks, setLikedTracks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activePlaylistTracks, setActivePlaylistTracks] = useState([]);
  const [selectedPlaylistName, setSelectedPlaylistName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading Spotify data...');
  const [notification, setNotification] = useState('');
  const [clientIdInput, setClientIdInput] = useState(spotifyService.clientId);
  const [showOAuthLogin, setShowOAuthLogin] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProfile(spotifyService.userProfile);
      if (spotifyService.isConnected()) {
        loadPlaylists();
      }
    }
  }, [isOpen]);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification('');
    }, 3500);
  };

  const loadPlaylists = async () => {
    setIsLoading(true);
    setLoadingText('Fetching your Spotify playlists...');
    try {
      const list = await spotifyService.getUserPlaylists();
      setPlaylists(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTopTracks = async () => {
    setIsLoading(true);
    setLoadingText('Fetching your personal Top Tracks from Spotify...');
    try {
      const tracks = await spotifyService.getUserTopTracks();
      setTopTracks(tracks);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLikedSongs = async () => {
    setIsLoading(true);
    setLoadingText('Fetching your Liked Songs from Spotify...');
    try {
      const tracks = await spotifyService.getUserLikedTracks();
      setLikedTracks(tracks);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setLoadingText(`Searching Spotify for "${searchQuery}"...`);
    try {
      const results = await spotifyService.searchTracks(searchQuery, 20);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectDemo = () => {
    const prof = spotifyService.connectDemoAccount();
    setProfile(prof);
    loadPlaylists();
  };

  const handleOAuthLogin = async (e) => {
    e.preventDefault();
    if (!clientIdInput.trim()) return;
    try {
      await spotifyService.startOAuthPKCELogin(clientIdInput);
    } catch (err) {
      alert(err.message || 'OAuth error');
    }
  };

  const handleDisconnect = () => {
    spotifyService.disconnectAccount();
    setProfile(null);
    setPlaylists([]);
    setActivePlaylistTracks([]);
    setTopTracks([]);
    setLikedTracks([]);
    setSearchResults([]);
  };

  const handleSelectPlaylist = async (pl) => {
    setIsLoading(true);
    setSelectedPlaylistName(pl.name);
    setLoadingText(`Loading tracks for "${pl.name}"...`);
    try {
      const tracks = await spotifyService.getPlaylistTracks(pl.id, pl.name);
      setActivePlaylistTracks(tracks);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Load entire playlist into DJ Mixer
  const handleLoadEntirePlaylist = async (pl) => {
    setIsLoading(true);
    setLoadingText(`Loading "${pl.name}" into DJ Mixer...`);
    try {
      const rawTracks = await spotifyService.getPlaylistTracks(pl.id, pl.name);
      if (rawTracks && rawTracks.length > 0) {
        onLoadPlaylist(rawTracks);
        showToast(`✅ Loaded ${rawTracks.length} tracks from "${pl.name}" into DJ Mixer! Deck A & B ready.`);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        alert('Could not retrieve tracks for this playlist.');
      }
    } catch (e) {
      console.error(e);
      alert('Error loading playlist: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTrackBatch = (tracks, name) => {
    if (!tracks || !tracks.length) return;
    onLoadPlaylist(tracks);
    showToast(`✅ Loaded ${tracks.length} tracks from ${name} into DJ Mixer! Deck A & B ready.`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleLoadSingleTrack = (deckId, track) => {
    onLoadDeck(deckId, track);
    showToast(`⚡ Loaded "${track.title}" into Deck ${deckId}!`);
  };

  if (!isOpen) return null;

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
          maxWidth: '880px',
          background: 'linear-gradient(180deg, #131722 0%, #0c0f16 100%)',
          borderRadius: '14px',
          border: '1px solid #1db954',
          boxShadow: '0 0 40px rgba(29, 185, 84, 0.25), 0 8px 32px rgba(0,0,0,0.85)',
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
            padding: '14px 22px',
            borderBottom: '1px solid #232938',
            background: 'linear-gradient(90deg, #121820 0%, #0d1e15 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🎧</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontFamily: 'Orbitron, sans-serif', color: '#1db954', letterSpacing: '1px' }}>
                SPOTIFY ACCOUNT & PLAYLIST BROWSER
              </h2>
              <p style={{ margin: 0, fontSize: '11px', color: '#8b97a8' }}>
                Load real Spotify playlists, top tracks & search songs directly into DJ Decks
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

        {/* Profile Status Banner */}
        <div style={{ background: '#0e121a', padding: '10px 20px', borderBottom: '1px solid #1c2330', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {profile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {profile.images?.[0]?.url ? (
                <img src={profile.images[0].url} alt={profile.display_name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #1db954' }} />
              ) : (
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1db954', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#000' }}>
                  {profile.display_name?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, color: '#f0f4f8', fontSize: '13px' }}>{profile.display_name}</span>
                  <span style={{ fontSize: '9px', background: '#1db95422', color: '#1db954', border: '1px solid #1db95444', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                    SPOTIFY {profile.product?.toUpperCase() || 'PREMIUM'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#7a8799' }}>
                  {profile.email || 'Connected'} • Country: {profile.country || 'Global'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#9eaab8' }}>
              No Spotify account connected yet.
            </div>
          )}

          <div>
            {profile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {spotifyService.isDemoConnected && (
                  <button
                    onClick={() => {
                      handleDisconnect();
                      setShowOAuthLogin(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #1db954 0%, #158b3e 100%)',
                      border: 'none',
                      color: '#000',
                      fontWeight: 900,
                      padding: '6px 14px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      boxShadow: '0 0 10px rgba(29, 185, 84, 0.4)',
                    }}
                  >
                    🟢 Connect Real Spotify Account
                  </button>
                )}
                <button
                  onClick={handleDisconnect}
                  style={{
                    background: 'transparent',
                    border: '1px solid #3d4a60',
                    color: '#8b97a8',
                    padding: '5px 12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleConnectDemo}
                  style={{
                    background: 'linear-gradient(135deg, #1db954 0%, #158b3e 100%)',
                    border: 'none',
                    color: '#000',
                    fontWeight: 900,
                    padding: '7px 14px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    boxShadow: '0 0 12px rgba(29, 185, 84, 0.3)',
                  }}
                >
                  ⚡ Instant Demo Connect
                </button>
                <button
                  onClick={() => setShowOAuthLogin(!showOAuthLogin)}
                  style={{
                    background: '#1a2233',
                    border: '1px solid #364460',
                    color: '#e0e6ed',
                    padding: '7px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Log In with PKCE
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div style={{ background: '#10331b', color: '#00ff88', borderBottom: '1px solid #1db954', padding: '9px 20px', fontSize: '12px', fontWeight: 800, textAlign: 'center', letterSpacing: '0.5px', animation: 'fadeIn 0.2s ease-in-out' }}>
            {notification}
          </div>
        )}

        {/* Tab Navigation Bar */}
        {profile && (
          <div style={{ display: 'flex', gap: '8px', padding: '10px 20px', background: '#0b0f17', borderBottom: '1px solid #1e2535' }}>
            <button
              onClick={() => {
                setActiveTab('playlists');
                setActivePlaylistTracks([]);
                if (!playlists.length) loadPlaylists();
              }}
              style={{
                background: activeTab === 'playlists' ? '#1db954' : '#141a26',
                color: activeTab === 'playlists' ? '#000' : '#8e9cb2',
                border: 'none',
                fontWeight: 800,
                fontSize: '11px',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              📁 Playlists ({playlists.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('top');
                setActivePlaylistTracks([]);
                if (!topTracks.length) loadTopTracks();
              }}
              style={{
                background: activeTab === 'top' ? '#1db954' : '#141a26',
                color: activeTab === 'top' ? '#000' : '#8e9cb2',
                border: 'none',
                fontWeight: 800,
                fontSize: '11px',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              🔥 Top Tracks
            </button>
            <button
              onClick={() => {
                setActiveTab('liked');
                setActivePlaylistTracks([]);
                if (!likedTracks.length) loadLikedSongs();
              }}
              style={{
                background: activeTab === 'liked' ? '#1db954' : '#141a26',
                color: activeTab === 'liked' ? '#000' : '#8e9cb2',
                border: 'none',
                fontWeight: 800,
                fontSize: '11px',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              ❤️ Liked Songs
            </button>
            <button
              onClick={() => {
                setActiveTab('search');
                setActivePlaylistTracks([]);
              }}
              style={{
                background: activeTab === 'search' ? '#1db954' : '#141a26',
                color: activeTab === 'search' ? '#000' : '#8e9cb2',
                border: 'none',
                fontWeight: 800,
                fontSize: '11px',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              🔍 Search Spotify Catalog
            </button>
          </div>
        )}

        {/* Content Area */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#1db954', fontSize: '13px', fontWeight: 700 }}>
              ⚡ {loadingText}
            </div>
          )}

          {/* TAB 1: PLAYLISTS GRID */}
          {profile && activeTab === 'playlists' && !activePlaylistTracks.length && !isLoading && (
            <div>
              {spotifyService.isDemoConnected && (
                <div style={{ background: '#1c2214', border: '1px solid #7a6200', color: '#ffcc00', padding: '10px 14px', borderRadius: '6px', fontSize: '11px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>⚠️ You are currently in <strong>Demo Mode</strong>. To load your personal Spotify playlists, click <strong>Connect Real Spotify Account</strong> above.</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#9aa7b8', letterSpacing: '0.5px' }}>
                  YOUR SPOTIFY PLAYLISTS ({playlists.length})
                </div>
                <button
                  onClick={loadPlaylists}
                  style={{ background: '#141a26', border: '1px solid #2b3548', color: '#8e9cb2', fontSize: '10px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  🔄 Refresh Playlists
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                {playlists.map((pl) => {
                  const trackCount = pl.trackCount || pl.tracks?.total || pl.items?.total || 'Available';
                  return (
                    <div
                      key={pl.id}
                      style={{
                        background: '#0f131c',
                        border: '1px solid #1f2738',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.15s, border-color 0.15s',
                      }}
                    >
                      {pl.images?.[0]?.url ? (
                        <img src={pl.images[0].url} alt={pl.name} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '120px', background: 'linear-gradient(135deg, #18221b 0%, #0e161c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                          🎵
                        </div>
                      )}
                      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#f0f4f8', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={pl.name}>
                            {pl.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#1db954', fontWeight: 700, marginBottom: '10px' }}>
                            {trackCount} Tracks • {pl.owner?.display_name || 'Spotify'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleSelectPlaylist(pl)}
                            style={{
                              flex: 1,
                              background: '#161b26',
                              border: '1px solid #2b3548',
                              color: '#e0e6ed',
                              padding: '7px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            👁️ View Tracks
                          </button>
                          <button
                            onClick={() => handleLoadEntirePlaylist(pl)}
                            style={{
                              flex: 1.4,
                              background: 'linear-gradient(135deg, #1db954 0%, #158b3e 100%)',
                              border: 'none',
                              color: '#000',
                              padding: '7px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 900,
                              cursor: 'pointer',
                            }}
                            title="Load all tracks into DJ Mixer & Auto-DJ"
                          >
                            🎧 Load to Mixer
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ACTIVE PLAYLIST DETAIL VIEW */}
          {activePlaylistTracks.length > 0 && !isLoading && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', background: '#0e121a', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1d2535' }}>
                <button
                  onClick={() => setActivePlaylistTracks([])}
                  style={{
                    background: '#161b26',
                    border: '1px solid #2b3548',
                    color: '#8e9bb0',
                    padding: '5px 12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ◀ Back to Playlists
                </button>

                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1db954' }}>
                  {selectedPlaylistName} ({activePlaylistTracks.length} Tracks)
                </div>

                <button
                  onClick={() => handleLoadTrackBatch(activePlaylistTracks, `"${selectedPlaylistName}"`)}
                  style={{
                    background: 'linear-gradient(135deg, #1db954 0%, #158b3e 100%)',
                    border: 'none',
                    color: '#000',
                    fontWeight: 900,
                    fontSize: '11px',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  🎧 LOAD ALL TO MIXER
                </button>
              </div>

              {renderTrackList(activePlaylistTracks)}
            </div>
          )}

          {/* TAB 2: TOP TRACKS */}
          {profile && activeTab === 'top' && !isLoading && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#9aa7b8' }}>
                  YOUR TOP SPOTIFY TRACKS ({topTracks.length})
                </div>
                {topTracks.length > 0 && (
                  <button
                    onClick={() => handleLoadTrackBatch(topTracks, 'Top Tracks')}
                    style={{ background: '#1db954', border: 'none', color: '#000', fontWeight: 900, fontSize: '11px', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    🎧 LOAD ALL TO MIXER
                  </button>
                )}
              </div>
              {topTracks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#7a8799' }}>
                  No top tracks found or loading... <button onClick={loadTopTracks} style={{ color: '#1db954', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Click to refresh</button>
                </div>
              ) : (
                renderTrackList(topTracks)
              )}
            </div>
          )}

          {/* TAB 3: LIKED SONGS */}
          {profile && activeTab === 'liked' && !isLoading && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#9aa7b8' }}>
                  YOUR LIKED SPOTIFY SONGS ({likedTracks.length})
                </div>
                {likedTracks.length > 0 && (
                  <button
                    onClick={() => handleLoadTrackBatch(likedTracks, 'Liked Songs')}
                    style={{ background: '#1db954', border: 'none', color: '#000', fontWeight: 900, fontSize: '11px', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    🎧 LOAD ALL TO MIXER
                  </button>
                )}
              </div>
              {likedTracks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#7a8799' }}>
                  No liked songs found. <button onClick={loadLikedSongs} style={{ color: '#1db954', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Click to refresh</button>
                </div>
              ) : (
                renderTrackList(likedTracks)
              )}
            </div>
          )}

          {/* TAB 4: SEARCH CATALOG */}
          {profile && activeTab === 'search' && (
            <div>
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="Search any song, artist, or album on Spotify..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1, background: '#10141e', border: '1px solid #232d3f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px', outline: 'none' }}
                />
                <button
                  type="submit"
                  style={{ background: '#1db954', border: 'none', color: '#000', fontWeight: 900, padding: '0 18px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                >
                  🔍 Search
                </button>
              </form>

              {searchResults.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#8e9bb0' }}>Found {searchResults.length} Spotify tracks:</span>
                    <button
                      onClick={() => handleLoadTrackBatch(searchResults, `"${searchQuery}" search`)}
                      style={{ background: '#1db954', border: 'none', color: '#000', fontWeight: 900, fontSize: '11px', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      🎧 LOAD ALL TO MIXER
                    </button>
                  </div>
                  {renderTrackList(searchResults)}
                </div>
              )}
            </div>
          )}

          {/* NOT CONNECTED STATE */}
          {!profile && !isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px', margin: '0 auto', padding: '10px 0' }}>
              <div
                style={{
                  background: 'linear-gradient(180deg, #111a14 0%, #0c120e 100%)',
                  border: '2px solid #1db954',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 0 25px rgba(29, 185, 84, 0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px' }}>🟢</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#1db954', fontFamily: 'Orbitron, sans-serif' }}>
                      CONNECT SPOTIFY PREMIUM ACCOUNT
                    </h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#8b97a8' }}>
                      Browse your real personal playlists, liked songs & stream in the DJ Mixer
                    </p>
                  </div>
                </div>

                <div style={{ background: '#090d0b', padding: '14px', borderRadius: '8px', border: '1px solid #1a291f', margin: '12px 0', fontSize: '12px', color: '#c0cdd8', lineHeight: '1.6' }}>
                  <div style={{ fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
                    Quick 1-Minute Connection Setup:
                  </div>
                  <ol style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>
                      Go to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" style={{ color: '#1db954', fontWeight: 700, textDecoration: 'underline' }}>developer.spotify.com/dashboard</a> and log in.
                    </li>
                    <li>
                      Click <strong>Create App</strong>:
                      <div style={{ fontSize: '11px', color: '#8e9da8', marginTop: '2px' }}>
                        • App Name: <code>DJ Mixer</code><br />
                        • Redirect URI: <strong style={{ color: '#1db954' }}>http://127.0.0.1:5173/</strong>{' '}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('http://127.0.0.1:5173/');
                            alert('Copied Redirect URI: http://127.0.0.1:5173/');
                          }}
                          style={{
                            background: '#1a2b20',
                            border: '1px solid #1db954',
                            color: '#1db954',
                            padding: '1px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            cursor: 'pointer',
                          }}
                        >
                          📋 Copy URI
                        </button>
                      </div>
                    </li>
                    <li>
                      In app <strong>Settings</strong>, copy your <strong>Client ID</strong> and paste below:
                    </li>
                  </ol>
                </div>

                <form onSubmit={handleOAuthLogin} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <input
                    type="text"
                    required
                    placeholder="Paste your Spotify Client ID here..."
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    style={{
                      flex: 1,
                      background: '#090d0b',
                      border: '1px solid #283a2e',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
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
                      padding: '0 20px',
                      cursor: 'pointer',
                      boxShadow: '0 0 15px rgba(29, 185, 84, 0.4)',
                    }}
                  >
                    🟢 LOG IN WITH SPOTIFY
                  </button>
                </form>
              </div>

              <div style={{ textAlign: 'center', background: '#0e121a', border: '1px solid #202736', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '12px', color: '#8a97a8', marginBottom: '8px' }}>
                  Want to try without creating a Spotify Developer app? Connect instant demo mode:
                </div>
                <button
                  type="button"
                  onClick={handleConnectDemo}
                  style={{
                    background: '#192233',
                    border: '1px solid #364663',
                    color: '#a0b4d4',
                    fontWeight: 700,
                    fontSize: '11px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Instant Demo Connect
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function renderTrackList(tracks) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
        {tracks.map((t, idx) => (
          <div
            key={t.id || idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#0f121a',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #1c2230',
            }}
          >
            <span style={{ color: '#687588', width: '22px', fontWeight: 700, fontSize: '11px' }}>{idx + 1}</span>
            {t.thumbnail && (
              <img src={t.thumbnail} alt={t.title} style={{ width: '38px', height: '38px', borderRadius: '4px', objectFit: 'cover' }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#f0f4f8', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.title}>
                {t.title}
              </div>
              <div style={{ fontSize: '11px', color: '#1db954', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.artist}
              </div>
            </div>
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: '#00ff88', fontSize: '12px' }}>
              {t.bpm} BPM
            </span>
            <span style={{ fontFamily: 'monospace', color: '#ffcc00', fontSize: '10px', background: '#ffcc0018', padding: '2px 6px', borderRadius: '3px' }}>
              {t.key}
            </span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                onClick={() => handleLoadSingleTrack('A', t)}
                style={{ background: '#122533', border: '1px solid #00f0ff', color: '#00f0ff', fontSize: '10px', fontWeight: 800, padding: '5px 9px', borderRadius: '4px', cursor: 'pointer' }}
                title="Load to Deck A"
              >
                DECK A
              </button>
              <button
                onClick={() => handleLoadSingleTrack('B', t)}
                style={{ background: '#331222', border: '1px solid #ff0077', color: '#ff0077', fontSize: '10px', fontWeight: 800, padding: '5px 9px', borderRadius: '4px', cursor: 'pointer' }}
                title="Load to Deck B"
              >
                DECK B
              </button>
              <button
                onClick={() => {
                  onLoadDeck('queue', t);
                  showToast(`Added "${t.title}" to mixer playlist!`);
                }}
                style={{ background: '#16221a', border: '1px solid #1db954', color: '#1db954', fontSize: '10px', fontWeight: 800, padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}
                title="Add to Playlist Queue"
              >
                ➕
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }
};

export default SpotifyAccountBrowser;
