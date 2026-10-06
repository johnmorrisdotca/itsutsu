"use client";

import type { ReactNode } from "react";

import { registerJaText } from "@/lib/i18n/jaRegistry";
import type { Locale } from "@/lib/i18n/i18n.types";
import type { JaText } from "@/lib/i18n/jaText.types";

import { LocaleProvider } from "./LocaleProvider";

/**
 * THE ROOT OF EVERY PAGE, WHATEVER THE READER'S LANGUAGE, AND THE ONLY WAY A
 * BROWSER IS GIVEN THE JAPANESE.
 *
 * The root layout draws this for every reader, and for a reader of Japanese
 * hands it the words (`text`: the sentences alone, never their
 * back-translations) as a prop; for anybody else `text` is left out. It is the
 * same component for every language ON PURPOSE. The first version drew
 * `JaLocale` for Japanese and `LocaleProvider` for the rest, and React treats a
 * different component at the same place as a different thing: choosing a
 * language in the account menu refreshes the router, the layout comes back with
 * the other component, and the whole page under it is thrown away and built
 * again, which shut the menu the reader had just used and dropped every other
 * piece of state the page was holding. One component, whose props change, is
 * the same thing updated. The words arrive with the page itself, so
 * they are here before anything under this is drawn or hydrated, and the markup
 * the browser makes is the markup the server sent: the server drew the same
 * words, registered by `jaText.server.ts`. A reader who changes language gets a
 * new layout and so new props, and nothing has to be fetched or waited for.
 *
 * It is a prop rather than an import because an import would put the Japanese in
 * the chunk the layout names, and every English reader's page would load it: a
 * client module the root layout imports is sent with every page, drawn or not
 * (`entryJSFiles`). Nothing a browser can reach imports the words
 * (`jaText.coverage.test.ts`), which is what makes an English reader's download
 * free of them. The price is the words riding in the page of a reader of
 * Japanese, about 46 KB compressed, where an English reader pays nothing.
 */
export function JaLocale({ locale, text, children }: { locale: Locale; text?: JaText; children: ReactNode }) {
  if (text !== undefined) registerJaText(text);
  return <LocaleProvider locale={locale}>{children}</LocaleProvider>;
}
