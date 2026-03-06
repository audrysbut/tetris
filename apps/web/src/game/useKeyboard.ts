import { useEffect, useCallback } from "react";

export type KeyAction =
  | "left"
  | "right"
  | "rotate"
  | "softDrop"
  | "hardDrop"
  | "pause";

const KEY_MAP: Record<string, KeyAction> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "rotate",
  ArrowDown: "softDrop",
  Space: "hardDrop",
  KeyP: "pause",
};

export function useKeyboard(
  onAction: (action: KeyAction) => void,
  enabled: boolean
) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      const action = KEY_MAP[e.code];
      if (!action) return;
      e.preventDefault();
      onAction(action);
    },
    [onAction, enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
}
