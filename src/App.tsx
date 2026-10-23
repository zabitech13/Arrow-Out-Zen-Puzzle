import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowData,
  GameMode,
  LevelData,
  PowerUpType,
  UserSettings,
} from './types/game';
import {
  checkArrowClearance,
  DIRECTION_OFFSETS,
  generatePuzzle,
  ROTATE_CW,
} from './utils/puzzleGenerator';
import {
  getDefaultSaveData,
  loadSaveData,
  saveGameData,
  SaveData,
} from './utils/storage';
import { sound } from './utils/audio';
import { triggerHaptic } from './utils/haptics';
import { THEMES, CHAPTER_PALETTES } from './utils/theme';
import { GameBoard } from './components/GameBoard';
import { HUD } from './components/HUD';
import { TutorialOverlay } from './components/TutorialOverlay';
import { ResultModal } from './components/ResultModal';
import { ShareModal } from './components/ShareModal';
import { ReplayViewer } from './components/ReplayViewer';
import { SettingsModal } from './components/SettingsModal';
import { DailyModal } from './components/DailyModal';
import { AchievementsModal } from './components/AchievementsModal';
import { CosmeticsShopModal } from './components/CosmeticsShopModal';
import { StatsModal } from './components/StatsModal';
import { OrientationWarning } from './components/OrientationWarning';
import {
  Play,
  RotateCcw,
  Sparkles,
  Award,
  Calendar,
  Flame,
  Volume2,
  VolumeX,
  Sliders,
  ChevronRight,
} from 'lucide-react';

type ScreenState = 'TITLE' | 'PLAYING';

