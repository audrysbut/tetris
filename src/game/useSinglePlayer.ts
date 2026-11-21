import { useState, useCallback, useRef, useEffect } from "react";
import { LINE_CLEAR_ANIMATION_MS, getDropIntervalMs } from "../shared/types.ts";
import type { GameAction, GameState } from "../shared/types.ts";
import {
  createInitialState,
  finishLineClear,
  reduceGameAction,
  stepGravity,
} from "../shared/game.ts";
import { playDrop, playLineClear, playRotate, preloadLineClear } from "./sfx.ts";

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
    const ms = getDropIntervalMs(state.level, constantSpeed);
    intervalRef.current = setInterval(() => {
      setState((s) => {
        const step = stepGravity(s);
        if (step.locked) playDrop();
        return step.state;
      });
    }, ms);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.gameOver, state.level, state.clearingRows, isPaused, constantSpeed]);

  const dispatch = useCallback((action: GameAction) => {
    setState((s) => {
      const result = reduceGameAction(s, action);
      if (result.sound === "rotate") playRotate();
      if (result.sound === "drop") playDrop();
      return result.state;
    });
  }, []);

  return { state, isPaused, setPaused, dispatch, reset };
}
