import Link from "next/link";

import { ZONE_FROM, zoneSourceFrom, zoneStanding } from "@/lib/auth/zoneGuess";

/**
 * Which zone this member's days are counted in — said out loud, and said to be a
 * guess when it is one.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE LINE THAT WOULD HAVE SAVED A DAY
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `dailyVisit`, the day-streak milestones and `weekendGame` are all decided by a
 * day boundary, and for every member who had never opened their profile that
 * boundary was UTC — five in the afternoon for the site's owner in Vancouver.
 * The rule was documented and the fallback was deliberate, and the ledger still
 * sat empty for a day with nobody able to see why, because NO SURFACE SAID WHICH
 * ZONE IT WAS USING. A reader looking at "A new day · 2026-09-12" had no way to
 * know whose day that was.
 *
 * So all three states say themselves, and the two that are not the member's own
 * answer carry the one press that fixes them. **That is what makes a wrong guess
 * harmless**: Canada's guess is Toronto and John is in Vancouver, so the first
 * person to read this will be reading the case it gets wrong.
 *
 * Whether it is a guess is READ from where the zone came from, which the member's
 * `preferences` column records — never re-derived here by comparing the zone
 * with the country. A member who chose exactly the zone their country guesses is
 * told it is theirs. Only a row from before sources were kept is still compared,
 * and `zoneStanding` says why.
 */
export function DayZoneNote({
  timeZone,
  country,
  preferences,
}: {
  timeZone: string | null;
  country: string | null;
  /** The member's stored preferences, raw: the zone's source is kept there. */
  preferences: unknown;
}) {
  const { zone, from } = zoneStanding({ stored: timeZone, country, source: zoneSourceFrom(preferences) });

  if (from === ZONE_FROM.member) {
    return (
      <p className="text-xs text-muted" data-testid="day-zone-known">
        Days are counted in {zone}, so a run of days is your days.
      </p>
    );
  }

  if (from === ZONE_FROM.guessed) {
    return (
      <p className="text-xs text-ink-soft" data-testid="day-zone-guessed">
        Days are counted in {zone} — a guess from your country, not something you told us. If your
        day ends somewhere else,{" "}
        <Link href="/me?view=profile" className="underline underline-offset-4">
          say where you are
        </Link>{" "}
        and this follows you.
      </p>
    );
  }

  return (
    <p className="text-xs text-ink-soft" data-testid="day-zone-floor">
      Days are counted in {zone}, because nothing here knows your time zone yet — so a day may end
      in the middle of your afternoon.{" "}
      <Link href="/me?view=profile" className="underline underline-offset-4">
        Set your time zone
      </Link>{" "}
      and the run of days becomes your own.
    </p>
  );
}
