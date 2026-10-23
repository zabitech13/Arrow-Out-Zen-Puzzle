export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type MechanicType = 'NORMAL' | 'LOCKED' | 'TWO_TAP' | 'ROTATING';

export interface ArrowData {
  id: string;
  row: number;
  col: number;
  direction: Direction;
  mechanic: MechanicType;
  tapsRemaining: number; // 2 for TWO_TAP, 1 for others
  lockRequiredId?: string; // id of arrow that must leave first
  colorIndex: number;
}

export interface WallBlock {
  id: string;
  row: number;
  col: number;
}

export type GameMode = 'RELAXED' | 'CLASSIC' | 'CHALLENGE' | 'ZEN';

export type ThemeId = 'light' | 'dark' | 'amoled' | 'colorblind';

export type ChapterId = 'garden' | 'ocean' | 'night' | 'desert';

export type SoundPackId = 'whoosh' | 'wind' | 'paper' | 'bubble' | 'silent';

export type ArrowStyleId = 'clean' | 'rounded' | 'neon' | 'dotted';

export type ArrowHeadShape = 'classic' | 'chevron' | 'diamond' | 'arc';

export type ThicknessLevel = 'slim' | 'regular' | 'bold' | 'heavy';

export type PowerUpType = 'hint' | 'xray' | 'shuffle' | 'undo';

export type HapticIntensity = 'off' | 'light' | 'medium' | 'firm';

export interface LevelData {
  levelNumber: number;
  chapterId: ChapterId;
  rows: number;
  cols: number;
  arrows: ArrowData[];
  walls: WallBlock[];
  initialSolutionOrder: string[];
  isDaily?: boolean;
  dateKey?: string;
}

export interface MoveRecord {
  arrow: ArrowData;
  timestamp: number;
  type: 'exit' | 'tap';
}

export interface UserSettings {
  gameMode: GameMode;
  confirmTap: boolean;
  autoHints: boolean;
  reduceEffects: boolean;
  arrowThickness: ThicknessLevel;
  theme: ThemeId;
  chapterOverride?: ChapterId;
  arrowStyle: ArrowStyleId;
  arrowHeadShape: ArrowHeadShape;
  soundPack: SoundPackId;
  sfxVolume: number; // 0 - 100
  ambientMusic: boolean;
  ambientVolume: number; // 0 - 100
  leftHanded: boolean;
  bigUI: boolean;
  hapticIntensity: HapticIntensity;
  reducedMotion: boolean;
  unlockedCosmetics: string[];
}

export interface PowerUpInventory {
  hint: number;
  xray: number;
  shuffle: number;
  undo: number;
}

export interface GameStats {
  levelsSolved: number;
  perfectRuns: number;
  totalPlaytimeSec: number;
  longestStreak: number;
  currentStreak: number;
  lastPlayedDate: string; // YYYY-MM-DD
  zenBoardsCleared: number;
  powerUpsUsed: number;
  starsCollected: number;
  favoriteMode: GameMode;
}

export interface DailyResult {
  completed: boolean;
  stars: number;
  timeSec: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardStars: number;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
}
