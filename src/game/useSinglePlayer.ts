import { useState, useCallback, useRef, useEffect } from "react";
import { DEFAULT_DROP_MS } from "../shared/types.ts";
import type { GameAction, GameState } from "../shared/types.ts";
import { applyAction, createInitialState, finishLineClear, lockPiece, tick } from "../shared/game.ts";
import { playDrop, playLineClear, playRotate, preloadLineClear } from "./sfx.ts";


const LINE_CLEAR_ANIMATION_MS = 400;

export function useSinglePlayer(constantSpeed = false) {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [isPaused, setPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    preloadLineClear();
  }, []);

  const reset = useCallback(() => {
    setState(createInitialState());
    setPaused(false);
  }, []);

  // When in line-clear phase, wait for animation then finish clear and spawn next piece
  useEffect(() => {
    const clearing = state.clearingRows?.length;
    if (!clearing) return;
    playLineClear(clearing);
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
        const locked = lockPiece(s);
        playDrop();
        return locked;
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
      if (next) {
        if (action.type === "rotate") playRotate();
        if (action.type === "hardDrop") playDrop();
        return next;
      }
      if (action.type === "move" && action.dir === "down") {
        const locked = lockPiece(s);
        playDrop();
        return locked;
      }
      return s;
    });
  }, []);

  return { state, isPaused, setPaused, dispatch, reset };
}
