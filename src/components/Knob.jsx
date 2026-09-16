import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Professional DJ Rotary Knob
 * Supports mouse drag (up/down), wheel, and double-click to reset.
 */
const Knob = ({
  label = 'KNOB',
  value = 0,
  min = -24,
  max = 6,
  defaultValue = 0,
  unit = 'dB',
  color = '#00f0ff',
  centerDetent = true,
  onChange = () => {},
  size = 46,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startVal = useRef(value);

  // Map value to angle (-135 deg to +135 deg)
  const range = max - min;
  const normalized = (value - min) / range;
  const angle = -135 + normalized * 270;

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    startY.current = e.clientY;
    startVal.current = value;
  };

  const handleDoubleClick = () => {
    onChange(defaultValue);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const dy = startY.current - e.clientY;
    const sensitivity = (max - min) / 120;
    let nextVal = startVal.current + dy * sensitivity;

    // Center detent snap
    if (centerDetent && Math.abs(nextVal - defaultValue) < range * 0.03) {
      nextVal = defaultValue;
    }

    nextVal = Math.max(min, Math.min(max, nextVal));
    onChange(Math.round(nextVal * 10) / 10);
  }, [isDragging, min, max, defaultValue, centerDetent, range, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const displayVal = value > 0 ? `+${value}` : `${value}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 2px' }}>
      <span style={{
        fontSize: '9px',
        fontWeight: 700,
        color: '#8e9aa8',
        letterSpacing: '0.5px',
        marginBottom: '2px',
        textTransform: 'uppercase'
      }}>
        {label}
      </span>

      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #2a2f3d 0%, #151821 70%, #0d0f14 100%)',
          border: `2px solid ${isDragging ? color : '#2f3647'}`,
          boxShadow: isDragging
            ? `0 0 10px ${color}66, inset 0 2px 4px rgba(255,255,255,0.1)`
            : '0 3px 6px rgba(0,0,0,0.6), inset 0 2px 3px rgba(255,255,255,0.08)',
          position: 'relative',
          cursor: 'ns-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color 0.15s',
        }}
        title={`${label}: ${displayVal}${unit} (Drag up/down, Double-click to reset)`}
      >
        {/* Subtle radial tick ring */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            transform: `rotate(${angle}deg)`,
            pointerEvents: 'none',
          }}
        >
          {/* Knob pointer line */}
          <div
            style={{
              position: 'absolute',
              top: '3px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '2.5px',
              height: '11px',
              borderRadius: '2px',
              backgroundColor: color,
              boxShadow: `0 0 6px ${color}`,
            }}
          />
        </div>

        {/* Center cap */}
        <div
          style={{
            width: `${size * 0.44}px`,
            height: `${size * 0.44}px`,
            borderRadius: '50%',
            background: '#0e1117',
            border: '1px solid #232938',
          }}
        />
      </div>

      {/* Value Readout */}
      <span style={{
        fontSize: '9px',
        fontFamily: 'monospace',
        color: Math.abs(value - defaultValue) < 0.05 ? '#606c7d' : color,
        marginTop: '2px',
      }}>
        {displayVal}
      </span>
    </div>
  );
};

export default Knob;
