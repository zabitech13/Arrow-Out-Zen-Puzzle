import React from 'react';
import { GameMode, PowerUpInventory, UserSettings } from '../types/game';
import { THEMES } from '../utils/theme';
import {
  Heart,
  RotateCcw,
  SkipForward,
  Settings,
  Sparkles,
  Eye,
  Shuffle,
  Undo2,
  Calendar,
  Flame,
  Award,
  ShoppingBag,
  BarChart3,
  WifiOff,
} from 'lucide-react';

interface HUDProps {
  levelNumber: number;
  chapterName: string;
  isDaily?: boolean;
  isZen?: boolean;
  gameMode: GameMode;
  hearts: number;
  maxHearts: number;
  mistakes: number;
  elapsedSec: number;
  stars: number;
  streak: number;
  powerUps: PowerUpInventory;
  settings: UserSettings;
  canSkipLevel: boolean;
  canUndo: boolean;
  onRestart: () => void;
  onSkipLevel: () => void;
  onUsePowerUp: (type: 'hint' | 'xray' | 'shuffle' | 'undo') => void;
  onOpenSettings: () => void;
  onOpenDaily: () => void;
  onOpenAchievements: () => void;
  onOpenShop: () => void;
  onOpenStats: () => void;
  onChangeMode: (mode: GameMode) => void;
}

