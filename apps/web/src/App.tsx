import { useState } from "react";
import { Home } from "./components/Home.tsx";
import { SinglePlayerGame } from "./components/SinglePlayerGame.tsx";
import { Lobby } from "./components/Lobby.tsx";
import { MultiplayerGame } from "./components/MultiplayerGame.tsx";
import type { JoinMatchResult } from "./api/match.ts";

type Screen = "home" | "single" | "lobby" | "multiplayer";

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [joinResult, setJoinResult] = useState<JoinMatchResult | null>(null);

  if (screen === "single") {
    return (
      <>
        <button
          type="button"
          onClick={() => setScreen("home")}
          style={{ position: "absolute", top: 16, left: 16 }}
        >
          ← Back
        </button>
        <SinglePlayerGame />
      </>
    );
  }

  if (screen === "multiplayer" && joinResult) {
    return (
      <MultiplayerGame
        joinResult={joinResult}
        onBack={() => { setScreen("home"); setJoinResult(null); }}
      />
    );
  }

  if (screen === "lobby") {
    return (
      <>
        <button
          type="button"
          onClick={() => setScreen("home")}
          style={{ position: "absolute", top: 16, left: 16 }}
        >
          ← Back
        </button>
        <Lobby
          onBack={() => setScreen("home")}
          onJoinGame={(result) => { setJoinResult(result); setScreen("multiplayer"); }}
        />
      </>
    );
  }

  return (
    <Home
      onSinglePlayer={() => setScreen("single")}
      onMultiplayer={() => setScreen("lobby")}
    />
  );
}

export default App;