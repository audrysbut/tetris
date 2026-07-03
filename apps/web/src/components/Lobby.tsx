import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [roomCode]);

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

  const sessionCreated = Boolean(roomCode);
  const showWaiting = roomCode && !connected;

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h2>Multiplayer Lobby</h2>
      {!sessionCreated && (
        <p style={{ color: "#666" }}>
          Create a match and share the room code with a friend, or enter a code to join.
        </p>
      )}

      <section style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16 }}>Create match</h3>
        <button type="button" onClick={handleCreate} disabled={creating || sessionCreated}>
          {creating ? "Creating…" : sessionCreated ? "Created" : "Create match"}
        </button>
        {showWaiting && (
          <div style={{ marginTop: 8 }}>
            <div style={{ padding: 12, background: "#f0f4f8", borderRadius: 4 }}>
              <p style={{ margin: "0 0 4px", fontSize: 13, color: "#555" }}>
                Share this room code with the other player (auto-copied!):
              </p>
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
              >
                {roomCode}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#555" }}>
                {copied ? "Copied to clipboard!" : "Waiting for them to connect…"}
              </p>
            </div>
          </div>
        )}
      </section>

      {!sessionCreated && (
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
      )}

      {connectionError && <p style={{ color: "#c00" }}>{connectionError}</p>}
    </div>
  );
}
