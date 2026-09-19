import React, { useRef, useEffect, useState, useMemo } from 'react';
import audioEngine from '../audio/audioEngine';
import autoDjEngine from '../audio/autoDjEngine';

export const VISUALIZER_THEMES = [
  { id: 'auto', label: '🔀 AUTO (BY SONG)', desc: 'Automatically matches visuals to the playing song genre & beats' },
  { id: 'laserTunnel', label: '⚡ LASER TUNNEL', desc: 'EDM / Festival hyperspace laser tunnel with strobe drop flares' },
  { id: 'cyberPulsar', label: '🔮 CYBER PULSAR', desc: 'House / Club 3D wireframe geometric core with bass shockwaves' },
  { id: 'subBassCity', label: '🏙️ SUB-BASS RIPPLE', desc: 'Hip-Hop / Trap sub-bass shockwaves with gritty neon equalizer' },
  { id: 'auroraWaves', label: '🌌 LIQUID AURORA', desc: 'Ambient / Chill flowing harmonic ribbons and floating starfield' },
  { id: 'synthwaveGrid', label: '🌅 80s SYNTHWAVE', desc: 'Retro outrun perspective neon grid with bass-bouncing sun' },
  { id: 'spectrumMirror', label: '📊 3D SPECTRUM', desc: 'Studio mirrored equalizer matrix with peak decay caps' },
];

