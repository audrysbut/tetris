import { getShape, CELL_COLORS } from "@shared/mod";
import type { PieceType } from "@shared/mod";

export interface HUDProps {
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
  isPaused: boolean;
  elapsedMs?: number;
}

export function HUD({ score, lines, level, gameOver, isPaused, elapsedMs }: HUDProps) {
  const textShadow = "0 1px 2px rgba(0,0,0,0.9), 0 0 4px #000";
  const timeStr =
    elapsedMs != null
      ? `${Math.floor(elapsedMs / 60000)}:${Math.floor((elapsedMs % 60000) / 1000).toString().padStart(2, "0")}`
      : null;
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
      {timeStr != null && <div>Time: {timeStr}</div>}
      {gameOver && <div style={{ color: "#f66", fontWeight: "bold" }}>Game Over</div>}
      {isPaused && !gameOver && <div style={{ color: "#ffc" }}>Paused</div>}
    </div>
  );
}

interface NextPieceProps {
  nextPieceType: PieceType;
}

const NEXT_CELL = 16;
const NEXT_INSET = 2; // proportional to Block's inner rect

export function NextPiece({ nextPieceType }: NextPieceProps) {
  const shape = getShape(nextPieceType, 0);
  const rows = shape.length;
  const cols = shape[0].length;
  const color = CELL_COLORS[nextPieceType + 1];
  const size = NEXT_CELL - 2; // match board block size = cellSize - BORDER*2
  const svgW = cols * NEXT_CELL;
  const svgH = rows * NEXT_CELL;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11, marginBottom: 2, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}>Next</div>
      <svg width={svgW} height={svgH} style={{ display: "block" }} aria-hidden>
        {shape.flatMap((row: number[], r: number) =>
          row.map((cell: number, c: number) =>
            cell ? (
              <g key={`${r}-${c}`}>
                <rect
                  x={c * NEXT_CELL + 1}
                  y={r * NEXT_CELL + 1}
                  width={size}
                  height={size}
                  fill={color}
                  rx={2}
                  ry={2}
                />
                <rect
                  x={c * NEXT_CELL + 1 + NEXT_INSET}
                  y={r * NEXT_CELL + 1 + NEXT_INSET}
                  width={size - NEXT_INSET * 2}
                  height={size - NEXT_INSET * 2}
                  fill="rgba(255,255,255,0.5)"
                  rx={2}
                  ry={2}
                />
              </g>
            ) : null
          )
        )}
      </svg>
    </div>
  );
}
