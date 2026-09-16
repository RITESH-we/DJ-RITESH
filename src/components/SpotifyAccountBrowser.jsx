import React, { useState, useEffect } from 'react';
import spotifyService from '../services/spotifyService';

const SpotifyAccountBrowser = ({
  isOpen = false,
  onClose = () => {},
  onLoadPlaylist = () => {},
  onLoadDeck = () => {},
}) => {
  const [profile, setProfile] = useState(spotifyService.userProfile);
  const [playlists, setPlaylists] = useState([]);
  const [activePlaylistTracks, setActivePlaylistTracks] = useState([]);
  const [selectedPlaylistName, setSelectedPlaylistName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(spotifyService.clientId);
  const [showOAuthLogin, setShowOAuthLogin] = useState(false);

  useEffect(() => {
    if (isOpen && spotifyService.isConnected()) {
      loadPlaylists();
    }
  }, [isOpen]);

  const loadPlaylists = async () => {
    setIsLoading(true);
    try {
      const list = await spotifyService.getUserPlaylists();
      setPlaylists(list);
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
  };

  const handleSelectPlaylist = async (pl) => {
    setIsLoading(true);
    setSelectedPlaylistName(pl.name);
    try {
      const tracks = await spotifyService.getPlaylistTracks(pl.id);
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
    try {
      const rawTracks = await spotifyService.getPlaylistTracks(pl.id);
      const prepared = [];
      for (const t of rawTracks) {
        const audioBuffer = await spotifyService.loadTrackAudioBuffer(t);
        prepared.push({ ...t, audioBuffer });
      }
      onLoadPlaylist(prepared);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSingleTrack = async (deckId, track) => {
    const audioBuffer = await spotifyService.loadTrackAudioBuffer(track);
    onLoadDeck(deckId, { ...track, audioBuffer });
    onClose();
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
          maxWidth: '820px',
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
            padding: '16px 22px',
            borderBottom: '1px solid #232938',
            background: 'linear-gradient(90deg, #121820 0%, #0d1e15 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>👤</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontFamily: 'Orbitron, sans-serif', color: '#1db954', letterSpacing: '1px' }}>
                SPOTIFY ACCOUNT & PLAYLIST BROWSER
              </h2>
              <p style={{ margin: 0, fontSize: '11px', color: '#8b97a8' }}>
                Browse your personal Spotify playlists, liked tracks & load full sets into the DJ console
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
        <div style={{ background: '#0e121a', padding: '12px 20px', borderBottom: '1px solid #1c2330', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {profile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {profile.images?.[0]?.url ? (
                <img src={profile.images[0].url} alt={profile.display_name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #1db954' }} />
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1db954', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#000' }}>
                  {profile.display_name?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, color: '#f0f4f8', fontSize: '14px' }}>{profile.display_name}</span>
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
              No Spotify account connected yet. Connect below:
            </div>
          )}

          <div>
            {profile ? (
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
                Disconnect Account
              </button>
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
                  ⚡ Instant Connect Demo Account
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
                  Log In with Spotify PKCE
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PKCE Login Input Accordion */}
        {showOAuthLogin && !profile && (
          <form onSubmit={handleOAuthLogin} style={{ background: '#0a0d14', padding: '14px 20px', borderBottom: '1px solid #242c3d', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Enter your Spotify Client ID..."
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
              style={{ flex: 1, background: '#121622', border: '1px solid #283348', borderRadius: '4px', padding: '8px 12px', color: '#fff', fontSize: '12px', outline: 'none' }}
            />
            <button
              type="submit"
              style={{ background: '#1db954', border: 'none', color: '#000', fontWeight: 800, padding: '8px 16px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
            >
              Log In via Spotify Auth
            </button>
          </form>
        )}

        {/* Content Area */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#1db954', fontSize: '13px' }}>
              ⚡ Loading Spotify playlists and audio features...
            </div>
          )}

          {profile && playlists.length > 0 && !activePlaylistTracks.length && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#9aa7b8', marginBottom: '12px', letterSpacing: '0.5px' }}>
                YOUR PLAYLISTS (CLICK TO VIEW OR LOAD TO DJ MIXER)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                {playlists.map((pl) => (
                  <div
                    key={pl.id}
                    style={{
                      background: '#0f131c',
                      border: '1px solid #1f2738',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    {pl.images?.[0]?.url && (
                      <img src={pl.images[0].url} alt={pl.name} style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                    )}
                    <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#f0f4f8', marginBottom: '2px' }}>
                          {pl.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#7a8799', marginBottom: '8px' }}>
                          {pl.tracks?.total || 0} Tracks • {pl.description || 'Spotify Playlist'}
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
                            padding: '6px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          View Tracks
                        </button>
                        <button
                          onClick={() => handleLoadEntirePlaylist(pl)}
                          style={{
                            flex: 1.3,
                            background: 'linear-gradient(135deg, #1db954 0%, #158b3e 100%)',
                            border: 'none',
                            color: '#000',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
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
                ))}
              </div>
            </div>
          )}

          {/* Active Playlist Detail View */}
          {activePlaylistTracks.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <button
                  onClick={() => setActivePlaylistTracks([])}
                  style={{
                    background: '#161b26',
                    border: '1px solid #2b3548',
                    color: '#8e9bb0',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  ◀ Back to All Playlists
                </button>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1db954' }}>
                  {selectedPlaylistName} ({activePlaylistTracks.length} Tracks)
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '350px', overflowY: 'auto' }}>
                {activePlaylistTracks.map((t, idx) => (
                  <div
                    key={t.id}
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
                    <span style={{ color: '#687588', width: '20px', fontWeight: 700, fontSize: '11px' }}>{idx + 1}</span>
                    {t.thumbnail && (
                      <img src={t.thumbnail} alt={t.title} style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#f0f4f8', fontSize: '12px' }}>{t.title}</div>
                      <div style={{ fontSize: '10px', color: '#1db954' }}>{t.artist}</div>
                    </div>
                    <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: '#00ff88', fontSize: '11px' }}>
                      {t.bpm} BPM
                    </span>
                    <span style={{ fontFamily: 'monospace', color: '#ffcc00', fontSize: '10px', background: '#ffcc0018', padding: '2px 6px', borderRadius: '3px' }}>
                      {t.key}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => handleLoadSingleTrack('A', t)}
                        style={{ background: '#122533', border: '1px solid #00f0ff', color: '#00f0ff', fontSize: '9px', fontWeight: 800, padding: '4px 8px', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        DECK A
                      </button>
                      <button
                        onClick={() => handleLoadSingleTrack('B', t)}
                        style={{ background: '#331222', border: '1px solid #ff0077', color: '#ff0077', fontSize: '9px', fontWeight: 800, padding: '4px 8px', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        DECK B
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!profile && !isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px', margin: '0 auto', padding: '10px 0' }}>
              {/* Main Premium Connection Card */}
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

                {/* 3-Step Setup Guide */}
                <div style={{ background: '#090d0b', padding: '14px', borderRadius: '8px', border: '1px solid #1a291f', margin: '12px 0', fontSize: '12px', color: '#c0cdd8', lineHeight: '1.6' }}>
                  <div style={{ fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
                    Quick 1-Minute Connection Setup:
                  </div>
                  <ol style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>
                      Go to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" style={{ color: '#1db954', fontWeight: 700, textDecoration: 'underline' }}>developer.spotify.com/dashboard</a> and log in with your Spotify account.
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
                          📋 Copy 127.0.0.1 URI
                        </button>
                        <div style={{ color: '#ffcc00', fontSize: '10px', marginTop: '3px' }}>
                          ⚡ Note: Spotify requires <code>http://127.0.0.1:5173/</code> instead of <code>localhost</code>.
                        </div>
                      </div>
                    </li>
                    <li>
                      Go to <strong>Settings</strong> in your app, copy your <strong>Client ID</strong>, and paste it below:
                    </li>
                  </ol>
                </div>

                {/* PKCE Login Form */}
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

              {/* Instant Demo Option */}
              <div style={{ textAlign: 'center', background: '#0e121a', border: '1px solid #202736', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '12px', color: '#8a97a8', marginBottom: '8px' }}>
                  Don't want to create a Spotify app right now? You can test with a simulated Pro account:
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
                  ⚡ Instant Connect Demo Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpotifyAccountBrowser;
