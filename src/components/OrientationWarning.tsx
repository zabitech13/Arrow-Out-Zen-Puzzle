import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, X, Check } from 'lucide-react';
import { ThemeId } from '../types/game';
import { THEMES } from '../utils/theme';

interface OrientationWarningProps {
  themeId: ThemeId;
}

export const OrientationWarning: React.FC<OrientationWarningProps> = ({ themeId }) => {
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Mobile landscape is typically height < 550px and width > height
      const isLandscape = window.innerWidth > window.innerHeight;
      const isSmallScreen = window.innerHeight < 550;
      setIsMobileLandscape(isLandscape && isSmallScreen);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // If dismissed or not mobile landscape, don't show
  if (!isMobileLandscape || isDismissed) {
    return null;
  }

  const theme = THEMES[themeId] || THEMES.light;

  return (
    <aside
      aria-label="Screen orientation suggestion"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in pointer-events-auto"
    >
      <div
        className="w-full max-w-sm rounded-3xl p-5 shadow-2xl border flex flex-col items-center text-center transition-all animate-gentle-float"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
          color: theme.textPrimary,
        }}
      >
        {/* Animated Phone Rotate Icon */}
        <div className="relative mb-3 w-16 h-16 flex items-center justify-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${theme.accent}15`, color: theme.accent }}
          >
            <Smartphone className="w-7 h-7 transform -rotate-90 transition-transform duration-500 animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 p-1 rounded-full bg-blue-500 text-white shadow-xs">
            <RotateCw className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-base font-bold tracking-tight mb-1">
          Portrait View Recommended
        </h3>
        <p className="text-xs opacity-70 max-w-xs mb-4 leading-relaxed">
          Rotate your device to portrait for the optimal puzzle experience and larger touch targets.
        </p>

        {/* Action Buttons */}
        <div className="w-full flex items-center gap-2">
          <button
            onClick={() => setIsDismissed(true)}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 active:scale-95 transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Continue in Landscape</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-2.5 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
            style={{ borderColor: theme.cardBorder, color: theme.textSecondary }}
            title="Dismiss notification"
            aria-label="Dismiss orientation recommendation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
