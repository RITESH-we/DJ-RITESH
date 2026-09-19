import React, { useRef, useEffect, useState, useMemo } from 'react';

const WaveformDisplay = ({
  audioBuffer = null,
  currentTime = 0,
  duration = 0,
  bpm = 120,
  cuePoint = 0,
  hotCues = [],
  isLooping = false,
  loopStart = 0,
  loopEnd = 0,
  color = '#00f0ff',
  onSeek = () => {},
  height = 70,
}) => {
  const canvasRef = useRef(null);
  const [hoverTime, setHoverTime] = useState(null);

  // Compute downsampled waveform peaks once per audioBuffer
  const peaks = useMemo(() => {
    if (!audioBuffer) return [];
    const rawData = audioBuffer.getChannelData(0);
    const numBuckets = 500;
    const bucketSize = Math.floor(rawData.length / numBuckets);
    const computedPeaks = [];

    for (let i = 0; i < numBuckets; i++) {
      let min = 1.0;
      let max = -1.0;
      const start = i * bucketSize;
      for (let j = 0; j < bucketSize; j += 4) {
        const val = rawData[start + j];
        if (val < min) min = val;
        if (val > max) max = val;
      }
      computedPeaks.push({ min, max });
    }
    return computedPeaks;
  }, [audioBuffer]);

  // Render waveform onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const h = canvas.height;
    const midY = h / 2;

    // Clear background
    ctx.fillStyle = '#0a0c11';
    ctx.fillRect(0, 0, width, h);

    // Subtle grid lines
    ctx.strokeStyle = '#181d28';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    if (!peaks.length || duration <= 0) {
      // Empty waveform placeholder
      ctx.fillStyle = '#232938';
      ctx.font = '11px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NO TRACK LOADED', width / 2, midY + 4);
      return;
    }

    const playheadRatio = currentTime / duration;
    const playheadX = playheadRatio * width;

    // 1. Beat-grid lines
    if (bpm > 40) {
      const secondsPerBeat = 60 / bpm;
      const totalBeats = Math.floor(duration / secondsPerBeat);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let b = 0; b < totalBeats; b++) {
        const beatTime = b * secondsPerBeat;
        const bx = (beatTime / duration) * width;
        // Stronger bar line every 4 beats
        if (b % 4 === 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        }
        ctx.beginPath();
        ctx.moveTo(bx, 0);
        ctx.lineTo(bx, h);
        ctx.stroke();
      }
    }

    // 2. Loop active region highlight
    if (isLooping && loopEnd > loopStart) {
      const loopStartX = (loopStart / duration) * width;
      const loopEndX = (loopEnd / duration) * width;
      ctx.fillStyle = 'rgba(255, 204, 0, 0.18)';
      ctx.fillRect(loopStartX, 0, loopEndX - loopStartX, h);
      ctx.strokeStyle = '#ffcc00';
      ctx.strokeRect(loopStartX, 0, loopEndX - loopStartX, h);
    }

    // 3. Draw Waveform Peaks
    const numPeaks = peaks.length;
    for (let i = 0; i < numPeaks; i++) {
      const x = (i / numPeaks) * width;
      const peak = peaks[i];
      const barHeight = Math.max(2, (peak.max - peak.min) * (midY - 4));

      // Color played portion vs upcoming portion
      if (x <= playheadX) {
        ctx.fillStyle = color;
      } else {
        ctx.fillStyle = '#3a4459';
      }

      ctx.fillRect(x, midY - barHeight / 2, Math.max(1, width / numPeaks - 0.5), barHeight);
    }

    // 4. Cue Point marker (Orange flag)
    if (cuePoint > 0) {
      const cueX = (cuePoint / duration) * width;
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(cueX - 1, 0, 3, h);
    }

    // 5. Hot Cues markers (8 RGB Flags)
    const cueColors = [
      '#00f0ff', // 1: Cyan (Intro)
      '#ff0077', // 2: Magenta (Verse)
      '#00ff88', // 3: Green (Build)
      '#ffcc00', // 4: Yellow (Drop)
      '#ff6600', // 5: Orange (Break)
      '#9900ff', // 6: Purple (Drop 2)
      '#ff0033', // 7: Red (Outro)
      '#3399ff', // 8: Sky Blue (End)
    ];

    hotCues.forEach((hc, idx) => {
      if (hc !== null && hc !== undefined) {
        const hcX = (hc / duration) * width;
        const padColor = cueColors[idx % cueColors.length];

        // Vertical line
        ctx.fillStyle = padColor;
        ctx.fillRect(hcX - 1, 0, 2, h);

        // Top triangular flag marker
        ctx.beginPath();
        ctx.moveTo(hcX, 0);
        ctx.lineTo(hcX + 6, 4);
        ctx.lineTo(hcX, 8);
        ctx.closePath();
        ctx.fill();

        // Small pad number
        ctx.font = '700 8px Orbitron, sans-serif';
        ctx.fillStyle = padColor;
        ctx.fillText(`${idx + 1}`, hcX + 3, 16);
      }
    });

    // 6. Playhead Cursor Line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, h);
    ctx.stroke();
    ctx.shadowBlur = 0; // reset
  }, [peaks, currentTime, duration, bpm, cuePoint, hotCues, isLooping, loopStart, loopEnd, color]);

  const handleCanvasClick = (e) => {
    if (!canvasRef.current || duration <= 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current || duration <= 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setHoverTime(ratio * duration);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
  };

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: '4px', overflow: 'hidden', border: '1px solid #242a38' }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={height}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverTime(null)}
        style={{
          width: '100%',
          height: `${height}px`,
          display: 'block',
          cursor: duration > 0 ? 'pointer' : 'default',
        }}
      />
      {hoverTime !== null && (
        <div style={{
          position: 'absolute',
          top: '2px',
          right: '6px',
          background: 'rgba(0,0,0,0.7)',
          padding: '2px 5px',
          borderRadius: '3px',
          fontSize: '10px',
          color: '#e0e6ed',
          pointerEvents: 'none',
        }}>
          Seek: {formatTime(hoverTime)}
        </div>
      )}
    </div>
  );
};

export default WaveformDisplay;
