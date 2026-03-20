import { useState, useEffect, useRef, type CSSProperties } from "react";
import { getFirstGamepad } from "../game/gamepad.ts";

const AXIS_THRESHOLD = 0.5;

interface HomeProps {
  onSinglePlayer: () => void;
  onMultiplayer: () => void;
}

export function Home({ onSinglePlayer, onMultiplayer }: HomeProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSinglePlayerRef = useRef(onSinglePlayer);
  const onMultiplayerRef = useRef(onMultiplayer);
  onSinglePlayerRef.current = onSinglePlayer;
  onMultiplayerRef.current = onMultiplayer;

  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  // Keyboard: Arrow Up/Down change selection, Enter/Space activate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % 2);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev === 0 ? 1 : 0));
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (selectedIndexRef.current === 0) {
          onSinglePlayerRef.current();
        } else {
          onMultiplayerRef.current();
        }
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Gamepad: d-pad/stick change selection, A/Start activate (edge detection)
  useEffect(() => {
    const prevRef = {
      up: false,
      down: false,
      confirm: false,
    };
    let rafId: number;

    const poll = () => {
      const gp = getFirstGamepad();
      if (!gp) {
        rafId = requestAnimationFrame(poll);
        return;
      }
      const buttons = Array.from(gp.buttons).map((b) => {
        if (!b) return false;
        const btn = b as GamepadButton & { value?: number };
        return !!btn.pressed || (typeof btn.value === "number" && btn.value > 0);
      });
      const axes = gp.axes ?? [];
      const axis1 = axes[1] ?? 0;
      const up = buttons[12] || axis1 < -AXIS_THRESHOLD;
      const down = buttons[13] || axis1 > AXIS_THRESHOLD;
      const confirm = buttons[0] || buttons[9];

      const prev = prevRef;
      if (up && !prev.up) setSelectedIndex(0);
      if (down && !prev.down) setSelectedIndex(1);
      if (confirm && !prev.confirm) {
        if (selectedIndexRef.current === 0) {
          onSinglePlayerRef.current();
        } else {
          onMultiplayerRef.current();
        }
      }

      prevRef.up = up;
      prevRef.down = down;
      prevRef.confirm = confirm;

      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const baseButtonStyle: CSSProperties = {
    padding: "12px 24px",
    fontSize: 16,
  };
  const selectedStyle: CSSProperties = {
    ...baseButtonStyle,
    outline: "2px solid #0af",
    background: "#222",
    color: "#fff",
  };

  return (
    <main style={{ padding: 24, textAlign: "center", maxWidth: 400, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Tetris</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Single player or 2P multiplayer</p>
      <p style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>
        ↑↓ or D-pad to select, Enter/Space or A to confirm
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          type="button"
          onClick={onSinglePlayer}
          style={selectedIndex === 0 ? selectedStyle : baseButtonStyle}
        >
          Single player
        </button>
        <button
          type="button"
          onClick={onMultiplayer}
          style={selectedIndex === 1 ? selectedStyle : baseButtonStyle}
        >
          Multiplayer (2P)
        </button>
      </div>
    </main>
  );
}
