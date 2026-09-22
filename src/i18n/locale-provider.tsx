"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { dictionaries, type Dict } from "./dictionaries";
import type { Locale } from "./pick";

const COOKIE_NAME = "locale";

function readCookieLocale(): Locale {
  if (typeof document === "undefined") return "ru";
  const match = document.cookie.match(/(?:^|; )locale=([^;]*)/);
  return match && match[1] === "ro" ? "ro" : "ru";
}

const LocaleContext = createContext<{ locale: Locale; dict: Dict; setLocale: (l: Locale) => void } | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Always start at "ru" so the very first client render matches the static
  // server-rendered HTML exactly (no hydration mismatch), then correct to the
  // visitor's saved preference right after mount.
  const [locale, setLocaleState] = useState<Locale>("ru");

  useEffect(() => {
    const saved = readCookieLocale();
    if (saved !== "ru") setLocaleState(saved);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    document.documentElement.setAttribute("data-locale", next === "ro" ? "ro" : "ru");
    document.documentElement.lang = next;
    setLocaleState(next);
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, dict: dictionaries[locale], setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx.locale;
}

export function useDict() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useDict must be used within LocaleProvider");
  return ctx.dict;
}

export function useSetLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useSetLocale must be used within LocaleProvider");
  return ctx.setLocale;
}
