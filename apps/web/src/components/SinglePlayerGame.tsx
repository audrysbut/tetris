import { useSinglePlayer } from "../game/useSinglePlayer.ts";
import { useKeyboard } from "../game/useKeyboard.ts";
import { useGamepad } from "../game/useGamepad.ts";
import { BoardCanvas } from "./BoardCanvas.tsx";
import { HUD, NextPiece } from "./HUD.tsx";
import type { KeyAction } from "../game/useKeyboard.ts";
import { useState, useEffect, useCallback, useRef } from "react";
import { BOARD_WIDTH, BOARD_HEIGHT } from "@shared/mod";

const MAX_CELL_SIZE = 44;

export function SinglePlayerGame() {
  const [constantSpeed, setConstantSpeed] = useState(true);
  const { state, isPaused, setPaused, dispatch, reset, lastTickAt, dropIntervalMs } = useSinglePlayer(constantSpeed);
  const [dropProgress, setDropProgress] = useState(0);
  const dropIntervalMsRef = useRef(dropIntervalMs);
  dropIntervalMsRef.current = dropIntervalMs;
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(MAX_CELL_SIZE);

  // Fit board in viewport: measure container and cap cell size so board doesn't overflow
  useEffect(() => {
    const el = boardContainerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0 || h <= 0) return;
      const sizeByW = w / BOARD_WIDTH;
      const sizeByH = h / BOARD_HEIGHT;
      const next = Math.min(sizeByW, sizeByH, MAX_CELL_SIZE);
      setCellSize(Math.max(8, Math.floor(next)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // requestAnimationFrame: compute drop progress for smooth falling
  // Only re-run when lastTickAt changes (real tick), not when dropIntervalMs changes (level up),
  // to avoid jitter from resetting progress without the piece moving.
  useEffect(() => {
    if (state.gameOver || isPaused || !state.currentPiece) return;
    setDropProgress(0);
    let rafId: number;
    const tick = () => {
      const elapsed = Date.now() - lastTickAt;
      const progress = Math.min(elapsed / dropIntervalMsRef.current, 0.9999);
      setDropProgress(progress);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [state.gameOver, isPaused, lastTickAt]);

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
  useGamepad(handleAction, !state.gameOver, { onHome: reset });

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        padding: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 4, fontSize: 18, flexShrink: 0 }}>Single Player</h2>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0, flex: 1, minHeight: 0 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minWidth: 140,
            flexShrink: 0,
          }}
        >
          <HUD
            score={state.score}
            lines={state.lines}
            level={constantSpeed ? 1 : state.level}
            gameOver={state.gameOver}
            isPaused={isPaused}
          />
          <NextPiece nextPieceType={state.nextPieceType} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" onClick={reset}>
                {state.gameOver ? "Play again" : "Restart"}
              </button>
              {!state.gameOver && (
                <button type="button" onClick={() => setPaused((p) => !p)}>
                  {isPaused ? "Resume" : "Pause"}
                </button>
              )}
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={constantSpeed}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConstantSpeed(e.target.checked)}
              />
              Constant speed
            </label>
          </div>
        </div>
        <div ref={boardContainerRef} style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", alignItems: "flex-start", justifyContent: "flex-start" }}>
          <BoardCanvas state={state} dropProgress={dropProgress} cellSize={cellSize} />
        </div>
      </div>
    </div>
  );
}
