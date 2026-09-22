import "server-only";
import { cookies } from "next/headers";

export const LOCALES = ["ru", "ro"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";
export const LOCALE_COOKIE = "locale";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value === "ro" ? "ro" : DEFAULT_LOCALE;
}
