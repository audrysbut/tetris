import { useState, useMemo } from "react";
import { Home } from "./components/Home.tsx";
import { SinglePlayerGame } from "./components/SinglePlayerGame.tsx";
import { Lobby } from "./components/Lobby.tsx";
import { MultiplayerGame } from "./components/MultiplayerGame.tsx";
import { BackButton } from "./components/BackButton.tsx";
import { startMusic, stopMusic } from "./game/music.ts";
import type { JoinMatchResult } from "./api/match.ts";
import { randomNatureImageUrl } from "./constants/picsumNatureIds.ts";

type Screen = "home" | "single" | "lobby" | "multiplayer";

function SinglePlayerScreen({ onBack }: { onBack: () => void }) {
  const backgroundImage = useMemo(
    () => `url('${randomNatureImageUrl()}')`,
    []
  );
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        backgroundImage,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "#eee",
      }}
    >
      <BackButton onClick={onBack} />
      <SinglePlayerGame />
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [joinResult, setJoinResult] = useState<JoinMatchResult | null>(null);

  if (screen === "single") {
    return <SinglePlayerScreen onBack={() => { stopMusic(); setScreen("home"); }} />;
  }

  if (screen === "multiplayer" && joinResult) {
    return (
      <MultiplayerGame
        joinResult={joinResult}
        onBack={() => { stopMusic(); setScreen("home"); setJoinResult(null); }}
      />
    );
  }

  if (screen === "lobby") {
    return (
      <>
        <BackButton onClick={() => { stopMusic(); setScreen("home"); }} />
        <Lobby
          onBack={() => { stopMusic(); setScreen("home"); }}
          onJoinGame={(result) => { setJoinResult(result); setScreen("multiplayer"); }}
        />
      </>
    );
  }

  return (
    <Home
      onSinglePlayer={() => {
        startMusic();
        setScreen("single");
      }}
      onMultiplayer={() => {
        startMusic();
        setScreen("lobby");
      }}
    />
  );
}

export default App;