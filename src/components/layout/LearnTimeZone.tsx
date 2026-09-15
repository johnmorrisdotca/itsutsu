import { zoneStandingFor } from "@/lib/auth/memberZone";
import { ZONE_FROM, worthAsking } from "@/lib/auth/zoneGuess";

import { DeviceTimeZone } from "./DeviceTimeZone";

/**
 * Mounts the device-zone sender only for a member whose day boundary this site
 * does not know, or knows only by guessing from their country.
 *
 * The decision is the SERVER'S, off a row it has already read, which is what
 * makes the write impossible to get wrong: the browser is never asked to judge
 * whether a zone is already set, so it can never overwrite one somebody chose or
 * one their browser measured. A member who chose Europe/Tallinn renders nothing
 * here, for ever.
 *
 * The guess itself travels as `held`, so a device that agrees with it writes
 * nothing — without that, a member whose browser confirms the guess would send
 * the same value back on every page. The bare floor sends null: nothing is held,
 * and whatever the device reports is better than UTC by default.
 *
 * The signed-in member's row is `cache()`d per request and the masthead above
 * has already read it, so this costs no query on any page. A signed-out reader
 * has no row to record a zone on and gets nothing.
 */
export async function LearnTimeZone() {
  const standing = await zoneStandingFor();
  if (standing === null || !worthAsking(standing.from)) return null;
  return <DeviceTimeZone held={standing.from === ZONE_FROM.guessed ? standing.zone : null} />;
}
