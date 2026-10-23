import { ArrowData, ChapterId, Direction, LevelData, WallBlock } from '../types/game';

// Seeded PRNG (Mulberry32) for reproducible, non-repeating levels
export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert string (like "2026-10-22" or "zen-12") to integer seed
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export const DIRECTION_OFFSETS: Record<Direction, { dr: number; dc: number; angle: number }> = {
  UP: { dr: -1, dc: 0, angle: 0 },
  RIGHT: { dr: 0, dc: 1, angle: 90 },
  DOWN: { dr: 1, dc: 0, angle: 180 },
  LEFT: { dr: 0, dc: -1, angle: 270 },
};

export const ROTATE_CW: Record<Direction, Direction> = {
  UP: 'RIGHT',
  RIGHT: 'DOWN',
  DOWN: 'LEFT',
  LEFT: 'UP',
};

// Check if an arrow's path is completely unblocked
export function checkArrowClearance(
  arrow: ArrowData,
  activeArrows: ArrowData[],
  walls: WallBlock[],
  rows: number,
  cols: number
): { isClear: boolean; reason?: 'blocked_by_arrow' | 'blocked_by_wall' | 'locked'; blockerId?: string } {
  // If locked and locking arrow is still on board
  if (arrow.mechanic === 'LOCKED' && arrow.lockRequiredId) {
    const isLockPrereqActive = activeArrows.some((a) => a.id === arrow.lockRequiredId);
    if (isLockPrereqActive) {
      return { isClear: false, reason: 'locked', blockerId: arrow.lockRequiredId };
    }
  }

  const { dr, dc } = DIRECTION_OFFSETS[arrow.direction];
  let r = arrow.row + dr;
  let c = arrow.col + dc;

  while (r >= 0 && r < rows && c >= 0 && c < cols) {
    // Check wall
    const wall = walls.find((w) => w.row === r && w.col === c);
    if (wall) {
      return { isClear: false, reason: 'blocked_by_wall' };
    }

    // Check active arrow
    const blocker = activeArrows.find((a) => a.id !== arrow.id && a.row === r && a.col === c);
    if (blocker) {
      return { isClear: false, reason: 'blocked_by_arrow', blockerId: blocker.id };
    }

    r += dr;
    c += dc;
  }

  return { isClear: true };
}

// Determine chapter based on level number
export function getChapterForLevel(level: number): ChapterId {
  if (level <= 15) return 'garden';
  if (level <= 30) return 'ocean';
  if (level <= 50) return 'night';
  return 'desert';
}

