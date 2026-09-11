import type { PreferencePatch, Preferences } from "@/lib/preferences/preferences.types";

import { NO_FILTER, readDirectoryFilter, type DirectoryFilter } from "./directoryFilter";

/**
 * Remembering how somebody likes the players page narrowed.
 *
 * A filter that has to be set again on every visit is a filter most people set
 * once and never again. So the last narrowing somebody actually asked for is
 * kept, and a bare `/players` shows it.
 *
 * ON THE ACCOUNT, through the preferences registry, so it follows a member
 * between a phone and a laptop the way the board's appearance does. It
 * shipped on a cookie first, per device, because the two JSON columns that
 * existed were documented for other jobs and there was nowhere honest for it
 * to go. This module was the seam for the move, and only where it is kept has
 * changed.
 *
 * Pure, so all of it can be checked without a browser or a database. Which
 * reader is asking, and the reading and writing of their account, is
 * `memberFilter.ts`.
 */

/**
 * Whether the address itself said anything about narrowing.
 *
 * The whole of the difference between "show me everybody" and "I have not
 * said". An address that asks is obeyed and remembered; an address that is
 * silent is where a remembered answer gets to speak.
 */
export function addressSaysFilter(query: Record<string, string | string[] | undefined>): boolean {
  return query.who !== undefined || query.settled !== undefined || query.active !== undefined;
}

/**
 * The filter a member's preferences hold, one question each.
 *
 * Three preferences rather than one, so that a `who` this version no longer
 * offers falls back on its own and leaves the other two standing. The registry
 * has already done that by the time this runs, which is why there is no null
 * here: a preference always answers, with the ordinary answer where nothing
 * usable was kept.
 */
export function rememberedFilter(preferences: Preferences): DirectoryFilter {
  return {
    who: preferences.playersWho,
    settled: preferences.playersSettled,
    active: preferences.playersActive,
  };
}

/**
 * What to keep for a filter somebody asked for.
 *
 * All three, the defaults included, unlike the address, where a default is
 * left off to keep an ordinary page a bare address. Asking for everyone has to
 * REPLACE a remembered People: it is what makes "show everybody again" work,
 * and a write that only kept narrowings would leave the old one standing.
 */
export function filterAsPreferences(filter: DirectoryFilter): PreferencePatch {
  return { playersWho: filter.who, playersSettled: filter.settled, playersActive: filter.active };
}

/**
 * The filter a page should use: what the address asked for, or failing that
 * what this reader last asked for — which is the ordinary page when they
 * never have.
 */
export function filterFor(
  query: Record<string, string | string[] | undefined>,
  preferences: Preferences,
): DirectoryFilter {
  if (addressSaysFilter(query)) return readDirectoryFilter(query);
  return rememberedFilter(preferences);
}

/**
 * The address that shows everybody and forgets the preference.
 *
 * Not the bare page, and that is the trap this exists to avoid: once a bare
 * `/players` means "whatever I last asked for", a clear link pointing there
 * would re-apply the very narrowing it claims to remove, and appear to do
 * nothing at all.
 */
export const SHOW_EVERYBODY_HREF = `/players?who=${NO_FILTER.who}`;
