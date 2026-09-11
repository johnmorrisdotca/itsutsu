"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { speaker, type Speaker } from "@/lib/i18n/i18n";
import { DEFAULT_LOCALE } from "@/lib/i18n/i18n.constants";
import type { Locale } from "@/lib/i18n/i18n.types";

/**
 * The reader's language, carried to the parts of the site React draws in the
 * browser.
 *
 * `currentSpeaker()` answers on the server and cannot answer in a Client
 * Component, and most of what a reader actually presses — the buttons, the
 * panels, the tab strip — is drawn on the client. Without this, the language
 * would reach the pages and stop at the first `"use client"`, which is most
 * of the site's furniture.
 *
 * It is set once, in the root layout, from the same `currentLocale()` the
 * server rendered the page with — so the markup React sends and the markup
 * React hydrates into agree by construction. Nothing here reads a cookie: a
 * second reader of the same fact is how the two come apart.
 *
 * The dictionary does travel to the browser with this, which is the cost.
 * It is a few dozen short strings, and most of the Japanese a reader sees is
 * not in it at all — it is the `kanji` already sitting beside the English in
 * the display tables, which the bundle was carrying anyway.
 */
const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/**
 * The site, ready to talk to whoever is reading — in a Client Component.
 *
 * The twin of `currentSpeaker()` on the server, with the same shape, so a
 * component that moves across the boundary changes one line and not its
 * wording. Outside a provider it answers in English rather than throwing: a
 * missing provider should cost a reader their language, never their page.
 */
export function useSpeaker(): Speaker {
  const locale = useContext(LocaleContext);
  return useMemo(() => speaker(locale), [locale]);
}

/** Just the locale, for the few places that want the tag and not the words. */
export function useLocale(): Locale {
  return useContext(LocaleContext);
}
