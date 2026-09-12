import { OFFERED_LOCALES } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE } from "@/lib/i18n/i18n.constants";
import { DIRECTORY_WHO_LIST, NO_FILTER } from "@/lib/rating/directoryFilter";

import type { PreferenceName, PreferenceSpec, Preferences } from "./preferences.types";

/**
 * The registry: every preference this site keeps on an account, with its
 * name, everything it may be, and what it is until somebody says otherwise.
 *
 * A registry rather than a bag, and the difference is the whole design. A
 * store that accepted any key and handed back whatever it found would be
 * worse than the two narrow columns it sits beside: `cleanAppearance` is why
 * a theme that has since been removed never breaks a board, and this keeps
 * that property for everything that comes after it. Reading gives the
 * fallback wherever nothing valid is stored; writing refuses what is not
 * declared here. The column underneath is an implementation detail.
 *
 * A preference is added by adding a row. Nothing else has to change for it to
 * be read, written through /api/me, and cleaned on the way back.
 *
 * On the account rather than in the browser, and that is decided: the board's
 * appearance is kept there so that somebody who changed the wood on their
 * phone finds that wood on their laptop. A preference that only exists in one
 * browser is a different feature wearing the same name.
 */

/** The two answers a switch can give. */
export const FLAG = [false, true] as const;

export const PREFERENCE_SPECS = {
  /*
   * How the players page was last narrowed: the three questions its filter
   * bar asks, one preference each, so that a `who` this version no longer
   * offers falls back on its own and leaves the other two alone. The first
   * thing kept here, and the reason the store exists — it shipped on a cookie
   * because there was nowhere honest for it to go.
   */
  playersWho: { options: DIRECTORY_WHO_LIST, fallback: NO_FILTER.who },
  playersSettled: { options: FLAG, fallback: NO_FILTER.settled },
  playersActive: { options: FLAG, fallback: NO_FILTER.active },

  /*
   * The language the site speaks to this member, wherever they sign in.
   * John: "I think language is another cross device thing."
   *
   * THE OPTIONS ARE THE LANGUAGES THE SITE CAN SPEAK, not the ones it knows
   * the name of. `OFFERED_LOCALES` is the list with a dictionary behind it,
   * and `i18n.types.ts` already gives the reason in as many words: offering
   * one the site cannot say anything in would be "a value in range that means
   * 'nothing'". So `{ language: "zh" }` is refused by name at `/api/me` today
   * and accepted the day somebody writes that dictionary, with nothing here
   * to remember to change.
   *
   * THE FALLBACK IS NOT AN ANSWER ABOUT THE MEMBER, and this is the one row
   * of the registry where that distinction bites. `DEFAULT_LOCALE` is what a
   * page is rendered in when nothing anywhere has said otherwise — its own
   * comment insists it "is not a preference and never stands in for one" —
   * so reading this through `preferencesFrom` or `preferencesFor` would turn
   * "has never chosen" into "chose English", and a Japanese browser belonging
   * to a member who never touched the picker would be answered in English.
   * That is the whole `Accept-Language` path lost to a default.
   *
   * So nothing reads the language through the filled-in view. `languageFrom`
   * in `lib/i18n/languagePreference.ts` reads it through `cleanPreferences`
   * and answers null for "never said", which is the only honest answer, and
   * `languagePreference.test.ts` holds the two apart on purpose.
   */
  language: { options: OFFERED_LOCALES, fallback: DEFAULT_LOCALE },
} as const satisfies Record<string, PreferenceSpec>;

/** Every declared name, in registry order. */
export const PREFERENCE_NAMES = Object.keys(PREFERENCE_SPECS) as readonly PreferenceName[];

/** What everybody has until they choose: each preference at its fallback. */
export const DEFAULT_PREFERENCES = Object.fromEntries(
  PREFERENCE_NAMES.map((name) => [name, PREFERENCE_SPECS[name].fallback]),
) as Preferences;
