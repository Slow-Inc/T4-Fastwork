/**
 * Validate + bound user-supplied inline images before they reach the vision model
 * (#42). Only raster `data:image/*;base64,…` URLs are accepted (SVG is excluded —
 * it can carry script); each is size-capped and the set is count-capped. Pure and
 * defensive: any malformed input yields a filtered subset, never throws.
 */
const DATA_URL = /^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/]+=*)$/;

const MAX_COUNT = 4;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB decoded, per image

export function sanitizeImages(
  input: unknown,
  opts: { maxCount?: number; maxBytes?: number } = {},
): string[] {
  if (!Array.isArray(input)) return [];
  const maxCount = opts.maxCount ?? MAX_COUNT;
  const maxBytes = opts.maxBytes ?? MAX_BYTES;

  const kept: string[] = [];
  for (const entry of input) {
    if (kept.length >= maxCount) break;
    if (typeof entry !== 'string') continue;
    const match = DATA_URL.exec(entry);
    if (!match) continue;
    // Decoded size ≈ base64 length × 3/4.
    const decodedBytes = Math.floor((match[2].length * 3) / 4);
    if (decodedBytes > maxBytes) continue;
    kept.push(entry);
  }
  return kept;
}
