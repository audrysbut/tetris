import { useState, useCallback, useRef, useEffect } from "react";
import {
  createInitialState,
  tick,
  lockPiece,
  finishLineClear,
  applyAction,
  DEFAULT_DROP_MS,
  type GameState,
  type GameAction,
} from "@shared/mod";

const LINE_CLEAR_ANIMATION_MS = 400;

export function useSinglePlayer(constantSpeed = false) {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [isPaused, setPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const reset = useCallback(() => {
    setState(createInitialState());
    setPaused(false);
    // setLastTickAt(Date.now());
  }, []);

  // When in line-clear phase, wait for animation then finish clear and spawn next piece
  useEffect(() => {
    const clearing = state.clearingRows?.length;
    if (!clearing) return;
    const id = window.setTimeout(() => {
      setState((s) => finishLineClear(s));
    }, LINE_CLEAR_ANIMATION_MS);
    return () => clearTimeout(id);
  }, [state.clearingRows]);

  // Game loop: drop every N ms (paused while clearing or game over)
  useEffect(() => {
    if (state.gameOver || isPaused || state.clearingRows?.length) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    const ms = constantSpeed
      ? DEFAULT_DROP_MS
      : Math.max(100, DEFAULT_DROP_MS - (state.level - 1) * 50);
    intervalRef.current = setInterval(() => {
      setState((s) => {
        const next = tick(s);
        if (next) return next;
        return lockPiece(s);
      });
    }, ms);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.gameOver, state.level, state.clearingRows, isPaused, constantSpeed]);

  const dispatch = useCallback((action: GameAction) => {
    setState((s) => {
      if (s.gameOver) return s;
      if (s.clearingRows?.length) return s; // no-op during line-clear animation
      const next = applyAction(s, action);
      if (next) return next;
      if (action.type === "move" && action.dir === "down") {
        const locked = lockPiece(s);
        return locked;
      }
      return s;
    });
  }, []);

  return { state, isPaused, setPaused, dispatch, reset };
}
