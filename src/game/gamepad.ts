export function getFirstGamepad(): Gamepad | null {
  const list = navigator.getGamepads?.();
  if (!list) return null;
  for (let i = 0; i < list.length; i++) {
    const gp = list[i];
    if (gp != null) return gp;
  }
  return null;
}
