"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { LOCALES } from "@/lib/i18n/i18n.constants";
import { useHydrated } from "@/lib/ui/hydrated";
import { readerWhen, stableWhen } from "@/lib/ui/when";

import type { LocalTimeProps } from "./ui.types";

/**
 * A moment, shown in the reader's own zone without the page disagreeing with
 * itself on the way.
 *
 * The one way a game page prints when something happened. It used to be
 * `new Date(at).toLocaleString()` in five places, each drawn first by the
 * server in its zone and language and then by the browser in the reader's —
 * a hydration mismatch on every load for anybody not sitting in the server's
 * zone, which is everybody, since production runs in UTC.
 *
 * THE FIRST DRAWING IS THE SAME ON BOTH SIDES: the moment in UTC digits,
 * labelled as UTC (`stableWhen`). Once the browser has taken over, the same
 * element says it in the reader's zone and the site's language
 * (`readerWhen`). Nothing moves but the words, and the server-rendered form
 * is true in its own right for the moment it is on screen.
 *
 * `Intl` IS CALLED IN RENDER HERE, and it is not the 0.146.1 fault. That rule
 * is about a render both the server and the browser perform. This branch is
 * only ever taken in a render the browser alone performs — after hydration,
 * which `useHydrated` is for — so there is no second drawing to disagree
 * with. `PhraseSetup` gates its date the same way.
 *
 * FOLLOW-UP, deliberately not taken here: since 0.171.0 the server knows a
 * zone for a signed-in member (`zoneStandingFor` in `lib/auth/memberZone.ts` —
 * their choice, their device, or a guess from their country). A page could
 * pass that zone down and draw the first form in it, so the switch is
 * invisible for them and the UTC form is only for a reader the site does not
 * know. Two things to settle first: a GUESS drawn as though it were the
 * reader's zone is the same fault this fixes, one rung up; and the browser
 * would then have to format with that zone too, not its own, or the two
 * drawings disagree again.
 */
export function LocalTime({ at, style = "dateTime" }: LocalTimeProps) {
  const hydrated = useHydrated();
  const locale = useLocale();
  const text = hydrated ? readerWhen(at, style, LOCALES[locale].tag) : stableWhen(at, style);
  if (text === null) return null;
  return <time dateTime={at}>{text}</time>;
}
