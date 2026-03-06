import { useSinglePlayer } from "../game/useSinglePlayer";
import { useKeyboard } from "../game/useKeyboard";
import { BoardCanvas } from "./BoardCanvas";
import { HUD, NextPiece } from "./HUD";
import type { KeyAction } from "../game/useKeyboard";
import { useState, useEffect } from "react";

export function SinglePlayerGame() {
  const { state, isPaused, setPaused, dispatch, reset, lastTickAt, dropIntervalMs } = useSinglePlayer();
  const [dropProgress, setDropProgress] = useState(0);

  // requestAnimationFrame: compute drop progress for smooth falling
  useEffect(() => {
    if (state.gameOver || isPaused || !state.currentPiece) return;
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

  useKeyboard(
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
    !state.gameOver
  );

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <h2 style={{ marginTop: 0 }}>Single Player</h2>
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
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
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
      <p style={{ fontSize: 12, color: "#666", marginTop: 12 }}>
        Controls: ← → move, ↑ rotate, ↓ soft drop, Space hard drop, P pause
      </p>
    </div>
  );
}
