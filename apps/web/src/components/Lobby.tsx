import { useState } from "react";
import type { UsePeerConnectionReturn } from "../game/usePeerConnection.ts";

interface LobbyProps {
  peerConnection: UsePeerConnectionReturn;
}

export function Lobby({ peerConnection }: LobbyProps) {
  const [creating, setCreating] = useState(false);
  const [joinId, setJoinId] = useState("");
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  const { createRoom, joinRoom, roomCode, connectionError, connected } = peerConnection;

  const handleCreate = async () => {
    setCreating(true);
    try {
      await createRoom();
    } catch {
      // error displayed via connectionError
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinId.trim()) return;
    setJoining(true);
    try {
      await joinRoom(joinId.trim());
    } catch {
      // error displayed via connectionError
    } finally {
      setJoining(false);
    }
  };

  const showWaiting = roomCode && !connected;

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h2>Multiplayer Lobby</h2>
      <p style={{ color: "#666" }}>
        Create a match and share the room code with a friend, or enter a code to join.
      </p>

      <section style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16 }}>Create match</h3>
        <button type="button" onClick={handleCreate} disabled={creating}>
          {creating ? "Creating…" : "Create match"}
        </button>
        {showWaiting && (
          <div style={{ marginTop: 8 }}>
            <div style={{ padding: 8, background: "#eee", borderRadius: 4 }}>
              <p style={{ margin: 0, fontWeight: "bold" }}>
                Room code: {roomCode}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(roomCode!).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                  style={{ marginLeft: 8, padding: "2px 8px", fontSize: 12 }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
                Share this code with the other player.
                Waiting for them to connect…
              </p>
            </div>
          </div>
        )}
      </section>

      <section style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16 }}>Join match</h3>
        <input
          type="text"
          placeholder="Room code"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          style={{ marginRight: 8, padding: "6px 8px" }}
        />
        <button
          type="button"
          onClick={handleJoin}
          disabled={joining || !joinId.trim()}
        >
          {joining ? "Joining…" : "Join"}
        </button>
      </section>

      {connectionError && <p style={{ color: "#c00" }}>{connectionError}</p>}
    </div>
  );
}
