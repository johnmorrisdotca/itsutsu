/**
 * WHERE A MEMBER'S TIME ZONE CAME FROM — kept beside the zone, never inferred
 * from it.
 *
 * `Member.timeZone` is one string, and for a release it was the only thing a
 * reader had: a zone was taken to be a guess when it equalled what the member's
 * country would guess, and a choice otherwise. That comparison is wrong exactly
 * when the two coincide — a member in Canada who deliberately chose
 * `America/Toronto` read as a guess, and a browser on a trip west was allowed to
 * write over them. The value could mean "the member said this" and "we assumed
 * this", and nothing could tell which.
 *
 * So the source is recorded when the zone is written, as `timeZoneFrom` in the
 * preferences registry (`preferences.constants.ts`) — the JSON column the member
 * row already carries and every page already reads, so no migration and no
 * query. `zoneGuess.ts` holds the rules that read and write it.
 *
 * No imports, on purpose: the registry imports this, and the rules import the
 * registry.
 */
export const ZONE_SOURCE = {
  /**
   * The member set it on their profile — typed it, picked it, or pressed "use
   * this device's". Only the member writes over it; nothing automatic ever does.
   */
  chosen: "chosen",
  /** Their browser reported it, learned once by `DeviceTimeZone`. Only the member writes over it. */
  device: "device",
  /** Guessed from their country when they signed in. Their browser may replace it, once. */
  country: "country",
} as const;

export type ZoneSource = (typeof ZONE_SOURCE)[keyof typeof ZONE_SOURCE];

/** Every source, for the registry's list of what `timeZoneFrom` may hold. */
export const ZONE_SOURCES = [ZONE_SOURCE.chosen, ZONE_SOURCE.device, ZONE_SOURCE.country] as const;