const ClubVisualizer = ({ activeTrack = null, activeDeckId = 'A' }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const [selectedTheme, setSelectedTheme] = useState('auto');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [bassBoost, setBassBoost] = useState(false);
  const [sensitivity, setSensitivity] = useState(1.2);
  const [beatPulse, setBeatPulse] = useState(false);

  // Auto-detect best visual theme based on song genre, vibe, and title
  const effectiveTheme = useMemo(() => {
    if (selectedTheme !== 'auto') return selectedTheme;
    if (!activeTrack) return 'laserTunnel';

    const genre = (activeTrack.genre || '').toLowerCase();
    const vibe = (activeTrack.vibe || '').toLowerCase();
    const title = (activeTrack.title || '').toLowerCase();
    const composite = `${genre} ${vibe} ${title}`;

    if (composite.includes('chill') || composite.includes('ambient') || composite.includes('sunset') || composite.includes('lounge') || composite.includes('acoustic')) {
      return 'auroraWaves';
    }
    if (composite.includes('hip-hop') || composite.includes('rap') || composite.includes('trap') || composite.includes('urban') || composite.includes('desi') || composite.includes('drill')) {
      return 'subBassCity';
    }
    if (composite.includes('synthwave') || composite.includes('retro') || composite.includes('80s') || composite.includes('pop') || composite.includes('disco')) {
      return 'synthwaveGrid';
    }
    if (composite.includes('house') || composite.includes('club') || composite.includes('techno') || composite.includes('tech')) {
      return 'cyberPulsar';
    }
    if (composite.includes('spectrum') || composite.includes('studio')) {
      return 'spectrumMirror';
    }
    // Default for EDM, Festival, High Energy, or unknown
    return 'laserTunnel';
  }, [selectedTheme, activeTrack]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request error:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Canvas visual rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let phase = 0;
    let particles = [];
    const numParticles = 60;
    for (let p = 0; p < numParticles; p++) {
      particles.push({
        x: Math.random() * 800,
        y: Math.random() * 400,
        z: Math.random() * 800 + 50,
        size: Math.random() * 2 + 1,
        color: p % 2 === 0 ? '#00f0ff' : '#ff0077',
      });
    }

    let tunnelRings = [];
    for (let r = 0; r < 10; r++) {
      tunnelRings.push({ z: r * 80, rot: (r * Math.PI) / 8 });
    }

    let rippleRings = [];
    let lastBeatTime = 0;

    const render = (timestamp) => {
      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Query real-time acoustic metrics from AudioEngine
      const metrics = audioEngine.getMasterBeatMetrics();
      const freqData = metrics.frequencyData || new Uint8Array(128);

      const boostMult = bassBoost ? 1.4 : 1.0;
      const effectiveBass = Math.min(1.5, metrics.bass * sensitivity * boostMult);
      const effectiveMid = Math.min(1.5, metrics.mid * sensitivity);
      const effectiveTreble = Math.min(1.5, metrics.treble * sensitivity);
      const energy = metrics.energy;

      // Detect beat pulses for UI indicator and shockwaves
      if (metrics.isBeat && timestamp - lastBeatTime > 280) {
        lastBeatTime = timestamp;
        setBeatPulse(true);
        setTimeout(() => setBeatPulse(false), 120);

        // Spawn shockwave ring
        if (rippleRings.length < 8) {
          rippleRings.push({
            radius: 10,
            opacity: 1.0,
            color: effectiveTheme === 'subBassCity' ? '#00ff88' : effectiveTheme === 'laserTunnel' ? '#00f0ff' : '#ff0077',
          });
        }
      }

      const bpm = activeTrack?.bpm || 120;
      const speed = (bpm / 120) * 2;
      phase += 0.02 * speed;

      // -------------------------------------------------------------
      // Background base clear
      // -------------------------------------------------------------
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, width, height);

      // Subtle strobe effect on heavy kick drops
      if (metrics.isBeat && effectiveBass > 0.85) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.18, (effectiveBass - 0.7) * 0.3)})`;
        ctx.fillRect(0, 0, width, height);
      }

      const cx = width / 2;
      const cy = height / 2;

      // -------------------------------------------------------------
      // THEME 1: LASER TUNNEL (EDM / Festival)
      // -------------------------------------------------------------
      if (effectiveTheme === 'laserTunnel') {
        // Perspective tunnel
        for (let i = tunnelRings.length - 1; i >= 0; i--) {
          const ring = tunnelRings[i];
          ring.z -= 2.5 * speed + effectiveBass * 4;
          if (ring.z <= 10) ring.z = 800;

          const k = 300 / ring.z;
          const rx = (ring.z < 150 ? (150 - ring.z) * 0.4 : 0);
          const size = Math.max(10, (120 + effectiveBass * 70 + rx) * k);

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(ring.rot + phase * 0.5);

          const alpha = Math.min(1, Math.max(0.1, (800 - ring.z) / 700));
          ctx.strokeStyle = i % 2 === 0 ? `rgba(0, 240, 255, ${alpha})` : `rgba(255, 0, 119, ${alpha})`;
          ctx.lineWidth = Math.max(1, 3 * k * (1 + effectiveBass));
          ctx.shadowBlur = ring.z < 300 ? 15 : 4;
          ctx.shadowColor = i % 2 === 0 ? '#00f0ff' : '#ff0077';

          // Octagon ring
          ctx.beginPath();
          for (let p = 0; p < 8; p++) {
            const angle = (p * Math.PI) / 4;
            const px = Math.cos(angle) * size;
            const py = Math.sin(angle) * size;
            if (p === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        }

        // Radiant laser beams
        const numLasers = 12;
        for (let l = 0; l < numLasers; l++) {
          const angle = (l * 2 * Math.PI) / numLasers + phase * 0.4;
          const laserLen = Math.max(width, height);
          const binIdx = Math.floor((l / numLasers) * 60);
          const val = (freqData[binIdx] || 0) / 255;
          const laserAlpha = Math.min(0.8, val * 0.9 + 0.1);

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(angle) * laserLen, cy + Math.sin(angle) * laserLen);
          ctx.strokeStyle = l % 3 === 0 ? `rgba(0, 240, 255, ${laserAlpha})` : l % 3 === 1 ? `rgba(255, 0, 119, ${laserAlpha})` : `rgba(160, 32, 240, ${laserAlpha})`;
          ctx.lineWidth = 1.5 + val * 3;
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#00f0ff';
          ctx.stroke();
          ctx.restore();
        }
      }

      // -------------------------------------------------------------
      // THEME 2: CYBER PULSAR (House / Club)
      // -------------------------------------------------------------
      else if (effectiveTheme === 'cyberPulsar') {
        const coreRadius = Math.max(35, 60 + effectiveBass * 55);

        // Ambient radial glow
        const radGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, coreRadius * 2.2);
        radGrad.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
        radGrad.addColorStop(0.5, 'rgba(255, 0, 119, 0.2)');
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, coreRadius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Rotating polygonal 3D wireframe core
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(phase);

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#00f0ff';

        // Outer circular equalizer halo
        const numPoints = 64;
        ctx.beginPath();
        for (let i = 0; i < numPoints; i++) {
          const angle = (i * 2 * Math.PI) / numPoints;
          const val = (freqData[i * 2] || 0) / 255;
          const r = coreRadius + val * 50 * sensitivity;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Inner nested pulsing diamond
        ctx.rotate(-phase * 1.5);
        ctx.strokeStyle = '#ff0077';
        ctx.shadowColor = '#ff0077';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let d = 0; d < 4; d++) {
          const a = (d * Math.PI) / 2;
          const dr = coreRadius * 0.65 + effectiveMid * 25;
          const dx = Math.cos(a) * dr;
          const dy = Math.sin(a) * dr;
          if (d === 0) ctx.moveTo(dx, dy);
          else ctx.lineTo(dx, dy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // -------------------------------------------------------------
      // THEME 3: SUB-BASS RIPPLE (Hip-Hop / Trap)
      // -------------------------------------------------------------
      else if (effectiveTheme === 'subBassCity') {
        const barCount = 48;
        const barWidth = width / barCount;

        // Symmetric ground equalizer bars
        for (let b = 0; b < barCount; b++) {
          const freqIdx = Math.floor(Math.abs(b - barCount / 2) * 3.5);
          const raw = (freqData[freqIdx] || 0) / 255;
          const h = Math.max(6, raw * height * 0.6 * sensitivity);

          const x = b * barWidth;
          const y = height - h;

          const barGrad = ctx.createLinearGradient(x, height, x, y);
          barGrad.addColorStop(0, '#00ff88');
          barGrad.addColorStop(0.6, '#00f0ff');
          barGrad.addColorStop(1, '#ff0077');

          ctx.fillStyle = barGrad;
          ctx.fillRect(x + 1, y, barWidth - 2, h);

          // Glowing peak cap
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 1, y - 3, barWidth - 2, 2);
        }

        // Bass shockwave seismic center circle
        ctx.save();
        ctx.beginPath();
        const shockRadius = 30 + effectiveBass * 80;
        ctx.arc(cx, cy - 20, shockRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 136, ${Math.min(1, 0.4 + effectiveBass * 0.6)})`;
        ctx.lineWidth = 3 + effectiveBass * 5;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ff88';
        ctx.stroke();
        ctx.restore();
      }

      // -------------------------------------------------------------
      // THEME 4: LIQUID AURORA WAVES (Ambient / Chill)
      // -------------------------------------------------------------
      else if (effectiveTheme === 'auroraWaves') {
        // Floating cosmic dust starfield
        for (let p of particles) {
          p.y -= 0.3 * speed;
          if (p.y < 0) p.y = height;
          const pAlpha = 0.3 + (freqData[Math.floor(p.x % 64)] || 0) / 512;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = pAlpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + effectiveTreble), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Flowing harmonic sinusoidal aurora ribbons
        const ribbonCount = 4;
        for (let r = 0; r < ribbonCount; r++) {
          const yBase = cy + (r - 1.5) * 35;
          ctx.beginPath();
          ctx.moveTo(0, yBase);

          for (let x = 0; x <= width; x += 20) {
            const freqVal = (freqData[Math.floor((x / width) * 40)] || 0) / 255;
            const waveY = Math.sin(x * 0.008 + phase + r * 1.2) * (35 + effectiveBass * 40 + freqVal * 35);
            ctx.lineTo(x, yBase + waveY);
          }

          ctx.strokeStyle = r === 0 ? 'rgba(0, 240, 255, 0.8)' : r === 1 ? 'rgba(123, 0, 255, 0.7)' : r === 2 ? 'rgba(255, 0, 119, 0.7)' : 'rgba(0, 255, 136, 0.6)';
          ctx.lineWidth = 3 + r * 0.5;
          ctx.shadowBlur = 18;
          ctx.shadowColor = ctx.strokeStyle;
          ctx.stroke();
        }
      }

      // -------------------------------------------------------------
      // THEME 5: 80s SYNTHWAVE (Synthwave / Retro / Pop)
      // -------------------------------------------------------------
      else if (effectiveTheme === 'synthwaveGrid') {
        const horizonY = height * 0.55;

        // Giant neon synthwave sun on horizon
        const sunRadius = Math.min(width, height) * 0.22 + effectiveBass * 20;
        const sunGrad = ctx.createLinearGradient(cx, horizonY - sunRadius * 2, cx, horizonY);
        sunGrad.addColorStop(0, '#ffff00');
        sunGrad.addColorStop(0.5, '#ff0077');
        sunGrad.addColorStop(1, '#660099');

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, horizonY, sunRadius, Math.PI, 0);
        ctx.fillStyle = sunGrad;
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff0077';
        ctx.fill();

        // Horizontal scanlines cutting through the sun
        ctx.fillStyle = '#06080d';
        for (let s = 1; s <= 6; s++) {
          const lineY = horizonY - sunRadius * (s / 7);
          ctx.fillRect(cx - sunRadius, lineY, sunRadius * 2, 2 + s * 0.8);
        }
        ctx.restore();

        // 3D perspective scrolling wireframe ground grid
        ctx.strokeStyle = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f0ff';
        ctx.lineWidth = 1.5;

        // Vanishing perspective vertical lines
        const numPerspLines = 24;
        for (let v = 0; v <= numPerspLines; v++) {
          const groundX = (v / numPerspLines) * width;
          ctx.beginPath();
          ctx.moveTo(cx, horizonY);
          ctx.lineTo(groundX, height);
          ctx.stroke();
        }

        // Horizontal grid lines scrolling forward
        const gridOffset = (phase * 60) % 30;
        for (let y = horizonY; y < height; y += (y - horizonY + 8) * 0.25) {
          const scrolledY = y + gridOffset * ((y - horizonY) / (height - horizonY));
          if (scrolledY >= horizonY && scrolledY <= height) {
            ctx.beginPath();
            ctx.moveTo(0, scrolledY);
            ctx.lineTo(width, scrolledY);
            ctx.stroke();
          }
        }
      }

      // -------------------------------------------------------------
      // THEME 6: 3D SPECTRUM MIRROR (Studio Matrix)
      // -------------------------------------------------------------
      else {
        const barCount = 56;
        const barWidth = (width / barCount) * 0.85;
        const gap = (width / barCount) * 0.15;

        for (let i = 0; i < barCount; i++) {
          const val = (freqData[i * 2] || 0) / 255;
          const barH = val * (height * 0.45) * sensitivity;
          const x = i * (barWidth + gap);

          // Top half (upward)
          const gradTop = ctx.createLinearGradient(x, cy, x, cy - barH);
          gradTop.addColorStop(0, '#00f0ff');
          gradTop.addColorStop(1, '#ff0077');
          ctx.fillStyle = gradTop;
          ctx.fillRect(x, cy - barH, barWidth, barH);

          // Mirrored bottom half (reflection)
          const gradBot = ctx.createLinearGradient(x, cy, x, cy + barH);
          gradBot.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
          gradBot.addColorStop(1, 'rgba(255, 0, 119, 0.05)');
          ctx.fillStyle = gradBot;
          ctx.fillRect(x, cy, barWidth, barH * 0.7);

          // Floating peak cap
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, cy - barH - 3, barWidth, 2);
        }
      }

      // -------------------------------------------------------------
      // Render expanding beat shockwaves
      // -------------------------------------------------------------
      for (let r = rippleRings.length - 1; r >= 0; r--) {
        const ring = rippleRings[r];
        ring.radius += 6 * speed;
        ring.opacity -= 0.025;

        if (ring.opacity <= 0 || ring.radius > Math.max(width, height)) {
          rippleRings.splice(r, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = ring.opacity;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = ring.color;
        ctx.stroke();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [effectiveTheme, bassBoost, sensitivity, activeTrack]);

  // Handle high-DPI canvas resolution
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = rect.width * dpr;
      canvas.height = (isFullscreen ? rect.height : isCollapsed ? 60 : 220) * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${isFullscreen ? rect.height : isCollapsed ? 60 : 220}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen, isCollapsed]);

  const currentGenre = activeTrack?.genre || 'Electronic / Dance';
  const currentVibe = activeTrack?.vibe || 'Late Night Club';

  return (
    <div
      ref={containerRef}
      style={{
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        width: '100%',
        height: isFullscreen ? '100vh' : 'auto',
        zIndex: isFullscreen ? 99999 : 10,
        backgroundColor: '#07090e',
        borderRadius: isFullscreen ? 0 : '12px',
        border: isFullscreen ? 'none' : '1px solid #1f2738',
        boxShadow: isFullscreen ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden',
        marginBottom: isFullscreen ? 0 : '12px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Visualizer Stage Canvas */}
      <div style={{ position: 'relative', width: '100%', height: isFullscreen ? '100%' : isCollapsed ? '60px' : '220px' }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />

        {/* Live Song Information & HUD Overlay */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '12px',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: beatPulse ? '#00ff88' : '#00f0ff',
                boxShadow: beatPulse ? '0 0 12px #00ff88' : '0 0 6px #00f0ff',
                transform: beatPulse ? 'scale(1.4)' : 'scale(1.0)',
                transition: 'all 0.08s ease',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 900,
                fontFamily: 'Orbitron, sans-serif',
                color: '#f0f4f8',
                letterSpacing: '1px',
                textShadow: '0 0 10px rgba(0, 240, 255, 0.7)',
              }}
            >
              STAGE VISUALIZER
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                background: 'rgba(0, 240, 255, 0.15)',
                color: '#00f0ff',
                border: '1px solid #00f0ff66',
                borderRadius: '3px',
                padding: '1px 5px',
              }}
            >
              {effectiveTheme.toUpperCase()}
            </span>
          </div>

          {activeTrack && (
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#e0e6ed', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {activeTrack.title} • <span style={{ color: '#8fa0b5', fontWeight: 600 }}>{activeTrack.artist}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '6px', fontSize: '9px', fontWeight: 700, color: '#7a8da3' }}>
            <span style={{ color: '#00ff88' }}>⚡ {activeTrack?.bpm || 128} BPM</span>
            <span>•</span>
            <span style={{ color: '#ff0077' }}>🔑 {activeTrack?.key || '8A'}</span>
            <span>•</span>
            <span style={{ color: '#ffcc00' }}>🎵 {currentGenre}</span>
          </div>
        </div>

        {/* Top Right Controls (Fullscreen, Boost, Collapse) */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 2,
          }}
        >
          <button
            onClick={() => setBassBoost(!bassBoost)}
            style={{
              background: bassBoost ? '#ff0077' : 'rgba(20, 26, 38, 0.8)',
              color: bassBoost ? '#ffffff' : '#8fa0b5',
              border: `1px solid ${bassBoost ? '#ff0077' : '#2b364a'}`,
              borderRadius: '4px',
              fontSize: '9px',
              fontWeight: 800,
              padding: '3px 7px',
              cursor: 'pointer',
              backdropFilter: 'blur(6px)',
              boxShadow: bassBoost ? '0 0 10px rgba(255, 0, 119, 0.6)' : 'none',
            }}
            title="Bass Reactivity Boost"
          >
            🔥 BASS BOOST
          </button>

          {!isFullscreen && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                background: 'rgba(20, 26, 38, 0.8)',
                color: '#8fa0b5',
                border: '1px solid #2b364a',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: 800,
                padding: '3px 7px',
                cursor: 'pointer',
                backdropFilter: 'blur(6px)',
              }}
              title={isCollapsed ? 'Expand Stage Visualizer' : 'Collapse Stage Visualizer'}
            >
              {isCollapsed ? '▲ EXPAND' : '▼ COLLAPSE'}
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            style={{
              background: 'linear-gradient(135deg, #00f0ff 0%, #7b00ff 100%)',
              color: '#000000',
              border: 'none',
              borderRadius: '4px',
              fontSize: '9px',
              fontWeight: 900,
              padding: '4px 8px',
              cursor: 'pointer',
              boxShadow: '0 0 10px rgba(0, 240, 255, 0.4)',
            }}
            title="Toggle Fullscreen Stage Projection"
          >
            {isFullscreen ? '✕ EXIT FULLSCREEN' : '⛶ FULLSCREEN'}
          </button>
        </div>
      </div>

      {/* Bottom Control Strip: Visual Themes & Sensitivity */}
      {!isCollapsed && (
        <div
          style={{
            background: 'linear-gradient(180deg, #0e121a 0%, #090c12 100%)',
            borderTop: '1px solid #1a2233',
            padding: '6px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#7a8da3', marginRight: '4px' }}>
              GRAPHICS THEME:
            </span>
            {VISUALIZER_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                title={theme.desc}
                style={{
                  background: selectedTheme === theme.id ? '#00f0ff22' : '#141824',
                  color: selectedTheme === theme.id ? '#00f0ff' : '#738499',
                  border: `1px solid ${selectedTheme === theme.id ? '#00f0ff' : '#222b3d'}`,
                  borderRadius: '3px',
                  padding: '3px 6px',
                  fontSize: '8px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {theme.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '8px', fontWeight: 700, color: '#68778d' }}>
              SENSITIVITY:
            </span>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              style={{
                width: '70px',
                height: '8px',
                cursor: 'pointer',
                accentColor: '#00f0ff',
              }}
              title={`Audio Sensitivity: ${sensitivity}x`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubVisualizer;
