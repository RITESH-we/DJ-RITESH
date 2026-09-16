import React, { useRef, useState } from 'react';
import audioEngine from '../audio/audioEngine';
import autoDjEngine from '../audio/autoDjEngine';

const PlaylistManager = ({
  playlist = [],
  setPlaylist = () => {},
  activeTracks = { A: null, B: null },
  onLoadToDeck = () => {},
  onOpenSpotify = () => {},
  onOpenVibeMix = () => {},
  onOpenSpotifyAccount = () => {},
}) => {
  const fileInputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordedBlobsRef = useRef([]);
  const recordTimerRef = useRef(null);

  // File Upload Handler
  const handleFilesSelected = async (files) => {
    if (!files || !files.length) return;
    setIsProcessing(true);
    audioEngine.resumeContext();

    const newTracks = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioEngine.ctx.decodeAudioData(arrayBuffer);
        const bpm = await audioEngine.detectBPM(audioBuffer);

        newTracks.push({
          id: `track-${Date.now()}-${i}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Local Track',
          genre: 'User Audio',
          duration: audioBuffer.duration,
          bpm: bpm,
          key: 'Auto',
          file: file,
          audioBuffer: audioBuffer,
        });
      } catch (err) {
        console.error('Failed to decode audio file:', file.name, err);
      }
    }

    const updated = [...playlist, ...newTracks];
    setPlaylist(updated);
    autoDjEngine.setPlaylist(updated);
    setIsProcessing(false);
  };

  // Load Demo Tracks
  const handleLoadDemoTracks = () => {
    const demos = audioEngine.createDemoTracks();
    const updated = [...playlist, ...demos];
    setPlaylist(updated);
    autoDjEngine.setPlaylist(updated);
  };

  // Sort by BPM
  const handleSortBpm = (ascending = true) => {
    const sorted = [...playlist].sort((a, b) => {
      const bpmA = a.bpm || 120;
      const bpmB = b.bpm || 120;
      return ascending ? bpmA - bpmB : bpmB - bpmA;
    });
    setPlaylist(sorted);
    autoDjEngine.setPlaylist(sorted);
  };

  // Remove track
  const handleRemoveTrack = (id) => {
    const updated = playlist.filter((t) => t.id !== id);
    setPlaylist(updated);
    autoDjEngine.setPlaylist(updated);
  };

  // Clear playlist
  const handleClearPlaylist = () => {
    setPlaylist([]);
    autoDjEngine.setPlaylist([]);
  };

  // Master Record Output
  const handleToggleRecord = () => {
    audioEngine.resumeContext();
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      clearInterval(recordTimerRef.current);
      setIsRecording(false);
    } else {
      // Start recording master output
      try {
        const dest = audioEngine.ctx.createMediaStreamDestination();
        audioEngine.masterGain.connect(dest);

        const recorder = new MediaRecorder(dest.stream);
        recordedBlobsRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedBlobsRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedBlobsRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `DJ_Mix_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 100);
        };

        recorder.start(500);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setRecordSeconds(0);

        recordTimerRef.current = setInterval(() => {
          setRecordSeconds((s) => s + 1);
        }, 1000);
      } catch (err) {
        console.error('MediaRecorder failed:', err);
        alert('Recording is not supported in this browser environment.');
      }
    }
  };

  const formatDuration = (sec) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatRecTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      style={{
        background: '#12151d',
        borderRadius: '10px',
        border: '1px solid #232a3a',
        padding: '14px',
        marginTop: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '14px', fontWeight: 900, color: '#f0f4f8', letterSpacing: '1px' }}>
            TRACK LIBRARY & AUTO-DJ PLAYLIST
          </span>
          <span style={{ fontSize: '11px', background: '#1c2230', padding: '2px 8px', borderRadius: '10px', color: '#8e9aa8' }}>
            {playlist.length} {playlist.length === 1 ? 'Track' : 'Tracks'}
          </span>
          {isProcessing && (
            <span style={{ fontSize: '11px', color: '#00f0ff', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ⚡ Analyzing BPM & decoding audio...
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFilesSelected(e.target.files)}
          />

          <button
            onClick={onOpenVibeMix}
            style={{
              background: 'linear-gradient(135deg, #ff0077 0%, #7b00ff 100%)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 12px rgba(255, 0, 119, 0.35)',
            }}
            title="Generate custom DJ mix based on Mood, Genre, Language & BPM"
          >
            <span>✨</span> AI Vibe Mix
          </button>

          <button
            onClick={onOpenSpotifyAccount}
            style={{
              background: 'linear-gradient(180deg, #183321 0%, #102417 100%)',
              border: '1px solid #1db954',
              color: '#1db954',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 10px rgba(29, 185, 84, 0.25)',
            }}
            title="Connect & browse your Spotify account playlists"
          >
            <span>👤</span> Spotify Library
          </button>

          <button
            onClick={onOpenSpotify}
            style={{
              background: '#161b24',
              border: '1px solid #293447',
              color: '#9ba8b8',
              borderRadius: '4px',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title="Search Spotify catalog or paste song link"
          >
            <span>🔍</span> Search / Link
          </button>

          <button
            onClick={() => fileInputRef.current.click()}
            style={{
              background: 'linear-gradient(180deg, #242c3d 0%, #171c28 100%)',
              border: '1px solid #3d4a66',
              color: '#e0e6ed',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Add MP3 / WAV Files
          </button>

          <button
            onClick={handleLoadDemoTracks}
            style={{
              background: 'linear-gradient(180deg, #1b2f3d 0%, #101e29 100%)',
              border: '1px solid #00f0ff88',
              color: '#00f0ff',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 8px rgba(0, 240, 255, 0.2)',
            }}
          >
            ⚡ Load Club Demo Tracks
          </button>

          <button
            onClick={() => handleSortBpm(true)}
            style={{
              background: '#191d28',
              border: '1px solid #283042',
              color: '#9aa5b8',
              borderRadius: '4px',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Sort tracks by BPM ascending for smooth tempo progression"
          >
            Sort by BPM ↑
          </button>

          {/* Record Mix Button */}
          <button
            onClick={handleToggleRecord}
            style={{
              background: isRecording ? '#ff2a55' : '#191d28',
              border: `1px solid ${isRecording ? '#ff2a55' : '#452028'}`,
              color: isRecording ? '#ffffff' : '#ff5577',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isRecording ? '0 0 12px #ff2a5588' : 'none',
            }}
            title="Record your live mix to an audio file"
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isRecording ? '#ffffff' : '#ff2a55',
              }}
            />
            {isRecording ? `REC [${formatRecTime(recordSeconds)}]` : 'REC MIX'}
          </button>

          {playlist.length > 0 && (
            <button
              onClick={handleClearPlaylist}
              style={{
                background: 'transparent',
                border: '1px solid #2d3547',
                color: '#6e7b8f',
                borderRadius: '4px',
                padding: '6px 8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tracks Table */}
      {playlist.length === 0 ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFilesSelected(e.dataTransfer.files);
          }}
          style={{
            border: '2px dashed #242a38',
            borderRadius: '8px',
            padding: '36px 20px',
            textAlign: 'center',
            color: '#7b879b',
            background: '#0e1017',
          }}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎧</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#c0c9d6', marginBottom: '4px' }}>
            No tracks in playlist
          </div>
          <div style={{ fontSize: '12px', marginBottom: '16px' }}>
            Drag and drop your audio files (MP3, WAV, FLAC, OGG) here, or click below to load demo tracks!
          </div>
          <button
            onClick={handleLoadDemoTracks}
            style={{
              background: 'linear-gradient(135deg, #00f0ff 0%, #7b00ff 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 18px',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)',
            }}
          >
            ⚡ Click to Load Club Demo Tracks (Ready to Mix)
          </button>
        </div>
      ) : (
        <div style={{ maxHeight: '230px', overflowY: 'auto', borderRadius: '6px', border: '1px solid #1f2535' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#161924', color: '#7a8799', borderBottom: '1px solid #232a3a', position: 'sticky', top: 0 }}>
                <th style={{ padding: '8px 12px' }}>#</th>
                <th style={{ padding: '8px 12px' }}>TITLE</th>
                <th style={{ padding: '8px 12px' }}>GENRE / ARTIST</th>
                <th style={{ padding: '8px 12px' }}>BPM</th>
                <th style={{ padding: '8px 12px' }}>KEY</th>
                <th style={{ padding: '8px 12px' }}>DURATION</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {playlist.map((track, idx) => {
                const isLoadedA = activeTracks.A && activeTracks.A.id === track.id;
                const isLoadedB = activeTracks.B && activeTracks.B.id === track.id;
                return (
                  <tr
                    key={track.id}
                    style={{
                      borderBottom: '1px solid #1b212e',
                      background: isLoadedA ? 'rgba(0, 240, 255, 0.07)' : isLoadedB ? 'rgba(255, 0, 119, 0.07)' : idx % 2 === 0 ? '#10131a' : '#12151d',
                    }}
                  >
                    <td style={{ padding: '8px 12px', color: '#667285', width: '30px' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#f0f4f8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {track.thumbnail ? (
                          <img src={track.thumbnail} alt={track.title} style={{ width: '28px', height: '28px', borderRadius: '3px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '28px', height: '28px', borderRadius: '3px', background: '#191f2b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                            {track.isSpotify ? '🟢' : '🎵'}
                          </div>
                        )}
                        <div>
                          <div>{track.title}</div>
                          <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                            {track.isSpotify && <span style={{ fontSize: '8px', color: '#1db954', background: '#1db95422', padding: '0 4px', borderRadius: '2px', border: '1px solid #1db95444' }}>SPOTIFY</span>}
                            {isLoadedA && <span style={{ fontSize: '8px', color: '#00f0ff', background: '#00f0ff22', padding: '0 4px', borderRadius: '2px' }}>DECK A</span>}
                            {isLoadedB && <span style={{ fontSize: '8px', color: '#ff0077', background: '#ff007722', padding: '0 4px', borderRadius: '2px' }}>DECK B</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#8a97a8' }}>
                      {track.artist}
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: '#00ff88' }}>
                      {track.bpm ? `${track.bpm} BPM` : '--'}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#ffcc00', fontFamily: 'monospace' }}>
                      {track.key || '8A'}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#8a97a8', fontFamily: 'monospace' }}>
                      {formatDuration(track.duration)}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => onLoadToDeck('A', track)}
                          style={{
                            background: '#122533',
                            border: '1px solid #00f0ff',
                            color: '#00f0ff',
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          LOAD A
                        </button>
                        <button
                          onClick={() => onLoadToDeck('B', track)}
                          style={{
                            background: '#331222',
                            border: '1px solid #ff0077',
                            color: '#ff0077',
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          LOAD B
                        </button>
                        <button
                          onClick={() => handleRemoveTrack(track.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#687487',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px 6px',
                          }}
                          title="Remove track"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PlaylistManager;
