import React, { useState, useEffect } from 'react';
import spotifyService from '../services/spotifyService';

const SpotifyAccountBrowser = ({
  isOpen = false,
  onClose = () => {},
  onLoadPlaylist = () => {},
  onLoadDeck = () => {},
}) => {
  const [isDeviceVerified, setIsDeviceVerified] = useState(spotifyService.isVerified());
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
  const [showAdvancedOAuth, setShowAdvancedOAuth] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const verified = spotifyService.isVerified();
      setIsDeviceVerified(verified);

      if (verified) {
        if (!spotifyService.userProfile) {
          spotifyService.verifyDeviceAsVip();
        }
        setProfile(spotifyService.userProfile);
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

  const handleVerifyVipDevice = () => {
    setIsLoading(true);
    setLoadingText('Authorizing device & initializing VIP Pro library...');
    setTimeout(() => {
      const prof = spotifyService.verifyDeviceAsVip();
      setIsDeviceVerified(true);
      setProfile(prof);
      setIsLoading(false);
      showToast('🎉 Device Successfully Verified! Permanent VIP Access Granted.');
      loadPlaylists();
    }, 500);
  };

  const handleResetDevice = () => {
    if (window.confirm('Reset verification on this device? You will be prompted to verify again.')) {
      spotifyService.unverifyDevice();
      setIsDeviceVerified(false);
      setProfile(null);
      setPlaylists([]);
      setActivePlaylistTracks([]);
      setTopTracks([]);
      setLikedTracks([]);
      setSearchResults([]);
      showToast('Device credentials cleared.');
    }
  };

  const loadPlaylists = async () => {
    setIsLoading(true);
    setLoadingText('Fetching Spotify playlists...');
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
    setLoadingText('Fetching personal Top Tracks from Spotify...');
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
    setLoadingText('Fetching Liked Songs from Spotify...');
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

  const handleOAuthLogin = async (e) => {
    e.preventDefault();
    if (!clientIdInput.trim()) return;
    try {
      await spotifyService.startOAuthPKCELogin(clientIdInput);
    } catch (err) {
      alert(err.message || 'OAuth error');
    }
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
        backdropFilter: 'blur(12px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          background: 'linear-gradient(180deg, #131722 0%, #0c0f16 100%)',
          borderRadius: '16px',
          border: '1px solid #1db954',
          boxShadow: '0 0 45px rgba(29, 185, 84, 0.28), 0 8px 32px rgba(0,0,0,0.9)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderBottom: '1px solid #232938',
            background: 'linear-gradient(90deg, #121820 0%, #0d1e15 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '26px' }}>🎧</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontFamily: 'Orbitron, sans-serif', color: '#1db954', letterSpacing: '1px' }}>
                  SPOTIFY DJ LIBRARY & VERIFICATION
                </h2>
                {isDeviceVerified && (
                  <span style={{ fontSize: '9px', background: '#00ff8822', color: '#00ff88', border: '1px solid #00ff8866', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                    🟢 VERIFIED
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#8b97a8' }}>
                {isDeviceVerified ? 'Device authorized permanently • 100M+ real tracks & 5+ min extended audio' : 'Device verification required once per device'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8e9bb0',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '2px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Profile / Device Status Bar */}
        {isDeviceVerified && profile && (
          <div style={{ background: '#0e121a', padding: '10px 20px', borderBottom: '1px solid #1c2330', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {profile.images?.[0]?.url ? (
                <img src={profile.images[0].url} alt={profile.display_name} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #1db954' }} />
              ) : (
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#1db954', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#000', fontSize: '14px' }}>
                  {profile.display_name?.charAt(0) || 'D'}
                </div>
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 800, color: '#f0f4f8', fontSize: '13px' }}>{profile.display_name}</span>
                  <span style={{ fontSize: '9px', background: '#1db95422', color: '#1db954', border: '1px solid #1db95444', padding: '1px 5px', borderRadius: '3px', fontWeight: 800 }}>
                    VIP PRO
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#7a8799' }}>
                  Device ID: <code>{spotifyService.deviceId?.substring(0, 16) || 'DEVICE-AUTH'}</code> • Verified permanently
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleResetDevice}
                style={{
                  background: '#181b24',
                  border: '1px solid #2d3546',
                  color: '#8b97a8',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
                title="Reset verification on this device"
              >
                ⚙️ Reset Device
              </button>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div style={{ background: '#10331b', color: '#00ff88', borderBottom: '1px solid #1db954', padding: '9px 20px', fontSize: '12px', fontWeight: 800, textAlign: 'center', letterSpacing: '0.5px' }}>
            {notification}
          </div>
        )}

        {/* Tab Navigation Bar (Shown only when verified) */}
        {isDeviceVerified && profile && (
          <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', background: '#0b0f17', borderBottom: '1px solid #1e2535', overflowX: 'auto' }}>
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
                whiteSpace: 'nowrap',
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
                whiteSpace: 'nowrap',
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
                whiteSpace: 'nowrap',
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
                whiteSpace: 'nowrap',
              }}
            >
              🔍 Search Catalog
            </button>
          </div>
        )}

        {/* Content Area */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#1db954', fontSize: '13px', fontWeight: 700 }}>
              ⚡ {loadingText}
            </div>
          )}

          {/* STATE 1: DEVICE NOT YET VERIFIED (ONE-TIME VERIFICATION PORTAL) */}
          {!isDeviceVerified && !isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '680px', margin: '0 auto', padding: '10px 0' }}>
              
              {/* Badge info row */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: '#16231a', border: '1px solid #1db954', color: '#1db954', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                  📱 MOBILE & LAPTOP READY
                </span>
                <span style={{ background: '#12202e', border: '1px solid #00f0ff', color: '#00f0ff', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                  ⚡ ONE-TIME VERIFICATION
                </span>
                <span style={{ background: '#261224', border: '1px solid #ff0077', color: '#ff0077', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                  🔥 5+ MIN REAL AUDIO
                </span>
              </div>

              {/* CARD 1: INSTANT VIP 1-CLICK VERIFICATION (PRIMARY) */}
              <div
                style={{
                  background: 'linear-gradient(180deg, #111e15 0%, #0c150e 100%)',
                  border: '2px solid #1db954',
                  borderRadius: '14px',
                  padding: '24px',
                  boxShadow: '0 0 30px rgba(29, 185, 84, 0.25)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛡️</div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#00ff88', fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px' }}>
                  AUTHORIZE THIS DEVICE (1-CLICK VIP)
                </h3>
                <p style={{ margin: '0 0 18px 0', fontSize: '12px', color: '#a0b3c6', lineHeight: '1.5' }}>
                  Click below to verify this device once. Your device will be permanently authorized to stream 100M+ real tracks, access top charts, use the AI Vibe Mixer, and spin 5+ minute extended audio. <strong>It will never ask again on this device.</strong>
                </p>

                <button
                  onClick={handleVerifyVipDevice}
                  style={{
                    background: 'linear-gradient(135deg, #00ff88 0%, #00b359 100%)',
                    border: 'none',
                    color: '#000',
                    fontFamily: 'Orbitron, sans-serif',
                    fontWeight: 900,
                    fontSize: '13px',
                    letterSpacing: '1px',
                    padding: '14px 28px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 0 25px rgba(0, 255, 136, 0.5)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'transform 0.15s',
                  }}
                >
                  <span>⚡</span> VERIFY & UNLOCK THIS DEVICE
                </button>

                <div style={{ marginTop: '12px', fontSize: '11px', color: '#687e70' }}>
                  Zero setup required • Unlimited streaming • Permanent authorization
                </div>
              </div>

              {/* CARD 2: CONNECT PERSONAL SPOTIFY ACCOUNT (OPTIONAL) */}
              <div
                style={{
                  background: '#0d1017',
                  border: '1px solid #1e2636',
                  borderRadius: '12px',
                  padding: '16px 20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowAdvancedOAuth(!showAdvancedOAuth)}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '12px', color: '#cbd5e1' }}>
                      🟢 Have a Personal Spotify Account? (Optional)
                    </div>
                    <div style={{ fontSize: '11px', color: '#7a889b' }}>
                      Log in to import your private personal playlists & liked songs
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{ background: '#161d2a', border: '1px solid #2b3850', color: '#94a3b8', fontSize: '11px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {showAdvancedOAuth ? 'Hide ▲' : 'Show Login ▼'}
                  </button>
                </div>

                {showAdvancedOAuth && (
                  <form onSubmit={handleOAuthLogin} style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#8e9cb2' }}>
                      Spotify Client ID (Pre-filled or use your own):
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        required
                        value={clientIdInput}
                        onChange={(e) => setClientIdInput(e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: '220px',
                          background: '#07090e',
                          border: '1px solid #232c3d',
                          borderRadius: '6px',
                          padding: '10px 14px',
                          color: '#ffffff',
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          background: '#1db954',
                          border: 'none',
                          color: '#000',
                          fontFamily: 'Orbitron, sans-serif',
                          fontWeight: 900,
                          fontSize: '11px',
                          padding: '0 18px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        LOG IN SPOTIFY
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: PLAYLISTS GRID */}
          {isDeviceVerified && profile && activeTab === 'playlists' && !activePlaylistTracks.length && !isLoading && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#9aa7b8', letterSpacing: '0.5px' }}>
                  VERIFIED SPOTIFY PLAYLISTS ({playlists.length})
                </div>
                <button
                  onClick={loadPlaylists}
                  style={{ background: '#141a26', border: '1px solid #2b3548', color: '#8e9cb2', fontSize: '10px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  🔄 Refresh Playlists
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
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
                      }}
                    >
                      {pl.images?.[0]?.url ? (
                        <img src={pl.images[0].url} alt={pl.name} style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '110px', background: 'linear-gradient(135deg, #18221b 0%, #0e161c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                          🎵
                        </div>
                      )}
                      <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#f0f4f8', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={pl.name}>
                            {pl.name}
                          </div>
                          <div style={{ fontSize: '10px', color: '#1db954', fontWeight: 700, marginBottom: '8px' }}>
                            {trackCount} Tracks • {pl.owner?.display_name || 'Spotify'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            onClick={() => handleSelectPlaylist(pl)}
                            style={{
                              flex: 1,
                              background: '#161b26',
                              border: '1px solid #2b3548',
                              color: '#e0e6ed',
                              padding: '6px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Tracks
                          </button>
                          <button
                            onClick={() => handleLoadEntirePlaylist(pl)}
                            style={{
                              flex: 1.4,
                              background: 'linear-gradient(135deg, #1db954 0%, #158b3e 100%)',
                              border: 'none',
                              color: '#000',
                              padding: '6px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 900,
                              cursor: 'pointer',
                            }}
                          >
                            🎧 Load All
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ACTIVE PLAYLIST TRACKS DRILL-DOWN */}
          {isDeviceVerified && profile && activeTab === 'playlists' && activePlaylistTracks.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', background: '#0e121a', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1f2738' }}>
                <div>
                  <button
                    onClick={() => setActivePlaylistTracks([])}
                    style={{ background: 'none', border: 'none', color: '#1db954', fontSize: '12px', fontWeight: 800, cursor: 'pointer', padding: 0, marginBottom: '2px' }}
                  >
                    ← Back to All Playlists
                  </button>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                    {selectedPlaylistName} ({activePlaylistTracks.length} tracks)
                  </div>
                </div>
                <button
                  onClick={() => handleLoadTrackBatch(activePlaylistTracks, selectedPlaylistName)}
                  style={{
                    background: 'linear-gradient(135deg, #1db954 0%, #158b3e 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#000',
                    fontFamily: 'Orbitron, sans-serif',
                    fontWeight: 900,
                    fontSize: '11px',
                    padding: '8px 14px',
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
          {isDeviceVerified && profile && activeTab === 'top' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#9aa7b8' }}>
                  YOUR TOP SPOTIFY TRACKS ({topTracks.length})
                </span>
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
                  No top tracks found. <button onClick={loadTopTracks} style={{ color: '#1db954', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Click to refresh</button>
                </div>
              ) : (
                renderTrackList(topTracks)
              )}
            </div>
          )}

          {/* TAB 3: LIKED SONGS */}
          {isDeviceVerified && profile && activeTab === 'liked' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#9aa7b8' }}>
                  YOUR LIKED SONGS ({likedTracks.length})
                </span>
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
          {isDeviceVerified && profile && activeTab === 'search' && (
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
              <img src={t.thumbnail} alt={t.title} style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
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
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => handleLoadSingleTrack('A', t)}
                style={{ background: '#122533', border: '1px solid #00f0ff', color: '#00f0ff', fontSize: '10px', fontWeight: 800, padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}
                title="Load to Deck A"
              >
                A
              </button>
              <button
                onClick={() => handleLoadSingleTrack('B', t)}
                style={{ background: '#331222', border: '1px solid #ff0077', color: '#ff0077', fontSize: '10px', fontWeight: 800, padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}
                title="Load to Deck B"
              >
                B
              </button>
              <button
                onClick={() => {
                  onLoadDeck('queue', t);
                  showToast(`Added "${t.title}" to mixer playlist!`);
                }}
                style={{ background: '#16221a', border: '1px solid #1db954', color: '#1db954', fontSize: '10px', fontWeight: 800, padding: '5px 7px', borderRadius: '4px', cursor: 'pointer' }}
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
