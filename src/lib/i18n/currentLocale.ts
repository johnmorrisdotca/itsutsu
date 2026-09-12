import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";

import { currentEmail } from "@/lib/auth/currentSession";

import { OFFERED_LOCALES } from "./dictionaries";
import { speaker, type Speaker } from "./i18n";
import { LANG_CHOSEN_COOKIE, LANG_COOKIE } from "./i18n.constants";
import type { Locale } from "./i18n.types";
import { keepChosenLanguage, languageOnAccount } from "./memberLanguage";
import { readLocale, resolveLocale } from "./locale";

/**
 * The language this request should be answered in.
 *
 * The only impure half of the i18n library, and it is deliberately thin: it
 * gathers four strings and hands them to `resolveLocale`, which is where
 * every decision actually lives. Everything above it is testable by value.
 *
 * ONCE PER REQUEST. An ordinary page asks three or four times — the document
 * element, the colophon, the page — and `cache()` makes that one reading of
 * one request, which is what `layout.tsx` already relies on when it passes
 * the same locale to `LocaleProvider` so the server and the browser cannot
 * disagree at hydration. It is also what stops the account write below
 * happening once per caller.
 *
 * **What the account costs, and it is nothing.** Three of the four sources
 * are on the request itself. The fourth is the member's own choice, read off
 * `memberRowFor` — the one row every server-rendered page already reads to
 * say who is here — so a signed-in reader pays no query they were not paying
 * and a signed-out one pays none at all. See `memberLanguage.ts`, and
 * `memberPreferences.ts` for why the store is one JSON column.
 *
 * **What this costs, measured rather than assumed.** Reading a cookie or a
 * header opts a route out of static rendering. That would be a real price on
 * this site — a database read in a prerendered rules page once failed a whole
 * deploy — except that there is nothing here left to opt out. `pnpm build` on
 * 2026-09-10 reported 58 dynamic routes and six static ones, and all six are
 * assets: `/robots.txt`, `/icon.svg`, `/apple-icon.png`, `/icon-192.png`
 * equivalents, the manifest and the OpenGraph image. Every page is already
 * server-rendered on demand, because `SiteHeader` asks who is signed in and
 * that is a cookie read on every page there is.
 *
 * **What it would cost if that changed.** The moment any page wants to be
 * prerendered again, this function is the wrong way to reach it and the
 * locale has to arrive in the path instead — `/es/rules/hex`, an `app/[lang]`
 * segment and `generateStaticParams`, which is what Next's own guide
 * recommends and the only shape that survives static rendering. That is why
 * `resolveLocale` takes named sources rather than reading anything: a path
 * segment is one more string arriving there, and nothing below it moves.
 */
export const currentLocale = cache(async (): Promise<Locale> => {
  const [jar, head] = await Promise.all([cookies(), headers()]);
  const justChosen = jar.get(LANG_CHOSEN_COOKIE)?.value ?? null;
  /*
   * Who is here, which this request has already worked out or is about to:
   * `currentSession` reads the same cookie the masthead reads, and the member
   * row underneath is `cache()`d for the rest of the request. Null for a
   * browser holding only an invite, and for a stranger, neither of whom has
   * an account for a language to live on.
   */
  const email = await currentEmail();
  /*
   * A choice is kept HERE rather than in the gate, and the gate is why it has
   * to be: `proxy.ts` cannot reach the database, so all it can do is say in a
   * cookie that a language was just asked for. This is the first thing that
   * both knows who is asking and is allowed to write. `memberFilter.ts` keeps
   * the players filter the same way and for the same second reason — a page
   * body is rendered only when the page was really asked for, where a gate
   * answers a prefetch too.
   */
  await keepChosenLanguage(email, readLocale(justChosen));
  return resolveLocale(
    {
      justChosen,
      onAccount: await languageOnAccount(email),
      remembered: jar.get(LANG_COOKIE)?.value ?? null,
      accepts: head.get("accept-language"),
    },
    OFFERED_LOCALES,
  );
});

/** The site, ready to talk to whoever sent this request. */
export async function currentSpeaker(): Promise<Speaker> {
  return speaker(await currentLocale());
}
