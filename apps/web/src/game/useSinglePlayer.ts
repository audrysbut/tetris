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

export function useSinglePlayer(constantSpeed = false) {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [isPaused, setPaused] = useState(false);
  const [lastTickAt, setLastTickAt] = useState(() => Date.now());
  const intervalRef = useRef<number | null>(null);

  const reset = useCallback(() => {
    setState(createInitialState());
    setPaused(false);
    setLastTickAt(Date.now());
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
    const ms = constantSpeed
      ? DEFAULT_DROP_MS
      : Math.max(100, DEFAULT_DROP_MS - (state.level - 1) * 50);
    intervalRef.current = window.setInterval(() => {
      setLastTickAt(Date.now());
      setState((s) => {
        const next = tick(s);
        if (next) return next;
        return lockPiece(s);
      });
    }, ms);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.gameOver, state.level, isPaused, constantSpeed]);

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
