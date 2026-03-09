import { Injectable } from "@nestjs/common";
import {
  createInitialState,
  applyAction,
  tick,
  lockPiece,
  finishLineClear,
  DEFAULT_DROP_MS,
  type GameState,
  type GameAction,
} from "shared";

export type RoomStatus = "waiting" | "playing" | "finished";

export interface RoomState {
  matchId: string;
  player1: GameState;
  player2: GameState;
  status: RoomStatus;
  winnerId: number | null;
}

@Injectable()
export class GameRoomService {
  private rooms = new Map<string, RoomState>();

  createRoom(matchId: string): void {
    this.rooms.set(matchId, {
      matchId,
      player1: createInitialState(),
      player2: createInitialState(),
      status: "waiting",
      winnerId: null,
    });
  }

  getRoom(matchId: string): RoomState | undefined {
    return this.rooms.get(matchId);
  }

  startGame(matchId: string): void {
    const room = this.rooms.get(matchId);
    if (!room || room.status !== "waiting") return;
    room.status = "playing";
  }

  /** Run one gravity tick for both players; update room; return room or null if not playing. Caller should publish. */
  tickGravity(matchId: string): RoomState | null {
    const room = this.rooms.get(matchId);
    if (!room || room.status !== "playing") return null;
    for (const id of [1, 2] as const) {
      const s = id === 1 ? room.player1 : room.player2;
      if (s.gameOver || !s.currentPiece) continue;
      const ticked = tick(s);
      if (ticked) {
        if (id === 1) room.player1 = ticked;
        else room.player2 = ticked;
      } else {
        let locked = lockPiece(s);
        if (locked.clearingRows?.length) locked = finishLineClear(locked);
        if (id === 1) room.player1 = locked;
        else room.player2 = locked;
      }
    }
    const p1 = room.player1;
    const p2 = room.player2;
    if (p1.gameOver || p2.gameOver) {
      room.status = "finished";
      room.winnerId = p1.score >= p2.score ? 1 : 2;
    }
    return room;
  }

  getDropIntervalMs(): number {
    return DEFAULT_DROP_MS;
  }

  /** Apply action for a player; update room; return new room state and whether match ended.
   * Gravity is handled by the interval (tickGravity); we do not tick here so each keypress doesn't drop the piece. */
  applyPlayerAction(
    matchId: string,
    playerId: 1 | 2,
    action: GameAction
  ): { room: RoomState; matchEnd: boolean } {
    const room = this.rooms.get(matchId);
    if (!room || room.status !== "playing") {
      return { room: room!, matchEnd: false };
    }
    const state = playerId === 1 ? room.player1 : room.player2;
    if (state.gameOver) return { room, matchEnd: false };

    let next = applyAction(state, action);
    if (next) {
      if (next.clearingRows?.length) next = finishLineClear(next);
      if (playerId === 1) room.player1 = next;
      else room.player2 = next;
    } else if (action.type === "move" && action.dir === "down") {
      let locked = lockPiece(state);
      if (locked.clearingRows?.length) locked = finishLineClear(locked);
      if (playerId === 1) room.player1 = locked;
      else room.player2 = locked;
    }

    // Check for game over (e.g. after hard drop or lock)
    const p1 = room.player1;
    const p2 = room.player2;
    if (p1.gameOver || p2.gameOver) {
      room.status = "finished";
      room.winnerId = p1.score >= p2.score ? 1 : 2;
      return { room, matchEnd: true };
    }
    return { room, matchEnd: false };
  }

  /** Serialize room for broadcasting to clients */
  serializeRoom(room: RoomState): Record<string, unknown> {
    return {
      status: room.status,
      winnerId: room.winnerId,
      player1: {
        board: room.player1.board,
        currentPiece: room.player1.currentPiece,
        nextPieceType: room.player1.nextPieceType,
        score: room.player1.score,
        lines: room.player1.lines,
        gameOver: room.player1.gameOver,
        level: room.player1.level,
      },
      player2: {
        board: room.player2.board,
        currentPiece: room.player2.currentPiece,
        nextPieceType: room.player2.nextPieceType,
        score: room.player2.score,
        lines: room.player2.lines,
        gameOver: room.player2.gameOver,
        level: room.player2.level,
      },
    };
  }
}
