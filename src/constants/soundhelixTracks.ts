/**
 * Curated SoundHelix track numbers for placeholder background music.
 * SoundHelix has no "random" endpoint; this list mirrors the picsumNatureIds
 * approach (curated IDs + random selection) for a "lorem picsum for music" feel.
 * Tracks are royalty-free MP3s served from soundhelix.com.
 * Extend by verifying additional SoundHelix-Song-N.mp3 URLs exist.
 */
export const SOUNDHELIX_TRACK_NUMBERS: number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
];

export function randomMusicUrl(): string {
  const n =
    SOUNDHELIX_TRACK_NUMBERS[
      Math.floor(Math.random() * SOUNDHELIX_TRACK_NUMBERS.length)
    ];
  return `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;
}