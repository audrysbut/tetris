import { getShape, ghostPosition, BOARD_WIDTH, BOARD_HEIGHT } from "@shared/mod";
import type { GameState } from "@shared/mod";

const CELL_SIZE = 36;
const BORDER = 1;

const COLORS: string[] = [
  "#000",
  "#00f0f0", // I
  "#f0f000", // O
  "#a000f0", // T
  "#00f000", // S
  "#f00000", // Z
  "#0000f0", // J
  "#f0a000", // L
];

interface BoardCanvasProps {
  state: GameState;
  width?: number;
  height?: number;
  cellSize?: number;
  /** 0–1 fraction of current drop interval elapsed (single-player smooth fall). */
  dropProgress?: number;
}

export function BoardCanvas({
  state,
  width = BOARD_WIDTH,
  height = BOARD_HEIGHT,
  cellSize = CELL_SIZE,
  dropProgress,
}: BoardCanvasProps) {
  const svgW = width * cellSize;
  const svgH = height * cellSize;
  const size = cellSize - BORDER * 2;

  const { board, currentPiece } = state;

  const ghost = currentPiece ? ghostPosition(board, currentPiece) : null;
  const ghostDiffers =
    currentPiece &&
    ghost &&
    (ghost.position.x !== currentPiece.position.x ||
      ghost.position.y !== currentPiece.position.y);
  const effectiveY =
    currentPiece && ghost
      ? currentPiece.position.y +
        (currentPiece.position.y === ghost.position.y ? 0 : dropProgress ?? 0)
      : 0;

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ display: "block" }}
      aria-label="Tetris board"
    >
      {/* Background */}
      <rect width={svgW} height={svgH} fill="#111" />
      {/* Board cells */}
      {board.map((row: number[], rowIndex: number) =>
        row.map((value: number, colIndex: number) => {
          if (value === 0) return null;
          const x = colIndex * cellSize + BORDER;
          const y = rowIndex * cellSize + BORDER;
          return (
            <rect
              key={`board-${rowIndex}-${colIndex}`}
              x={x}
              y={y}
              rx={4}
              ry={4}
              width={size}
              height={size}
              fill={COLORS[value] ?? "#333"}
            />
          );
        })
      )}
      {/* Ghost piece */}
      {currentPiece && ghostDiffers && ghost && (
        <g>
          {getShape(ghost.type, ghost.rotation).map((shapeRow: number[], rowIndex: number) =>
            shapeRow.map((cell: number, colIndex: number) => {
              if (!cell) return null;
              const x = (ghost.position.x + colIndex) * cellSize + BORDER;
              const y = (ghost.position.y + rowIndex) * cellSize + BORDER;
              return (
                <rect
                  key={`ghost-${rowIndex}-${colIndex}`}
                  x={x}
                  y={y}
                  width={size}
                  height={size}
                  rx={4}
                  ry={4}
                  fill="rgba(255,255,255,0.12)"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth={2}
                />
              );
            })
          )}
        </g>
      )}
      {/* Current piece */}
      {currentPiece && (
        <g>
          {getShape(currentPiece.type, currentPiece.rotation).map(
            (shapeRow: number[], rowIndex: number) =>
              shapeRow.map((cell: number, colIndex: number) => {
                if (!cell) return null;
                const cellY = effectiveY + rowIndex;
                if (cellY >= height) return null;
                const x =
                  (currentPiece.position.x + colIndex) * cellSize + BORDER;
                const y = (effectiveY + rowIndex) * cellSize + BORDER;
                return (
                  <rect
                    key={`piece-${rowIndex}-${colIndex}`}
                    x={x}
                    y={y}
                    width={size}
                    height={size}
                    fill={COLORS[currentPiece.type + 1]}
                  />
                );
              })
          )}
        </g>
      )}
    </svg>
  );
}
