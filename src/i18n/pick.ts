export type Locale = "ru" | "ro";

/** Picks the Romanian value when active and non-empty, otherwise falls back to Russian. */
export function pick(ru: string, ro: string | null | undefined, locale: Locale): string {
  if (locale === "ro" && ro) return ro;
  return ru;
}
