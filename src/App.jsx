import React, { useState, useEffect } from 'react';
import Deck from './components/Deck';
import MixerCenter from './components/MixerCenter';
import PlaylistManager from './components/PlaylistManager';
import SpotifyModal from './components/SpotifyModal';
import VibeMixModal from './components/VibeMixModal';
import SpotifyAccountBrowser from './components/SpotifyAccountBrowser';
import ClubVisualizer from './components/ClubVisualizer';
import SoundFxBoard from './components/SoundFxBoard';
import VibeCardModal from './components/VibeCardModal';
import YouTubeModal from './components/YouTubeModal';
import CasualPlayer from './components/CasualPlayer';
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
  const [tribeAesthetic, setTribeAesthetic] = useState('hybrid'); // 'hybrid' | 'millennial' | 'genz'
  const [auraEnergy, setAuraEnergy] = useState(0.2);
  const [appMode, setAppMode] = useState('dj'); // 'dj' | 'player'

  // Modals
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [isVibeMixOpen, setIsVibeMixOpen] = useState(false);
  const [isSpotifyAccountOpen, setIsSpotifyAccountOpen] = useState(false);
  const [isVibeCardOpen, setIsVibeCardOpen] = useState(false);

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

  // Real-time audio reactive energy tracker for ambient aura backglow
  useEffect(() => {
    let animId;
    const checkAura = () => {
      const metrics = audioEngine.getMasterBeatMetrics();
      if (metrics) {
        setAuraEnergy(metrics.subBass * 0.7 + metrics.energy * 0.3);
      }
      animId = requestAnimationFrame(checkAura);
    };
    animId = requestAnimationFrame(checkAura);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleLoadToDeck = async (deckId, track) => {
    if (deckId === 'queue') {
      handleAddSpotifyTrack(track);
      return;
    }
    await audioEngine.resumeContext();
    setAudioStarted(true);
    setActiveTracks((prev) => ({ ...prev, [deckId]: track }));
    await audioEngine.loadTrack(deckId, track);
  };

  const handleStartAudio = async () => {
    await audioEngine.resumeContext();
    setAudioStarted(true);
  };

  const handleCasualTrackChange = async (track) => {
    await audioEngine.resumeContext();
    setAudioStarted(true);
    audioEngine.updateCrossfader(0.0);
    setActiveTracks((prev) => ({ ...prev, A: track }));
    await audioEngine.loadTrack('A', track);
  };

  // Seamless Mode Switcher with cross-deck audio migration
  const switchAppMode = async (targetMode) => {
    if (targetMode === appMode) return;
    await audioEngine.resumeContext();
    setAudioStarted(true);

    if (targetMode === 'player') {
      autoDjEngine.toggleAutoDJ(false);

      const deckA = audioEngine.decks.A;
      const deckB = audioEngine.decks.B;
      const wasBPlaying = deckB && (deckB.isPlaying || crossfadeVal > 0.55);

      if (wasBPlaying && activeTracks.B) {
        // Deck B was playing: seamlessly transfer song and playback position to Deck A
        const bTime = audioEngine.getCurrentTime('B');
        const isBPlaying = deckB.isPlaying;
        audioEngine.stop('B');
        setActiveTracks((prev) => ({ ...prev, A: activeTracks.B }));
        audioEngine.updateCrossfader(0.0);
        await audioEngine.loadTrack('A', activeTracks.B);
        if (isBPlaying) {
          audioEngine.seek('A', bTime);
          audioEngine.play('A');
        }
      } else {
        audioEngine.updateCrossfader(0.0);
        if (activeTracks.A && (!deckA?.trackInfo || !deckA?.audioBuffer)) {
          await audioEngine.loadTrack('A', activeTracks.A);
        }
      }
      setAppMode('player');
    } else {
      autoDjEngine.setMixMode('smartOutro');
      setAppMode('dj');
    }
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
    <div className={`dj-app vibe-${tribeAesthetic}`}>
      {/* Audio-Reactive Ambient Aura Backdrop Glow */}
      <div
        className="vibe-aura-backdrop"
        style={{
          background: tribeAesthetic === 'millennial'
            ? 'radial-gradient(ellipse at center, rgba(255, 170, 0, 0.28) 0%, rgba(200, 80, 0, 0.12) 50%, transparent 75%)'
            : tribeAesthetic === 'genz'
            ? 'radial-gradient(ellipse at center, rgba(0, 240, 255, 0.32) 0%, rgba(255, 0, 119, 0.22) 40%, rgba(112, 0, 255, 0.16) 70%, transparent 85%)'
            : 'radial-gradient(ellipse at center, rgba(0, 240, 255, 0.24) 0%, rgba(255, 0, 119, 0.18) 50%, transparent 75%)',
          transform: `translateX(-50%) scale(${1 + auraEnergy * 0.16})`,
          opacity: 0.25 + auraEnergy * 0.35,
        }}
      />

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
          {/* Main Console Mode Switcher: PRO DJ vs CASUAL PLAYER */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#090d15',
              padding: '3px',
              borderRadius: '8px',
              border: '1.5px solid #28374f',
              gap: '3px',
              boxShadow: '0 0 15px rgba(0,0,0,0.6)',
            }}
          >
            <button
              onClick={() => switchAppMode('dj')}
              style={{
                background: appMode === 'dj' ? 'linear-gradient(135deg, #00f0ff 0%, #7b00ff 100%)' : 'transparent',
                color: appMode === 'dj' ? '#000000' : '#8fa4bf',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontFamily: 'Orbitron, sans-serif',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: appMode === 'dj' ? '0 0 14px rgba(0, 240, 255, 0.45)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🎛️</span> PRO DJ
            </button>

            <button
              onClick={() => switchAppMode('player')}
              style={{
                background: appMode === 'player' ? 'linear-gradient(135deg, #00ffaa 0%, #00f0ff 100%)' : 'transparent',
                color: appMode === 'player' ? '#000000' : '#8fa4bf',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontFamily: 'Orbitron, sans-serif',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: appMode === 'player' ? '0 0 14px rgba(0, 255, 170, 0.55)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🎧</span> CASUAL PLAYER
            </button>
          </div>

          {/* Tribe Aesthetic Switcher: Millennial × Gen Z */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#0a0d14',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #1e2638',
              gap: '2px',
            }}
          >
            <button
              onClick={() => setTribeAesthetic('hybrid')}
              title="Hybrid Fusion: Pioneer CDJ Hardware + Gen Z Y2K Holographic Glow"
              style={{
                background: tribeAesthetic === 'hybrid' ? 'linear-gradient(135deg, #00f0ff 0%, #ff0077 100%)' : 'transparent',
                color: tribeAesthetic === 'hybrid' ? '#000' : '#8898aa',
                border: 'none',
                borderRadius: '5px',
                padding: '5px 8px',
                fontSize: '10px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <span>✨</span> FUSION
            </button>
            <button
              onClick={() => setTribeAesthetic('millennial')}
              title="Millennial Retro Club: Pioneer CDJ-1000 Onyx, Amber VFD & Cassette Nostalgia"
              style={{
                background: tribeAesthetic === 'millennial' ? 'linear-gradient(135deg, #ffaa00 0%, #ff5500 100%)' : 'transparent',
                color: tribeAesthetic === 'millennial' ? '#000' : '#8898aa',
                border: 'none',
                borderRadius: '5px',
                padding: '5px 8px',
                fontSize: '10px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <span>📼</span> RETRO
            </button>
            <button
              onClick={() => setTribeAesthetic('genz')}
              title="Gen Z Cyber-Y2K: Iridescent Liquid Glass, Ambient Aura & Hype Badges"
              style={{
                background: tribeAesthetic === 'genz' ? 'linear-gradient(135deg, #00f0ff 0%, #7000ff 100%)' : 'transparent',
                color: tribeAesthetic === 'genz' ? '#000' : '#8898aa',
                border: 'none',
                borderRadius: '5px',
                padding: '5px 8px',
                fontSize: '10px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <span>⚡</span> GEN Z
            </button>
          </div>

          {/* Share Vibe Story Card Button */}
          <button
            onClick={() => setIsVibeCardOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #7000ff 0%, #ff0077 100%)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontWeight: 800,
              fontSize: '11px',
              padding: '7px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 0 12px rgba(112, 0, 255, 0.4)',
            }}
            title="Generate a viral aesthetic Now Playing story card for Instagram / TikTok"
          >
            <span>📸</span> VIBE SNAP
          </button>

          {/* YouTube Music & YouTube quick button */}
          <button
            onClick={() => setIsYouTubeModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #ff0000 0%, #b30000 100%)',
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
              boxShadow: '0 0 14px rgba(255, 0, 0, 0.45)',
            }}
            title="Stream & mix songs directly from YouTube Music / YouTube"
          >
            <span>🔴</span> YouTube (80+ Hits)
          </button>

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

          <div className="shortcuts-badge" title="Space: Play/Pause | Tab: Mix Now | Left/Right: Crossfader | 1-8: Hot Cues | L: Auto Loop | Z-N: Club FX Drops">
            ⌨ <kbd>SPACE</kbd> PLAY • <kbd>TAB</kbd> MIX • <kbd>Z-N</kbd> FX DROPS • <kbd>1-8</kbd> CUES • <kbd>◄ ►</kbd> FADER
          </div>
        </div>
      </header>

      {appMode === 'player' ? (
        <CasualPlayer
          playlist={playlist}
          setPlaylist={setPlaylist}
          currentTrack={activeTracks.A || playlist[0]}
          onTrackChange={handleCasualTrackChange}
          tribeAesthetic={tribeAesthetic}
          onOpenYouTube={() => setIsYouTubeModalOpen(true)}
          onOpenSpotify={() => setIsSpotifyModalOpen(true)}
          onOpenVibeMix={() => setIsVibeMixOpen(true)}
        />
      ) : (
        <>
          {/* 3D Audio-Reactive Club Visualizer Stage */}
          <ClubVisualizer
            activeTrack={currentOnAirTrack}
            activeDeckId={currentDeckId}
          />

          {/* Club & Festival Soundboard (Millennial + Gen Z Drops) */}
          <SoundFxBoard tribeAesthetic={tribeAesthetic} />

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
                tribeAesthetic={tribeAesthetic}
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
                tribeAesthetic={tribeAesthetic}
              />
            )}

            {/* Right Deck (Deck B) */}
            {(mobileView === 'all' || mobileView === 'B') && (
              <Deck
                deckId="B"
                track={activeTracks.B}
                otherDeckId="A"
                accentColor="#ff0077"
                tribeAesthetic={tribeAesthetic}
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
              onOpenYouTube={() => setIsYouTubeModalOpen(true)}
            />
          </section>
        </>
      )}

      {/* Spotify Search & Link Modal */}
      <SpotifyModal
        isOpen={isSpotifyModalOpen}
        onClose={() => setIsSpotifyModalOpen(false)}
        onAddTrack={handleAddSpotifyTrack}
        onLoadDeck={handleLoadDeckSpotifyTrack}
      />

      {/* Dedicated YouTube & YouTube Music Console Modal */}
      <YouTubeModal
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
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

      {/* Gen Z & Millennial Now Playing Vibe Story Card Modal */}
      <VibeCardModal
        isOpen={isVibeCardOpen}
        onClose={() => setIsVibeCardOpen(false)}
        activeTrack={currentOnAirTrack}
        tribeAesthetic={tribeAesthetic}
      />
    </div>
  );
};

export default App;
