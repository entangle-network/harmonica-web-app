/**
 * Pure helpers for participant-facing theming.
 *
 * Deliberately not a 'use server' module: Next.js requires those to export only
 * async functions, and these types and constants are needed on the client too.
 */

export type SessionTheme = {
  primary: string | null;
  gradientFrom: string | null;
  surface: string | null;
  introImageId: string | null;
  avatarId: string | null;
  logoId: string | null;
  logoUrl: string | null;
  privacyUrl: string | null;
};

export const EMPTY_THEME: SessionTheme = {
  primary: null,
  gradientFrom: null,
  surface: null,
  introImageId: null,
  avatarId: null,
  logoId: null,
  logoUrl: null,
  privacyUrl: null,
};

/**
 * shadcn's colour variables hold a bare HSL triplet ("0 0% 9%"), not a colour
 * value — the utilities wrap them in hsl() themselves and rely on that to derive
 * opacity variants such as `bg-primary/90`. A hex value assigned directly would
 * silently break those.
 */
export function hexToHslTriplet(hex: string): string | null {
  const match = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  let value = match[1];
  if (value.length === 3) {
    value = value
      .split('')
      .map((c) => c + c)
      .join('');
  }

  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;

  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  const round = (n: number) => Math.round(n * 10) / 10;
  return `${round(hue)} ${round(saturation * 100)}% ${round(lightness * 100)}%`;
}

/**
 * Foreground colour for text sitting on `hex`. Perceived brightness rather than
 * plain lightness, so a saturated yellow button gets dark text instead of the
 * unreadable white that a naive threshold would pick.
 */
export function readableForeground(hex: string): string {
  const match = /^#?([\da-f]{6})$/i.exec(hex.trim());
  if (!match) return '0 0% 9%';

  const value = match[1];
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '0 0% 9%' : '0 0% 98%';
}

export function themeImageUrl(id: string | null | undefined) {
  return id ? `/api/theme-image/${id}` : null;
}

/**
 * Accent shades derived from the brand colour.
 *
 * The small tinted surfaces — numbered badges, the hover on the "How it works"
 * strip, the input's focus ring — were fixed ambers. Turning them into a fourth
 * and fifth colour picker would be tedious to keep in harmony, so they follow
 * the hue of the button colour: a blue brand gets blue-tinted badges.
 *
 * Returns null when there is no brand colour, which leaves the original ambers
 * in place through the CSS fallbacks.
 */
export function deriveAccents(hex: string | null): {
  accent: string;
  accentForeground: string;
  ring: string;
} | null {
  const triplet = hex && hexToHslTriplet(hex);
  if (!triplet) return null;

  const [hue, saturation] = triplet.split(' ');
  // Cap the saturation so a vivid brand colour does not produce a badge that
  // fights the text sitting next to it.
  const s = Math.min(parseFloat(saturation), 65);

  return {
    accent: `hsl(${hue} ${s}% 92%)`,
    accentForeground: `hsl(${hue} ${s}% 32%)`,
    ring: `hsl(${hue} ${s}% 70%)`,
  };
}
