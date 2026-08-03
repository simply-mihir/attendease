/**
 * Server-safe DiceBear avatar utilities.
 * These functions have no React / client dependencies and can be imported anywhere.
 */

const DICEBEAR_STYLES = [
  "bottts-neutral",
  "fun-emoji",
  "pixel-art-neutral",
  "shapes",
  "identicon",
  "thumbs",
  "rings",
  "glass",
  "initials",
  "notionists-neutral",
  "adventurer-neutral",
  "big-ears-neutral",
  "lorelei-neutral",
  "dylan",
] as const;

export type AvatarStyle = (typeof DICEBEAR_STYLES)[number];

export function getAvatarUrl(seed: string, style: AvatarStyle = "bottts-neutral"): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

/** Pick a random DiceBear avatar URL for a new user */
export function generateRandomAvatar(seed: string): string {
  const style = DICEBEAR_STYLES[Math.floor(Math.random() * DICEBEAR_STYLES.length)];
  return getAvatarUrl(seed, style);
}

export { DICEBEAR_STYLES };
