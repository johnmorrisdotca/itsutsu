"use client";

import type { ReactNode } from "react";

import { registerJaText } from "@/lib/i18n/jaRegistry";
import type { JaText } from "@/lib/i18n/jaText.types";

import { LocaleProvider } from "./LocaleProvider";

/**
 * THE ROOT OF A PAGE DRAWN FOR A READER OF JAPANESE, AND THE ONLY WAY A BROWSER
 * IS GIVEN THE JAPANESE.
 *
 * The root layout draws this in place of `LocaleProvider` when the reader's
 * language is Japanese, and hands it the words (`text`: the sentences alone,
 * never their back-translations) as a prop. They arrive with the page itself, so
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
export function JaLocale({ text, children }: { text: JaText; children: ReactNode }) {
  registerJaText(text);
  return <LocaleProvider locale="ja">{children}</LocaleProvider>;
}
