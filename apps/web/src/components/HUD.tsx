import { getShape, CELL_COLORS } from "@shared/mod";
import { BoardCanvas } from "./BoardCanvas.tsx";
import type { GameState, PieceType } from "@shared/mod";

interface HUDProps {
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
  isPaused: boolean;
}

export function HUD({ score, lines, level, gameOver, isPaused }: HUDProps) {
  const textShadow = "0 1px 2px rgba(0,0,0,0.9), 0 0 4px #000";
  return (
    <div
      style={{
        marginBottom: 4,
        fontFamily: "monospace",
        fontSize: 13,
        textShadow,
        color: "#fff",
      }}
    >
      <div>Score: {score}</div>
      <div>Lines: {lines}</div>
      <div>Level: {level}</div>
      {gameOver && <div style={{ color: "#f66", fontWeight: "bold" }}>Game Over</div>}
      {isPaused && !gameOver && <div style={{ color: "#ffc" }}>Paused</div>}
    </div>
  );
}

interface NextPieceProps {
  nextPieceType: PieceType;
}

const NEXT_SIZE = 16;

export function NextPiece({ nextPieceType }: NextPieceProps) {
  const shape = getShape(nextPieceType, 0);
  const rows = shape.length;
  const cols = shape[0].length;
  const color = CELL_COLORS[nextPieceType + 1];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11, marginBottom: 2, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}>Next</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, ${NEXT_SIZE}px)`,
          gridTemplateRows: `repeat(${rows}, ${NEXT_SIZE}px)`,
          width: cols * NEXT_SIZE,
          height: rows * NEXT_SIZE,
          background: "#111",
        }}
      >
        {shape.flatMap((row: number[], r: number) =>
          row.map((cell: number, c: number) =>
            cell ? (
              <div
                key={`${r}-${c}`}
                style={{
                  background: color,
                  width: NEXT_SIZE - 2,
                  height: NEXT_SIZE - 2,
                }}
              />
            ) : (
              <div key={`${r}-${c}`} />
            )
          )
        )}
      </div>
    </div>
  );
}
