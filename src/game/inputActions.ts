import type { GameAction } from "../shared/types.ts";
import type { KeyAction } from "./useKeyboard.ts";

export function keyActionToGameAction(action: KeyAction): GameAction | null {
  switch (action) {
    case "left":
      return { type: "move", dir: "left" };
    case "right":
      return { type: "move", dir: "right" };
    case "rotate":
      return { type: "rotate" };
    case "softDrop":
      return { type: "move", dir: "down" };
    case "hardDrop":
      return { type: "hardDrop" };
    case "pause":
      return null;
  }
}
