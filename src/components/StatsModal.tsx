import React from 'react';
import { GameStats, ThemeId } from '../types/game';
import { THEMES } from '../utils/theme';
import { X, BarChart3, CheckCircle2, Star, Clock, Flame, Zap, Award } from 'lucide-react';

interface StatsModalProps {
  stats: GameStats;
  themeId: ThemeId;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  stats,
  themeId,
  onClose,
}) => {
  const theme = THEMES[themeId] || THEMES.light;

  const formatPlaytime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m ${totalSec % 60}s`;
  };

  const statItems = [
    { label: 'Levels Solved', value: stats.levelsSolved, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Perfect Runs (3★)', value: stats.perfectRuns, icon: Star, color: 'text-amber-500' },
    { label: 'Total Playtime', value: formatPlaytime(stats.totalPlaytimeSec), icon: Clock, color: 'text-blue-500' },
    { label: 'Current Streak', value: `${stats.currentStreak} days`, icon: Flame, color: 'text-orange-500' },
    { label: 'Longest Streak', value: `${stats.longestStreak} days`, icon: Award, color: 'text-indigo-500' },
    { label: 'Zen Boards Cleared', value: stats.zenBoardsCleared, icon: Zap, color: 'text-teal-500' },
    { label: 'Favorite Mode', value: stats.favoriteMode || 'Classic', icon: BarChart3, color: 'text-purple-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-colors"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
          color: theme.textPrimary,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.cardBorder }}>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-base">Player Statistics</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            style={{ color: theme.textSecondary }}
            aria-label="Close stats"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 my-4">
          {statItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3 rounded-2xl border bg-black/5 dark:bg-white/5"
                style={{ borderColor: theme.cardBorder }}
              >
                <div className="flex items-center gap-1.5 mb-1 opacity-70 text-[11px]">
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="font-bold font-mono text-base tabular-nums truncate">
                  {item.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