// Generate guaranteed solvable puzzle via reverse generation
export function generatePuzzle(levelNumber: number, options?: { isDaily?: boolean; dateKey?: string; isZen?: boolean }): LevelData {
  let seed = levelNumber * 104729;
  if (options?.isDaily && options.dateKey) {
    seed = hashString(options.dateKey);
  } else if (options?.isZen) {
    seed = Date.now() ^ (levelNumber * 7919);
  }

  const rng = mulberry32(seed);

  // Determine grid size
  let rows = 4;
  let cols = 4;
  if (levelNumber === 1 || levelNumber === 2) {
    rows = 3;
    cols = 3;
  } else if (levelNumber <= 6) {
    rows = 4;
    cols = 4;
  } else if (levelNumber <= 15) {
    rows = 5;
    cols = 5;
  } else if (levelNumber <= 30) {
    rows = 5;
    cols = 6;
  } else if (levelNumber <= 50) {
    rows = 6;
    cols = 6;
  } else {
    // 7x7 or 8x8 for deep master levels
    rows = Math.min(8, 6 + Math.floor(rng() * 2));
    cols = rows;
  }

  if (options?.isZen) {
    const zenSizes = [4, 5, 5, 6, 6];
    rows = zenSizes[Math.floor(rng() * zenSizes.length)];
    cols = rows;
  }

  const totalCells = rows * cols;
  const targetArrowCount = Math.max(3, Math.floor(totalCells * (levelNumber <= 2 ? 0.45 : levelNumber <= 10 ? 0.65 : 0.78)));

  const walls: WallBlock[] = [];
  // Introduce walls from level 45+
  const hasWalls = (levelNumber >= 45 || (options?.isDaily && levelNumber >= 20)) && rows >= 5;
  if (hasWalls) {
    const wallCount = Math.min(3, 1 + Math.floor(rng() * 2));
    for (let w = 0; w < wallCount; w++) {
      const wr = 1 + Math.floor(rng() * (rows - 2));
      const wc = 1 + Math.floor(rng() * (cols - 2));
      if (!walls.some((x) => x.row === wr && x.col === wc)) {
        walls.push({ id: `wall-${w}`, row: wr, col: wc });
      }
    }
  }

  // Reverse generation:
  // We maintain board grid and place arrows one by one from last to exit -> first to exit.
  // Each placed arrow must have a clear path to edge *among currently placed arrows & walls*.
  const gridOccupied: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  walls.forEach((w) => {
    gridOccupied[w.row][w.col] = true;
  });

  const placedArrows: ArrowData[] = [];
  const directions: Direction[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];

  // Handcrafted starter puzzles for tutorials 1, 2, 3
  if (levelNumber === 1 && !options?.isDaily && !options?.isZen) {
    const tutorialArrows: ArrowData[] = [
      { id: 'a1', row: 0, col: 1, direction: 'UP', mechanic: 'NORMAL', tapsRemaining: 1, colorIndex: 0 },
      { id: 'a2', row: 1, col: 2, direction: 'RIGHT', mechanic: 'NORMAL', tapsRemaining: 1, colorIndex: 1 },
      { id: 'a3', row: 2, col: 1, direction: 'DOWN', mechanic: 'NORMAL', tapsRemaining: 1, colorIndex: 2 },
      { id: 'a4', row: 1, col: 0, direction: 'LEFT', mechanic: 'NORMAL', tapsRemaining: 1, colorIndex: 3 },
    ];
    return {
      levelNumber: 1,
      chapterId: 'garden',
      rows: 3,
      cols: 3,
      arrows: tutorialArrows,
      walls: [],
      initialSolutionOrder: ['a1', 'a2', 'a3', 'a4'],
    };
  }

  if (levelNumber === 2 && !options?.isDaily && !options?.isZen) {
    const tutorialArrows: ArrowData[] = [
      // Outer arrow clear immediately
      { id: 'a1', row: 0, col: 0, direction: 'UP', mechanic: 'NORMAL', tapsRemaining: 1, colorIndex: 0 },
      { id: 'a2', row: 0, col: 2, direction: 'RIGHT', mechanic: 'NORMAL', tapsRemaining: 1, colorIndex: 1 },
      // Inner arrows blocked until outer leave
      { id: 'a3', row: 1, col: 0, direction: 'UP', mechanic: 'NORMAL', tapsRemaining: 1, colorIndex: 2 },
      { id: 'a4', row: 0, col: 1, direction: 'RIGHT', mechanic: 'NORMAL', tapsRemaining: 1, colorIndex: 3 },
      { id: 'a5', row: 2, col: 1, direction: 'DOWN', mechanic: 'NORMAL', tapsRemaining: 1, colorIndex: 4 },
    ];
    return {
      levelNumber: 2,
      chapterId: 'garden',
      rows: 3,
      cols: 3,
      arrows: tutorialArrows,
      walls: [],
      initialSolutionOrder: ['a1', 'a2', 'a5', 'a3', 'a4'],
    };
  }

  // Reverse generation loop
  let attempts = 0;
  while (placedArrows.length < targetArrowCount && attempts < 800) {
    attempts++;
    const r = Math.floor(rng() * rows);
    const c = Math.floor(rng() * cols);

    if (gridOccupied[r][c]) continue;

    // Shuffle directions
    const shuffledDirs = [...directions].sort(() => rng() - 0.5);

    let chosenDir: Direction | null = null;
    for (const dir of shuffledDirs) {
      const { dr, dc } = DIRECTION_OFFSETS[dir];
      let cr = r + dr;
      let cc = c + dc;
      let clearOutward = true;

      while (cr >= 0 && cr < rows && cc >= 0 && cc < cols) {
        if (gridOccupied[cr][cc]) {
          clearOutward = false;
          break;
        }
        cr += dr;
        cc += dc;
      }

      if (clearOutward) {
        chosenDir = dir;
        break;
      }
    }

    if (chosenDir) {
      gridOccupied[r][c] = true;

      // Determine mechanics based on level
      let mechanic: ArrowData['mechanic'] = 'NORMAL';
      let tapsRemaining = 1;

      // Introduce mechanics progressively:
      // Locked: Level 30+
      // Two-Tap: Level 35+
      // Rotating: Level 40+
      const roll = rng();
      if (levelNumber >= 40 && roll < 0.2) {
        mechanic = 'ROTATING';
      } else if (levelNumber >= 35 && roll < 0.35) {
        mechanic = 'TWO_TAP';
        tapsRemaining = 2;
      }

      const id = `arrow-${placedArrows.length}-${r}-${c}`;
      placedArrows.push({
        id,
        row: r,
        col: c,
        direction: chosenDir,
        mechanic,
        tapsRemaining,
        colorIndex: (placedArrows.length + r + c) % 6,
      });
    }
  }

  // Add locked arrow mechanic for level 30+
  if (levelNumber >= 30 && placedArrows.length >= 6) {
    // Pick an arrow near the middle of placed arrows
    const lockedIdx = Math.floor(placedArrows.length * 0.4);
    // The key that unlocks it must exit BEFORE it (so it was placed AFTER it in reverse)
    const keyIdx = Math.min(placedArrows.length - 1, lockedIdx + 2);
    placedArrows[lockedIdx].mechanic = 'LOCKED';
    placedArrows[lockedIdx].lockRequiredId = placedArrows[keyIdx].id;
  }

  // The solution order forward is simply the reverse of placed order!
  // (Because last placed in reverse had nothing blocking it from all arrows placed before it)
  const initialSolutionOrder = [...placedArrows].reverse().map((a) => a.id);

  return {
    levelNumber,
    chapterId: getChapterForLevel(levelNumber),
    rows,
    cols,
    arrows: placedArrows,
    walls,
    initialSolutionOrder,
    isDaily: options?.isDaily,
    dateKey: options?.dateKey,
  };
}
