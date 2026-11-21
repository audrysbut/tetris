import { useState, useCallback, useRef, useEffect } from "react";
import { useMemo } from "react";
import type { PeerMessage, PlayerStateUpdate } from "../api/types.ts";
import { DEFAULT_DROP_MS, type GameAction, type GameState } from "../shared/types.ts";
import { applyAction, createInitialState, finishLineClear, lockPiece, tick } from "../shared/game.ts";
import { playDrop, playLineClear, playRotate, preloadLineClear } from "./sfx.ts";

const LINE_CLEAR_ANIMATION_MS = 400;

export interface UseMultiPlayerOptions {
  send: (data: unknown) => void;
  onData: (cb: (data: unknown) => void) => () => void;
  isHost: boolean;
  connected: boolean;
}

export interface UseMultiPlayerReturn {
  myState: GameState;
  oppState: PlayerStateUpdate | null;
  gameStatus: "connecting" | "waiting" | "playing" | "finished";
  winnerId: number | null;
  myPlayerId: 1 | 2;
  dispatch: (action: GameAction) => void;
}

function serializeState(state: GameState): PlayerStateUpdate {
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

export function useMultiPlayer({
  send,
  onData,
  isHost,
  connected,
}: UseMultiPlayerOptions): UseMultiPlayerReturn {
  const myPlayerId = isHost ? 1 : 2;
  const [gameStatus, setGameStatus] = useState<"connecting" | "waiting" | "playing" | "finished">("connecting");
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [myState, setMyState] = useState<GameState>(() => createInitialState());
  const [oppState, setOppState] = useState<PlayerStateUpdate | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const gameStatusRef = useRef(gameStatus);
  gameStatusRef.current = gameStatus;

  useEffect(() => {
    preloadLineClear();
  }, []);

  useEffect(() => {
    if (!connected) {
      setGameStatus("connecting");
      startedRef.current = false;
      return;
    }
    if (isHost) {
      const s = createInitialState();
      send({ type: "seed", seed: s.pieceSeed });
      setMyState(s);
      setGameStatus("playing");
      startedRef.current = true;
    } else {
      setGameStatus("waiting");
    }
  }, [connected, isHost, send]);

  useEffect(() => {
    const unsub = onData((data: unknown) => {
      const msg = data as PeerMessage;
      if (msg.type === "seed") {
        setMyState(createInitialState(msg.seed));
        setGameStatus("playing");
        startedRef.current = true;
      } else if (msg.type === "sync" && msg.playerId !== myPlayerId) {
        setOppState(msg.state);
      } else if (msg.type === "gameEnd") {
        setGameStatus("finished");
        setWinnerId(myPlayerId);
      }
    });
    return unsub;
  }, [onData, myPlayerId]);

  useEffect(() => {
    const clearing = myState.clearingRows?.length;
    if (!clearing) return;
    playLineClear(clearing);
    const id = window.setTimeout(() => {
      setMyState((s) => {
        const next = finishLineClear(s);
        send({ type: "sync", playerId: myPlayerId, state: serializeState(next) });
        return next;
      });
    }, LINE_CLEAR_ANIMATION_MS);
    return () => clearTimeout(id);
  }, [myState.clearingRows, myPlayerId, send]);

  useEffect(() => {
    if (myState.gameOver || myState.clearingRows?.length || gameStatus !== "playing") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    const ms = Math.max(100, DEFAULT_DROP_MS - (myState.level - 1) * 50);
    intervalRef.current = setInterval(() => {
      setMyState((s) => {
        const next = tick(s);
        if (next) {
          send({ type: "sync", playerId: myPlayerId, state: serializeState(next) });
          return next;
        }
        const locked = lockPiece(s);
        playDrop();
        send({ type: "sync", playerId: myPlayerId, state: serializeState(locked) });
        return locked;
      });
    }, ms);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [myState.gameOver, myState.level, myState.clearingRows, gameStatus, myPlayerId, send]);

  useEffect(() => {
    if (myState.gameOver) {
      const opponentId = myPlayerId === 1 ? 2 : 1;
      send({ type: "gameEnd", winnerId: opponentId });
      setGameStatus("finished");
      setWinnerId(opponentId);
    }
  }, [myState.gameOver, myPlayerId, send]);

  const dispatch = useCallback(
    (action: GameAction) => {
      setMyState((s) => {
        if (s.gameOver) return s;
        if (s.clearingRows?.length) return s;
        if (gameStatusRef.current !== "playing") return s;
        const next = applyAction(s, action);
        if (next) {
          if (action.type === "rotate") playRotate();
          if (action.type === "hardDrop") playDrop();
          send({ type: "sync", playerId: myPlayerId, state: serializeState(next) });
          return next;
        }
        if (action.type === "move" && action.dir === "down") {
          const locked = lockPiece(s);
          playDrop();
          send({ type: "sync", playerId: myPlayerId, state: serializeState(locked) });
          return locked;
        }
        return s;
      });
    },
    [myPlayerId, send]
  );

  return useMemo(
    () => ({
      myState,
      oppState,
      gameStatus,
      winnerId,
      myPlayerId,
      dispatch,
    }),
    [myState, oppState, gameStatus, winnerId, myPlayerId, dispatch],
  );
}
