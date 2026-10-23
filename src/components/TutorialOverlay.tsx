import React from 'react';
import { THEMES } from '../utils/theme';
import { ThemeId } from '../types/game';
import { Hand, Sparkles, X } from 'lucide-react';

interface TutorialOverlayProps {
  levelNumber: number;
  themeId: ThemeId;
  onDismiss: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  levelNumber,
  themeId,
  onDismiss,
}) => {
  const theme = THEMES[themeId] || THEMES.light;

  let title = '';
  let description = '';

  if (levelNumber === 1) {
    title = 'How to Play';
    description = 'Arrows slide out in the direction they point. Tap an arrow with a clear path out of the board.';
  } else if (levelNumber === 2) {
    title = 'Clear the Way';
    description = 'Outer arrows clear first. As they leave, they open up paths for blocked arrows behind them.';
  } else if (levelNumber === 3) {
    title = 'Think Ahead';
    description = 'Tapping a blocked arrow gently shakes it (or costs a heart in Classic mode). Look before you tap!';
  } else if (levelNumber === 30) {
    title = 'New: Locked Arrow';
    description = 'Arrows marked with a lock icon cannot leave until their companion key arrow has been cleared first.';
  } else if (levelNumber === 35) {
    title = 'New: Two-Tap Arrow';
    description = 'These arrows require two taps. The first tap unlocks the outer shell; the second tap launches it.';
  } else if (levelNumber === 40) {
    title = 'New: Rotating Arrow';
    description = 'After every move you make, rotating arrows turn 90° clockwise. Time your moves carefully!';
  } else if (levelNumber === 45) {
    title = 'New: Stone Walls';
    description = 'Solid stone walls are fixed in place. Arrows cannot slide through them.';
  } else {
    return null;
  }

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 max-w-sm w-[90%] pointer-events-auto">
      <div
        className="rounded-2xl p-3.5 shadow-lg backdrop-blur-md flex items-start gap-3 border transition-all animate-gentle-float"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
        }}
      >
        <div
          className="p-2 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${theme.accent}15`, color: theme.accent }}
        >
          {levelNumber <= 3 ? <Hand className="w-5 h-5 animate-pulse" /> : <Sparkles className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold tracking-tight" style={{ color: theme.textPrimary }}>
              {title}
            </h4>
            <button
              onClick={onDismiss}
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              style={{ color: theme.textSecondary }}
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: theme.textSecondary }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
