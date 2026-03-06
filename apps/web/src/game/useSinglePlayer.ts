import { useState, useCallback, useRef, useEffect } from "react";
import {
  createInitialState,
  tick,
  lockPiece,
  applyAction,
  DEFAULT_DROP_MS,
  type GameState,
  type GameAction,
} from "@shared/mod";

export function useSinglePlayer() {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [isPaused, setPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const reset = useCallback(() => {
    setState(createInitialState());
    setPaused(false);
  }, []);

  // Game loop: drop every N ms
  useEffect(() => {
    if (state.gameOver || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    const ms = Math.max(100, DEFAULT_DROP_MS - (state.level - 1) * 50);
    intervalRef.current = window.setInterval(() => {
      setState((s) => {
        const next = tick(s);
        if (next) return next;
        return lockPiece(s);
      });
    }, ms);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.gameOver, state.level, isPaused]);

  const dispatch = useCallback((action: GameAction) => {
    setState((s) => {
      if (s.gameOver) return s;
      const next = applyAction(s, action);
      if (next) return next;
      // Maybe lock after move down
      if (action.type === "move" && action.dir === "down") {
        const locked = lockPiece(s);
        return locked;
      }
      return s;
    });
  }, []);

  return { state, isPaused, setPaused, dispatch, reset };
}
