import React, { useRef, useEffect, useState, useCallback } from 'react';

const JogWheel = ({
  deckId = 'A',
  isPlaying = false,
  playbackRate = 1.0,
  color = '#00f0ff',
  onScratch = () => {},
  onNudge = () => {},
  size = 190,
}) => {
  const [rotation, setRotation] = useState(0);
  const isDragging = useRef(false);
  const lastAngle = useRef(0);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
  const jogRef = useRef(null);

  // Smooth continuous rotation while playing
  useEffect(() => {
    const updateRotation = (time) => {
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (isPlaying && !isDragging.current) {
        // Standard 33.33 RPM = ~200 deg/sec at 1.0x rate
        const degPerSec = 200 * playbackRate;
        setRotation((prev) => (prev + degPerSec * delta) % 360);
      }
      animFrameRef.current = requestAnimationFrame(updateRotation);
    };

    animFrameRef.current = requestAnimationFrame(updateRotation);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, playbackRate]);

  // Calculate mouse angle relative to jogwheel center
  const getAngle = (e) => {
    if (!jogRef.current) return 0;
    const rect = jogRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    lastAngle.current = getAngle(e);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const currentAngle = getAngle(e);
    let deltaAngle = currentAngle - lastAngle.current;

    // Handle wrap-around at -180 / 180
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    lastAngle.current = currentAngle;
    setRotation((prev) => (prev + deltaAngle) % 360);

    // Trigger scratch/nudge
    const scratchDeltaSeconds = deltaAngle * 0.008;
    onScratch(scratchDeltaSeconds);
  }, [onScratch]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={jogRef}
      onMouseDown={handleMouseDown}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        margin: '0 auto',
        position: 'relative',
        cursor: 'grab',
        background: 'radial-gradient(circle, #1a1d26 0%, #10121a 70%, #08090d 100%)',
        boxShadow: `0 0 25px ${isPlaying ? color + '44' : 'rgba(0,0,0,0.8)'}, inset 0 0 15px rgba(0,0,0,0.9)`,
        border: `3px solid ${isPlaying ? color : '#242a38'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-color 0.3s, box-shadow 0.3s',
        userSelect: 'none',
      }}
      title="Jog Wheel / Platter: Drag to scratch or nudge"
    >
      {/* Outer Metallic Strobe / Dots Ring */}
      <div
        style={{
          position: 'absolute',
          inset: '4px',
          borderRadius: '50%',
          border: '1px dashed #343c50',
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      />

      {/* Rotating Vinyl Surface */}
      <div
        style={{
          position: 'absolute',
          inset: '12px',
          borderRadius: '50%',
          background: `repeating-radial-gradient(circle, #12141a, #12141a 2px, #0b0d12 3px, #0b0d12 4px)`,
          transform: `rotate(${rotation}deg)`,
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.9)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Light sheen reflection overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%, rgba(255,255,255,0.04) 60%, transparent 100%)',
          }}
        />

        {/* Vinyl Marker Needle */}
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '3px',
            height: '24px',
            backgroundColor: color,
            borderRadius: '2px',
            boxShadow: `0 0 8px ${color}`,
          }}
        />

        {/* Center Platter Label */}
        <div
          style={{
            width: `${size * 0.38}px`,
            height: `${size * 0.38}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}22 0%, #151822 80%)`,
            border: `2px solid ${color}88`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          <span style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '11px',
            fontWeight: 900,
            color: color,
            letterSpacing: '1px',
          }}>
            DECK {deckId}
          </span>
          <span style={{
            fontSize: '8px',
            color: '#8b97a8',
            marginTop: '2px',
            letterSpacing: '0.5px',
          }}>
            {isPlaying ? 'ACTIVE' : 'IDLE'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default JogWheel;
