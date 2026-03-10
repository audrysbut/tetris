import { useEffect, useRef, useCallback } from "react";
import { getFirstGamepad } from "./gamepad.ts";
import type { KeyAction } from "./useKeyboard.ts";

const AXIS_DEAD_ZONE = 0.25;
const AXIS_THRESHOLD = 1;
const REPEAT_MS = 100;
const SOFT_DROP_REPEAT_MS = 130;
/** Ignore same-direction input for this long after release to avoid overshoot (stick/d-pad bounce or lag) */
const RELEASE_COOLDOWN_MS = 180;
/** After releasing left or right, ignore both horizontal directions to avoid opposite-direction stick overshoot */
const RELEASE_HORIZONTAL_COOLDOWN_MS = 180;

export function useGamepad(
  onAction: (action: KeyAction) => void,
  enabled: boolean,
  options?: { onHome?: () => void }
) {
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;
  const onHomeRef = useRef(options?.onHome);
  onHomeRef.current = options?.onHome;

  const prevRef = useRef({
    buttons: Array(20).fill(false) as boolean[],
    axisLeftRight: 0,
    axisDown: 0,
    axisUp: 0,
  });
  const repeatRef = useRef({
    lastLeft: 0,
    lastRight: 0,
    lastDown: 0,
    releasedLeftAt: 0,
    releasedRightAt: 0,
    releasedDownAt: 0,
    releasedHorizontalAt: 0,
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
      !!buttons[13] ||
      (axis1 > AXIS_DEAD_ZONE && axis1 >= AXIS_THRESHOLD) ||
      (axis7 > AXIS_THRESHOLD);
    const rotate = !!buttons[0] || !!buttons[1] || !!buttons[2];
    const hardDrop = !!buttons[3] || !!buttons[5] || !!buttons[12] ||
      (axis7 < -AXIS_DEAD_ZONE && axis7 <= -AXIS_THRESHOLD) ||
      (axis1 < -AXIS_THRESHOLD);
    const pause = !!buttons[9];

    const fire = (action: KeyAction) => onActionRef.current(action);

    const wasLeft = !!prev.buttons[14] || prev.axisLeftRight < -AXIS_THRESHOLD;
    const wasRight = !!prev.buttons[15] || prev.axisLeftRight > AXIS_THRESHOLD;
    const wasDown = !!prev.buttons[13] || prev.axisDown >= AXIS_THRESHOLD;
    const now = Date.now();

    if (left) {
      const cooldownHorizontal = repeatRef.current.releasedHorizontalAt && (now - repeatRef.current.releasedHorizontalAt) < RELEASE_HORIZONTAL_COOLDOWN_MS;
      const cooldownLeft = repeatRef.current.releasedLeftAt && (now - repeatRef.current.releasedLeftAt) < RELEASE_COOLDOWN_MS;
      if (!cooldownHorizontal && !cooldownLeft && (!wasLeft || now - repeatRef.current.lastLeft >= REPEAT_MS)) {
        fire("left");
        repeatRef.current.lastLeft = now;
        repeatRef.current.releasedLeftAt = 0;
        repeatRef.current.releasedHorizontalAt = 0;
      }
    } else {
      if (repeatRef.current.lastLeft !== 0) {
        repeatRef.current.releasedLeftAt = now;
        repeatRef.current.releasedHorizontalAt = now;
      }
      repeatRef.current.lastLeft = 0;
    }
    if (right) {
      const cooldownHorizontal = repeatRef.current.releasedHorizontalAt && (now - repeatRef.current.releasedHorizontalAt) < RELEASE_HORIZONTAL_COOLDOWN_MS;
      const cooldownRight = repeatRef.current.releasedRightAt && (now - repeatRef.current.releasedRightAt) < RELEASE_COOLDOWN_MS;
      if (!cooldownHorizontal && !cooldownRight && (!wasRight || now - repeatRef.current.lastRight >= REPEAT_MS)) {
        fire("right");
        repeatRef.current.lastRight = now;
        repeatRef.current.releasedRightAt = 0;
        repeatRef.current.releasedHorizontalAt = 0;
      }
    } else {
      if (repeatRef.current.lastRight !== 0) {
        repeatRef.current.releasedRightAt = now;
        repeatRef.current.releasedHorizontalAt = now;
      }
      repeatRef.current.lastRight = 0;
    }
    if (down) {
      const cooldownDown = repeatRef.current.releasedDownAt && (now - repeatRef.current.releasedDownAt) < RELEASE_COOLDOWN_MS;
      if (!cooldownDown && (!wasDown || now - repeatRef.current.lastDown >= SOFT_DROP_REPEAT_MS)) {
        fire("softDrop");
        repeatRef.current.lastDown = now;
        repeatRef.current.releasedDownAt = 0;
      }
    } else {
      if (repeatRef.current.lastDown !== 0) {
        repeatRef.current.releasedDownAt = now;
      }
      repeatRef.current.lastDown = 0;
    }

    if (rotate && !(prev.buttons[0] || prev.buttons[1] || prev.buttons[2])) fire("rotate");
    if (hardDrop && !(prev.buttons[3] || prev.buttons[5] || prev.buttons[12]) &&
        !(prev.axisUp <= -AXIS_THRESHOLD)) fire("hardDrop");
    if (pause && !prev.buttons[9]) fire("pause");
    if (!!buttons[16] && !prev.buttons[16]) onHomeRef.current?.();

    prevRef.current = {
      buttons,
      axisLeftRight: Math.abs(axis0) >= AXIS_THRESHOLD ? axis0 : Math.abs(axis6) >= AXIS_THRESHOLD ? axis6 : 0,
      axisDown: axis1 >= AXIS_THRESHOLD ? axis1 : axis7 >= AXIS_THRESHOLD ? axis7 : 0,
      axisUp: axis7 <= -AXIS_THRESHOLD ? axis7 : axis1 <= -AXIS_THRESHOLD ? axis1 : 0,
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
