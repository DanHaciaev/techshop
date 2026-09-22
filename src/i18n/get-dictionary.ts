import "server-only";
import { dictionaries } from "./dictionaries";
import { getLocale } from "./locale";

export async function getDict() {
  const locale = await getLocale();
  return { locale, dict: dictionaries[locale] };
}
