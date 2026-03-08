import { useEffect, useRef } from "react";

/**
 * Requests a screen wake lock so the device screen does not dim or lock
 * while the game is in progress. Release when active becomes false or on unmount.
 * Re-requests when the document becomes visible again (browser releases on tab hide),
 * when the sentinel fires release (e.g. platform released due to inactivity),
 * and on a heartbeat so controller-only play stays awake.
 * No-op if navigator.wakeLock is not available.
 */
export function useScreenWakeLock(active: boolean): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    const wl = (navigator as Navigator & { wakeLock?: { request(type: "screen"): Promise<WakeLockSentinel> } }).wakeLock;
    if (!wl) return;

    const requestLock = async () => {
      if (document.visibilityState !== "visible" || !activeRef.current) return;
      try {
        const sentinel = await wl.request("screen");
        sentinelRef.current = sentinel;
        sentinel.addEventListener("release", () => {
          sentinelRef.current = null;
          if (activeRef.current && document.visibilityState === "visible") {
            requestLock();
          }
        });
      } catch {
        // Ignore (e.g. low battery, policy, no user gesture)
      }
    };

    const releaseLock = () => {
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
        sentinelRef.current = null;
      }
    };

    if (active && document.visibilityState === "visible") {
      requestLock();
    } else {
      releaseLock();
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && activeRef.current) {
        requestLock();
      } else {
        releaseLock();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    // Re-acquire if we lost the lock while still active and visible (e.g. browser
    // released due to inactivity without firing release event, or controller-only play).
    const intervalMs = 8000;
    const heartbeat = setInterval(() => {
      if (activeRef.current && document.visibilityState === "visible" && !sentinelRef.current) {
        requestLock();
      }
    }, intervalMs);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      releaseLock();
    };
  }, [active]);
}
