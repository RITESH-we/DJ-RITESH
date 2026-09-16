import React, { useState, useEffect } from 'react';
import Deck from './components/Deck';
import MixerCenter from './components/MixerCenter';
import PlaylistManager from './components/PlaylistManager';
import SpotifyModal from './components/SpotifyModal';
import VibeMixModal from './components/VibeMixModal';
import SpotifyAccountBrowser from './components/SpotifyAccountBrowser';
import audioEngine from './audio/audioEngine';
import autoDjEngine from './audio/autoDjEngine';
import spotifyService from './services/spotifyService';
import './App.css';

const App = () => {
  const [playlist, setPlaylist] = useState([]);
  const [activeTracks, setActiveTracks] = useState({ A: null, B: null });
  const [crossfadeVal, setCrossfadeVal] = useState(0.5);
  const [audioStarted, setAudioStarted] = useState(false);

  // Modals
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [isVibeMixOpen, setIsVibeMixOpen] = useState(false);
  const [isSpotifyAccountOpen, setIsSpotifyAccountOpen] = useState(false);

  // Handle Spotify OAuth callback (?code=...) on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      spotifyService.handleOAuthCallback(code).then(() => {
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsSpotifyAccountOpen(true);
      }).catch((e) => {
        console.error('OAuth callback error', e);
      });
    }
  }, []);

  // Auto-initialize demo tracks on first load so the app is instantly ready
  useEffect(() => {
    const demos = audioEngine.createDemoTracks();
    setPlaylist(demos);
    autoDjEngine.setPlaylist(demos);

    // Pre-load Demo 1 to Deck A and Demo 2 to Deck B
    if (demos.length >= 2) {
      setActiveTracks({ A: demos[0], B: demos[1] });
    }
  }, []);

  // Sync crossfader state with audio engine
  const handleCrossfadeChange = (val) => {
    setCrossfadeVal(val);
    audioEngine.updateCrossfader(val);
  };

  const handleLoadToDeck = (deckId, track) => {
    audioEngine.resumeContext();
    setAudioStarted(true);
    setActiveTracks((prev) => ({ ...prev, [deckId]: track }));
  };

  const handleStartAudio = async () => {
    await audioEngine.resumeContext();
    setAudioStarted(true);
  };

  // Global DJ Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        const activeId = autoDjEngine.activeDeckId || 'A';
        const deck = audioEngine.decks[activeId];
        if (deck.isPlaying) audioEngine.pause(activeId);
        else audioEngine.play(activeId);
      } else if (e.code === 'Tab') {
        e.preventDefault();
        autoDjEngine.triggerTransition();
      } else if (e.code === 'ArrowLeft') {
        handleCrossfadeChange(Math.max(0, crossfadeVal - 0.05));
      } else if (e.code === 'ArrowRight') {
        handleCrossfadeChange(Math.min(1, crossfadeVal + 0.05));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [crossfadeVal]);

  const handleAddSpotifyTrack = (track) => {
    const updated = [...playlist, track];
    setPlaylist(updated);
    autoDjEngine.setPlaylist(updated);
  };

  const handleLoadDeckSpotifyTrack = (deckId, track) => {
    handleAddSpotifyTrack(track);
    handleLoadToDeck(deckId, track);
  };

  // Load an entire AI Vibe Mix set
  const handleLoadVibeMix = (tracks) => {
    audioEngine.resumeContext();
    setAudioStarted(true);
    setPlaylist(tracks);
    autoDjEngine.setPlaylist(tracks);

    // Auto-load first 2 tracks to Deck A and Deck B
    if (tracks.length >= 1) {
      handleLoadToDeck('A', tracks[0]);
    }
    if (tracks.length >= 2) {
      handleLoadToDeck('B', tracks[1]);
    }

    // Start playback on Deck A and activate Auto-DJ
    setTimeout(() => {
      audioEngine.play('A');
      autoDjEngine.toggleAutoDJ(false);
    }, 200);
  };

  // Load an entire Spotify Playlist
  const handleLoadSpotifyPlaylist = (tracks) => {
    audioEngine.resumeContext();
    setAudioStarted(true);
    setPlaylist(tracks);
    autoDjEngine.setPlaylist(tracks);

    if (tracks.length >= 1) handleLoadToDeck('A', tracks[0]);
    if (tracks.length >= 2) handleLoadToDeck('B', tracks[1]);
  };

  return (
    <div className="dj-app">
      {/* Top Navigation / Brand Bar */}
      <header className="dj-header">
        <div className="brand-group">
          <div className="brand-icon">
            <span className="pulse-dot"></span>
            ⚡
          </div>
          <div>
            <h1 className="brand-title">PRO DJ AUTOMIXER</h1>
            <p className="brand-subtitle">Automated Beatmatching & Club Console</p>
          </div>
        </div>

        <div className="header-actions">
          {/* AI Vibe Mix quick button */}
          <button
            onClick={() => setIsVibeMixOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #ff0077 0%, #7b00ff 100%)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontWeight: 800,
              fontSize: '11px',
              padding: '8px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 14px rgba(255, 0, 119, 0.4)',
            }}
          >
            <span>✨</span> AI Vibe Mix
          </button>

          {/* Spotify Account button */}
          <button
            onClick={() => setIsSpotifyAccountOpen(true)}
            style={{
              background: 'linear-gradient(180deg, #183321 0%, #102417 100%)',
              border: '1px solid #1db954',
              borderRadius: '6px',
              color: '#1db954',
              fontWeight: 800,
              fontSize: '11px',
              padding: '7px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>👤</span> {spotifyService.isConnected() ? (spotifyService.userProfile?.display_name || 'Spotify Active') : 'Spotify Library'}
          </button>

          {!audioStarted && (
            <button className="init-audio-btn" onClick={handleStartAudio}>
              ▶ ENABLE AUDIO
            </button>
          )}

          <div className="shortcuts-badge" title="Space: Play/Pause | Tab: Mix Now | Left/Right: Crossfader">
            ⌨ <kbd>SPACE</kbd> PLAY • <kbd>TAB</kbd> MIX NOW • <kbd>◄ ►</kbd> FADER
          </div>
        </div>
      </header>

      {/* Main DJ Console Hardware Chassis */}
      <main className="dj-console">
        {/* Left Deck (Deck A) */}
        <Deck
          deckId="A"
          track={activeTracks.A}
          otherDeckId="B"
          accentColor="#00f0ff"
          onTrackEnd={() => {
            if (autoDjEngine.enabled) {
              autoDjEngine.triggerTransition();
            }
          }}
        />

        {/* Center Mixer */}
        <MixerCenter
          crossfadeValue={crossfadeVal}
          onCrossfadeChange={handleCrossfadeChange}
        />

        {/* Right Deck (Deck B) */}
        <Deck
          deckId="B"
          track={activeTracks.B}
          otherDeckId="A"
          accentColor="#ff0077"
          onTrackEnd={() => {
            if (autoDjEngine.enabled) {
              autoDjEngine.triggerTransition();
            }
          }}
        />
      </main>

      {/* Track Library & Auto-DJ Manager */}
      <section className="dj-library-section">
        <PlaylistManager
          playlist={playlist}
          setPlaylist={setPlaylist}
          activeTracks={activeTracks}
          onLoadToDeck={handleLoadToDeck}
          onOpenSpotify={() => setIsSpotifyModalOpen(true)}
          onOpenVibeMix={() => setIsVibeMixOpen(true)}
          onOpenSpotifyAccount={() => setIsSpotifyAccountOpen(true)}
        />
      </section>

      {/* Spotify Search & Link Modal */}
      <SpotifyModal
        isOpen={isSpotifyModalOpen}
        onClose={() => setIsSpotifyModalOpen(false)}
        onAddTrack={handleAddSpotifyTrack}
        onLoadDeck={handleLoadDeckSpotifyTrack}
      />

      {/* AI Vibe Mix Generator Modal */}
      <VibeMixModal
        isOpen={isVibeMixOpen}
        onClose={() => setIsVibeMixOpen(false)}
        onLoadMix={handleLoadVibeMix}
      />

      {/* Spotify Account & Library Browser Modal */}
      <SpotifyAccountBrowser
        isOpen={isSpotifyAccountOpen}
        onClose={() => setIsSpotifyAccountOpen(false)}
        onLoadPlaylist={handleLoadSpotifyPlaylist}
        onLoadDeck={handleLoadToDeck}
      />
    </div>
  );
};

export default App;
