import { useState, useEffect, useCallback, useRef } from "react";
import { useWebStomp } from "../game/useWebStomp.ts";
import { useKeyboard } from "../game/useKeyboard.ts";
import { useGamepad } from "../game/useGamepad.ts";
import { useScreenWakeLock } from "../game/useScreenWakeLock.ts";
import { BoardCanvas } from "./BoardCanvas.tsx";
import { HUD } from "./HUD.tsx";
import { BackButton } from "./BackButton.tsx";
import { parseRoomUpdate, toGameState } from "../api/types.ts";
import type { JoinMatchResult } from "../api/match.ts";
import type { KeyAction } from "../game/useKeyboard.ts";
import type { GameState } from "@shared/mod";

interface MultiplayerGameProps {
  joinResult: JoinMatchResult;
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

export function MultiplayerGame({ joinResult, onBack }: MultiplayerGameProps) {
  const { matchId, playerId, actionsDestination, updatesDestination, gameStarted } = joinResult;
  const [room, setRoom] = useState<ReturnType<typeof parseRoomUpdate>>(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { connect, disconnect, subscribe, send } = useWebStomp();
  const unsubRef = useRef<(() => void) | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConnectionError(null);
    const timeoutMs = 45000; // Allow slow RabbitMQ/WebSocket (logs showed ~34s connect in some envs)
    const timeoutId = setTimeout(() => {
      setConnectionError((prev) =>
        prev ? prev : "Connection timed out. Is RabbitMQ running? Start it with: docker compose up -d rabbitmq"
      );
    }, timeoutMs);
    const _client = connect(
      () => {
        clearTimeout(timeoutId);
        setConnected(true);
        setConnectionError(null);
        unsubRef.current = subscribe(updatesDestination, (body) => {
          const next = parseRoomUpdate(body);
          if (next) {
            setRoom(next);
          } else if (body && body.trim() !== "") {
            setConnectionError("Invalid update from server");
          }
        });
      },
      () => {
        clearTimeout(timeoutId);
        setConnected(false);
        setConnectionError("Connection failed");
      }
    );
    return () => {
      clearTimeout(timeoutId);
      unsubRef.current?.();
      disconnect();
    };
  }, [matchId, updatesDestination, connect, disconnect, subscribe]);

  const sendAction = useCallback(
    (type: string, dir?: string) => {
      send(actionsDestination, JSON.stringify({ matchId, playerId, type, dir }));
    },
    [actionsDestination, matchId, playerId, send]
  );

  const handleAction = useCallback(
    (action: KeyAction) => {
      if (room?.status === "finished" || !room) return;
      if (action === "left") sendAction("move", "left");
      else if (action === "right") sendAction("move", "right");
      else if (action === "rotate") sendAction("rotate");
      else if (action === "softDrop") sendAction("move", "down");
      else if (action === "hardDrop") sendAction("hardDrop");
    },
    [room, sendAction]
  );

  const gameActive = room?.status === "playing" || room?.status === "finished";
  const showGame = connected && (gameStarted || room?.event === "gameStart" || gameActive);
  const showWaiting = connected && !gameStarted && !gameActive && room?.event !== "gameStart";

  useScreenWakeLock(connected && !!gameActive);
  useKeyboard(handleAction, connected && gameActive);
  useGamepad(handleAction, connected && gameActive);

  // Focus game area when game becomes active so keyboard/gamepad work (e.g. after joining)
  useEffect(() => {
    if (gameActive && connected) gameAreaRef.current?.focus();
  }, [gameActive, connected]);

  const myState: GameState = room
    ? toGameState(playerId === 1 ? room.player1 : room.player2)
    : emptyState;
  const oppState: GameState = room
    ? toGameState(playerId === 1 ? room.player2 : room.player1)
    : emptyState;

  return (
    <div style={{ padding: 8 }}>
      <BackButton onClick={onBack} />
      {connectionError && (
        <p style={{ color: "#c00", marginBottom: 8 }}>{connectionError}</p>
      )}
      {!connected && !connectionError && (
        <p>Connecting to RabbitMQ… This may take up to 45 seconds. If it takes longer, ensure RabbitMQ is running (e.g. <code>docker compose up -d rabbitmq</code>).</p>
      )}
      {showWaiting && (
        <>
          <div style={{ marginTop: 8, padding: 12, background: "#f0f4f8", borderRadius: 8, maxWidth: 400 }}>
            <p style={{ margin: "0 0 6px", fontWeight: "bold", fontSize: 14 }}>Share this match ID with your opponent:</p>
            <p
              style={{
                margin: 0,
                fontSize: 20,
                fontFamily: "monospace",
                letterSpacing: 2,
                userSelect: "all",
                padding: "8px 12px",
                background: "#fff",
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
              title="Click to select, then copy"
            >
              {matchId}
            </p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(matchId).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              style={{ marginTop: 6, padding: "4px 10px", fontSize: 13 }}
            >
              {copied ? "Copied!" : "Copy match ID"}
            </button>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#555" }}>
              They can enter this in the lobby under “Join match”.
            </p>
          </div>
          <p style={{ marginTop: 8, fontSize: 13 }}>Waiting for opponent to join…</p>
        </>
      )}
      {showGame && (
        <>
          <div
            ref={gameAreaRef}
            tabIndex={0}
            style={{ outline: "none" }}
            aria-label="Game area - use keyboard or gamepad to move pieces"
          >
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: 14 }}>You (Player {playerId})</h3>
              <HUD
                score={myState.score}
                lines={myState.lines}
                level={myState.level}
                gameOver={myState.gameOver}
                isPaused={false}
              />
              <BoardCanvas state={myState} />
            </div>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: 14 }}>Opponent</h3>
              <HUD
                score={oppState.score}
                lines={oppState.lines}
                level={oppState.level}
                gameOver={oppState.gameOver}
                isPaused={false}
              />
              <BoardCanvas state={oppState} />
            </div>
          </div>
          {room?.status === "finished" && room.winnerId != null && (
            <p style={{ marginTop: 8, fontSize: 16, fontWeight: "bold" }}>
              {room.winnerId === playerId ? "You win!" : "You lose!"} Winner: highest score when someone topped out.
            </p>
          )}
          </div>
        </>
      )}
    </div>
  );
}
