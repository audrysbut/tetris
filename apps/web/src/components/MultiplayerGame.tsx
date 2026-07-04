import { useEffect, useCallback, useRef } from "react";
import { useFitBoardCellSize } from "../game/useFitBoardCellSize.ts";
import { useMultiPlayer } from "../game/useMultiPlayer.ts";
import { useKeyboard } from "../game/useKeyboard.ts";
import { useGamepad } from "../game/useGamepad.ts";
import { useScreenWakeLock } from "../game/useScreenWakeLock.ts";
import { BoardCanvas } from "./BoardCanvas.tsx";
import { HUD } from "./HUD.tsx";
import { BackButton } from "./BackButton.tsx";
import { toGameState } from "../api/types.ts";
import type { UsePeerConnectionReturn } from "../game/usePeerConnection.ts";
import type { KeyAction } from "../game/useKeyboard.ts";
import type { GameState } from "../shared/types.ts";

interface MultiplayerGameProps {
  peerConnection: UsePeerConnectionReturn;
  onBack: () => void;
}

const emptyState: GameState = {
  board: Array.from({ length: 20 }, () => Array(10).fill(0)),
  currentPiece: null,
  nextPieceType: 0,
  score: 0,
  lines: 0,
  gameOver: false,
  level: 1,
};

export function MultiplayerGame({ peerConnection, onBack }: MultiplayerGameProps) {
  const { send, onData, isHost } = peerConnection;

  const multi = useMultiPlayer({
    send,
    onData,
    isHost,
    connected: peerConnection.connected,
  });

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const myBoardRef = useRef<HTMLDivElement>(null);
  const oppBoardRef = useRef<HTMLDivElement>(null);
  const myCellSize = useFitBoardCellSize(myBoardRef);
  const oppCellSize = useFitBoardCellSize(oppBoardRef);

  const gameActive = multi.gameStatus === "playing" || multi.gameStatus === "finished";

  const handleAction = useCallback(
    (action: KeyAction) => {
      if (multi.gameStatus !== "playing") return;
      if (action === "left") multi.dispatch({ type: "move", dir: "left" });
      else if (action === "right") multi.dispatch({ type: "move", dir: "right" });
      else if (action === "rotate") multi.dispatch({ type: "rotate" });
      else if (action === "softDrop") multi.dispatch({ type: "move", dir: "down" });
      else if (action === "hardDrop") multi.dispatch({ type: "hardDrop" });
    },
    [multi]
  );

  useScreenWakeLock(gameActive);
  useKeyboard(handleAction, gameActive);
  useGamepad(handleAction, gameActive);

  useEffect(() => {
    if (gameActive) gameAreaRef.current?.focus();
  }, [gameActive]);

  const myGameState = multi.myState;
  const oppGameState: GameState = multi.oppState
    ? toGameState(multi.oppState)
    : emptyState;

  const showWaiting = multi.gameStatus === "waiting";

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        padding: 8,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <BackButton onClick={onBack} />
      {multi.gameStatus === "connecting" && (
        <p style={{ flexShrink: 0 }}>Establishing connection…</p>
      )}
      {showWaiting && (
        <p style={{ flexShrink: 0 }}>Waiting for opponent…</p>
      )}
      <div
        ref={gameAreaRef}
        tabIndex={gameActive ? 0 : -1}
        style={{
          outline: "none",
          flex: gameActive ? 1 : 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        aria-label={gameActive ? "Game area - use keyboard or gamepad to move pieces" : undefined}
      >
          <div
            style={{
              display: "flex",
              gap: 8,
              flex: 1,
              minHeight: 0,
              alignSelf: "stretch",
            }}
          >
            <div
              style={{
                flex: "1 1 0",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 14, flexShrink: 0, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 6px #000" }}>
                You (Player {multi.myPlayerId})
              </h3>
              <HUD
                score={myGameState.score}
                lines={myGameState.lines}
                level={myGameState.level}
                gameOver={myGameState.gameOver}
                isPaused={false}
              />
              <div
                ref={myBoardRef}
                style={{
                  flex: 1,
                  minHeight: 0,
                  alignSelf: "stretch",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <BoardCanvas state={myGameState} cellSize={myCellSize} />
              </div>
            </div>
            <div
              style={{
                flex: "1 1 0",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 14, flexShrink: 0, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 6px #000" }}>Opponent</h3>
              <HUD
                score={oppGameState.score}
                lines={oppGameState.lines}
                level={oppGameState.level}
                gameOver={oppGameState.gameOver}
                isPaused={false}
              />
              <div
                ref={oppBoardRef}
                style={{
                  flex: 1,
                  minHeight: 0,
                  alignSelf: "stretch",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <BoardCanvas state={oppGameState} cellSize={oppCellSize} />
              </div>
            </div>
          </div>
          {multi.gameStatus === "finished" && multi.winnerId != null && (
            <p style={{ marginTop: 8, fontSize: 16, fontWeight: "bold" }}>
              {multi.winnerId === multi.myPlayerId ? "You win!" : "You lose!"}
            </p>
          )}
        </div>
    </div>
  );
}
