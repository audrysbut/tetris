import { useEffect, useRef, useCallback } from "react";
import type { KeyAction } from "./useKeyboard.ts";

const AXIS_DEAD_ZONE = 0.25;
const AXIS_THRESHOLD = 0.5;

function getFirstGamepad(): Gamepad | null {
  const list = navigator.getGamepads?.();
  if (!list) return null;
  for (let i = 0; i < list.length; i++) {
    const gp = list[i];
    if (gp != null) return gp;
  }
  return null;
}

export function useGamepad(
  onAction: (action: KeyAction) => void,
  enabled: boolean
) {
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  const prevRef = useRef({
    buttons: Array(20).fill(false) as boolean[],
    axisLeftRight: 0,
    axisDown: 0,
  });

  const poll = useCallback(() => {
    if (!enabled) return;
    const gp = getFirstGamepad();
    if (!gp) return;

    const prev = prevRef.current;
    const buttons = Array.from(gp.buttons).map((b) => {
      if (!b) return false;
      const btn = b as GamepadButton & { value?: number };
      return !!btn.pressed || (typeof btn.value === "number" && btn.value > 0);
    });
    const axes = gp.axes ?? [];
    const axis0 = axes[0] ?? 0;
    const axis1 = axes[1] ?? 0;
    const axis6 = axes[6] ?? 0;
    const axis7 = axes[7] ?? 0;

    const left =
      !!buttons[14] || (axis0 < -AXIS_DEAD_ZONE && axis0 <= -AXIS_THRESHOLD) ||
      (axis6 < -AXIS_THRESHOLD);
    const right =
      !!buttons[15] || (axis0 > AXIS_DEAD_ZONE && axis0 >= AXIS_THRESHOLD) ||
      (axis6 > AXIS_THRESHOLD);
    const down =
      !!buttons[13] || !!buttons[1] ||
      (axis1 > AXIS_DEAD_ZONE && axis1 >= AXIS_THRESHOLD) ||
      (axis7 > AXIS_THRESHOLD);
    const rotate = !!buttons[0] || !!buttons[1] || !!buttons[2];
    const hardDrop = !!buttons[3] || !!buttons[5];
    const pause = !!buttons[9];

    const fire = (action: KeyAction) => onActionRef.current(action);

    if (left && !prev.buttons[14] && !(prev.axisLeftRight < -AXIS_THRESHOLD))
      fire("left");
    if (right && !prev.buttons[15] && !(prev.axisLeftRight > AXIS_THRESHOLD))
      fire("right");
    if (down && !prev.buttons[13] && !prev.buttons[1] && !(prev.axisDown >= AXIS_THRESHOLD))
      fire("softDrop");
    if (rotate && !(prev.buttons[0] || prev.buttons[1] || prev.buttons[2])) fire("rotate");
    if (hardDrop && !(prev.buttons[3] || prev.buttons[5])) fire("hardDrop");
    if (pause && !prev.buttons[9]) fire("pause");

    prevRef.current = {
      buttons,
      axisLeftRight: Math.abs(axis0) >= AXIS_THRESHOLD ? axis0 : Math.abs(axis6) >= AXIS_THRESHOLD ? axis6 : 0,
      axisDown: axis1 >= AXIS_THRESHOLD ? axis1 : axis7 >= AXIS_THRESHOLD ? axis7 : 0,
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let rafId: number;
    const loop = () => {
      poll();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, poll]);
}
