import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  LINE_SCORES,
  type Board,
  type CurrentPiece,
  type GameState,
  type PieceType,
  type Position,
} from "./types.ts";
import { getShape, randomPieceType } from "./pieces.ts";

/** Create an empty board */
export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => 0)
  );
}

/** Deep clone board */
export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/** Check if a piece at position overlaps with board or is out of bounds */
export function collides(
  board: Board,
  piece: CurrentPiece,
  offset: Position = { x: 0, y: 0 }
): boolean {
  const shape = getShape(piece.type, piece.rotation);
  const px = piece.position.x + offset.x;
  const py = piece.position.y + offset.y;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const nx = px + col;
        const ny = py + row;
        if (nx < 0 || nx >= BOARD_WIDTH || ny >= BOARD_HEIGHT) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
  }
  return false;
}

/** Return the piece at its landing position (lowest Y where it can sit without colliding). Used for ghost/indicator. */
export function ghostPosition(board: Board, piece: CurrentPiece): CurrentPiece {
  let ghost: CurrentPiece = {
    ...piece,
    position: { ...piece.position },
  };
  while (!collides(board, ghost, { x: 0, y: 1 })) {
    ghost = {
      ...ghost,
      position: { ...ghost.position, y: ghost.position.y + 1 },
    };
  }
  return ghost;
}

/** Merge current piece into board and return new board (does not mutate) */
export function mergePiece(board: Board, piece: CurrentPiece): Board {
  const next = cloneBoard(board);
  const shape = getShape(piece.type, piece.rotation);
  const color = piece.type + 1; // 1-7 for display
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const ny = piece.position.y + row;
        const nx = piece.position.x + col;
        if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH) {
          next[ny][nx] = color;
        }
      }
    }
  }
  return next;
}

/** Find and clear full rows; return [newBoard, numberOfLinesCleared] */
export function clearLines(board: Board): [Board, number] {
  const fullRows = getFullRows(board);
  if (fullRows.length === 0) return [cloneBoard(board), 0];
  const newBoard = board.filter((_, y) => !fullRows.includes(y));
  const emptyRows = fullRows.length;
  for (let i = 0; i < emptyRows; i++) {
    newBoard.unshift(Array.from({ length: BOARD_WIDTH }, () => 0));
  }
  return [newBoard as Board, emptyRows];
}

/** Return row indices that are full (all cells non-zero) */
export function getFullRows(board: Board): number[] {
  const fullRows: number[] = [];
  for (let y = 0; y < board.length; y++) {
    if (board[y].every((cell) => cell !== 0)) fullRows.push(y);
  }
  return fullRows;
}

/** Score for clearing n lines (1-4) */
export function scoreForLines(lines: number): number {
  return LINE_SCORES[Math.min(lines, 4)] ?? 0;
}

/** Spawn position: center top (y may be negative for I piece) */
export function spawnPosition(pieceType: PieceType): Position {
  const shape = getShape(pieceType, 0);
  const cols = shape[0].length;
  const x = Math.floor((BOARD_WIDTH - cols) / 2);
  const y = 0;
  return { x, y };
}

/** Check if piece at spawn position collides (top-out / game over) */
export function wouldSpawnCollide(board: Board, pieceType: PieceType): boolean {
  const pos = spawnPosition(pieceType);
  const piece: CurrentPiece = {
    type: pieceType,
    rotation: 0,
    position: pos,
  };
  return collides(board, piece);
}

/** Create initial game state */
export function createInitialState(seedNext?: PieceType): GameState {
  const first = randomPieceType();
  const next = seedNext ?? randomPieceType();
  const pos = spawnPosition(first);
  return {
    board: createEmptyBoard(),
    currentPiece: {
      type: first,
      rotation: 0,
      position: pos,
    },
    nextPieceType: next,
    score: 0,
    lines: 0,
    gameOver: false,
    level: 1,
  };
}

/** Apply gravity: move piece down one row if possible; returns new state or null if locked */
export function tick(state: GameState): GameState | null {
  if (state.gameOver || !state.currentPiece) return null;
  if (collides(state.board, state.currentPiece, { x: 0, y: 1 })) {
    return null; // lock - caller should lock and spawn next
  }
  return {
    ...state,
    currentPiece: {
      ...state.currentPiece,
      position: {
        ...state.currentPiece.position,
        y: state.currentPiece.position.y + 1,
      },
    },
  };
}

