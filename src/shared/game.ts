import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  LINE_SCORES,
  type Board,
  type CurrentPiece,
  type GameAction,
  type GameState,
  type PieceType,
  type Position,
} from "./types.ts";
import { getShape, pieceAtSeed } from "./pieces.ts";

/** Generate a random seed for single-player when no seed is provided. */
function generateRandomSeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) >>> 0);
}

/** Create an empty board */
function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => 0)
  );
}

/** Deep clone board */
function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/** Check if a piece at position overlaps with board or is out of bounds */
function collides(
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
function mergePiece(board: Board, piece: CurrentPiece): Board {
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
function clearLines(board: Board): [Board, number] {
  const fullRows = getFullRows(board);
  if (fullRows.length === 0) return [cloneBoard(board), 0];
  const newBoard = board
    .filter((_, y) => !fullRows.includes(y))
    .map((row) => [...row]);
  const emptyRows = fullRows.length;
  for (let i = 0; i < emptyRows; i++) {
    newBoard.unshift(Array.from({ length: BOARD_WIDTH }, () => 0));
  }
  return [newBoard as Board, emptyRows];
}

/** Return row indices that are full (all cells non-zero) */
function getFullRows(board: Board): number[] {
  const fullRows: number[] = [];
  for (let y = 0; y < board.length; y++) {
    if (board[y].every((cell) => cell !== 0)) fullRows.push(y);
  }
  return fullRows;
}

/** Score for clearing n lines (1-4) */
function scoreForLines(lines: number): number {
  return LINE_SCORES[Math.min(lines, 4)] ?? 0;
}

/** Spawn position: center top (y may be negative for I piece) */
function spawnPosition(pieceType: PieceType): Position {
  const shape = getShape(pieceType, 0);
  const cols = shape[0].length;
  const x = Math.floor((BOARD_WIDTH - cols) / 2);
  const y = 0;
  return { x, y };
}

/** Check if piece at spawn position collides (top-out / game over) */
function wouldSpawnCollide(board: Board, pieceType: PieceType): boolean {
  const pos = spawnPosition(pieceType);
  const piece: CurrentPiece = {
    type: pieceType,
    rotation: 0,
    position: pos,
  };
  return collides(board, piece);
}

/** Create initial game state. Pass optional numeric seed for deterministic piece sequence; omit for random seed. */
export function createInitialState(seed?: number): GameState {
  const s = seed !== undefined ? seed >>> 0 : generateRandomSeed();
  const first = pieceAtSeed(s, 0);
  const next = pieceAtSeed(s, 1);
  const pos = spawnPosition(first);
  const returnState: GameState = {
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
    pieceSeed: s,
    pieceIndex: 2,
  };
  return returnState;
}

/** Create an empty (no piece) game state, useful for placeholder/opponent boards. */
export function createEmptyGameState(): GameState {
  return {
    board: createEmptyBoard(),
    currentPiece: null,
    nextPieceType: 0,
    score: 0,
    lines: 0,
    gameOver: false,
    level: 1,
    pieceSeed: 0,
    pieceIndex: 0,
    clearingRows: undefined,
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

export interface GravityStep {
  state: GameState;
  locked: boolean;
}

/** Advance gravity by one row, locking the piece when it cannot move down. */
export function stepGravity(state: GameState): GravityStep {
  const next = tick(state);
  if (next) return { state: next, locked: false };
  return { state: lockPiece(state), locked: true };
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

/** Compute the next piece fields after a lock/spawn, given the board the new piece will spawn on. */
function computeSpawn(
  state: GameState,
  board: Board,
): {
  currentPiece: CurrentPiece | null;
  nextPieceType: PieceType;
  pieceIndex: number;
  gameOver: boolean;
} {
  const nextType = state.nextPieceType;
  const spawnPos = spawnPosition(nextType);
  const wouldCollide = wouldSpawnCollide(board, nextType);
  const nextPieceType = wouldCollide
    ? state.nextPieceType
    : pieceAtSeed(state.pieceSeed, state.pieceIndex);
  const nextIndex = wouldCollide ? state.pieceIndex : state.pieceIndex + 1;
  return {
    currentPiece: wouldCollide
      ? null
      : {
          type: nextType,
          rotation: 0,
          position: spawnPos,
        },
    nextPieceType,
    pieceIndex: nextIndex,
    gameOver: wouldCollide,
  };
}

/** Hard drop: move piece to bottom, then lock (may start line-clear animation). */
export function hardDrop(state: GameState): GameState {
  if (state.gameOver || !state.currentPiece) return state;
  const s = { ...state };
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
    const spawned = computeSpawn(state, board);
    return {
      ...state,
      board,
      currentPiece: spawned.currentPiece,
      nextPieceType: spawned.nextPieceType,
      pieceIndex: spawned.pieceIndex,
      gameOver: spawned.gameOver,
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
  const spawned = computeSpawn(state, newBoard);
  return {
    ...state,
    board: newBoard,
    score: state.score + addScore,
    lines: state.lines + linesCleared,
    level: Math.floor((state.lines + linesCleared) / 10) + 1,
    clearingRows: undefined,
    currentPiece: spawned.currentPiece,
    nextPieceType: spawned.nextPieceType,
    pieceIndex: spawned.pieceIndex,
    gameOver: spawned.gameOver,
  };
}

/** Apply one action (move/rotate/softDrop/hardDrop); returns new state or null if no change */
export function applyAction(
  state: GameState,
  action: GameAction
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

export interface ReducedAction {
  state: GameState;
  changed: boolean;
  sound: "rotate" | "drop" | null;
}

/** Apply a player action, including soft-drop lock when moving down into an occupied cell. */
export function reduceGameAction(state: GameState, action: GameAction): ReducedAction {
  if (state.gameOver || state.clearingRows?.length) {
    return { state, changed: false, sound: null };
  }

  const next = applyAction(state, action);
  if (next) {
    const sound =
      action.type === "rotate"
        ? "rotate"
        : action.type === "hardDrop"
          ? "drop"
          : null;
    return { state: next, changed: true, sound };
  }

  if (action.type === "softDrop" || (action.type === "move" && action.dir === "down")) {
    const locked = lockPiece(state);
    return { state: locked, changed: true, sound: "drop" };
  }

  return { state, changed: false, sound: null };
}
