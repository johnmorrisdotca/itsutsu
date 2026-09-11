import "server-only";

import { cookies, headers } from "next/headers";

import { OFFERED_LOCALES } from "./dictionaries";
import { speaker, type Speaker } from "./i18n";
import { LANG_COOKIE } from "./i18n.constants";
import type { Locale } from "./i18n.types";
import { resolveLocale } from "./locale";

/**
 * The language this request should be answered in.
 *
 * The only impure half of the i18n library, and it is deliberately thin: it
 * reads two strings off the request and hands them to `resolveLocale`, which
 * is where every decision actually lives. Everything above it is testable by
 * value.
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
export async function currentLocale(): Promise<Locale> {
  const [jar, head] = await Promise.all([cookies(), headers()]);
  return resolveLocale(
    {
      remembered: jar.get(LANG_COOKIE)?.value ?? null,
      accepts: head.get("accept-language"),
    },
    OFFERED_LOCALES,
  );
}

/** The site, ready to talk to whoever sent this request. */
export async function currentSpeaker(): Promise<Speaker> {
  return speaker(await currentLocale());
}
