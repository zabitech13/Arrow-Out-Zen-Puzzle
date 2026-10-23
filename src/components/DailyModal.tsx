import React from 'react';
import { DailyResult, ThemeId } from '../types/game';
import { THEMES } from '../utils/theme';
import { X, Flame, Check, Play, Calendar as CalendarIcon, Star } from 'lucide-react';

interface DailyModalProps {
  streak: number;
  longestStreak: number;
  dailyHistory: Record<string, DailyResult>;
  themeId: ThemeId;
  onPlayToday: () => void;
  onClose: () => void;
}

export const DailyModal: React.FC<DailyModalProps> = ({
  streak,
  longestStreak,
  dailyHistory,
  themeId,
  onPlayToday,
  onClose,
}) => {
  const theme = THEMES[themeId] || THEMES.light;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  // Format today's date key YYYY-MM-DD
  const formatKey = (d: Date) => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayKey = formatKey(today);
  const isTodayCompleted = Boolean(dailyHistory[todayKey]?.completed);

  // Month info
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

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
            <CalendarIcon className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-base">Daily Challenges</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            style={{ color: theme.textSecondary }}
            aria-label="Close daily modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Streak Cluster */}
        <div className="my-4 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md">
              <Flame className="w-7 h-7 fill-white" />
            </div>
            <div>
              <div className="text-xl font-extrabold font-mono tabular-nums text-orange-600 dark:text-orange-400">
                {streak} Day Streak
              </div>
              <div className="text-[11px] opacity-70">
                Longest: {longestStreak} days · Solve daily to grow
              </div>
            </div>
          </div>

          <button
            onClick={onPlayToday}
            className="py-2.5 px-4 rounded-xl font-bold text-xs bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isTodayCompleted ? 'Replay' : 'Play Today'}</span>
          </button>
        </div>

        {/* Calendar Grid Header */}
        <div className="mb-2 flex items-center justify-between text-xs font-bold">
          <span>{monthNames[currentMonth]} {currentYear}</span>
          <span className="opacity-60 font-normal text-[11px]">
            {Object.keys(dailyHistory).filter((k) => k.startsWith(`${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`)).length} / {daysInMonth} Solved
          </span>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold opacity-50 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div key={idx} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Month Days Matrix */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayDate = new Date(currentYear, currentMonth, dayNum);
            const key = formatKey(dayDate);
            const isToday = key === todayKey;
            const isCompleted = dailyHistory[key]?.completed;
            const isFuture = dayDate > today;

            return (
              <div
                key={`day-${dayNum}`}
                className={`h-9 rounded-xl flex flex-col items-center justify-center text-xs relative transition-all border ${
                  isToday
                    ? 'border-orange-500 font-bold shadow-xs'
                    : 'border-transparent'
                } ${
                  isCompleted
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : isFuture
                    ? 'opacity-30'
                    : 'bg-black/5 dark:bg-white/5 opacity-80'
                }`}
              >
                <span>{dayNum}</span>
                {isCompleted && (
                  <Check className="w-2.5 h-2.5 text-emerald-500 absolute bottom-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t text-[11px] opacity-60 flex items-center justify-between" style={{ borderColor: theme.cardBorder }}>
          <span>Earn +5 Stars & +2 Power-ups per day</span>
          <span className="flex items-center gap-1 font-mono">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> +5
          </span>
        </div>
      </div>
    </div>
  );
};
