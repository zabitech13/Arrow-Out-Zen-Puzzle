import React from 'react';
import { GameMode, ThemeId } from '../types/game';
import { THEMES } from '../utils/theme';
import { Star, Play, RotateCcw, Share2, Film, Heart, Clock } from 'lucide-react';

interface ResultModalProps {
  levelNumber: number;
  chapterName: string;
  isDaily?: boolean;
  isZen?: boolean;
  gameMode: GameMode;
  stars: number;
  timeSec: number;
  heartsLeft: number;
  mistakes: number;
  isPerfectRun: boolean;
  onNextLevel: () => void;
  onReplayLevel: () => void;
  onWatchReplay: () => void;
  onOpenShare: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  levelNumber,
  chapterName,
  isDaily,
  isZen,
  gameMode,
  stars,
  timeSec,
  heartsLeft,
  mistakes,
  isPerfectRun,
  onNextLevel,
  onReplayLevel,
  onWatchReplay,
  onOpenShare,
}) => {
  const theme = THEMES['light']; // Default fallback or prop

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const getGradingExplanation = () => {
    if (isZen) return 'Board cleared smoothly in Zen Flow';
    if (stars === 3) return '3 Stars · Flawless precision (0 mistakes)';
    if (stars === 2) return '2 Stars · Great focus (1-2 mistakes)';
    return '1 Star · Level cleared';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl transition-all border text-center"
        style={{
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
        }}
      >
        <div className="mb-1 text-xs font-semibold tracking-wider uppercase text-slate-400">
          {isDaily ? 'Daily Challenge' : isZen ? 'Zen Board Complete' : `Level ${levelNumber} · ${chapterName}`}
        </div>

        <h2 className="text-xl font-bold tracking-tight text-slate-800">
          {isPerfectRun ? 'Flawless Clear' : 'Level Complete'}
        </h2>

        {/* Clear Grading Stars */}
        {!isZen && (
          <div className="flex justify-center items-center gap-2 my-4">
            {[1, 2, 3].map((starIdx) => {
              const active = starIdx <= stars;
              return (
                <div
                  key={`star-${starIdx}`}
                  className="transition-transform duration-300"
                  style={{ transform: active ? 'scale(1)' : 'scale(0.85)' }}
                >
                  <Star
                    className={`w-9 h-9 ${
                      active
                        ? 'fill-amber-400 text-amber-500 drop-shadow-sm'
                        : 'text-slate-200 fill-transparent'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Clear grading 1-line plain English explanation */}
        <p className="text-xs font-medium text-slate-500 mb-5">{getGradingExplanation()}</p>

        {/* Metrics Row: Time & Hearts */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex flex-col items-center">
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mb-0.5">
              <Clock className="w-3.5 h-3.5" /> Time
            </span>
            <span className="font-mono tabular-nums text-sm font-bold text-slate-700">
              {formatTime(timeSec)}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mb-0.5">
              <Heart className="w-3.5 h-3.5" /> Mistakes
            </span>
            <span className="font-mono tabular-nums text-sm font-bold text-slate-700">
              {mistakes === 0 ? '0 (None)' : mistakes}
            </span>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onNextLevel}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>{isDaily ? 'Finish Daily' : 'Next Level'}</span>
            <Play className="w-4 h-4 fill-white" />
          </button>

          <div className="grid grid-cols-3 gap-2">
            {isPerfectRun ? (
              <button
                onClick={onWatchReplay}
                className="py-2.5 px-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                title="Watch peaceful replay of clearing sequence"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={onOpenShare}
              className="py-2.5 px-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              title="Share clean victory card"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              onClick={onReplayLevel}
              className="py-2.5 px-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              title="Retry level for free"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
