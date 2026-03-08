/**
 * Curated Picsum photo IDs for nature/landscape backgrounds.
 * Picsum has no category API; this list is maintained for "nature only" selection.
 * Extend by checking https://picsum.photos/v2/list or the gallery.
 */
export const PICSUM_NATURE_IDS: number[] = [
  10, 11, 15, 16, 17, 18, 26, 27, 28, 29,
  101, 102, 108, 118, 119, 152, 158, 164, 168, 169,
  182, 184, 185, 188, 195, 196, 197, 198, 199, 200,
  201, 207, 211, 216, 217, 220, 221, 228, 237, 238,
  249, 251, 259, 260, 268, 274, 278, 283, 284, 289,
  290, 291, 292, 293, 294, 295, 296, 297, 298, 299,
];

const MIN_SIZE = 320;

export function randomNatureImageUrl(): string {
  const id = PICSUM_NATURE_IDS[Math.floor(Math.random() * PICSUM_NATURE_IDS.length)];
  const w = Math.max(MIN_SIZE, window.innerWidth);
  const h = Math.max(MIN_SIZE, window.innerHeight);
  return `https://picsum.photos/id/${id}/${w}/${h}`;
}
