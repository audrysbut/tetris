/** Board dimensions (standard Tetris) */
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

/** Cell value: 0 = empty, 1-7 = piece color/index */
export type CellValue = number;

/** Row of cells */
export type Row = CellValue[];

/** 2D board: BOARD_HEIGHT rows of BOARD_WIDTH cells */
export type Board = Row[];

/** Piece type identifier (I, O, T, S, Z, J, L) */
export type PieceType = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Position { x, y } in board coordinates */
export interface Position {
  x: number;
  y: number;
}

/** Current piece with type, rotation index, and position */
export interface CurrentPiece {
  type: PieceType;
  rotation: number;
  position: Position;
}

/** Action types for multiplayer */
export type MoveDirection = "left" | "right" | "down";
export type ActionType = "move" | "rotate" | "softDrop" | "hardDrop";

export interface GameAction {
  type: ActionType;
  dir?: MoveDirection;
}

/** Single player's game state (one board) */
export interface PlayerGameState {
  board: Board;
  currentPiece: CurrentPiece | null;
  nextPieceType: PieceType;
  score: number;
  lines: number;
  gameOver: boolean;
  level: number;
}

/** Full game state for one player (used by client and server) */
export interface GameState extends PlayerGameState {
  /** Row indices currently playing line-clear animation (board still contains these rows until animation ends) */
  clearingRows?: number[];
}

/** Line clear scoring: 100, 300, 500, 800 for 1-4 lines */
export const LINE_SCORES = [0, 100, 300, 500, 800] as const;

/** Default drop interval in ms (will decrease with level) */
export const DEFAULT_DROP_MS = 1000;
