import { useRef, useEffect } from "react";
import { getShape, ghostPosition, BOARD_WIDTH, BOARD_HEIGHT } from "@shared/mod";
import type { GameState } from "@shared/mod";

const CELL_SIZE = 24;
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
}

export function BoardCanvas({
  state,
  width = BOARD_WIDTH,
  height = BOARD_HEIGHT,
  cellSize = CELL_SIZE,
}: BoardCanvasProps) {
  const canvasW = width * cellSize;
  const canvasH = height * cellSize;

  const draw = (ctx: CanvasRenderingContext2D) => {
    const { board, currentPiece } = state;
    // Board background
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvasW, canvasH);
    // Grid cells
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        const value = board[row][col];
        const x = col * cellSize + BORDER;
        const y = row * cellSize + BORDER;
        const size = cellSize - BORDER * 2;
        ctx.fillStyle = COLORS[value] ?? "#333";
        ctx.fillRect(x, y, size, size);
      }
    }
    // Ghost piece (landing indicator): draw only when different from current position
    if (currentPiece) {
      const ghost = ghostPosition(board, currentPiece);
      if (
        ghost.position.x !== currentPiece.position.x ||
        ghost.position.y !== currentPiece.position.y
      ) {
        const shape = getShape(ghost.type, ghost.rotation);
        const color = COLORS[ghost.type + 1];
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = color;
        for (let row = 0; row < shape.length; row++) {
          for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
              const x = (ghost.position.x + col) * cellSize + BORDER;
              const y = (ghost.position.y + row) * cellSize + BORDER;
              const size = cellSize - BORDER * 2;
              ctx.fillRect(x, y, size, size);
            }
          }
        }
        ctx.restore();
      }
    }
    // Current piece
    if (currentPiece) {
      const shape = getShape(currentPiece.type, currentPiece.rotation);
      const color = COLORS[currentPiece.type + 1];
      ctx.fillStyle = color;
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const x =
              (currentPiece.position.x + col) * cellSize + BORDER;
            const y =
              (currentPiece.position.y + row) * cellSize + BORDER;
            const size = cellSize - BORDER * 2;
            ctx.fillRect(x, y, size, size);
          }
        }
      }
    }
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const ref = (el: HTMLCanvasElement | null) => {
    canvasRef.current = el;
  };

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    draw(ctx);
  }, [state]);

  return (
    <canvas
      ref={ref}
      width={canvasW}
      height={canvasH}
      style={{ display: "block", background: "#111" }}
      aria-label="Tetris board"
    />
  );
}
