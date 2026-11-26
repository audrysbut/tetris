import { useEffect, useCallback, useMemo, useRef, type RefObject } from "react";
import { useFitBoardCellSize } from "../game/useFitBoardCellSize.ts";
import { useMultiPlayer } from "../game/useMultiPlayer.ts";
import { useKeyboard } from "../game/useKeyboard.ts";
import { useGamepad } from "../game/useGamepad.ts";
import { useScreenWakeLock } from "../game/useScreenWakeLock.ts";
import { BoardCanvas } from "./BoardCanvas.tsx";
import { HUD } from "./HUD.tsx";
import { BackButton } from "./BackButton.tsx";
import { toGameState } from "../api/types.ts";
import { createEmptyGameState } from "../shared/game.ts";
import { keyActionToGameAction } from "../game/inputActions.ts";
import type { UsePeerConnectionReturn } from "../game/usePeerConnection.ts";
import type { KeyAction } from "../game/useKeyboard.ts";
import type { GameState } from "../shared/types.ts";

interface MultiplayerGameProps {
  peerConnection: UsePeerConnectionReturn;
  onBack: () => void;
}

interface PlayerColumnProps {
  title: string;
  state: GameState;
  boardRef: RefObject<HTMLDivElement | null>;
  cellSize: number;
}

function PlayerColumn({ title, state, boardRef, cellSize }: PlayerColumnProps) {
  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 14,
          flexShrink: 0,
          color: "#fff",
          textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 6px #000",
        }}
      >
        {title}
      </h3>
      <HUD
        score={state.score}
        lines={state.lines}
        level={state.level}
        gameOver={state.gameOver}
        isPaused={false}
      />
      <div
        ref={boardRef}
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
        <BoardCanvas state={state} cellSize={cellSize} />
      </div>
    </div>
  );
}

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
      const gameAction = keyActionToGameAction(action);
      if (gameAction) multi.dispatch(gameAction);
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
  const oppGameState: GameState = useMemo(
    () => (multi.oppState ? toGameState(multi.oppState) : createEmptyGameState()),
    [multi.oppState],
  );

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
            <PlayerColumn
              title={`You (Player ${multi.myPlayerId})`}
              state={myGameState}
              boardRef={myBoardRef}
              cellSize={myCellSize}
            />
            <PlayerColumn
              title="Opponent"
              state={oppGameState}
              boardRef={oppBoardRef}
              cellSize={oppCellSize}
            />
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
