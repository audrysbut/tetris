import { useState, useEffect, useCallback, useRef } from "react";
import { useWebStomp } from "../game/useWebStomp";
import { useKeyboard } from "../game/useKeyboard";
import { BoardCanvas } from "./BoardCanvas";
import { HUD } from "./HUD";
import { parseRoomUpdate, toGameState } from "../api/types";
import type { JoinMatchResult } from "../api/match";
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
  const { connect, disconnect, subscribe, send } = useWebStomp();
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const client = connect(
      () => {
        setConnected(true);
        unsubRef.current = subscribe(updatesDestination, (body) => {
          const next = parseRoomUpdate(body);
          if (next) setRoom(next);
        });
      },
      () => setConnected(false)
    );
    return () => {
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

  useKeyboard(
    (action) => {
      if (room?.status === "finished" || !room) return;
      if (action === "left") sendAction("move", "left");
      else if (action === "right") sendAction("move", "right");
      else if (action === "rotate") sendAction("rotate");
      else if (action === "softDrop") sendAction("move", "down");
      else if (action === "hardDrop") sendAction("hardDrop");
    },
    connected && room?.status === "playing"
  );

  const myState: GameState = room
    ? toGameState(playerId === 1 ? room.player1 : room.player2)
    : emptyState;
  const oppState: GameState = room
    ? toGameState(playerId === 1 ? room.player2 : room.player1)
    : emptyState;

  return (
    <div style={{ padding: 16 }}>
      <button type="button" onClick={onBack} style={{ marginBottom: 8 }}>
        ← Back
      </button>
      {!connected && <p>Connecting to game… (reconnecting if connection was lost)</p>}
      {connected && !gameStarted && !room?.event && (
        <p>Waiting for opponent to join…</p>
      )}
      {connected && (gameStarted || room?.event === "gameStart") && (
        <>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ margin: "0 0 8px" }}>You (Player {playerId})</h3>
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
              <h3 style={{ margin: "0 0 8px" }}>Opponent</h3>
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
            <p style={{ marginTop: 16, fontSize: 18, fontWeight: "bold" }}>
              {room.winnerId === playerId ? "You win!" : "You lose!"} Winner: highest score when someone topped out.
            </p>
          )}
        </>
      )}
    </div>
  );
}
