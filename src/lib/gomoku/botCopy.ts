import type { Locale } from "../i18n/i18n.types";
import { jaText } from "../i18n/jaText";

import { BOT_PROFILES } from "./opponent.constants";
import type { BotProfile, BotTier } from "./opponent.types";

const IN_JAPANESE = new Map<BotTier, BotProfile>();

/**
 * A computer player's profile in the reader's language. Japanese puts its own
 * `strength` and `blurb` over the English row and keeps the name and its
 * `native` form, which are the player's name and are not translated.
 *
 * Read from here rather than from `BOT_PROFILES`, because `opponent.constants.ts`
 * is hashed by the measured ladder's fingerprint (`ladderFingerprint.ts`): a
 * word edited there silences the strength tables until they are measured again,
 * so the Japanese sits beside it and never in it.
 */
export function botProfile(tier: BotTier, locale: Locale): BotProfile {
  const english = BOT_PROFILES[tier];
  if (locale !== "ja") return english;
  const made = IN_JAPANESE.get(tier);
  if (made !== undefined) return made;
  const ja = jaText().bots[tier];
  const profile: BotProfile = { ...english, strength: ja.strength, blurb: ja.blurb };
  IN_JAPANESE.set(tier, profile);
  return profile;
}

/** What a computer player's own page says about it, in the reader's language; the English comes from the caller. */
export function botBio(tier: BotTier, english: string, locale: Locale): string {
  return locale === "ja" ? jaText().bots[tier].bio : english;
}
