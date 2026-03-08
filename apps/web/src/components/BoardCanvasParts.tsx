import { getShape, CELL_COLORS } from "@shared/mod";
import type { Board, CurrentPiece } from "@shared/mod";

const BORDER = 1;

export interface BoardCellsProps {
  board: Board;
  cellSize: number;
}

export function BoardCells({ board, cellSize }: BoardCellsProps) {
  const size = cellSize - BORDER * 2;
  return (
    <>
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
              fill={CELL_COLORS[value] ?? "#333"}
            />
          );
        })
      )}
    </>
  );
}

export interface GhostPieceProps {
  ghost: CurrentPiece;
  cellSize: number;
}

export function GhostPiece({ ghost, cellSize }: GhostPieceProps) {
  const size = cellSize - BORDER * 2;
  return (
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
  );
}

export interface CurrentPieceViewProps {
  piece: CurrentPiece;
  effectiveY: number;
  cellSize: number;
  boardHeight: number;
}

export function CurrentPieceView({ piece, effectiveY, cellSize, boardHeight }: CurrentPieceViewProps) {
  const size = cellSize - BORDER * 2;
  return (
    <g>
      {getShape(piece.type, piece.rotation).map(
        (shapeRow: number[], rowIndex: number) =>
          shapeRow.map((cell: number, colIndex: number) => {
            if (!cell) return null;
            const cellY = effectiveY + rowIndex;
            if (cellY >= boardHeight) return null;
            const x = (piece.position.x + colIndex) * cellSize + BORDER;
            const y = (effectiveY + rowIndex) * cellSize + BORDER;
            return (
              <rect
                key={`piece-${rowIndex}-${colIndex}`}
                x={x}
                y={y}
                rx={4}
                ry={4}
                width={size}
                height={size}
                fill={CELL_COLORS[piece.type + 1]}
                stroke="rgba(255,255,255,0.7)"
                strokeWidth={2}
              />
            );
          })
      )}
    </g>
  );
}
