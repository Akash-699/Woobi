/**
 * Woobi - 3D Studio Features
 * ColourTheory.js - Color Science, Color Wheel Harmonies, Contrast & Clash Detection
 */

/**
 * Normalizes any hex string to 6-character format without #
 */
export function normalizeHex(hex) {
  if (!hex || typeof hex !== 'string') return '808080';
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) {
    return '808080';
  }
  return clean.toUpperCase();
}

/**
 * Converts Hex string to RGB object {r, g, b} in range 0-255
 */
export function hexToRgb(hex) {
  const norm = normalizeHex(hex);
  const num = parseInt(norm, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Converts RGB to 6-char Hex string with leading #
 */
export function rgbToHex(r, g, b) {
  const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = v => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Converts RGB to HSL object { h: [0-360], s: [0-100], l: [0-100] }
 */
export function rgbToHsl(r, g, b) {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;

  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case rf:
        h = ((gf - bf) / delta) + (gf < bf ? 6 : 0);
        break;
      case gf:
        h = ((bf - rf) / delta) + 2;
        break;
      case bf:
        h = ((rf - gf) / delta) + 4;
        break;
    }
    h = h * 60;
  }

  return {
    h: Math.round(h) % 360,
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Converts HSL to RGB object {r, g, b}
 */
export function hslToRgb(h, s, l) {
  const hNorm = ((h % 360) + 360) % 360;
  const sFrac = Math.max(0, Math.min(100, s)) / 100;
  const lFrac = Math.max(0, Math.min(100, l)) / 100;

  if (sFrac === 0) {
    const gray = Math.round(lFrac * 255);
    return { r: gray, g: gray, b: gray };
  }

  const hue2rgb = (p, q, t) => {
    let tNorm = t;
    if (tNorm < 0) tNorm += 1;
    if (tNorm > 1) tNorm -= 1;
    if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm;
    if (tNorm < 1 / 2) return q;
    if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6;
    return p;
  };

  const q = lFrac < 0.5 ? lFrac * (1 + sFrac) : lFrac + sFrac - lFrac * sFrac;
  const p = 2 * lFrac - q;
  const hk = hNorm / 360;

  const r = hue2rgb(p, q, hk + 1 / 3);
  const g = hue2rgb(p, q, hk);
  const b = hue2rgb(p, q, hk - 1 / 3);

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Converts HSL directly to Hex
 */
export function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

/**
 * Returns shortest circular angular difference between two hues (0-180 degrees)
 */
export function getHueDifference(h1, h2) {
  const diff = Math.abs((h1 % 360) - (h2 % 360));
  return Math.min(diff, 360 - diff);
}

/**
 * Calculates standard WCAG relative luminance of an RGB color
 */
export function getRelativeLuminance(rgb) {
  const transform = c => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * transform(rgb.r) +
    0.7152 * transform(rgb.g) +
    0.0722 * transform(rgb.b)
  );
}

/**
 * Calculates WCAG contrast ratio between two RGB colors (1.0 to 21.0)
 */
export function getContrastRatio(rgb1, rgb2) {
  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Categorizes whether a parsed color acts as a fashion neutral.
 * In classic styling, pure neutrals (black/white/grey/cream) AND fashion staple neutrals
 * (deep navy, olive, camel, khaki, tan, espresso brown) function as grounding anchors.
 */
export function analyzeNeutrality(h, s, l) {
  // 1. Absolute neutrals (very low saturation, or extreme lightness/darkness)
  if (s <= 18) return { isNeutral: true, type: 'true_neutral', family: 'grey' };
  if (l >= 90 && s <= 40) return { isNeutral: true, type: 'true_neutral', family: 'white' };
  if (l >= 93) return { isNeutral: true, type: 'true_neutral', family: 'white' };
  if (l <= 14) return { isNeutral: true, type: 'true_neutral', family: 'black' };

  // 2. Deep Navy (Hue: 200-245, moderate saturation, dark lightness)
  if (h >= 200 && h <= 245 && s <= 65 && l <= 35) {
    return { isNeutral: true, type: 'cool_neutral', family: 'navy' };
  }

  // 3. Warm Earth Neutrals: Camel, Tan, Khaki, Beige, Sand, Cream, Ivory (Hue: 20-65)
  if (h >= 20 && h <= 65 && s <= 65 && l >= 25 && l <= 95) {
    return { isNeutral: true, type: 'warm_neutral', family: 'earth_neutral' };
  }

  // 4. Espresso / Deep Brown (Hue: 15-45, moderate saturation, dark lightness)
  if (h >= 15 && h <= 45 && s <= 65 && l <= 35) {
    return { isNeutral: true, type: 'warm_neutral', family: 'brown' };
  }

  // 5. Muted Olive (Hue: 65-115, muted saturation, moderate darkness)
  if (h >= 65 && h <= 115 && s <= 45 && l >= 20 && l <= 45) {
    return { isNeutral: true, type: 'earth_neutral', family: 'olive' };
  }

  return { isNeutral: false, type: 'accent', family: null };
}

/**
 * Detects color temperature (warm, cool, or neutral)
 */
export function getColorTemperature(h, s, l) {
  const neutral = analyzeNeutrality(h, s, l);
  if (neutral.isNeutral && neutral.type === 'true_neutral') return 'neutral';
  if ((h >= 0 && h <= 75) || (h >= 320 && h <= 360)) return 'warm';
  if (h > 75 && h < 165) return 'neutral_warm'; // warm greens / yellows
  if (h >= 165 && h <= 280) return 'cool'; // teals, blues, purples
  return 'cool_neutral';
}

/**
 * Detects harmony relation between two non-neutral hues
 */
export function getPairwiseHarmony(h1, h2) {
  const angle = getHueDifference(h1, h2);

  if (angle <= 20) {
    return { harmony: 'monochromatic', angle, score: 95, label: 'Monochromatic Tonal' };
  }
  if (angle >= 25 && angle <= 60) {
    return { harmony: 'analogous', angle, score: 90, label: 'Analogous Harmony' };
  }
  if (angle >= 140 && angle <= 180) {
    return { harmony: 'complementary', angle, score: 92, label: 'Complementary Contrast' };
  }
  if (angle >= 110 && angle < 140) {
    return { harmony: 'split_complementary', angle, score: 85, label: 'Split-Complementary' };
  }
  if (angle >= 70 && angle < 110) {
    return { harmony: 'discordant', angle, score: 45, label: 'Discordant Angle' };
  }

  return { harmony: 'moderate', angle, score: 70, label: 'Moderate Harmony' };
}
