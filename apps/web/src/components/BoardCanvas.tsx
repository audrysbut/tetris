import { ghostPosition, BOARD_WIDTH, BOARD_HEIGHT } from "@shared/mod";
import type { GameState } from "@shared/mod";
import {
  BoardCells,
  GhostPiece,
  CurrentPieceView,
} from "./BoardCanvasParts.tsx";

const CELL_SIZE = 36;

interface BoardCanvasProps {
  state: GameState;
  width?: number;
  height?: number;
  cellSize?: number;
}

export function BoardCanvas({
  state,
  width = BOARD_WIDTH,
  height = BOARD_HEIGHT,
  cellSize = CELL_SIZE,
}: BoardCanvasProps) {
  const svgW = width * cellSize;
  const svgH = height * cellSize;

  const { board, currentPiece, clearingRows } = state;

  const ghost = currentPiece ? ghostPosition(board, currentPiece) : null;
  const ghostDiffers =
    currentPiece &&
    ghost &&
    (ghost.position.x !== currentPiece.position.x ||
      ghost.position.y !== currentPiece.position.y);
  const effectiveY =
    currentPiece && ghost
      ? currentPiece.position.y +
        (currentPiece.position.y === ghost.position.y ? 0 : 0)
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
      <rect width={svgW} height={svgH} fill="rgba(0, 0, 0, 0.7)" rx={8} ry={8} />
      {/* Board cells */}
      <BoardCells
        board={board}
        cellSize={cellSize}
        clearingRows={clearingRows}
      />
      {/* Ghost piece */}
      {currentPiece && ghostDiffers && ghost && (
        <GhostPiece ghost={ghost} cellSize={cellSize} />
      )}
      {/* Current piece */}
      {currentPiece && (
        <CurrentPieceView
          piece={currentPiece}
          effectiveY={effectiveY}
          cellSize={cellSize}
          boardHeight={height}
        />
      )}
    </svg>
  );
}
