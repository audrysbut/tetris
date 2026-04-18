import type { CSSProperties } from "react";

const btnStyle: CSSProperties = {
  position: "fixed",
  top: 8,
  right: 8,
  zIndex: 20,
  background: "rgba(0,0,0,0.55)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.35)",
  padding: "6px 12px",
  borderRadius: 6,
  fontSize: 14,
  cursor: "pointer",
};

interface MusicMuteButtonProps {
  muted: boolean;
  onToggle: () => void;
}

export function MusicMuteButton({ muted, onToggle }: MusicMuteButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={btnStyle}
      aria-pressed={muted}
      title={muted ? "Unmute music" : "Mute music"}
    >
      {muted ? "Unmute" : "Mute"}
    </button>
  );
}
