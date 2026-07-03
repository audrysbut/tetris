import { useMemo } from "react";
import { SinglePlayerGame } from "./SinglePlayerGame.tsx";
import { BackButton } from "./BackButton.tsx";
import { MusicMuteButton } from "./MusicMuteButton.tsx";
import { randomNatureImageUrl } from "../constants/picsumNatureIds.ts";

interface SinglePlayerScreenProps {
  onBack: () => void;
  musicMuted: boolean;
  onToggleMute: () => void;
}

export function SinglePlayerScreen({
  onBack,
  musicMuted,
  onToggleMute,
}: SinglePlayerScreenProps) {
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
