import React from 'react';
import { ArrowData, ArrowHeadShape, ArrowStyleId, ThicknessLevel } from '../types/game';
import { DIRECTION_OFFSETS } from '../utils/puzzleGenerator';
import { THICKNESS_PIXELS } from '../utils/theme';
import { Lock, RefreshCw } from 'lucide-react';

interface ArrowSvgProps {
  arrow: ArrowData;
  cellSize: number;
  color: string;
  arrowStyle: ArrowStyleId;
  headShape: ArrowHeadShape;
  thickness: ThicknessLevel;
  isSelected?: boolean;
  isHinted?: boolean;
  isXRayBlocked?: boolean;
  isShaking?: boolean;
  reduceEffects?: boolean;
  contrastTheme?: string;
}

export const ArrowSvg: React.FC<ArrowSvgProps> = ({
  arrow,
  cellSize,
  color,
  arrowStyle,
  headShape,
  thickness,
  isSelected,
  isHinted,
  isXRayBlocked,
  isShaking,
  reduceEffects,
  contrastTheme,
}) => {
  const { angle } = DIRECTION_OFFSETS[arrow.direction];
  const strokeWidth = THICKNESS_PIXELS[thickness];

  // Length and geometry within cell coordinate system (100x100 viewBox)
  const lineStartY = 74;
  const lineEndY = 26;
  const centerX = 50;

  // Render Arrow Head path based on chosen cosmetic shape
  const renderHead = () => {
    switch (headShape) {
      case 'chevron':
        return (
          <path
            d="M32 42 L50 24 L68 42 M32 52 L50 34 L68 52"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth * 0.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'diamond':
        return (
          <path
            d="M50 16 L65 30 L50 44 L35 30 Z"
            fill={arrowStyle === 'neon' ? 'transparent' : color}
            stroke={color}
            strokeWidth={strokeWidth * 0.8}
            strokeLinejoin="round"
          />
        );
      case 'arc':
        return (
          <path
            d="M30 38 Q50 16 70 38"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth * 1.1}
            strokeLinecap="round"
          />
        );
      case 'classic':
      default:
        return (
          <path
            d="M32 40 L50 22 L68 40"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap={arrowStyle === 'rounded' ? 'round' : 'square'}
            strokeLinejoin={arrowStyle === 'rounded' ? 'round' : 'miter'}
          />
        );
    }
  };

  const getStrokeDasharray = () => {
    if (arrowStyle === 'dotted') return '4 6';
    return undefined;
  };

  const filterEffect = () => {
    if (arrowStyle === 'neon' && !reduceEffects) {
      return `drop-shadow(0 0 6px ${color})`;
    }
    if (isHinted) {
      return 'drop-shadow(0 0 8px #10b981)';
    }
    return undefined;
  };

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center transition-transform duration-150 ${
        isShaking ? 'animate-gentle-shake' : ''
      }`}
      style={{
        opacity: isXRayBlocked ? 0.35 : 1,
      }}
    >
      {/* Invisible expanded hit target with visual selection / hint ring */}
      <div
        className={`absolute inset-0 rounded-xl transition-all duration-200 pointer-events-none ${
          isSelected
            ? 'ring-2 ring-blue-500 bg-blue-500/10'
            : isHinted
            ? 'ring-2 ring-emerald-500/80 bg-emerald-500/10 animate-soft-pulse'
            : ''
        }`}
      />

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: 'center center',
          filter: filterEffect(),
        }}
        aria-hidden="true"
      >
        {/* Glow backdrop for high contrast at night */}
        {contrastTheme !== 'light' && (
          <line
            x1={centerX}
            y1={lineStartY}
            x2={centerX}
            y2={lineEndY}
            stroke="rgba(0,0,0,0.4)"
            strokeWidth={strokeWidth + 3}
            strokeLinecap={arrowStyle === 'rounded' ? 'round' : 'butt'}
          />
        )}

        {/* Stem of arrow */}
        <line
          x1={centerX}
          y1={lineStartY}
          x2={centerX}
          y2={lineEndY}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap={arrowStyle === 'rounded' ? 'round' : 'butt'}
          strokeDasharray={getStrokeDasharray()}
        />

        {/* Arrowhead */}
        {renderHead()}

        {/* Two-Tap Outer Ring Indicator */}
        {arrow.mechanic === 'TWO_TAP' && arrow.tapsRemaining === 2 && (
          <circle
            cx={centerX}
            cy={lineStartY}
            r="8"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth * 0.75}
            strokeDasharray="3 3"
          />
        )}
      </svg>

      {/* Mechanic Overlays */}
      {arrow.mechanic === 'LOCKED' && (
        <div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500/90 text-white flex items-center justify-center shadow-sm"
          title="Locked arrow: must clear key arrow first"
        >
          <Lock className="w-2.5 h-2.5" />
        </div>
      )}

      {arrow.mechanic === 'ROTATING' && (
        <div
          className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-indigo-500/80 text-white flex items-center justify-center shadow-xs"
          title="Rotating arrow: turns 90° after each clear"
        >
          <RefreshCw className="w-2.5 h-2.5" />
        </div>
      )}

      {arrow.mechanic === 'TWO_TAP' && arrow.tapsRemaining === 2 && (
        <div
          className="absolute top-0 left-0 px-1 py-0.2 bg-blue-500 text-white text-[9px] font-bold rounded-sm leading-none"
          title="Requires 2 taps to exit"
        >
          2×
        </div>
      )}
    </div>
  );
};
