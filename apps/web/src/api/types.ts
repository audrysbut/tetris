import type { GameState } from "@shared/mod";

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
  } as GameState;
}
