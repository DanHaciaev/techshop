"use client";

import { useRouter } from "next/navigation";
import { useLocale, useDict, useSetLocale } from "./locale-provider";
import type { Locale } from "./pick";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const dict = useDict();
  const setLocale = useSetLocale();
  const router = useRouter();

  function change(next: Locale) {
    if (next === locale) return;
    setLocale(next);
    // Admin pages render their dictionary text server-side (they're already
    // dynamic, session-gated routes) — refresh so that text updates too.
    // Harmless no-op-ish on the public storefront, which never reads the
    // locale cookie server-side and toggles purely via CSS.
    router.refresh();
  }

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5 text-xs font-semibold",
        className
      )}
      aria-label={dict.locale.label}
    >
      {(["ru", "ro"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => change(code)}
          className={cn(
            "rounded-full px-2 py-1 uppercase transition-colors",
            locale === code ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
