import type { PieceType } from "./types.ts";

/**
 * Tetromino shapes per type and rotation.
 * Each shape is a 2D array (rows x cols) with 1 = filled, 0 = empty.
 * Origin for rotation is top-left of the bounding box.
 */
const SHAPES: Record<PieceType, number[][][]> = {
  // I
  0: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],
  // O
  1: [
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
  ],
  // T
  2: [
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  // S
  3: [
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 0, 0],
      [0, 1, 1],
      [1, 1, 0],
    ],
    [
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  // Z
  4: [
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
  ],
  // J
  5: [
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  ],
  // L
  6: [
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
  ],
};

/** Get shape matrix for a piece type and rotation (0-3) */
export function getShape(type: PieceType, rotation: number): number[][] {
  const r = ((rotation % 4) + 4) % 4;
  return SHAPES[type][r].map((row) => [...row]);
}

/** All piece types for random selection */
export const PIECE_TYPES: PieceType[] = [0, 1, 2, 3, 4, 5, 6];

/** Seeded PRNG (mulberry32). Returns a function that yields values in [0, 1). */
export function createSeededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    const t = Math.imul(s ^ (s >>> 15), 1 | s);
    return ((t + (t ^ (t >>> 7)) >>> 0) / 4294967296);
  };
}

/** Fisher–Yates shuffle of [0..6] using seeded RNG; returns a new array. */
function getShuffledBag(seed: number, bagIndex: number): PieceType[] {
  const rng = createSeededRng((seed * 31 + bagIndex) >>> 0);
  const arr: PieceType[] = [0, 1, 2, 3, 4, 5, 6];
  for (let i = 0; i < 7; i++) {
    const j = i + Math.floor(rng() * (7 - i));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Deterministic piece at index: same (seed, index) always returns same piece (7-bag). */
export function pieceAtSeed(seed: number, index: number): PieceType {
  const bagIndex = Math.floor(index / 7);
  const pos = index % 7;
  return getShuffledBag(seed, bagIndex)[pos];
}

/** Return a random piece type (non-deterministic; for non-game use if needed) */
export function randomPieceType(): PieceType {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
}

/** Cell colors for rendering: index 0 = empty, 1–7 = I, O, T, S, Z, J, L */
const OPACITY = 0.8;
export const CELL_COLORS: string[] = [
  "#000",
  `rgba(34, 211, 211, ${OPACITY})`, // I – cyan
  `rgba(250, 204, 21, ${OPACITY})`, // O – amber
  `rgba(192, 132, 252, ${OPACITY})`, // T – violet
  `rgba(74, 222, 128, ${OPACITY})`, // S – emerald
  `rgba(248, 113, 113, ${OPACITY})`, // Z – coral
  `rgba(96, 165, 250, ${OPACITY})`, // J – sky blue
  `rgba(251, 146, 60, ${OPACITY})`, // L – orange
];
