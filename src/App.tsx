import { useState, useCallback, useEffect, useRef } from "react";
import { Home } from "./components/Home.tsx";
import { SinglePlayerScreen } from "./components/SinglePlayerScreen.tsx";
import { MultiplayerScreen } from "./components/MultiplayerScreen.tsx";
import { MusicMuteButton } from "./components/MusicMuteButton.tsx";
import { startMusic, stopMusic } from "./game/music.ts";
import { setSfxMuted } from "./game/sfx.ts";
import {
  clearJoinCodeFromLocation,
  getJoinCodeFromLocation,
} from "./game/joinUrl.ts";

type Screen = "home" | "single" | "multiplayer";

const INITIAL_JOIN_CODE = getJoinCodeFromLocation();

function App() {
  const [initialJoinCode, setInitialJoinCode] = useState<string | null>(
    INITIAL_JOIN_CODE,
  );
  const [screen, setScreen] = useState<Screen>(
    initialJoinCode ? "multiplayer" : "home",
  );
  const [musicMuted, setMusicMuted] = useState(false);
  const autoJoinMusicStartedRef = useRef(false);

  useEffect(() => {
    if (initialJoinCode) clearJoinCodeFromLocation();
  }, [initialJoinCode]);

  useEffect(() => {
    if (initialJoinCode && !musicMuted && !autoJoinMusicStartedRef.current) {
      autoJoinMusicStartedRef.current = true;
      startMusic();
    }
  }, [initialJoinCode, musicMuted]);

  const toggleMute = useCallback(() => {
    if (!musicMuted) {
      stopMusic();
      setMusicMuted(true);
      setSfxMuted(true);
    } else {
      setMusicMuted(false);
      setSfxMuted(false);
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
        initialJoinCode={initialJoinCode ?? undefined}
        onBack={() => {
          stopMusic();
          setInitialJoinCode(null);
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
