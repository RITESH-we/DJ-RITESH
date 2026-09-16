import React, { useEffect, useState, useRef } from 'react';

const VuMeter = ({
  level = { peak: 0, rms: 0 },
  segments = 12,
  vertical = true,
  height = 120,
  width = 12,
}) => {
  const [peakHold, setPeakHold] = useState(0);
  const peakDecayRef = useRef(0);

  useEffect(() => {
    const rawPeak = Math.min(1.0, level.peak * 1.5);
    if (rawPeak > peakDecayRef.current) {
      peakDecayRef.current = rawPeak;
    } else {
      peakDecayRef.current = Math.max(0, peakDecayRef.current - 0.04);
    }
    setPeakHold(peakDecayRef.current);
  }, [level]);

  // Compute active segments
  const activeCount = Math.floor(Math.min(1.0, level.peak * 1.4) * segments);
  const peakHoldIdx = Math.floor(peakHold * segments);

  const segmentNodes = [];
  for (let i = segments - 1; i >= 0; i--) {
    const isActive = i < activeCount;
    const isPeak = i === peakHoldIdx && peakHoldIdx > 0;

    // Segment color: top 2 = RED, next 3 = AMBER/YELLOW, bottom 7 = GREEN
    let segColor = '#00ff66';
    let glowColor = '#00ff66';
    if (i >= segments - 2) {
      segColor = '#ff2a55';
      glowColor = '#ff2a55';
    } else if (i >= segments - 5) {
      segColor = '#ffb300';
      glowColor = '#ffb300';
    }

    segmentNodes.push(
      <div
        key={i}
        style={{
          flex: 1,
          margin: '1px 0',
          borderRadius: '1px',
          backgroundColor: isActive || isPeak ? segColor : '#161922',
          boxShadow: isActive || isPeak ? `0 0 5px ${glowColor}` : 'none',
          transition: 'background-color 0.05s',
        }}
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: `${height}px`,
        width: `${width}px`,
        padding: '2px',
        backgroundColor: '#0c0e14',
        borderRadius: '3px',
        border: '1px solid #1f2533',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)',
      }}
      title={`VU Meter: Peak ${(level.peak * 100).toFixed(0)}%`}
    >
      {segmentNodes}
    </div>
  );
};

export default VuMeter;
