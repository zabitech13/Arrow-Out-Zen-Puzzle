import React, { useState, useEffect } from 'react';
import { ArrowData, LevelData, UserSettings } from '../types/game';
import { ArrowSvg } from './ArrowSvg';
import { THEMES, CHAPTER_PALETTES } from '../utils/theme';
import { sound } from '../utils/audio';
import { FastForward, Play, Pause } from 'lucide-react';

interface ReplayViewerProps {
  levelData: LevelData;
  moveHistory: ArrowData[];
  settings: UserSettings;
  onClose: () => void;
}

export const ReplayViewer: React.FC<ReplayViewerProps> = ({
  levelData,
  moveHistory,
  settings,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const theme = THEMES[settings.theme] || THEMES.light;
  const chapterPalette =
    CHAPTER_PALETTES[settings.chapterOverride || levelData.chapterId] || CHAPTER_PALETTES.garden;

  const maxDim = Math.max(levelData.rows, levelData.cols);
  const cellSize = Math.max(48, Math.min(68, Math.floor(400 / maxDim)));

  // Filter remaining arrows at current replay step
  const clearedIds = new Set(moveHistory.slice(0, currentStep).map((a) => a.id));
  const remainingArrows = levelData.arrows.filter((a) => !clearedIds.has(a.id));

  useEffect(() => {
    if (!isPlaying) return;

    if (currentStep >= moveHistory.length) {
      // Replay complete, wait a moment then close
      const finishTimer = setTimeout(() => {
        onClose();
      }, 1200);
      return () => clearTimeout(finishTimer);
    }

    const timer = setTimeout(() => {
      sound.playArrowExit(currentStep);
      setCurrentStep((s) => s + 1);
    }, 420);

    return () => clearTimeout(timer);
  }, [currentStep, isPlaying, moveHistory.length, onClose]);

  const getArrowColor = (arrow: ArrowData) => {
    const colors = chapterPalette.colors;
    return colors[arrow.colorIndex % colors.length];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md rounded-3xl p-6 bg-slate-900 border border-slate-800 text-white shadow-2xl flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-100">Perfect Run Replay</h3>
            <p className="text-xs text-slate-400">
              Move {currentStep} of {moveHistory.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="py-1 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all flex items-center gap-1.5"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Skip</span>
          </button>
        </div>

        {/* Board container */}
        <div
          className="relative rounded-2xl shadow-inner p-3 transition-colors mb-5"
          style={{
            backgroundColor: theme.boardBg,
            border: `2px solid ${theme.boardBorder}`,
            width: levelData.cols * cellSize + 24,
            height: levelData.rows * cellSize + 24,
          }}
        >
          <div
            className="grid w-full h-full relative"
            style={{
              gridTemplateRows: `repeat(${levelData.rows}, ${cellSize}px)`,
              gridTemplateColumns: `repeat(${levelData.cols}, ${cellSize}px)`,
            }}
          >
            {/* Walls */}
            {levelData.walls.map((wall) => (
              <div
                key={wall.id}
                className="absolute rounded-md shadow-inner flex items-center justify-center"
                style={{
                  top: wall.row * cellSize,
                  left: wall.col * cellSize,
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: theme.wallBg,
                  border: `1px solid ${theme.wallBorder}`,
                }}
              />
            ))}

            {/* Remaining Arrows */}
            {remainingArrows.map((arrow) => (
              <div
                key={arrow.id}
                className="absolute transition-all duration-300"
                style={{
                  top: arrow.row * cellSize,
                  left: arrow.col * cellSize,
                  width: cellSize,
                  height: cellSize,
                  padding: Math.max(4, cellSize * 0.1),
                }}
              >
                <ArrowSvg
                  arrow={arrow}
                  cellSize={cellSize}
                  color={getArrowColor(arrow)}
                  arrowStyle={settings.arrowStyle}
                  headShape={settings.arrowHeadShape}
                  thickness={settings.arrowThickness}
                  reduceEffects={settings.reduceEffects}
                  contrastTheme={settings.theme}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
            title={isPlaying ? 'Pause' : 'Resume'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
        </div>
      </div>
    </div>
  );
};
