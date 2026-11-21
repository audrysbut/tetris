import type { GameState } from "@shared/types";

/** Network snapshot of a player's visible game state. */
export interface PlayerStateUpdate {
  board: number[][];
  currentPiece: GameState["currentPiece"];
  nextPieceType: number;
  score: number;
  lines: number;
  gameOver: boolean;
  level: number;
}

export function toGameState(p: PlayerStateUpdate): GameState {
  return {
    board: p.board,
    currentPiece: p.currentPiece,
    nextPieceType: p.nextPieceType as GameState["nextPieceType"],
    score: p.score,
    lines: p.lines,
    gameOver: p.gameOver,
    level: p.level,
    pieceSeed: 0,
    pieceIndex: 0,
    clearingRows: undefined,
  };
}

export function toPlayerStateUpdate(state: GameState): PlayerStateUpdate {
  return {
    board: state.board,
    currentPiece: state.currentPiece,
    nextPieceType: state.nextPieceType,
    score: state.score,
    lines: state.lines,
    gameOver: state.gameOver,
    level: state.level,
  };
}

/** Messages exchanged between peers over the data channel. */
export type PeerMessage =
  | { type: "seed"; seed: number }
  | { type: "sync"; playerId: number; state: PlayerStateUpdate }
  | { type: "gameEnd"; winnerId: number };