export const HUD: React.FC<HUDProps> = ({
  levelNumber,
  chapterName,
  isDaily,
  isZen,
  gameMode,
  hearts,
  maxHearts,
  elapsedSec,
  stars,
  streak,
  powerUps,
  settings,
  canSkipLevel,
  canUndo,
  onRestart,
  onSkipLevel,
  onUsePowerUp,
  onOpenSettings,
  onOpenDaily,
  onOpenAchievements,
  onOpenShop,
  onOpenStats,
  onChangeMode,
}) => {
  const theme = THEMES[settings.theme] || THEMES.light;
  const isBig = settings.bigUI;

  // Format seconds into MM:SS
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  // Render Hearts or Mode Badge
  const renderLifeIndicator = () => {
    if (isZen) {
      return (
        <span
          className="text-xs font-medium tracking-wide uppercase px-2 py-0.5 rounded-md"
          style={{ backgroundColor: `${theme.accent}15`, color: theme.accent }}
        >
          Zen Endless
        </span>
      );
    }

    if (gameMode === 'RELAXED') {
      return (
        <div className="flex items-center gap-1.5 text-emerald-500 font-medium text-xs">
          <Heart className="w-4 h-4 fill-emerald-500 text-emerald-500" />
          <span>Infinite Relaxed</span>
        </div>
      );
    }

    if (gameMode === 'CHALLENGE') {
      return (
        <div className="flex items-center gap-1.5 text-amber-500 font-semibold text-xs">
          <Heart
            className={`w-4 h-4 transition-all ${
              hearts > 0 ? 'fill-amber-500 text-amber-500' : 'text-slate-400 opacity-40'
            }`}
          />
          <span className="tabular-nums">1 Heart (+Bonus Star)</span>
        </div>
      );
    }

    // Classic 3 Hearts
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: maxHearts }).map((_, i) => {
          const isAlive = i < hearts;
          return (
            <Heart
              key={`heart-${i}`}
              className={`w-4 h-4 transition-colors duration-200 ${
                isAlive ? 'fill-rose-500 text-rose-500' : 'text-slate-400/40 fill-transparent'
              }`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Top Header Bar */}
      <header
        className="w-full px-4 py-2.5 flex items-center justify-between z-30 select-none border-b transition-colors"
        style={{
          backgroundColor: theme.bg,
          borderColor: theme.cardBorder,
        }}
      >
        {/* Left Section: Level / Chapter & Mode Switcher */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight" style={{ color: theme.textPrimary }}>
                {isDaily ? 'Daily Challenge' : isZen ? `Zen Board #${levelNumber}` : `Level ${levelNumber}`}
              </span>
              {!isDaily && !isZen && (
                <span className="text-xs hidden sm:inline" style={{ color: theme.textSecondary }}>
                  · {chapterName}
                </span>
              )}
            </div>

            <div className="mt-0.5 flex items-center gap-2">
              {renderLifeIndicator()}
              {!isZen && (
                <span className="text-xs font-mono tabular-nums" style={{ color: theme.textSecondary }}>
                  · {formatTime(elapsedSec)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center / Right Section: Streak, Stars & Top Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Flame Daily Streak */}
          <button
            onClick={onOpenDaily}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            style={{ color: '#f97316' }}
            title="Daily Challenge Streak & Calendar"
            aria-label={`Daily challenge streak: ${streak} days`}
          >
            <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-gentle-float" />
            <span className="font-mono tabular-nums font-bold">{streak}</span>
          </button>

          {/* Stars Collected */}
          <button
            onClick={onOpenShop}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            style={{ color: '#eab308' }}
            title="Stars / Cosmetic Unlock Shop"
            aria-label={`Total stars collected: ${stars}`}
          >
            <Award className="w-4 h-4 fill-amber-400 text-amber-500" />
            <span className="font-mono tabular-nums font-bold">{stars}</span>
          </button>

          {/* Instant Free Restart */}
          <button
            onClick={onRestart}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
            style={{ color: theme.textSecondary }}
            title="Restart Level (Free & Instant)"
            aria-label="Restart level instantly"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Skip Level Button (Available every 5 levels or if struggled) */}
          {canSkipLevel && !isDaily && (
            <button
              onClick={onSkipLevel}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
              style={{ color: theme.accent }}
              title="Skip this level"
              aria-label="Skip level"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          )}

          {/* Achievements */}
          <button
            onClick={onOpenAchievements}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all hidden sm:flex"
            style={{ color: theme.textSecondary }}
            title="Badges & Achievements"
            aria-label="Achievements modal"
          >
            <Award className="w-4 h-4" />
          </button>

          {/* Stats */}
          <button
            onClick={onOpenStats}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all hidden sm:flex"
            style={{ color: theme.textSecondary }}
            title="Game Statistics"
            aria-label="Game statistics"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* Cosmetics Shop */}
          <button
            onClick={onOpenShop}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all hidden sm:flex"
            style={{ color: theme.textSecondary }}
            title="Unlock Arrow Styles & Themes"
            aria-label="Cosmetics shop"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
            style={{ color: theme.textSecondary }}
            title="Game Settings"
            aria-label="Open settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Bottom Floating Power-Ups HUD */}
      <footer
        className={`absolute bottom-3 left-0 right-0 z-20 flex justify-center pointer-events-none px-4 ${
          settings.leftHanded ? 'sm:justify-start sm:left-4' : 'sm:justify-center'
        }`}
      >
        <div
          className={`pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 p-1.5 rounded-2xl shadow-lg backdrop-blur-md transition-all ${
            isBig ? 'scale-110' : ''
          }`}
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
          }}
        >
          {/* Hint Power-up */}
          <button
            onClick={() => onUsePowerUp('hint')}
            disabled={powerUps.hint <= 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              powerUps.hint > 0
                ? 'hover:bg-black/5 dark:hover:bg-white/10 active:scale-95'
                : 'opacity-40 cursor-not-allowed'
            }`}
            style={{ color: theme.safeHighlight }}
            title="Hint: Highlights a safe unblocked arrow"
            aria-label={`Hint power-up. ${powerUps.hint} remaining.`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden xs:inline">Hint</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              {powerUps.hint}
            </span>
          </button>

          {/* X-Ray Power-up */}
          <button
            onClick={() => onUsePowerUp('xray')}
            disabled={powerUps.xray <= 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              powerUps.xray > 0
                ? 'hover:bg-black/5 dark:hover:bg-white/10 active:scale-95'
                : 'opacity-40 cursor-not-allowed'
            }`}
            style={{ color: theme.accent }}
            title="X-Ray: Dims all blocked arrows for 3 seconds"
            aria-label={`X-Ray power-up. ${powerUps.xray} remaining.`}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden xs:inline">X-Ray</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums bg-blue-500/15 text-blue-600 dark:text-blue-400">
              {powerUps.xray}
            </span>
          </button>

          {/* Shuffle Colors Power-up */}
          <button
            onClick={() => onUsePowerUp('shuffle')}
            disabled={powerUps.shuffle <= 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              powerUps.shuffle > 0
                ? 'hover:bg-black/5 dark:hover:bg-white/10 active:scale-95'
                : 'opacity-40 cursor-not-allowed'
            }`}
            style={{ color: '#a855f7' }}
            title="Shuffle Colors: Re-arranges arrow hues for fresh perspective"
            aria-label={`Shuffle colors power-up. ${powerUps.shuffle} remaining.`}
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden xs:inline">Colors</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums bg-purple-500/15 text-purple-600 dark:text-purple-400">
              {powerUps.shuffle}
            </span>
          </button>

          {/* Undo Last Move */}
          <button
            onClick={() => onUsePowerUp('undo')}
            disabled={!canUndo || powerUps.undo <= 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              canUndo && powerUps.undo > 0
                ? 'hover:bg-black/5 dark:hover:bg-white/10 active:scale-95'
                : 'opacity-40 cursor-not-allowed'
            }`}
            style={{ color: theme.textSecondary }}
            title="Undo Last Move"
            aria-label={`Undo last move. ${powerUps.undo} remaining.`}
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden xs:inline">Undo</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums bg-slate-500/15 text-slate-600 dark:text-slate-400">
              {powerUps.undo}
            </span>
          </button>
        </div>
      </footer>

      {/* Offline Ready Quiet Indicator */}
      <div
        className="absolute top-14 left-4 z-10 flex items-center gap-1 text-[10px] font-medium pointer-events-none opacity-60"
        style={{ color: theme.textSecondary }}
      >
        <WifiOff className="w-3 h-3" />
        <span>Offline Ready</span>
      </div>
    </>
  );
};
