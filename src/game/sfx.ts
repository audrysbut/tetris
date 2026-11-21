/**
 * Sound effects using bundled CC0 audio files (Kenney, via hipdiscovery).
 * Files live in public/sounds/. Replace the filenames to swap sounds.
 *
 * rotate/drop are swapped per user request. Line clear uses the Web Audio API
 * with a gain boost (>1) so it can be played louder than the HTMLAudio cap.
 */

const BASE = import.meta.env.BASE_URL;

// rotate/drop are intentionally swapped per user request.
const SOUND_URLS = {
  rotate: `${BASE}sounds/drop.ogg`,
  drop: `${BASE}sounds/rotate.ogg`,
  lineClear: `${BASE}sounds/lineclear.ogg`,
} as const;

const audioCache: Partial<Record<"rotate" | "drop", HTMLAudioElement>> = {};

function getAudio(key: "rotate" | "drop"): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audioCache[key]) {
    const a = new Audio(SOUND_URLS[key]);
    a.preload = "auto";
    audioCache[key] = a;
  }
  return audioCache[key]!;
}

let muted = false;

// --- Web Audio for boosted line-clear playback ---
let audioCtx: AudioContext | null = null;
let lineClearBuffer: AudioBuffer | null = null;
let lineClearLoading: Promise<void> | null = null;

function getAudioContext(): AudioContext | null {
  if (muted) return null;
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

async function ensureLineClearBuffer(): Promise<AudioBuffer | null> {
  const c = getAudioContext();
  if (!c) return null;
  if (lineClearBuffer) return lineClearBuffer;
  if (!lineClearLoading) {
    lineClearLoading = (async () => {
      const res = await fetch(SOUND_URLS.lineClear);
      const arr = await res.arrayBuffer();
      lineClearBuffer = await c.decodeAudioData(arr);
    })().catch(() => {
      lineClearLoading = null;
    });
  }
  await lineClearLoading;
  return lineClearBuffer;
}

function playBoosted(buffer: AudioBuffer, gainValue: number): void {
  const c = getAudioContext();
  if (!c) return;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const gain = c.createGain();
  gain.gain.value = gainValue;
  src.connect(gain).connect(c.destination);
  src.start();
}

export function setSfxMuted(value: boolean): void {
  muted = value;
  if (value && audioCtx) {
    audioCtx.suspend().catch(() => {});
  } else if (!value && audioCtx?.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}

function play(key: "rotate" | "drop", volume = 1): void {
  if (muted) return;
  const a = getAudio(key);
  if (!a) return;
  try {
    a.volume = volume;
    a.currentTime = 0;
    void a.play().catch(() => {});
  } catch {
    // ignore
  }
}

export function playRotate(): void {
  play("rotate", 0.9);
}

export function playDrop(): void {
  play("drop", 0.9);
}

export function preloadLineClear(): void {
  void ensureLineClearBuffer();
}

export function playLineClear(lines: number): void {
  if (muted) return;
  void ensureLineClearBuffer().then((buf) => {
    if (!buf) return;
    playBoosted(buf, 0.6);
    if (lines >= 4) {
      window.setTimeout(() => {
        void ensureLineClearBuffer().then((b) => b && playBoosted(b, 0.6));
      }, 120);
    }
  });
  // (No fallback: boosted playback above is the only path.)
}
