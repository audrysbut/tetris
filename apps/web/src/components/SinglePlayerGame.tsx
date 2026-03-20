import { useSinglePlayer } from "../game/useSinglePlayer.ts";
import { useKeyboard } from "../game/useKeyboard.ts";
import { useGamepad } from "../game/useGamepad.ts";
import { useScreenWakeLock } from "../game/useScreenWakeLock.ts";
import { BoardCanvas } from "./BoardCanvas.tsx";
import { HUD, NextPiece } from "./HUD.tsx";
import type { KeyAction } from "../game/useKeyboard.ts";
import { useState, useEffect, useCallback, useRef, type ChangeEvent } from "react";
import { BOARD_WIDTH, BOARD_HEIGHT } from "@shared/mod";

const MAX_CELL_SIZE = 44;

export function SinglePlayerGame() {
  const [constantSpeed, setConstantSpeed] = useState(true);
  const { state, isPaused, setPaused, dispatch, reset } = useSinglePlayer(constantSpeed);
  const [elapsedMs, setElapsedMs] = useState(0);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(MAX_CELL_SIZE);

  const handleReset = useCallback(() => {
    setElapsedMs(0);
    reset();
  }, [reset]);

  // Timer: run only when playing (not paused, not game over)
  useEffect(() => {
    if (state.gameOver || isPaused) return;
    const id = setInterval(() => setElapsedMs((e) => e + 100), 100);
    return () => clearInterval(id);
  }, [state.gameOver, isPaused]);

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

  const handleAction = useCallback(
    (action: KeyAction) => {
      if (action === "pause") {
        setPaused((p) => !p);
        return;
      }
      if (isPaused) return;
      if (action === "left") dispatch({ type: "move", dir: "left" });
      else if (action === "right") dispatch({ type: "move", dir: "right" });
      else if (action === "rotate") dispatch({ type: "rotate" });
      else if (action === "softDrop") dispatch({ type: "move", dir: "down" });
      else if (action === "hardDrop") dispatch({ type: "hardDrop" });
    },
    [dispatch, setPaused, isPaused]
  );

  useKeyboard(handleAction, !state.gameOver);
  useGamepad(handleAction, true, { onHome: handleReset });

  useScreenWakeLock(!state.gameOver && !isPaused);

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        padding: 8,
        paddingLeft: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: 4,
          fontSize: 18,
          flexShrink: 0,
          color: "#fff",
          textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 6px #000",
        }}
      >
        Single player
      </h2>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          minWidth: 0,
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minWidth: 140,
            flexShrink: 0,
            background: "rgba(0,0,0,0.45)",
            padding: "10px 12px",
            borderRadius: 8,
          }}
        >
          <HUD
            score={state.score}
            lines={state.lines}
            level={constantSpeed ? 1 : state.level}
            gameOver={state.gameOver}
            isPaused={isPaused}
            elapsedMs={elapsedMs}
          />
          <NextPiece nextPieceType={state.nextPieceType} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.4)",
                  borderRadius: 6,
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                {state.gameOver ? "Play again" : "Restart"}
              </button>
              {!state.gameOver && (
                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.4)",
                    borderRadius: 6,
                    padding: "6px 12px",
                    cursor: "pointer",
                  }}
                >
                  {isPaused ? "Resume" : "Pause"}
                </button>
              )}
            </div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
                color: "#fff",
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              <input
                type="checkbox"
                checked={constantSpeed}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setConstantSpeed(e.target.checked)
                }
              />
              Constant speed
            </label>
          </div>
        </div>
        <div
          ref={boardContainerRef}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-start",
          }}
        >
          <BoardCanvas state={state} cellSize={cellSize} />
        </div>
      </div>
    </div>
  );
}
