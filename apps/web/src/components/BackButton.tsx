interface BackButtonProps {
  onClick: () => void;
}

const backButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: 8,
  left: 8,
};

export function BackButton({ onClick }: BackButtonProps) {
  return (
    <button type="button" onClick={onClick} style={backButtonStyle}>
      ← Back
    </button>
  );
}
