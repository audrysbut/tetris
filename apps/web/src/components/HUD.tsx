import { getShape } from "@shared/mod";
import { BoardCanvas } from "./BoardCanvas.tsx";
import type { GameState } from "@shared/mod";

interface HUDProps {
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
  isPaused: boolean;
}

export function HUD({ score, lines, level, gameOver, isPaused }: HUDProps) {
  return (
    <div style={{ marginBottom: 8, fontFamily: "monospace", fontSize: 16 }}>
      <div>Score: {score}</div>
      <div>Lines: {lines}</div>
      <div>Level: {level}</div>
      {gameOver && <div style={{ color: "#f00", fontWeight: "bold" }}>Game Over</div>}
      {isPaused && !gameOver && <div style={{ color: "#ff0" }}>Paused</div>}
    </div>
  );
}

interface NextPieceProps {
  nextPieceType: number;
}

const NEXT_SIZE = 16;

export function NextPiece({ nextPieceType }: NextPieceProps) {
  const shape = getShape(nextPieceType as any, 0);
  const rows = shape.length;
  const cols = shape[0].length;
  const colors = ["#000", "#00f0f0", "#f0f000", "#a000f0", "#00f000", "#f00000", "#0000f0", "#f0a000"];
  const color = colors[nextPieceType + 1];
  return (
    <div style={{ marginLeft: 16 }}>
      <div style={{ fontSize: 12, marginBottom: 4 }}>Next</div>
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
