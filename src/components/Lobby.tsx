import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { UsePeerConnectionReturn } from "../game/usePeerConnection.ts";
import { buildJoinUrl } from "../game/joinUrl.ts";

interface LobbyProps {
  peerConnection: UsePeerConnectionReturn;
  initialJoinCode?: string;
}

export function Lobby({ peerConnection, initialJoinCode }: LobbyProps) {
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const autoJoinAttemptedRef = useRef(false);

  const { createRoom, joinRoom, roomCode, connectionError, connected } =
    peerConnection;
  const shareUrl = roomCode ? buildJoinUrl(roomCode) : null;
  const isAutoJoin = Boolean(initialJoinCode);

  useEffect(() => {
    if (shareUrl) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          // clipboard may be unavailable; URL is still visible for manual copy
        });
    }
  }, [shareUrl]);

  useEffect(() => {
    if (!initialJoinCode || autoJoinAttemptedRef.current || connected) return;
    autoJoinAttemptedRef.current = true;
    setJoining(true);
    joinRoom(initialJoinCode)
      .catch(() => {
        // error displayed via connectionError
      })
      .finally(() => {
        setJoining(false);
      });
    return () => {
      autoJoinAttemptedRef.current = false;
    };
  }, [initialJoinCode, connected, joinRoom]);

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

  const sessionCreated = Boolean(roomCode);
  const showWaiting = roomCode && !connected;

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h2>Multiplayer Lobby</h2>
      {!sessionCreated && !isAutoJoin && (
        <p style={{ color: "#666" }}>
          Create a match and share the join link or QR code with a friend.
        </p>
      )}

      {isAutoJoin && !connected && (
        <p style={{ color: "#666" }}>
          {joining
            ? "Joining room from link…"
            : connectionError
              ? "Could not join room from link."
              : "Preparing to join room…"}
        </p>
      )}

      {!isAutoJoin && (
        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16 }}>Create match</h3>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || sessionCreated}
          >
            {creating ? "Creating…" : sessionCreated ? "Created" : "Create match"}
          </button>
        </section>
      )}

      {showWaiting && shareUrl && (
        <div style={{ marginTop: 8, marginBottom: 24 }}>
          <div style={{ padding: 12, background: "#f0f4f8", borderRadius: 4 }}>
            <p style={{ margin: "0 0 8px", fontSize: 13, color: "#555" }}>
              Share this join link with the other player (auto-copied!):
            </p>
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 14,
                fontFamily: "monospace",
                wordBreak: "break-all",
                userSelect: "all",
                padding: "8px 12px",
                background: "#fff",
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            >
              {shareUrl}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: 12,
                background: "#fff",
                borderRadius: 4,
                border: "1px solid #ccc",
                marginBottom: 12,
              }}
            >
              <QRCodeSVG value={shareUrl} size={180} />
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "#555" }}>
              Room code: <span style={{ fontFamily: "monospace" }}>{roomCode}</span>
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
              {copied ? "Copied to clipboard!" : "Waiting for them to connect…"}
            </p>
          </div>
        </div>
      )}

      {connectionError && <p style={{ color: "#c00" }}>{connectionError}</p>}
    </div>
  );
}
