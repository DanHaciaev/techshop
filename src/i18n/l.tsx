/**
 * Renders both language variants into static HTML; a `data-locale` attribute on
 * <html> (set by an inline script + the locale switcher) toggles which one is
 * visible via CSS. This keeps pages fully static/ISR-cacheable — no per-request
 * cookie read is needed to decide which language to render server-side.
 */
export function L({ ru, ro }: { ru: string; ro?: string | null }) {
  if (!ro) return <>{ru}</>;
  return (
    <>
      <span data-i18n="ru">{ru}</span>
      <span data-i18n="ro">{ro}</span>
    </>
  );
}
