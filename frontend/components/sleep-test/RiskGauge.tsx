import React from 'react';
import type { RiskLevel } from '@/lib/sleepQuiz';

/**
 * Semicircle risk meter: low (green) · moderate (amber) · high (red).
 * The active band is solid, the others are faded; a marker points at the active band.
 * Pure SVG (no images), so it stays crisp at any size. `level` undefined = teaser (all solid).
 */

const BANDS: { level: RiskLevel; from: number; to: number; color: string }[] = [
  { level: 'low', from: 180, to: 122, color: '#16A34A' },
  { level: 'moderate', from: 118, to: 62, color: '#F59E0B' },
  { level: 'high', from: 58, to: 0, color: '#DC2626' },
];

const CX = 120;
const CY = 120;
const R = 92;
const WIDTH = 30;

/** Point on the circle; angles in degrees, 180 = left, 0 = right (upper half). */
const point = (deg: number, r = R) => {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY - r * Math.sin(rad) };
};

const arc = (from: number, to: number) => {
  const a = point(from);
  const b = point(to);
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R} ${R} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
};

export const RiskGauge: React.FC<{ level?: RiskLevel; className?: string; title?: string }> = ({
  level,
  className = '',
  title = 'Sleep apnea risk meter',
}) => {
  const active = BANDS.find((b) => b.level === level);
  const markerAngle = active ? (active.from + active.to) / 2 : null;
  const marker = markerAngle !== null ? point(markerAngle, R - WIDTH / 2 - 14) : null;

  return (
    <svg viewBox="0 0 240 132" className={className} role="img" aria-label={level ? `${title}: ${level}` : title}>
      {BANDS.map((b) => (
        <path
          key={b.level}
          d={arc(b.from, b.to)}
          fill="none"
          stroke={b.color}
          strokeWidth={WIDTH}
          strokeLinecap="round"
          opacity={!level || b.level === level ? 1 : 0.18}
        />
      ))}
      {marker && markerAngle !== null && (
        <g transform={`translate(${marker.x} ${marker.y}) rotate(${90 - markerAngle})`}>
          {/* triangle pointing outward to the active band */}
          <path d="M -8 6 L 8 6 L 0 -9 Z" fill="#12263F" />
        </g>
      )}
    </svg>
  );
};

export default RiskGauge;
