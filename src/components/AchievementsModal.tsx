import React from 'react';
import { Achievement, ThemeId } from '../types/game';
import { THEMES } from '../utils/theme';
import {
  X,
  Award,
  Star,
  Check,
  Flame,
  Sparkles,
  Trophy,
  Zap,
  Grid,
  Lock,
  Compass,
} from 'lucide-react';

interface AchievementsModalProps {
  achievements: Achievement[];
  totalStars: number;
  themeId: ThemeId;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  achievements,
  totalStars,
  themeId,
  onClose,
}) => {
  const theme = THEMES[themeId] || THEMES.light;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return Sparkles;
      case 'Star':
        return Star;
      case 'Flame':
        return Flame;
      case 'Trophy':
        return Trophy;
      case 'Compass':
        return Compass;
      case 'Lock':
        return Lock;
      case 'Zap':
        return Zap;
      case 'Grid':
        return Grid;
      default:
        return Award;
    }
  };

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-lg rounded-3xl p-6 shadow-2xl border flex flex-col max-h-[85vh] transition-colors"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
          color: theme.textPrimary,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.cardBorder }}>
          <div>
            <h3 className="font-bold text-base">Achievements & Badges</h3>
            <p className="text-xs opacity-60">
              {unlockedCount} of {achievements.length} Badges Unlocked
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            style={{ color: theme.textSecondary }}
            aria-label="Close achievements"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
          {achievements.map((ach) => {
            const Icon = getIcon(ach.icon);
            const isUnlocked = Boolean(ach.unlockedAt);
            const progress = ach.progress ?? (isUnlocked ? 1 : 0);
            const max = ach.maxProgress ?? 1;
            const percent = Math.min(100, Math.round((progress / max) * 100));

            return (
              <div
                key={ach.id}
                className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
                  isUnlocked
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-slate-200 dark:border-slate-800 opacity-60'
                }`}
                style={{ borderColor: isUnlocked ? undefined : theme.cardBorder }}
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    isUnlocked
                      ? 'bg-amber-400/20 text-amber-500'
                      : 'bg-black/5 dark:bg-white/5 opacity-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="font-bold text-xs truncate">{ach.title}</h4>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500 shrink-0">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      +{ach.rewardStars}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-70 leading-tight mb-1.5">{ach.description}</p>

                  {/* Progress bar if multi-step */}
                  {ach.maxProgress && ach.maxProgress > 1 && (
                    <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                </div>

                {isUnlocked && (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
