import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Home } from "./components/Home.tsx";
import { SinglePlayerGame } from "./components/SinglePlayerGame.tsx";
import { Lobby } from "./components/Lobby.tsx";
import { MultiplayerGame } from "./components/MultiplayerGame.tsx";
import { BackButton } from "./components/BackButton.tsx";
import { MusicMuteButton } from "./components/MusicMuteButton.tsx";
import { startMusic, stopMusic } from "./game/music.ts";
import { usePeerConnection } from "./game/usePeerConnection.ts";
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
  const [musicMuted, setMusicMuted] = useState(false);
  const pc = usePeerConnection();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (pc.connected && !connectedRef.current && screen === "lobby") {
      connectedRef.current = true;
      setScreen("multiplayer");
    }
    if (!pc.connected) {
      connectedRef.current = false;
    }
  }, [pc.connected, screen]);

  const goHome = useCallback(() => {
    pc.disconnect();
    stopMusic();
    setScreen("home");
  }, [pc]);

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
      <div
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          backgroundImage: `url('${randomNatureImageUrl()}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#eee",
        }}
      >
        <MusicMuteButton muted={musicMuted} onToggle={toggleMute} />
        <MultiplayerGame
          peerConnection={pc}
          onBack={goHome}
        />
      </div>
    );
  }

  if (screen === "lobby") {
    return (
      <>
        <MusicMuteButton muted={musicMuted} onToggle={toggleMute} />
        <BackButton onClick={goHome} />
        <Lobby peerConnection={pc} />
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