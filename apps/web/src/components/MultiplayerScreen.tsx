import { useState, useEffect, useRef, useCallback } from "react";
import { Lobby } from "./Lobby.tsx";
import { MultiplayerGame } from "./MultiplayerGame.tsx";
import { BackButton } from "./BackButton.tsx";
import { MusicMuteButton } from "./MusicMuteButton.tsx";
import { usePeerConnection } from "../game/usePeerConnection.ts";
import { stopMusic } from "../game/music.ts";
import { randomNatureImageUrl } from "../constants/picsumNatureIds.ts";

interface MultiplayerScreenProps {
  onBack: () => void;
  musicMuted: boolean;
  onToggleMute: () => void;
}

export function MultiplayerScreen({
  onBack,
  musicMuted,
  onToggleMute,
}: MultiplayerScreenProps) {
  const [mpScreen, setMpScreen] = useState<"lobby" | "multiplayer">("lobby");
  const pc = usePeerConnection();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (pc.connected && !connectedRef.current && mpScreen === "lobby") {
      connectedRef.current = true;
      setMpScreen("multiplayer");
    }
    if (!pc.connected) {
      connectedRef.current = false;
    }
  }, [pc.connected, mpScreen]);

  const goHome = useCallback(() => {
    pc.disconnect();
    stopMusic();
    onBack();
  }, [pc, onBack]);

  if (mpScreen === "multiplayer") {
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
        <MusicMuteButton muted={musicMuted} onToggle={onToggleMute} />
        <MultiplayerGame peerConnection={pc} onBack={goHome} />
      </div>
    );
  }

  return (
    <>
      <MusicMuteButton muted={musicMuted} onToggle={onToggleMute} />
      <BackButton onClick={goHome} />
      <Lobby peerConnection={pc} />
    </>
  );
}
