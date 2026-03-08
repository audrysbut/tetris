import { getShape, CELL_COLORS } from "@shared/mod";
import type { Board, CurrentPiece } from "@shared/mod";
import { motion } from "framer-motion";
import { Block } from "./Block.tsx";

const BORDER = 1;
const MOVE_DURATION = 0.06;

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
            <Block
              key={`board-${rowIndex}-${colIndex}`}
              x={x}
              y={y}
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
  const groupX = ghost.position.x * cellSize;
  const groupY = ghost.position.y * cellSize;
  return (
    <motion.g
      initial={false}
      animate={{ x: groupX, y: groupY }}
      transition={{ duration: MOVE_DURATION }}
    >
      {getShape(ghost.type, ghost.rotation).map((shapeRow: number[], rowIndex: number) =>
        shapeRow.map((cell: number, colIndex: number) => {
          if (!cell) return null;
          const x = colIndex * cellSize + BORDER;
          const y = rowIndex * cellSize + BORDER;
          return (
            <Block
              key={`ghost-${rowIndex}-${colIndex}`}
              x={x}
              y={y}
              width={size}
              height={size}
              fill="rgba(255,255,255,0.12)"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={2}
            />
          );
        })
      )}
    </motion.g>
  );
}

export interface CurrentPieceViewProps {
  piece: CurrentPiece;
  effectiveY: number;
  cellSize: number
  boardHeight: number;
}

export function CurrentPieceView({ piece, effectiveY, cellSize, boardHeight }: CurrentPieceViewProps) {
  const size = cellSize - BORDER * 2;
  const shape = getShape(piece.type, piece.rotation);
  const groupX = piece.position.x * cellSize;
  const groupY = effectiveY * cellSize;

  return (
    <motion.g
      initial={false}
      animate={{ x: groupX, y: groupY }}
      transition={{ duration: MOVE_DURATION }}
    >
      {shape.map(
        (shapeRow: number[], rowIndex: number) =>
          shapeRow.map((cell: number, colIndex: number) => {
            if (!cell) return null;
            const cellY = effectiveY + rowIndex;
            if (cellY >= boardHeight) return null;
            const x = colIndex * cellSize + BORDER;
            const y = rowIndex * cellSize + BORDER;
            return (
              <Block
                key={`piece-${rowIndex}-${colIndex}`}
                x={x}
                y={y}
                width={size}
                height={size}
                fill={CELL_COLORS[piece.type + 1]}
              />
            );
          })
      )}
    </motion.g>
  );
}
