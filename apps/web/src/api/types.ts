import type { GameState } from "@shared/mod";

/** Server sends serialized player state (same shape as GameState for display) */
export interface PlayerStateUpdate {
  board: number[][];
  currentPiece: GameState["currentPiece"];
  nextPieceType: number;
  score: number;
  lines: number;
  gameOver: boolean;
  level: number;
}

export interface RoomUpdate {
  event?: "gameStart" | "matchEnd";
  status: string;
  winnerId?: number | null;
  player1: PlayerStateUpdate;
  player2: PlayerStateUpdate;
}

export function parseRoomUpdate(json: string): RoomUpdate | null {
  try {
    return JSON.parse(json) as RoomUpdate;
  } catch {
    return null;
  }
}

/** Build a GameState-like object for BoardCanvas from server update */
export function toGameState(p: PlayerStateUpdate): GameState {
  return {
    board: p.board,
    currentPiece: p.currentPiece,
    nextPieceType: p.nextPieceType as GameState["nextPieceType"],
    score: p.score,
    lines: p.lines,
    gameOver: p.gameOver,
    level: p.level,
  };
}
