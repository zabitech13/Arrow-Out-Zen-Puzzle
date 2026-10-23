import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowData, LevelData, ThemeId, UserSettings } from '../types/game';
import { checkArrowClearance, DIRECTION_OFFSETS } from '../utils/puzzleGenerator';
import { CHAPTER_PALETTES, THEMES } from '../utils/theme';
import { ArrowSvg } from './ArrowSvg';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ExitingArrow {
  arrow: ArrowData;
  color: string;
  flyX: number;
  flyY: number;
  rotation: number;
}

interface GameBoardProps {
  levelData: LevelData;
  activeArrows: ArrowData[];
  settings: UserSettings;
  selectedArrowId: string | null;
  hintedArrowId: string | null;
  xrayActive: boolean;
  onArrowTap: (arrow: ArrowData) => void;
  onSelectArrow: (id: string | null) => void;
  shakingArrowId: string | null;
  exitingArrows: ExitingArrow[];
}

export const GameBoard: React.FC<GameBoardProps> = ({
  levelData,
  activeArrows,
  settings,
  selectedArrowId,
  hintedArrowId,
  xrayActive,
  onArrowTap,
  onSelectArrow,
  shakingArrowId,
  exitingArrows,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom state
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);

  // Strict Safe-Tap tracking refs: moves < 8px and duration < 250ms
  const pointerStartRef = useRef<{ x: number; y: number; time: number; targetArrowId: string | null }>({
    x: 0,
    y: 0,
    time: 0,
    targetArrowId: null,
  });
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });

  // Dynamic container dimensions for optimal auto-scaling across portrait & landscape
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 500,
    height: typeof window !== 'undefined' ? Math.max(300, window.innerHeight - 130) : 500,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateFromRect = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateFromRect();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });

    observer.observe(el);
    window.addEventListener('resize', updateFromRect);
    window.addEventListener('orientationchange', updateFromRect);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateFromRect);
      window.removeEventListener('orientationchange', updateFromRect);
    };
  }, []);

  // Compute adaptive cell size based on available width and height
  // reserving space for outer board border (24px) and edge buffer (36px)
  const availWidth = Math.max(160, containerSize.width - 48);
  const availHeight = Math.max(160, containerSize.height - 48);

  const cellFromWidth = Math.floor(availWidth / levelData.cols);
  const cellFromHeight = Math.floor(availHeight / levelData.rows);

  // Preserve exact 1:1 square grid ratio, clamped between 28px and 78px
  const cellSize = Math.max(28, Math.min(78, Math.min(cellFromWidth, cellFromHeight)));

  const theme = THEMES[settings.theme] || THEMES.light;
  const chapterPalette =
    CHAPTER_PALETTES[settings.chapterOverride || levelData.chapterId] || CHAPTER_PALETTES.garden;

  // Reset zoom & pan when level changes
  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [levelData.levelNumber]);

  // Zoom handlers
  const handleZoomIn = () => setScale((s) => Math.min(2.0, s + 0.15));
  const handleZoomOut = () => setScale((s) => Math.max(0.7, s - 0.15));
  const handleResetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((s) => Math.min(2.0, s + 0.08));
    } else {
      setScale((s) => Math.max(0.7, s - 0.08));
    }
  };

  // Safe pointer down
  const handlePointerDown = (e: React.PointerEvent, arrowId?: string) => {
    // Only primary button
    if (e.button !== 0) return;

    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
      targetArrowId: arrowId || null,
    };

    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };

    setIsPanning(true);
  };

  // Pointer move: pan the board if dragged
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    const dist = Math.hypot(dx, dy);

    // If dragged >= 8px, clear targetArrowId so it can never trigger an arrow tap
    if (dist >= 8) {
      pointerStartRef.current.targetArrowId = null;
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
    }
  };

  // Pointer up: strictly enforce < 8px and < 250ms for arrow taps
  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);

    const start = pointerStartRef.current;
    const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    const duration = Date.now() - start.time;

    // RULE: Safe Taps - tap only counts if finger moves < 8px and lasts < 250ms
    if (start.targetArrowId && dist < 8 && duration < 250) {
      const arrow = activeArrows.find((a) => a.id === start.targetArrowId);
      if (arrow) {
        if (settings.confirmTap) {
          if (selectedArrowId === arrow.id) {
            // Second tap confirms release!
            onSelectArrow(null);
            onArrowTap(arrow);
          } else {
            // First tap selects and highlights
            onSelectArrow(arrow.id);
          }
        } else {
          // Direct tap mode
          onArrowTap(arrow);
        }
      }
    } else if (dist < 8 && !start.targetArrowId) {
      // Tapped empty space -> clear selection
      if (selectedArrowId) {
        onSelectArrow(null);
      }
    }
  };

  // Determine color for an arrow
  const getArrowColor = (arrow: ArrowData) => {
    if (settings.theme === 'colorblind') {
      // Distinct high-contrast palette
      const cbColors = ['#ffd166', '#06d6a0', '#118ab2', '#f77f00', '#90e0ef', '#e7c6ff'];
      return cbColors[arrow.colorIndex % cbColors.length];
    }
    const colors = chapterPalette.colors;
    return colors[arrow.colorIndex % colors.length];
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden touch-none select-none"
      onPointerDown={(e) => handlePointerDown(e)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setIsPanning(false)}
      onWheel={handleWheel}
      style={{
        cursor: isPanning ? 'grabbing' : 'default',
      }}
    >
      {/* Pan & Zoom Floating Mini-Controls */}
      <div
        className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 p-1 rounded-xl shadow-md backdrop-blur-md transition-opacity duration-200"
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
        }}
      >
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-sm font-medium"
          style={{ color: theme.textSecondary }}
          title="Zoom In"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-sm font-medium"
          style={{ color: theme.textSecondary }}
          title="Zoom Out"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        {(scale !== 1 || pan.x !== 0 || pan.y !== 0) && (
          <button
            onClick={handleResetView}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-xs font-medium flex items-center gap-1"
            style={{ color: theme.accent }}
            title="Reset View"
            aria-label="Reset zoom and position"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Transformable Board Wrapper */}
      <div
        className="relative transition-transform duration-75 ease-out select-none"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Main Board Tray Container */}
        <div
          className="relative rounded-2xl shadow-xl transition-colors duration-300 p-3"
          style={{
            backgroundColor: theme.boardBg,
            border: `2px solid ${theme.boardBorder}`,
            width: levelData.cols * cellSize + 24,
            height: levelData.rows * cellSize + 24,
          }}
        >
          {/* Subtle Grid Cells and Wall Obstacles */}
          <div
            className="grid w-full h-full relative"
            style={{
              gridTemplateRows: `repeat(${levelData.rows}, ${cellSize}px)`,
              gridTemplateColumns: `repeat(${levelData.cols}, ${cellSize}px)`,
            }}
          >
            {Array.from({ length: levelData.rows }).map((_, r) =>
              Array.from({ length: levelData.cols }).map((_, c) => {
                const wall = levelData.walls.find((w) => w.row === r && w.col === c);
                return (
                  <div
                    key={`cell-${r}-${c}`}
                    className="relative flex items-center justify-center rounded-lg transition-colors"
                    style={{
                      border: `1px solid ${theme.gridLine}`,
                      backgroundColor: wall ? theme.wallBg : 'transparent',
                    }}
                  >
                    {wall && (
                      <div
                        className="w-full h-full rounded-md shadow-inner flex items-center justify-center"
                        style={{
                          backgroundColor: theme.wallBg,
                          border: `1px solid ${theme.wallBorder}`,
                        }}
                        title="Wall block: arrows cannot pass through"
                      >
                        <div className="w-2.5 h-2.5 rounded-xs opacity-40 bg-black dark:bg-white" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Active Arrows Layer */}
            {activeArrows.map((arrow) => {
              const color = getArrowColor(arrow);
              const isSelected = selectedArrowId === arrow.id;
              const isHinted = hintedArrowId === arrow.id;
              const isShaking = shakingArrowId === arrow.id;

              // If X-Ray is active, check if arrow path is blocked
              let isXRayBlocked = false;
              if (xrayActive) {
                const clearance = checkArrowClearance(
                  arrow,
                  activeArrows,
                  levelData.walls,
                  levelData.rows,
                  levelData.cols
                );
                isXRayBlocked = !clearance.isClear;
              }

              return (
                <div
                  key={arrow.id}
                  className="absolute z-10 transition-all duration-150 flex items-center justify-center cursor-pointer select-none"
                  style={{
                    top: arrow.row * cellSize,
                    left: arrow.col * cellSize,
                    width: cellSize,
                    height: cellSize,
                    padding: Math.max(4, cellSize * 0.1),
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    handlePointerDown(e, arrow.id);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Arrow pointing ${arrow.direction} at row ${arrow.row + 1}, column ${
                    arrow.col + 1
                  }${arrow.mechanic !== 'NORMAL' ? `, ${arrow.mechanic} mechanic` : ''}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onArrowTap(arrow);
                    }
                  }}
                >
                  <ArrowSvg
                    arrow={arrow}
                    cellSize={cellSize}
                    color={color}
                    arrowStyle={settings.arrowStyle}
                    headShape={settings.arrowHeadShape}
                    thickness={settings.arrowThickness}
                    isSelected={isSelected}
                    isHinted={isHinted}
                    isXRayBlocked={isXRayBlocked}
                    isShaking={isShaking}
                    reduceEffects={settings.reduceEffects}
                    contrastTheme={settings.theme}
                  />
                </div>
              );
            })}

            {/* Smooth 60fps Exiting Arrows along Curved Arcs */}
            {exitingArrows.map(({ arrow, color, flyX, flyY, rotation }) => {
              return (
                <div
                  key={`exiting-${arrow.id}`}
                  className="absolute z-20 pointer-events-none transition-all duration-280 ease-out"
                  style={{
                    top: arrow.row * cellSize,
                    left: arrow.col * cellSize,
                    width: cellSize,
                    height: cellSize,
                    padding: Math.max(4, cellSize * 0.1),
                    transform: `translate3d(${flyX}px, ${flyY}px, 0) rotate(${rotation}deg) scale(0.95)`,
                    opacity: 0,
                  }}
                >
                  <ArrowSvg
                    arrow={arrow}
                    cellSize={cellSize}
                    color={color}
                    arrowStyle={settings.arrowStyle}
                    headShape={settings.arrowHeadShape}
                    thickness={settings.arrowThickness}
                    reduceEffects={settings.reduceEffects}
                    contrastTheme={settings.theme}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
