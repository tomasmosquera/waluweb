const AVATAR_CODE_POINTS = [
  0x1f468, 0x1f469, 0x1f431, 0x1f436, 0x1f98a, 0x1f42f, 0x1f43c, 0x1f981,
  0x1f428, 0x1f435, 0x1f47b, 0x1f427, 0x1f984, 0x1f916, 0x1f47d, 0x1f60e,
  0x1f920, 0x1f911, 0x1f43b, 0x1f42e, 0x1f437, 0x1f439, 0x1f430, 0x1f419,
  0x1f422, 0x1f41d, 0x1f42c, 0x1f433, 0x1f996, 0x1f9a6,
];

export const AVATAR_OPTIONS = AVATAR_CODE_POINTS.map((cp) => String.fromCodePoint(cp));
export const DEFAULT_AVATAR = AVATAR_OPTIONS[2]; // 🐱

export function normalizeAvatarEmoji(value?: string | null): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const looksCorrupted =
    trimmed.includes('\u00c3') || trimmed.includes('\u00f0') || trimmed.includes('\ufffd');
  return looksCorrupted ? DEFAULT_AVATAR : trimmed;
}
