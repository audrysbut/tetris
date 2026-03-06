interface HomeProps {
  onSinglePlayer: () => void;
  onMultiplayer: () => void;
}

export function Home({ onSinglePlayer, onMultiplayer }: HomeProps) {
  return (
    <main style={{ padding: 24, textAlign: "center", maxWidth: 400, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Tetris</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Single player or 2P multiplayer</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          type="button"
          onClick={onSinglePlayer}
          style={{ padding: "12px 24px", fontSize: 16 }}
        >
          Single player
        </button>
        <button
          type="button"
          onClick={onMultiplayer}
          style={{ padding: "12px 24px", fontSize: 16 }}
        >
          Multiplayer (2P)
        </button>
      </div>
    </main>
  );
}
