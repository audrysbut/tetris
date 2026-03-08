interface BackButtonProps {
  onClick: () => void;
}

const backButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: 8,
  left: 8,
  background: "rgba(0,0,0,0.5)",
  color: "#fff",
  border: "none",
  padding: "6px 12px",
  borderRadius: 6,
  fontSize: 14,
  cursor: "pointer",
};

export function BackButton({ onClick }: BackButtonProps) {
  return (
    <button type="button" onClick={onClick} style={backButtonStyle}>
      ← Back
    </button>
  );
}
