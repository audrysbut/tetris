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

function makeGradient(id: string, color: string) {
  return (
    <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop
        offset="0%"
        style={{ stopColor: "rgb(255,255,255,1)", stopOpacity: 1 }}
      />
      <stop offset="100%" style={{ stopColor: color, stopOpacity: 1 }} />
    </linearGradient>
  );
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
      <defs>
        {makeGradient("I", "rgba(34, 211, 211, 1)")}
        {makeGradient("O", "rgba(250, 204, 21, 1)")}
        {makeGradient("T", "rgba(192, 132, 252, 1)")}
        {makeGradient("S", "rgba(74, 222, 128, 1)")}
        {makeGradient("Z", "rgba(248, 113, 113, 1)")}
        {makeGradient("J", "rgba(96, 165, 250, 1)")}
        {makeGradient("L", "rgba(251, 146, 60, 1)")}
      </defs>
      {/* Background */}
      <rect
        width={svgW}
        height={svgH}
        fill="rgba(0, 0, 0, 0.7)"
        rx={8}
        ry={8}
      />
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
