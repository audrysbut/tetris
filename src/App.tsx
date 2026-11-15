import { useState, useCallback } from "react";
import { Home } from "./components/Home.tsx";
import { SinglePlayerScreen } from "./components/SinglePlayerScreen.tsx";
import { MultiplayerScreen } from "./components/MultiplayerScreen.tsx";
import { MusicMuteButton } from "./components/MusicMuteButton.tsx";
import { startMusic, stopMusic } from "./game/music.ts";

type Screen = "home" | "single" | "multiplayer";

function App() {
  const [screen, setScreen] = useState<Screen>("home");
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

  if (screen === "multiplayer") {
    return (
      <MultiplayerScreen
        musicMuted={musicMuted}
        onToggleMute={toggleMute}
        onBack={() => {
          stopMusic();
          setScreen("home");
        }}
      />
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
          setScreen("multiplayer");
        }}
      />
    </>
  );
}

export default App;
