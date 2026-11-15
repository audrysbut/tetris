import { useEffect, useCallback, useRef } from "react";

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

const KEY_REPEAT_MS = 130;
const REPEATABLE: Set<KeyAction> = new Set(["left", "right", "softDrop"]);

export function useKeyboard(
  onAction: (action: KeyAction) => void,
  enabled: boolean
) {
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const repeatRef = useRef<{
    timerId: ReturnType<typeof setInterval> | null;
    keyCode: string;
  }>({ timerId: null, keyCode: "" });

  const keydown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabledRef.current) return;
      const action = KEY_MAP[e.code];
      if (!action) return;
      e.preventDefault();

      const repeat = repeatRef.current;
      if (repeat.timerId) {
        clearInterval(repeat.timerId);
        repeat.timerId = null;
      }

      onActionRef.current(action);

      if (REPEATABLE.has(action)) {
        repeat.timerId = setInterval(() => {
          if (!enabledRef.current) return;
          onActionRef.current(action);
        }, KEY_REPEAT_MS);
        repeat.keyCode = e.code;
      }
    },
    []
  );

  const keyup = useCallback((e: KeyboardEvent) => {
    const repeat = repeatRef.current;
    if (e.code === repeat.keyCode && repeat.timerId) {
      clearInterval(repeat.timerId);
      repeat.timerId = null;
      repeat.keyCode = "";
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      if (repeatRef.current.timerId) {
        clearInterval(repeatRef.current.timerId);
        repeatRef.current.timerId = null;
        repeatRef.current.keyCode = "";
      }
    };
  }, [keydown, keyup]);
}
