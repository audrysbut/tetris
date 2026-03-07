import { useState } from "react";
import { createMatch, joinMatch } from "../api/match.ts";
import type { CreateMatchResult, JoinMatchResult } from "../api/match.ts";

interface LobbyProps {
  onBack: () => void;
  onJoinGame: (result: JoinMatchResult) => void;
}

export function Lobby({ onBack, onJoinGame }: LobbyProps) {
  const [creating, setCreating] = useState(false);
  const [joinId, setJoinId] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreateMatchResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setError("");
    setCreating(true);
    try {
      const result = await createMatch();
      setCreated(result);
      const joinResult = await joinMatch(result.matchId);
      if (!("error" in joinResult)) onJoinGame(joinResult);
      else setError(joinResult.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create match");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinId.trim()) return;
    setError("");
    setJoining(true);
    try {
      const result = await joinMatch(joinId.trim());
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onJoinGame(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h2>Multiplayer Lobby</h2>
      <p style={{ color: "#666" }}>
        Create a match and share the match ID with a friend, or enter a match ID to join.
      </p>

      <section style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16 }}>Create match</h3>
        <button type="button" onClick={handleCreate} disabled={creating}>
          {creating ? "Creating…" : "Create match"}
        </button>
        {created && (
          <div style={{ marginTop: 8, padding: 8, background: "#eee", borderRadius: 4 }}>
            <p style={{ margin: 0, fontWeight: "bold" }}>
              Match ID: {created.matchId}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(created.matchId).then(() => {
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
              Share this ID with the other player. When they join, you’ll both enter the game.
            </p>
          </div>
        )}
      </section>

      <section style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16 }}>Join match</h3>
        <input
          type="text"
          placeholder="Match ID"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          style={{ marginRight: 8, padding: "6px 8px" }}
        />
        <button type="button" onClick={handleJoin} disabled={joining || !joinId.trim()}>
          {joining ? "Joining…" : "Join"}
        </button>
      </section>

      {error && <p style={{ color: "#c00" }}>{error}</p>}
    </div>
  );
}
