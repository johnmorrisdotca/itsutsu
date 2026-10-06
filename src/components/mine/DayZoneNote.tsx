import Link from "@/components/ui/Link";
import { weave } from "@/lib/i18n/weave";
import type { Speaker } from "@/lib/i18n/i18n";

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
  say,
}: {
  say: Speaker;
  timeZone: string | null;
  country: string | null;
  /** The member's stored preferences, raw: the zone's source is kept there. */
  preferences: unknown;
}) {
  const { zone, from } = zoneStanding({ stored: timeZone, country, source: zoneSourceFrom(preferences) });

  if (from === ZONE_FROM.member) {
    return (
      <p className="text-xs text-muted" data-testid="day-zone-known">
        {say.say("mine.zoneKnown", { zone })}
      </p>
    );
  }

  if (from === ZONE_FROM.guessed) {
    return (
      <p className="text-xs text-ink-soft" data-testid="day-zone-guessed">
        {weave(say.say("mine.zoneGuessed", { zone }), {
          link: (
            <Link href="/me/profile" className="underline underline-offset-4">
              {say.say("mine.zoneGuessedLink")}
            </Link>
          ),
        })}
      </p>
    );
  }

  return (
    <p className="text-xs text-ink-soft" data-testid="day-zone-floor">
      {weave(say.say("mine.zoneFloor", { zone }), {
        link: (
          <Link href="/me/profile" className="underline underline-offset-4">
            {say.say("mine.zoneFloorLink")}
          </Link>
        ),
      })}
    </p>
  );
}
