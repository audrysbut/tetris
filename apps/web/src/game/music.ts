/**
 * Background music when the game starts. Supports external MP3 URLs or YouTube links.
 * Call startMusic(url) from a user gesture (e.g. when entering single/multiplayer).
 */

/** Default track when startMusic() is called with no URL. Set to an MP3 or YouTube link, or leave empty for no default. */
// export const DEFAULT_MUSIC_URL =
//   "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

export const DEFAULT_MUSIC_URL =
  "https://www.youtube.com/watch?v=A5WZZlTtILo&list=PLP6rFm3TTGwbY98voBz7YvGZJ_sbFFG3S&index=8";

const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

function getYouTubeVideoId(url: string): string | null {
  const m = url.trim().match(YOUTUBE_REGEX);
  return m ? m[1]! : null;
}

function isYouTubeUrl(url: string): boolean {
  return getYouTubeVideoId(url) !== null;
}

// --- MP3 / direct audio ---
let audio: HTMLAudioElement | null = null;

// --- YouTube IFrame API ---
declare global {
  interface Window {
    YT?: {
      Player: new (
        el: string | HTMLElement,
        opts: {
          height?: string;
          width?: string;
          videoId: string;
          events?: {
            onReady: (ev: { target: YTPlayer }) => void;
          };
        },
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  stopVideo: () => void;
  pauseVideo: () => void;
}

let ytContainer: HTMLDivElement | null = null;
let ytPlayer: YTPlayer | null = null;
let ytPendingVideoId: string | null = null;
let ytScriptLoaded = false;

function loadYouTubeAPI(): Promise<void> {
  if (typeof document === "undefined")
    return Promise.reject(new Error("No document"));
  if (window.YT?.Player) return Promise.resolve();
  if (ytScriptLoaded) {
    return new Promise((resolve) => {
      const check = () => {
        if (window.YT?.Player) resolve();
        else setTimeout(check, 50);
      };
      check();
    });
  }
  ytScriptLoaded = true;
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const first = document.getElementsByTagName("script")[0];
    first?.parentNode?.insertBefore(tag, first);
  });
}

function createYouTubePlayer(videoId: string): Promise<void> {
  return loadYouTubeAPI().then(() => {
    if (!ytContainer || !document.body) return;
    try {
      new window.YT!.Player(ytContainer, {
        height: "0",
        width: "0",
        videoId,
        events: {
          onReady(ev) {
            ytPlayer = ev.target;
            if (ytPendingVideoId === videoId) {
              ev.target.playVideo();
            }
          },
        },
      });
    } catch {
      ytPlayer = null;
    }
  });
}

function ensureYouTubeContainer(): void {
  if (typeof document === "undefined") return;
  if (ytContainer?.parentNode) return;
  ytContainer = document.createElement("div");
  ytContainer.setAttribute("aria-hidden", "true");
  ytContainer.style.cssText =
    "position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;pointer-events:none;";
  document.body.appendChild(ytContainer);
}

/**
 * Start playing music from an external URL (MP3 or YouTube).
 * Call from a user gesture so the browser allows playback.
 * @param url - MP3 URL (e.g. https://example.com/track.mp3) or YouTube link (youtube.com/watch?v=... or youtu.be/...)
 */
export function startMusic(url?: string): void {
  if (typeof document === "undefined") return;
  const src = (url ?? DEFAULT_MUSIC_URL).trim();
  if (!src) return;

  const videoId = getYouTubeVideoId(src);

  if (videoId) {
    // YouTube
    stopMusic();
    ensureYouTubeContainer();
    if (!ytContainer) return;
    ytPendingVideoId = videoId;
    createYouTubePlayer(videoId)
      .then(() => {
        if (ytPlayer && ytPendingVideoId === videoId) {
          ytPlayer.playVideo();
        }
      })
      .catch(() => {});
    return;
  }

  // MP3 or other direct audio
  stopMusic();
  audio = new Audio();
  audio.volume = 0.4;
  audio.loop = true;
  audio.src = src;
  audio.play().catch(() => {});
}

/**
 * Stop music (both audio element and YouTube player).
 */
export function stopMusic(): void {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio = null;
  }
  ytPendingVideoId = null;
  if (ytPlayer && typeof ytPlayer.stopVideo === "function") {
    try {
      ytPlayer.stopVideo();
    } catch {
      // ignore
    }
    ytPlayer = null;
  }
}

/**
 * Pause or resume music (for game pause).
 */
export function setMusicPaused(paused: boolean): void {
  if (audio) {
    if (paused) audio.pause();
    else audio.play().catch(() => {});
  }
  if (ytPlayer) {
    try {
      if (paused) ytPlayer.pauseVideo();
      else ytPlayer.playVideo();
    } catch {
      // ignore
    }
  }
}

export function resumeMusic(): void {
  setMusicPaused(false);
}
