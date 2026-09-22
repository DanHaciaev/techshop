function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

function mix(hex: string, target: number, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    r + (target - r) * amount,
    g + (target - g) * amount,
    b + (target - b) * amount
  );
}

export function darken(hex: string, amount = 0.15) {
  return mix(hex, 0, amount);
}

export function lighten(hex: string, amount = 0.15) {
  return mix(hex, 255, amount);
}

/** Returns CSS custom properties derived from a single accent color, for both themes. */
export function buildAccentVars(accent: string) {
  const safe = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(accent) ? accent : "#2563eb";
  return {
    light: {
      primary: safe,
      primaryHover: darken(safe, 0.15),
      primarySoft: lighten(safe, 0.88),
    },
    dark: {
      primary: lighten(safe, 0.12),
      primaryHover: lighten(safe, 0.32),
      primarySoft: mix(safe, 0, 0.7),
    },
  };
}
