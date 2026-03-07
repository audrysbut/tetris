import type { PieceType } from "./types.ts";

/**
 * Tetromino shapes per type and rotation.
 * Each shape is a 2D array (rows x cols) with 1 = filled, 0 = empty.
 * Origin for rotation is top-left of the bounding box.
 */
const SHAPES: Record<PieceType, number[][][]> = {
  // I
  0: [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
    [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
  ],
  // O
  1: [
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
  ],
  // T
  2: [
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
  ],
  // S
  3: [
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
    [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
    [[1, 0, 0], [1, 1, 0], [0, 1, 0]],
  ],
  // Z
  4: [
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
    [[0, 1, 0], [1, 1, 0], [1, 0, 0]],
  ],
  // J
  5: [
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
    [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
  ],
  // L
  6: [
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
    [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
    [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
  ],
};

/** Get shape matrix for a piece type and rotation (0-3) */
export function getShape(type: PieceType, rotation: number): number[][] {
  const r = ((rotation % 4) + 4) % 4;
  return SHAPES[type][r].map((row) => [...row]);
}

/** All piece types for random selection */
export const PIECE_TYPES: PieceType[] = [0, 1, 2, 3, 4, 5, 6];

/** Return a random piece type */
export function randomPieceType(): PieceType {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
}

/** Cell colors for rendering: index 0 = empty, 1–7 = I, O, T, S, Z, J, L */
export const CELL_COLORS: string[] = [
  "#000",
  "#00f0f0", // I
  "#f0f000", // O
  "#a000f0", // T
  "#00f000", // S
  "#f00000", // Z
  "#0000f0", // J
  "#f0a000", // L
];