/** Move piece left/right/down; returns new state or null if invalid */
export function move(
  state: GameState,
  dir: "left" | "right" | "down"
): GameState | null {
  if (state.gameOver || !state.currentPiece) return null;
  const offset =
    dir === "left"
      ? { x: -1, y: 0 }
      : dir === "right"
        ? { x: 1, y: 0 }
        : { x: 0, y: 1 };
  if (collides(state.board, state.currentPiece, offset)) return null;
  return {
    ...state,
    currentPiece: {
      ...state.currentPiece,
      position: {
        x: state.currentPiece.position.x + offset.x,
        y: state.currentPiece.position.y + offset.y,
      },
    },
  };
}

/** Rotate piece (clockwise); returns new state or null if invalid */
export function rotate(state: GameState): GameState | null {
  if (state.gameOver || !state.currentPiece) return null;
  const nextRotation = (state.currentPiece.rotation + 1) % 4;
  const rotated: CurrentPiece = {
    ...state.currentPiece,
    rotation: nextRotation,
  };
  if (!collides(state.board, rotated)) {
    return { ...state, currentPiece: rotated };
  }
  // Wall kick: try one cell left then one cell right
  for (const dx of [-1, 1]) {
    const kicked: CurrentPiece = {
      ...rotated,
      position: { ...rotated.position, x: rotated.position.x + dx },
    };
    if (!collides(state.board, kicked)) {
      return { ...state, currentPiece: kicked };
    }
  }
  return null;
}

/** Hard drop: move piece to bottom, then lock (may start line-clear animation). */
export function hardDrop(state: GameState): GameState {
  if (state.gameOver || !state.currentPiece) return state;
  let s = { ...state };
  let piece = s.currentPiece!;
  while (!collides(s.board, piece, { x: 0, y: 1 })) {
    piece = {
      ...piece,
      position: { ...piece.position, y: piece.position.y + 1 },
    };
  }
  return lockPiece({ ...s, currentPiece: piece });
}

/** Start line-clear phase: merge piece, set clearingRows if any full rows; otherwise do full lock. */
export function lockPiece(state: GameState): GameState {
  if (state.gameOver || !state.currentPiece) return state;
  const board = mergePiece(state.board, state.currentPiece);
  const fullRows = getFullRows(board);
  if (fullRows.length === 0) {
    const [newBoard] = clearLines(board);
    const nextType = state.nextPieceType;
    const spawnPos = spawnPosition(nextType);
    const wouldCollide = wouldSpawnCollide(newBoard, nextType);
    return {
      ...state,
      board: newBoard,
      currentPiece: wouldCollide
        ? null
        : {
            type: nextType,
            rotation: 0,
            position: spawnPos,
          },
      nextPieceType: wouldCollide ? state.nextPieceType : randomPieceType(),
      gameOver: wouldCollide,
    };
  }
  return {
    ...state,
    board,
    currentPiece: null,
    clearingRows: fullRows,
  };
}

/** Finish line-clear: apply clear, update score/lines/level, spawn next. Call after clearing animation. */
export function finishLineClear(state: GameState): GameState {
  const clearingRows = state.clearingRows;
  if (!clearingRows?.length) return state;
  const [newBoard, linesCleared] = clearLines(state.board);
  const addScore = scoreForLines(linesCleared);
  const nextType = state.nextPieceType;
  const spawnPos = spawnPosition(nextType);
  const wouldCollide = wouldSpawnCollide(newBoard, nextType);
  const newState: GameState = {
    ...state,
    board: newBoard,
    score: state.score + addScore,
    lines: state.lines + linesCleared,
    level: Math.floor((state.lines + linesCleared) / 10) + 1,
    clearingRows: undefined,
    currentPiece: wouldCollide
      ? null
      : {
          type: nextType,
          rotation: 0,
          position: spawnPos,
        },
    nextPieceType: wouldCollide ? state.nextPieceType : randomPieceType(),
    gameOver: wouldCollide,
  };
  return newState;
}

/** Apply one action (move/rotate/softDrop/hardDrop); returns new state or null if no change */
export function applyAction(
  state: GameState,
  action: { type: string; dir?: "left" | "right" | "down" }
): GameState | null {
  if (state.gameOver) return null;
  switch (action.type) {
    case "move":
      return action.dir ? move(state, action.dir) : null;
    case "rotate":
      return rotate(state);
    case "softDrop":
      return move(state, "down");
    case "hardDrop":
      return hardDrop(state);
    default:
      return null;
  }
}
