import { getShape, CELL_COLORS } from "@shared/mod";
import type { Board, CurrentPiece } from "@shared/mod";
import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Block } from "./Block.tsx";

const BORDER = 1;
const MOVE_DURATION = 0.04;
const ROTATE_DURATION = 0.08;

export interface BoardCellsProps {
  board: Board;
  cellSize: number;
  /** Row indices currently animating (line clear). */
  clearingRows?: number[];
}

const CLEAR_ANIMATION_DURATION = 0.2;

export function BoardCells({
  board,
  cellSize,
  clearingRows = [],
}: BoardCellsProps) {
  const size = cellSize - BORDER * 2;
  const isClearing = (rowIndex: number) => clearingRows.includes(rowIndex);

  return (
    <>
      {board.map((row: number[], rowIndex: number) =>
        row.map((value: number, colIndex: number) => {
          if (value === 0) return null;
          const x = colIndex * cellSize + BORDER;
          const y = rowIndex * cellSize + BORDER;
          const clearing = isClearing(rowIndex);
          if (clearing) {
            return (
              <motion.g
                key={`board-${rowIndex}-${colIndex}`}
                initial={{ scaleY: 1, opacity: 1 }}
                animate={{ scaleY: 0, opacity: 0 }}
                transition={{
                  duration: CLEAR_ANIMATION_DURATION,
                  ease: "easeIn",
                }}
                style={{
                  transformOrigin: `${x + size / 2}px ${y + size / 2}px`,
                }}
              >
                <Block
                  x={x}
                  y={y}
                  width={size}
                  height={size}
                  fill="rgba(255,255,255,0.9)"
                />
              </motion.g>
            );
          }
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
        }),
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
      {getShape(ghost.type, ghost.rotation).map(
        (shapeRow: number[], rowIndex: number) =>
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
          }),
      )}
    </motion.g>
  );
}

export interface CurrentPieceViewProps {
  piece: CurrentPiece;
  effectiveY: number;
  cellSize: number;
  boardHeight: number;
}

export function CurrentPieceView({
  piece,
  effectiveY,
  cellSize,
  boardHeight,
}: CurrentPieceViewProps) {
  const size = cellSize - BORDER * 2;
  const shape = getShape(piece.type, piece.rotation);
  const groupX = piece.position.x * cellSize;
  const groupY = effectiveY * cellSize;

  const prevRotationRef = useRef(piece.rotation);
  const rotationDelta =
    prevRotationRef.current !== piece.rotation
      ? -Math.abs((prevRotationRef.current - piece.rotation) * 90)
      : 0;
  useEffect(() => {
    prevRotationRef.current = piece.rotation;
  }, [piece.rotation]);

  const cols = shape[0].length;
  const rows = shape.length;
  const originX = (cols * cellSize) / 2;
  const originY = (rows * cellSize) / 2;

  return (
    <motion.g
      initial={false}
      animate={{
        x: groupX,
        y: groupY,
      }}
      transition={{ duration: MOVE_DURATION }}
    >
      <motion.g
        key={piece.rotation}
        initial={{ rotate: rotationDelta }}
        animate={{ rotate: 0 }}
        transition={{ duration: ROTATE_DURATION, ease: "easeOut" }}
        style={{
          transformOrigin: `${originX}px ${originY}px`,
        }}
      >
        {shape.map((shapeRow: number[], rowIndex: number) =>
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
          }),
        )}
      </motion.g>
    </motion.g>
  );
}
