import { useSinglePlayer } from "../game/useSinglePlayer.ts";
import { useKeyboard } from "../game/useKeyboard.ts";
import { useGamepad } from "../game/useGamepad.ts";
import { BoardCanvas } from "./BoardCanvas.tsx";
import { HUD, NextPiece } from "./HUD.tsx";
import type { KeyAction } from "../game/useKeyboard.ts";
import { useState, useEffect, useCallback } from "react";

export function SinglePlayerGame() {
  const { state, isPaused, setPaused, dispatch, reset, lastTickAt, dropIntervalMs } = useSinglePlayer();
  const [dropProgress, setDropProgress] = useState(0);

  // requestAnimationFrame: compute drop progress for smooth falling
  useEffect(() => {
    if (state.gameOver || isPaused || !state.currentPiece) return;
    setDropProgress(0); // reset so we never draw at new position.y + stale progress
    let rafId: number;
    const tick = () => {
      const elapsed = Date.now() - lastTickAt;
      const progress = Math.min(elapsed / dropIntervalMs, 0.9999);
      setDropProgress(progress);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [state.gameOver, isPaused, state.currentPiece, lastTickAt, dropIntervalMs]);

  const handleAction = useCallback(
    (action: KeyAction) => {
      if (action === "pause") {
        setPaused((p) => !p);
        return;
      }
      if (action === "left") dispatch({ type: "move", dir: "left" });
      else if (action === "right") dispatch({ type: "move", dir: "right" });
      else if (action === "rotate") dispatch({ type: "rotate" });
      else if (action === "softDrop") dispatch({ type: "move", dir: "down" });
      else if (action === "hardDrop") dispatch({ type: "hardDrop" });
    },
    [dispatch, setPaused]
  );

  useKeyboard(handleAction, !state.gameOver);
  useGamepad(handleAction, !state.gameOver);

  return (
    <div style={{ padding: 8, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <h2 style={{ marginTop: 0, marginBottom: 4, fontSize: 18 }}>Single Player</h2>
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <div>
          <HUD
            score={state.score}
            lines={state.lines}
            level={state.level}
            gameOver={state.gameOver}
            isPaused={isPaused}
          />
          <BoardCanvas state={state} dropProgress={dropProgress} />
          <div style={{ marginTop: 4, display: "flex", gap: 8 }}>
            <button type="button" onClick={reset}>
              {state.gameOver ? "Play again" : "Restart"}
            </button>
            {!state.gameOver && (
              <button type="button" onClick={() => setPaused((p) => !p)}>
                {isPaused ? "Resume" : "Pause"}
              </button>
            )}
          </div>
        </div>
        <NextPiece nextPieceType={state.nextPieceType} />
      </div>
      <p style={{ fontSize: 11, color: "#666", marginTop: 6 }}>
        Controls: ← → move, ↑ rotate, ↓ soft drop, Space hard drop, P pause. Gamepad: D-pad or left stick to move, D-pad up hard drop, A rotate, B soft drop, Y hard drop, Start pause. (If gamepad does nothing, click the game area then press any gamepad button.)
      </p>
    </div>
  );
}