export default function App() {
  // Saved data state
  const [saveData, setSaveData] = useState<SaveData>(loadSaveData);
  const [screen, setScreen] = useState<ScreenState>('TITLE');

  // Active level state
  const [levelData, setLevelData] = useState<LevelData>(() =>
    generatePuzzle(saveData.currentLevel)
  );
  const [activeArrows, setActiveArrows] = useState<ArrowData[]>(
    () => levelData.arrows
  );
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
  const [hintedArrowId, setHintedArrowId] = useState<string | null>(null);
  const [shakingArrowId, setShakingArrowId] = useState<string | null>(null);
  const [exitingArrows, setExitingArrows] = useState<
    { arrow: ArrowData; color: string; flyX: number; flyY: number; rotation: number }[]
  >([]);

  // Health and score tracking
  const [hearts, setHearts] = useState<number>(3);
  const [maxHearts, setMaxHearts] = useState<number>(3);
  const [mistakes, setMistakes] = useState<number>(0);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [isLevelCleared, setIsLevelCleared] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(true);

  // Power-up states
  const [xrayActive, setXrayActive] = useState<boolean>(false);
  const [moveHistory, setMoveHistory] = useState<ArrowData[]>([]);

  // Modal displays
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showReplayViewer, setShowReplayViewer] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showDailyModal, setShowDailyModal] = useState<boolean>(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState<boolean>(false);
  const [showShopModal, setShowShopModal] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);

  // Combos & ASMR audio pitch rising
  const comboRef = useRef<number>(0);
  const lastClearTimeRef = useRef<number>(0);
  const idleTimerRef = useRef<number | null>(null);

  const theme = THEMES[saveData.settings.theme] || THEMES.light;
  const chapterName =
    CHAPTER_PALETTES[
      saveData.settings.chapterOverride || levelData.chapterId
    ]?.name || 'Garden';

  // Save changes to storage whenever saveData updates
  useEffect(() => {
    saveGameData(saveData);
  }, [saveData]);

  // Audio engine initialization
  useEffect(() => {
    sound.setConfig(
      saveData.settings.soundPack,
      saveData.settings.sfxVolume,
      saveData.settings.ambientVolume,
      saveData.settings.ambientMusic
    );
  }, [
    saveData.settings.soundPack,
    saveData.settings.sfxVolume,
    saveData.settings.ambientVolume,
    saveData.settings.ambientMusic,
  ]);

  // Load a specific puzzle
  const initLevel = useCallback(
    (lvlNum: number, options?: { isDaily?: boolean; isZen?: boolean }) => {
      const isDaily = options?.isDaily;
      const isZen = options?.isZen || saveData.settings.gameMode === 'ZEN';
      const todayKey = new Date().toISOString().slice(0, 10);

      const puzzle = generatePuzzle(lvlNum, {
        isDaily,
        dateKey: isDaily ? todayKey : undefined,
        isZen,
      });

      setLevelData(puzzle);
      setActiveArrows(puzzle.arrows);
      setSelectedArrowId(null);
      setHintedArrowId(null);
      setShakingArrowId(null);
      setExitingArrows([]);
      setMoveHistory([]);
      setMistakes(0);
      setElapsedSec(0);
      setIsLevelCleared(false);
      setIsGameOver(false);
      setShowResultModal(false);
      setShowTutorial(lvlNum <= 3 || lvlNum === 30 || lvlNum === 35 || lvlNum === 40 || lvlNum === 45);

      // Hearts setup based on Game Mode
      if (isZen || saveData.settings.gameMode === 'RELAXED') {
        setHearts(999);
        setMaxHearts(999);
      } else if (saveData.settings.gameMode === 'CHALLENGE') {
        setHearts(1);
        setMaxHearts(1);
      } else {
        setHearts(3);
        setMaxHearts(3);
      }
    },
    [saveData.settings.gameMode]
  );

  // Start Playing from Title
  const handleStartGame = (mode?: GameMode) => {
    if (mode) {
      setSaveData((prev) => ({
        ...prev,
        settings: { ...prev.settings, gameMode: mode },
      }));
    }
    initLevel(saveData.currentLevel);
    setScreen('PLAYING');
    sound.init();
  };

  // Timer loop
  useEffect(() => {
    if (screen !== 'PLAYING' || isLevelCleared || isGameOver) return;
    const interval = setInterval(() => {
      setElapsedSec((s) => s + 1);
      setSaveData((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          totalPlaytimeSec: prev.stats.totalPlaytimeSec + 1,
        },
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [screen, isLevelCleared, isGameOver]);

  // Smart Auto-Hints: 20 seconds inactivity
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (!saveData.settings.autoHints) return;

    idleTimerRef.current = window.setTimeout(() => {
      // Find any clear arrow to gently pulse
      const safe = activeArrows.find(
        (a) =>
          checkArrowClearance(
            a,
            activeArrows,
            levelData.walls,
            levelData.rows,
            levelData.cols
          ).isClear
      );
      if (safe) {
        setHintedArrowId(safe.id);
      }
    }, 20000);
  }, [
    activeArrows,
    levelData.cols,
    levelData.rows,
    levelData.walls,
    saveData.settings.autoHints,
  ]);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [activeArrows, resetIdleTimer]);

  // Handle Arrow Tap
  const handleArrowTap = (arrow: ArrowData) => {
    if (isLevelCleared || isGameOver) return;
    resetIdleTimer();
    setHintedArrowId(null);

    // Check path clearance
    const clearance = checkArrowClearance(
      arrow,
      activeArrows,
      levelData.walls,
      levelData.rows,
      levelData.cols
    );

    if (!clearance.isClear) {
      // BLOCKED MOVE
      sound.playInvalidTap();
      triggerHaptic(saveData.settings.hapticIntensity, 'invalid');
      setShakingArrowId(arrow.id);
      setTimeout(() => setShakingArrowId(null), 300);
      setMistakes((m) => m + 1);

      // In Classic or Challenge mode, deduct heart
      if (
        saveData.settings.gameMode === 'CLASSIC' ||
        saveData.settings.gameMode === 'CHALLENGE'
      ) {
        setHearts((h) => {
          const next = Math.max(0, h - 1);
          if (next === 0) {
            setIsGameOver(true);
          }
          return next;
        });
      }
      return;
    }

    // TWO-TAP MECHANIC CHECK:
    if (arrow.mechanic === 'TWO_TAP' && arrow.tapsRemaining > 1) {
      sound.playTwoTapTick();
      triggerHaptic(saveData.settings.hapticIntensity, 'tap');
      setActiveArrows((prev) =>
        prev.map((a) =>
          a.id === arrow.id ? { ...a, tapsRemaining: a.tapsRemaining - 1 } : a
        )
      );
      return;
    }

    // VALID CLEAR MOVE!
    const now = Date.now();
    if (now - lastClearTimeRef.current < 1600) {
      comboRef.current = Math.min(10, comboRef.current + 1);
    } else {
      comboRef.current = 0;
    }
    lastClearTimeRef.current = now;

    sound.playArrowExit(comboRef.current);
    triggerHaptic(saveData.settings.hapticIntensity, 'tap');

    // Trigger visual curved exit flight
    const { dr, dc } = DIRECTION_OFFSETS[arrow.direction];
    const flyDist = Math.max(levelData.rows, levelData.cols) * 85 + 100;
    const curveOffset = saveData.settings.reduceEffects
      ? 0
      : (Math.random() - 0.5) * 40;

    const palette =
      CHAPTER_PALETTES[
        saveData.settings.chapterOverride || levelData.chapterId
      ]?.colors || CHAPTER_PALETTES.garden.colors;
    const arrowColor = palette[arrow.colorIndex % palette.length];

    setExitingArrows((prev) => [
      ...prev,
      {
        arrow,
        color: arrowColor,
        flyX: dc * flyDist + (dr !== 0 ? curveOffset : 0),
        flyY: dr * flyDist + (dc !== 0 ? curveOffset : 0),
        rotation: saveData.settings.reduceEffects ? 0 : curveOffset * 0.5,
      },
    ]);

    setTimeout(() => {
      setExitingArrows((prev) => prev.filter((item) => item.arrow.id !== arrow.id));
    }, 320);

    // Remove from active arrows and update rotating arrows
    const remaining = activeArrows.filter((a) => a.id !== arrow.id);
    const updatedWithRotations = remaining.map((a) => {
      if (a.mechanic === 'ROTATING') {
        return {
          ...a,
          direction: ROTATE_CW[a.direction],
        };
      }
      return a;
    });

    setActiveArrows(updatedWithRotations);
    setMoveHistory((prev) => [...prev, arrow]);

    // Check if any locked arrow was just unlocked
    const unlockedNow = updatedWithRotations.filter(
      (a) => a.mechanic === 'LOCKED' && a.lockRequiredId === arrow.id
    );
    if (unlockedNow.length > 0) {
      setTimeout(() => {
        sound.playUnlock();
        triggerHaptic(saveData.settings.hapticIntensity, 'unlock');
      }, 150);
    }

    // CHECK LEVEL COMPLETION
    if (remaining.length === 0) {
      handleLevelWin(moveHistory.length + 1);
    }
  };

  // Level Win handler
  const handleLevelWin = (totalMoves: number) => {
    setIsLevelCleared(true);
    sound.playVictory();
    triggerHaptic(saveData.settings.hapticIntensity, 'victory');

    // Grade calculation (Stars 1-3)
    let awardedStars = 1;
    if (mistakes === 0) {
      awardedStars = 3;
    } else if (mistakes <= 2) {
      awardedStars = 2;
    }
    // Challenge mode bonus
    if (saveData.settings.gameMode === 'CHALLENGE' && mistakes === 0) {
      awardedStars = 3; // +1 bonus star
    }

    const isPerfect = mistakes === 0;

    // Check Daily completion
    const todayKey = new Date().toISOString().slice(0, 10);
    let nextStreak = saveData.streak;
    let nextDailyHistory = { ...saveData.dailyHistory };

    if (levelData.isDaily) {
      if (!nextDailyHistory[todayKey]?.completed) {
        nextStreak = saveData.streak + 1;
        nextDailyHistory[todayKey] = {
          completed: true,
          stars: awardedStars,
          timeSec: elapsedSec,
        };
      }
    }

    // Update achievements
    const nextAch = saveData.achievements.map((ach) => {
      if (ach.id === 'first_clear' && !ach.unlockedAt) {
        return { ...ach, unlockedAt: Date.now() };
      }
      if (ach.id === 'ten_perfect' && isPerfect) {
        const cur = (ach.progress || 0) + 1;
        return {
          ...ach,
          progress: cur,
          unlockedAt: cur >= 10 ? Date.now() : ach.unlockedAt,
        };
      }
      if (ach.id === 'zen_10' && saveData.settings.gameMode === 'ZEN') {
        const cur = (ach.progress || 0) + 1;
        return {
          ...ach,
          progress: cur,
          unlockedAt: cur >= 10 ? Date.now() : ach.unlockedAt,
        };
      }
      return ach;
    });

    // Update persistent state
    setSaveData((prev) => {
      const prevStars = prev.levelStars[levelData.levelNumber] || 0;
      const newStarDiff = Math.max(0, awardedStars - prevStars);

      return {
        ...prev,
        stars: prev.stars + newStarDiff + (levelData.isDaily ? 5 : 0),
        levelStars: {
          ...prev.levelStars,
          [levelData.levelNumber]: Math.max(prevStars, awardedStars),
        },
        highestLevel: Math.max(prev.highestLevel, levelData.levelNumber + 1),
        currentLevel: levelData.isDaily
          ? prev.currentLevel
          : levelData.levelNumber + 1,
        streak: nextStreak,
        dailyHistory: nextDailyHistory,
        achievements: nextAch,
        stats: {
          ...prev.stats,
          levelsSolved: prev.stats.levelsSolved + 1,
          perfectRuns: isPerfect ? prev.stats.perfectRuns + 1 : prev.stats.perfectRuns,
          longestStreak: Math.max(prev.stats.longestStreak, nextStreak),
          currentStreak: nextStreak,
          zenBoardsCleared:
            saveData.settings.gameMode === 'ZEN'
              ? prev.stats.zenBoardsCleared + 1
              : prev.stats.zenBoardsCleared,
        },
      };
    });

    setTimeout(() => {
      setShowResultModal(true);
    }, 550);
  };

  // Power-up handlers
  const handleUsePowerUp = (type: PowerUpType) => {
    if (saveData.powerUps[type] <= 0 || isLevelCleared || isGameOver) return;

    sound.playPowerUp();

    // Deduct charge
    setSaveData((prev) => ({
      ...prev,
      powerUps: {
        ...prev.powerUps,
        [type]: prev.powerUps[type] - 1,
      },
      stats: {
        ...prev.stats,
        powerUpsUsed: prev.stats.powerUpsUsed + 1,
      },
    }));

    switch (type) {
      case 'hint': {
        const safe = activeArrows.find(
          (a) =>
            checkArrowClearance(
              a,
              activeArrows,
              levelData.walls,
              levelData.rows,
              levelData.cols
            ).isClear
        );
        if (safe) {
          setHintedArrowId(safe.id);
        }
        break;
      }
      case 'xray': {
        setXrayActive(true);
        setTimeout(() => setXrayActive(false), 3000);
        break;
      }
      case 'shuffle': {
        setActiveArrows((prev) =>
          prev.map((a) => ({
            ...a,
            colorIndex: Math.floor(Math.random() * 6),
          }))
        );
        break;
      }
      case 'undo': {
        if (moveHistory.length === 0) return;
        const lastMove = moveHistory[moveHistory.length - 1];
        setMoveHistory((prev) => prev.slice(0, -1));
        setActiveArrows((prev) => [...prev, lastMove]);
        break;
      }
    }
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSettingsModal || showShopModal || showDailyModal) return;

      if (e.key === 'r' || e.key === 'R') {
        initLevel(levelData.levelNumber, { isDaily: levelData.isDaily });
      } else if (e.key === 'h' || e.key === 'H') {
        handleUsePowerUp('hint');
      } else if (e.key === 'x' || e.key === 'X') {
        handleUsePowerUp('xray');
      } else if (e.key === 'u' || e.key === 'U') {
        handleUsePowerUp('undo');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    levelData.isDaily,
    levelData.levelNumber,
    initLevel,
    showDailyModal,
    showSettingsModal,
    showShopModal,
  ]);

  // Restart level
  const handleRestart = () => {
    initLevel(levelData.levelNumber, { isDaily: levelData.isDaily });
  };

  // Next level
  const handleNextLevel = () => {
    setShowResultModal(false);
    initLevel(levelData.levelNumber + 1);
  };

  // Skip level (available every 5 levels or when stuck)
  const canSkipLevel = levelData.levelNumber % 5 === 0 || mistakes >= 3;
  const handleSkipLevel = () => {
    initLevel(levelData.levelNumber + 1);
  };

  return (
    <div
      className="relative w-screen h-screen flex flex-col overflow-hidden select-none transition-colors duration-300"
      style={{
        backgroundColor: theme.bg,
        color: theme.textPrimary,
      }}
    >
      {/* SCREEN 1: TITLE SCREEN / GAME SHELL */}
      {screen === 'TITLE' ? (
        <div className="relative w-full h-full flex flex-col items-center justify-between p-6 sm:p-12 z-20 overflow-y-auto">
          {/* Subtle Ambient Top Status */}
          <div className="w-full max-w-4xl flex items-center justify-between text-xs opacity-70">
            <span className="font-semibold tracking-wider uppercase">
              A Minimalist Arrow Puzzle
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 font-mono text-amber-500 font-bold">
                <Award className="w-4 h-4 fill-current" /> {saveData.stars}
              </span>
              <span className="flex items-center gap-1 font-mono text-orange-500 font-bold">
                <Flame className="w-4 h-4 fill-current" /> {saveData.streak}d
              </span>
            </div>
          </div>

          {/* Hero Centerpiece: Inline SVG Title Lockup */}
          <div className="my-auto flex flex-col items-center text-center max-w-md">
            <div className="relative mb-6 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
              {/* Decorative Geometric Rings */}
              <div className="absolute inset-0 rounded-3xl border-2 border-slate-300 dark:border-slate-700 animate-gentle-float" />
              <div className="absolute inset-2 rounded-2xl bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center">
                {/* 4 Directions Compass Arrow SVG */}
                <svg viewBox="0 0 100 100" className="w-14 h-14 text-blue-600 dark:text-blue-400">
                  <path
                    d="M50 16 L58 32 L50 28 L42 32 Z"
                    fill="currentColor"
                  />
                  <path
                    d="M84 50 L68 58 L72 50 L68 42 Z"
                    fill="currentColor"
                  />
                  <path
                    d="M50 84 L42 68 L50 72 L58 68 Z"
                    fill="currentColor"
                  />
                  <path
                    d="M16 50 L32 42 L28 50 L32 58 Z"
                    fill="currentColor"
                  />
                  <circle cx="50" cy="50" r="5" fill="currentColor" />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
              Arrow Out
            </h1>
            <p className="text-sm opacity-60 max-w-xs mb-8 leading-relaxed">
              Serene procedural puzzles. Clear the board one arrow at a time with calm precision.
            </p>

            {/* Mode selection buttons */}
            <div className="w-full flex flex-col gap-2.5 mb-6">
              <button
                onClick={() => handleStartGame('CLASSIC')}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Continue Level {saveData.currentLevel}</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStartGame('RELAXED')}
                  className="py-2.5 px-3 rounded-xl text-xs font-semibold border hover:bg-black/5 dark:hover:bg-white/5 transition-all text-emerald-600 dark:text-emerald-400"
                  style={{ borderColor: theme.cardBorder }}
                >
                  Relaxed (Infinite Lives)
                </button>
                <button
                  onClick={() => handleStartGame('ZEN')}
                  className="py-2.5 px-3 rounded-xl text-xs font-semibold border hover:bg-black/5 dark:hover:bg-white/5 transition-all text-teal-600 dark:text-teal-400"
                  style={{ borderColor: theme.cardBorder }}
                >
                  Zen Mode (Endless)
                </button>
              </div>
            </div>

            {/* Flat control-hint line */}
            <div className="text-[11px] opacity-50 font-mono">
              Tap Arrow · Drag to Pan · Pinch to Zoom · Esc Menu
            </div>
          </div>

          {/* Bottom Bar: Settings, Daily, Achievements */}
          <div className="w-full max-w-sm flex items-center justify-center gap-3 pt-4 border-t" style={{ borderColor: theme.cardBorder }}>
            <button
              onClick={() => setShowDailyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
              <span>Daily Challenge</span>
            </button>
            <button
              onClick={() => setShowShopModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Cosmetics</span>
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      ) : (
        /* SCREEN 2: ACTIVE PLAY VIEW */
        <div className="relative w-full h-full flex flex-col overflow-hidden">
          {/* Perimeter HUD Top & Bottom */}
          <HUD
            levelNumber={levelData.levelNumber}
            chapterName={chapterName}
            isDaily={levelData.isDaily}
            isZen={saveData.settings.gameMode === 'ZEN'}
            gameMode={saveData.settings.gameMode}
            hearts={hearts}
            maxHearts={maxHearts}
            mistakes={mistakes}
            elapsedSec={elapsedSec}
            stars={saveData.stars}
            streak={saveData.streak}
            powerUps={saveData.powerUps}
            settings={saveData.settings}
            canSkipLevel={canSkipLevel}
            canUndo={moveHistory.length > 0}
            onRestart={handleRestart}
            onSkipLevel={handleSkipLevel}
            onUsePowerUp={handleUsePowerUp}
            onOpenSettings={() => setShowSettingsModal(true)}
            onOpenDaily={() => setShowDailyModal(true)}
            onOpenAchievements={() => setShowAchievementsModal(true)}
            onOpenShop={() => setShowShopModal(true)}
            onOpenStats={() => setShowStatsModal(true)}
            onChangeMode={(m) => {
              setSaveData((prev) => ({
                ...prev,
                settings: { ...prev.settings, gameMode: m },
              }));
              initLevel(levelData.levelNumber);
            }}
          />

          {/* Interactive Game Board */}
          <GameBoard
            levelData={levelData}
            activeArrows={activeArrows}
            settings={saveData.settings}
            selectedArrowId={selectedArrowId}
            hintedArrowId={hintedArrowId}
            xrayActive={xrayActive}
            onArrowTap={handleArrowTap}
            onSelectArrow={setSelectedArrowId}
            shakingArrowId={shakingArrowId}
            exitingArrows={exitingArrows}
          />

          {/* Interactive Tutorial Prompts */}
          {showTutorial && (
            <TutorialOverlay
              levelNumber={levelData.levelNumber}
              themeId={saveData.settings.theme}
              onDismiss={() => setShowTutorial(false)}
            />
          )}

          {/* Game Over / Instant Retry Modal */}
          {isGameOver && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
              <div
                className="w-full max-w-sm rounded-3xl p-6 shadow-2xl border text-center"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                }}
              >
                <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-1">Out of Hearts</h3>
                <p className="text-xs opacity-60 mb-5">
                  No penalties or loss of progress. Try again instantly for free!
                </p>
                <button
                  onClick={handleRestart}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-slate-900 dark:bg-white dark:text-slate-900 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restart Instantly</span>
                </button>
              </div>
            </div>
          )}

          {/* Level Complete Result Modal */}
          {showResultModal && (
            <ResultModal
              levelNumber={levelData.levelNumber}
              chapterName={chapterName}
              isDaily={levelData.isDaily}
              isZen={saveData.settings.gameMode === 'ZEN'}
              gameMode={saveData.settings.gameMode}
              stars={mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1}
              timeSec={elapsedSec}
              heartsLeft={hearts}
              mistakes={mistakes}
              isPerfectRun={mistakes === 0}
              onNextLevel={handleNextLevel}
              onReplayLevel={handleRestart}
              onWatchReplay={() => {
                setShowResultModal(false);
                setShowReplayViewer(true);
              }}
              onOpenShare={() => {
                setShowShareModal(true);
              }}
            />
          )}
        </div>
      )}

      {/* REPLAY VIEWER */}
      {showReplayViewer && (
        <ReplayViewer
          levelData={levelData}
          moveHistory={moveHistory}
          settings={saveData.settings}
          onClose={() => {
            setShowReplayViewer(false);
            setShowResultModal(true);
          }}
        />
      )}

      {/* SHARE MODAL */}
      {showShareModal && (
        <ShareModal
          levelNumber={levelData.levelNumber}
          chapterName={chapterName}
          stars={mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1}
          timeSec={elapsedSec}
          mistakes={mistakes}
          isDaily={levelData.isDaily}
          dateKey={levelData.dateKey}
          streak={saveData.streak}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <SettingsModal
          settings={saveData.settings}
          onUpdateSettings={(newSettings) =>
            setSaveData((prev) => ({ ...prev, settings: newSettings }))
          }
          onResetProgress={() => {
            const fresh = getDefaultSaveData();
            setSaveData(fresh);
            initLevel(1);
          }}
          onExportData={() => {
            const dataStr =
              'data:text/json;charset=utf-8,' +
              encodeURIComponent(JSON.stringify(saveData, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', dataStr);
            downloadAnchor.setAttribute('download', `arrow_out_save.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
          }}
          onImportData={(jsonStr) => {
            try {
              const parsed = JSON.parse(jsonStr);
              setSaveData({
                ...getDefaultSaveData(),
                ...parsed,
              });
              setShowSettingsModal(false);
              initLevel(parsed.currentLevel || 1);
            } catch {
              alert('Invalid save file format.');
            }
          }}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* DAILY CHALLENGE MODAL */}
      {showDailyModal && (
        <DailyModal
          streak={saveData.streak}
          longestStreak={saveData.stats.longestStreak}
          dailyHistory={saveData.dailyHistory}
          themeId={saveData.settings.theme}
          onPlayToday={() => {
            setShowDailyModal(false);
            setScreen('PLAYING');
            initLevel(999, { isDaily: true });
          }}
          onClose={() => setShowDailyModal(false)}
        />
      )}

      {/* ACHIEVEMENTS MODAL */}
      {showAchievementsModal && (
        <AchievementsModal
          achievements={saveData.achievements}
          totalStars={saveData.stars}
          themeId={saveData.settings.theme}
          onClose={() => setShowAchievementsModal(false)}
        />
      )}

      {/* COSMETICS SHOP MODAL */}
      {showShopModal && (
        <CosmeticsShopModal
          stars={saveData.stars}
          unlockedCosmetics={saveData.settings.unlockedCosmetics}
          settings={saveData.settings}
          themeId={saveData.settings.theme}
          onUnlockItem={(itemId, cost) => {
            setSaveData((prev) => ({
              ...prev,
              stars: prev.stars - cost,
              settings: {
                ...prev.settings,
                unlockedCosmetics: [...prev.settings.unlockedCosmetics, itemId],
              },
            }));
          }}
          onEquipItem={(type, value) => {
            setSaveData((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                ...(type === 'style'
                  ? { arrowStyle: value as any }
                  : { arrowHeadShape: value as any }),
              },
            }));
          }}
          onClaimSupporterBonus={() => {
            setSaveData((prev) => ({
              ...prev,
              stars: prev.stars + 5,
            }));
          }}
          onClose={() => setShowShopModal(false)}
        />
      )}

      {/* STATS MODAL */}
      {showStatsModal && (
        <StatsModal
          stats={saveData.stats}
          themeId={saveData.settings.theme}
          onClose={() => setShowStatsModal(false)}
        />
      )}

      {/* MOBILE LANDSCAPE ORIENTATION WARNING */}
      <OrientationWarning themeId={saveData.settings.theme} />
    </div>
  );
}
