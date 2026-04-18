import { useState, useMemo, useCallback } from "react";
import { Home } from "./components/Home.tsx";
import { SinglePlayerGame } from "./components/SinglePlayerGame.tsx";
import { Lobby } from "./components/Lobby.tsx";
import { MultiplayerGame } from "./components/MultiplayerGame.tsx";
import { BackButton } from "./components/BackButton.tsx";
import { MusicMuteButton } from "./components/MusicMuteButton.tsx";
import { startMusic, stopMusic } from "./game/music.ts";
import type { JoinMatchResult } from "./api/match.ts";
import { randomNatureImageUrl } from "./constants/picsumNatureIds.ts";

type Screen = "home" | "single" | "lobby" | "multiplayer";

function SinglePlayerScreen({
  onBack,
  musicMuted,
  onToggleMute,
}: {
  onBack: () => void;
  musicMuted: boolean;
  onToggleMute: () => void;
}) {
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
      <MusicMuteButton muted={musicMuted} onToggle={onToggleMute} />
      <BackButton onClick={onBack} />
      <SinglePlayerGame />
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [joinResult, setJoinResult] = useState<JoinMatchResult | null>(null);
  const [musicMuted, setMusicMuted] = useState(false);

  const toggleMute = useCallback(() => {
    if (!musicMuted) {
      stopMusic();
      setMusicMuted(true);
    } else {
      setMusicMuted(false);
      if (screen !== "home") startMusic();
    }
  }, [musicMuted, screen]);

  if (screen === "single") {
    return (
      <SinglePlayerScreen
        musicMuted={musicMuted}
        onToggleMute={toggleMute}
        onBack={() => {
          stopMusic();
          setScreen("home");
        }}
      />
    );
  }

  if (screen === "multiplayer" && joinResult) {
    return (
      <>
        <MusicMuteButton muted={musicMuted} onToggle={toggleMute} />
        <MultiplayerGame
          joinResult={joinResult}
          onBack={() => {
            stopMusic();
            setScreen("home");
            setJoinResult(null);
          }}
        />
      </>
    );
  }

  if (screen === "lobby") {
    return (
      <>
        <MusicMuteButton muted={musicMuted} onToggle={toggleMute} />
        <BackButton onClick={() => { stopMusic(); setScreen("home"); }} />
        <Lobby
          onBack={() => { stopMusic(); setScreen("home"); }}
          onJoinGame={(result) => { setJoinResult(result); setScreen("multiplayer"); }}
        />
      </>
    );
  }

  return (
    <>
      <MusicMuteButton muted={musicMuted} onToggle={toggleMute} />
      <Home
        onSinglePlayer={() => {
          if (!musicMuted) startMusic();
          setScreen("single");
        }}
        onMultiplayer={() => {
          if (!musicMuted) startMusic();
          setScreen("lobby");
        }}
      />
    </>
  );
}

export default App;