import { Achievement, DailyResult, GameStats, PowerUpInventory, UserSettings } from '../types/game';

const STORAGE_KEY = 'arrow_out_zen_save_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  gameMode: 'CLASSIC',
  confirmTap: false,
  autoHints: true,
  reduceEffects: false,
  arrowThickness: 'regular',
  theme: 'light',
  arrowStyle: 'clean',
  arrowHeadShape: 'classic',
  soundPack: 'whoosh',
  sfxVolume: 80,
  ambientMusic: false,
  ambientVolume: 40,
  leftHanded: false,
  bigUI: false,
  hapticIntensity: 'medium',
  reducedMotion: false,
  unlockedCosmetics: ['style_clean', 'head_classic'],
};

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_clear', title: 'First Steps', description: 'Clear Level 1 without any errors', icon: 'Sparkles', rewardStars: 3 },
  { id: 'ten_perfect', title: 'Flawless Ten', description: 'Complete 10 levels with 3 stars', icon: 'Star', rewardStars: 10, maxProgress: 10 },
  { id: 'streak_3', title: 'Daily Focus', description: 'Maintain a 3-day Daily Challenge streak', icon: 'Flame', rewardStars: 15, maxProgress: 3 },
  { id: 'streak_7', title: 'Zen Consistency', description: 'Maintain a 7-day Daily Challenge streak', icon: 'Trophy', rewardStars: 30, maxProgress: 7 },
  { id: 'zen_10', title: 'Endless Flow', description: 'Clear 10 Zen Mode boards', icon: 'Compass', rewardStars: 15, maxProgress: 10 },
  { id: 'master_mechanics', title: 'Puzzle Architect', description: 'Clear a level featuring locked and rotating arrows', icon: 'Lock', rewardStars: 20 },
  { id: 'pure_mind', title: 'Intuition', description: 'Clear 15 levels without using hints', icon: 'Zap', rewardStars: 25, maxProgress: 15 },
  { id: 'big_board', title: 'Expansive Mind', description: 'Clear a board with 6x6 or greater dimensions', icon: 'Grid', rewardStars: 20 },
];

export interface SaveData {
  currentLevel: number;
  highestLevel: number;
  stars: number;
  levelStars: Record<number, number>; // levelNumber -> stars (1-3)
  settings: UserSettings;
  powerUps: PowerUpInventory;
  stats: GameStats;
  dailyHistory: Record<string, DailyResult>;
  achievements: Achievement[];
  streak: number;
}

export function getDefaultSaveData(): SaveData {
  return {
    currentLevel: 1,
    highestLevel: 1,
    stars: 0,
    levelStars: {},
    settings: { ...DEFAULT_SETTINGS },
    powerUps: {
      hint: 3,
      xray: 3,
      shuffle: 3,
      undo: 3,
    },
    stats: {
      levelsSolved: 0,
      perfectRuns: 0,
      totalPlaytimeSec: 0,
      longestStreak: 0,
      currentStreak: 0,
      lastPlayedDate: '',
      zenBoardsCleared: 0,
      powerUpsUsed: 0,
      starsCollected: 0,
      favoriteMode: 'CLASSIC',
    },
    dailyHistory: {},
    achievements: [...INITIAL_ACHIEVEMENTS],
    streak: 0,
  };
}

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultSaveData();
    const parsed = JSON.parse(raw);
    return {
      ...getDefaultSaveData(),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      powerUps: { ...getDefaultSaveData().powerUps, ...parsed.powerUps },
      stats: { ...getDefaultSaveData().stats, ...parsed.stats },
      achievements: INITIAL_ACHIEVEMENTS.map((initAch) => {
        const existing = parsed.achievements?.find((a: Achievement) => a.id === initAch.id);
        return existing || initAch;
      }),
    };
  } catch {
    return getDefaultSaveData();
  }
}

export function saveGameData(data: SaveData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}
