import React, { useState, useEffect } from 'react';
import Deck from './components/Deck';
import MixerCenter from './components/MixerCenter';
import PlaylistManager from './components/PlaylistManager';
import SpotifyModal from './components/SpotifyModal';
import VibeMixModal from './components/VibeMixModal';
import SpotifyAccountBrowser from './components/SpotifyAccountBrowser';
import ClubVisualizer from './components/ClubVisualizer';
import audioEngine from './audio/audioEngine';
import autoDjEngine from './audio/autoDjEngine';
import spotifyService from './services/spotifyService';
import './App.css';

const App = () => {
  const [playlist, setPlaylist] = useState([]);
  const [activeTracks, setActiveTracks] = useState({ A: null, B: null });
  const [crossfadeVal, setCrossfadeVal] = useState(0.5);
  const [audioStarted, setAudioStarted] = useState(false);
  const [mobileView, setMobileView] = useState('all'); // 'all' | 'A' | 'mixer' | 'B'
  const [isDeviceVerified, setIsDeviceVerified] = useState(spotifyService.isVerified());

  // Modals
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [isVibeMixOpen, setIsVibeMixOpen] = useState(false);
  const [isSpotifyAccountOpen, setIsSpotifyAccountOpen] = useState(false);

  // Handle Spotify OAuth callback (?code=...) on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      alert(`Spotify Login returned: ${error}. Activating VIP Pro device access.`);
      spotifyService.verifyDeviceAsVip();
      setIsDeviceVerified(true);
      setIsSpotifyAccountOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code) {
      spotifyService.handleOAuthCallback(code).then(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsDeviceVerified(true);
        setIsSpotifyAccountOpen(true);
      }).catch((e) => {
        console.warn('OAuth callback error, falling back to VIP Pro access', e);
        spotifyService.verifyDeviceAsVip();
        setIsDeviceVerified(true);
        setIsSpotifyAccountOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
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

  // Hook autoDjEngine deck changes so Deck UI and waveforms dynamically update during auto-mix
  useEffect(() => {
    autoDjEngine.onDeckTrackUpdate = (deckId, track) => {
      setActiveTracks((prev) => ({ ...prev, [deckId]: track }));
    };
    return () => {
      autoDjEngine.onDeckTrackUpdate = null;
    };
  }, []);

  // Master handler: Start automated beatmixing across the entire playlist
  const handleStartPlaylistBeatMix = async (tracksToMix, options = {}) => {
    await audioEngine.resumeContext();
    setAudioStarted(true);
    const targetList = tracksToMix && tracksToMix.length > 0 ? tracksToMix : playlist;
    if (!targetList || targetList.length === 0) return;
    setPlaylist(targetList);
    await autoDjEngine.startPlaylistBeatMix(targetList, options);
  };

  // Sync crossfader state with audio engine
  const handleCrossfadeChange = (val) => {
    setCrossfadeVal(val);
    audioEngine.updateCrossfader(val);
  };

  // Keep crossfadeVal state synchronized during motorized glide & Auto-DJ transitions
  useEffect(() => {
    const unsub = audioEngine.subscribeCrossfade((val) => {
      setCrossfadeVal(val);
    });
    return unsub;
  }, []);

  const handleLoadToDeck = (deckId, track) => {
    if (deckId === 'queue') {
      handleAddSpotifyTrack(track);
      return;
    }
    audioEngine.resumeContext();
    setAudioStarted(true);
    setActiveTracks((prev) => ({ ...prev, [deckId]: track }));
  };

  const handleStartAudio = async () => {
    await audioEngine.resumeContext();
    setAudioStarted(true);
  };

  // Determine on-air active deck and track for real-time audio-reactive graphics stage
  const currentDeckId = crossfadeVal > 0.55 ? 'B' : crossfadeVal < 0.45 ? 'A' : (autoDjEngine.activeDeckId || 'A');
  const currentOnAirTrack = currentDeckId === 'B'
    ? (activeTracks.B || activeTracks.A)
    : (activeTracks.A || activeTracks.B);

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
        e.preventDefault();
        if (e.shiftKey) {
          handleCrossfadeChange(0); // Cut to Deck A
        } else {
          handleCrossfadeChange(Math.max(0, crossfadeVal - 0.05));
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) {
          handleCrossfadeChange(1); // Cut to Deck B
        } else {
          handleCrossfadeChange(Math.min(1, crossfadeVal + 0.05));
        }
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleCrossfadeChange(0.5); // Snap to Center (50/50)
      } else if (e.code === 'KeyX') {
        e.preventDefault();
        audioEngine.toggleHamsterReverse(); // Toggle Hamster reverse fader
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        const activeId = autoDjEngine.activeDeckId || 'A';
        audioEngine.toggleAutoLoop(activeId, 4);
      } else if (e.code === 'BracketLeft') {
        e.preventDefault();
        const activeId = autoDjEngine.activeDeckId || 'A';
        audioEngine.halfLoop(activeId);
      } else if (e.code === 'BracketRight') {
        e.preventDefault();
        const activeId = autoDjEngine.activeDeckId || 'A';
        audioEngine.doubleLoop(activeId);
      } else if (e.code >= 'Digit1' && e.code <= 'Digit4') {
        // Keys 1-4: Hot Cues on Deck A
        e.preventDefault();
        const idx = parseInt(e.code.replace('Digit', '')) - 1;
        const deckA = audioEngine.decks.A;
        if (deckA.hotCues[idx] !== null && deckA.hotCues[idx] !== undefined) {
          audioEngine.jumpHotCue('A', idx);
        } else {
          audioEngine.setHotCue('A', idx);
        }
      } else if (e.code >= 'Digit5' && e.code <= 'Digit8') {
        // Keys 5-8: Hot Cues on Deck B
        e.preventDefault();
        const idx = parseInt(e.code.replace('Digit', '')) - 5;
        const deckB = audioEngine.decks.B;
        if (deckB.hotCues[idx] !== null && deckB.hotCues[idx] !== undefined) {
          audioEngine.jumpHotCue('B', idx);
        } else {
          audioEngine.setHotCue('B', idx);
        }
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

          {/* Spotify Account / Device Verification button */}
          <button
            onClick={() => setIsSpotifyAccountOpen(true)}
            style={{
              background: isDeviceVerified
                ? 'linear-gradient(180deg, #183321 0%, #102417 100%)'
                : 'linear-gradient(180deg, #2b2210 0%, #1c1508 100%)',
              border: `1px solid ${isDeviceVerified ? '#1db954' : '#ffaa00'}`,
              borderRadius: '6px',
              color: isDeviceVerified ? '#1db954' : '#ffcc00',
              fontWeight: 800,
              fontSize: '11px',
              padding: '7px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{isDeviceVerified ? '🟢' : '🔑'}</span> {isDeviceVerified ? (spotifyService.userProfile?.display_name || 'Spotify VIP') : 'Verify Device'}
          </button>

          {!audioStarted && (
            <button className="init-audio-btn" onClick={handleStartAudio}>
              ▶ ENABLE AUDIO
            </button>
          )}

          <div className="shortcuts-badge" title="Space: Play/Pause | Tab: Mix Now | Left/Right: Crossfader | 1-8: Hot Cues | L: Auto Loop | [ ]: Halve/Double Loop">
            ⌨ <kbd>SPACE</kbd> PLAY • <kbd>TAB</kbd> MIX • <kbd>1-8</kbd> CUES • <kbd>L</kbd> LOOP • <kbd>◄ ►</kbd> FADER
          </div>
        </div>
      </header>

      {/* 3D Audio-Reactive Club Visualizer Stage */}
      <ClubVisualizer
        activeTrack={currentOnAirTrack}
        activeDeckId={currentDeckId}
      />

      {/* Mobile Console Tab Switcher (Touch friendly) */}
      <div className="mobile-view-tabs">
        <button
          type="button"
          className={`mobile-view-tab ${mobileView === 'all' ? 'active-all' : ''}`}
          onClick={() => setMobileView('all')}
        >
          ⚡ ALL
        </button>
        <button
          type="button"
          className={`mobile-view-tab ${mobileView === 'A' ? 'active-A' : ''}`}
          onClick={() => setMobileView('A')}
        >
          🔵 DECK A
        </button>
        <button
          type="button"
          className={`mobile-view-tab ${mobileView === 'mixer' ? 'active-mixer' : ''}`}
          onClick={() => setMobileView('mixer')}
        >
          🎛️ MIXER
        </button>
        <button
          type="button"
          className={`mobile-view-tab ${mobileView === 'B' ? 'active-B' : ''}`}
          onClick={() => setMobileView('B')}
        >
          🔴 DECK B
        </button>
      </div>

      {/* Main DJ Console Hardware Chassis */}
      <main className="dj-console">
        {/* Left Deck (Deck A) */}
        {(mobileView === 'all' || mobileView === 'A') && (
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
        )}

        {/* Center Mixer */}
        {(mobileView === 'all' || mobileView === 'mixer') && (
          <MixerCenter
            crossfadeValue={crossfadeVal}
            onCrossfadeChange={handleCrossfadeChange}
          />
        )}

        {/* Right Deck (Deck B) */}
        {(mobileView === 'all' || mobileView === 'B') && (
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
        )}
      </main>

      {/* Track Library & Auto-DJ Manager */}
      <section className="dj-library-section">
        <PlaylistManager
          playlist={playlist}
          setPlaylist={setPlaylist}
          activeTracks={activeTracks}
          onLoadToDeck={handleLoadToDeck}
          onStartPlaylistBeatMix={handleStartPlaylistBeatMix}
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
        onClose={() => {
          setIsSpotifyAccountOpen(false);
          setIsDeviceVerified(spotifyService.isVerified());
        }}
        onLoadPlaylist={handleLoadSpotifyPlaylist}
        onLoadDeck={handleLoadToDeck}
      />
    </div>
  );
};

export default App;
