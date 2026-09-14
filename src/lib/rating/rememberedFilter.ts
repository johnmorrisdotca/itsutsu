import type { PreferencePatch, Preferences } from "@/lib/preferences/preferences.types";

import { NO_FILTER, readDirectoryFilter, type DirectoryFilter, type DirectoryWho } from "./directoryFilter";

/**
 * Remembering which KIND of player somebody likes the players page to list.
 *
 * On the account, through the preferences registry, so it follows a member
 * between a phone and a laptop the way the board's appearance does. It shipped
 * on a cookie first, per device, and this module was the seam for the move.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHO IS KEPT. THE TWO SWITCHES ARE NOT.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * All three answers were kept until 0.187.3, when John opened /players signed
 * in as himself and read "0 of 11 listed" over empty headings: "no player
 * standings". "Settled ratings" and "Seen lately" had been pressed on some
 * earlier visit and a bare address reopened both. Nothing on the page was
 * wrong about what it was showing; it was showing a narrowing he was no longer
 * asking for.
 *
 * The line between what is kept and what is not is the line a games site
 * draws. People, Computers or Everyone is a VIEW — which list somebody reads,
 * the way somebody who never plays the programs reads the ladder of people —
 * and it cannot empty the page, because the site always has members of both
 * kinds. "Who is about this month" and "whose rating has settled" are
 * QUESTIONS asked on the day, and on a site this size either one alone can
 * leave nobody. So they live in the address — a link can still carry them, the
 * back button still undoes them — and a bare /players opens with both off.
 *
 * Pure, so all of it can be checked without a browser or a database. Which
 * reader is asking, and the reading and writing of their account, is
 * `memberFilter.ts`.
 */

/** What the members tab is shown, and whether its `who` came from memory rather than the address. */
export type ShownDirectoryFilter = {
  filter: DirectoryFilter;
  /**
   * The kind of player this page opened with because the account remembered
   * it — null where the address said, or where what is remembered is Everyone,
   * which narrows nothing. The page says so beside the way to take it off.
   */
  rememberedWho: DirectoryWho | null;
};

/**
 * Whether the address itself said anything about narrowing.
 *
 * The whole of the difference between "show me everybody" and "I have not
 * said". An address that asks is obeyed; an address that is silent is where a
 * remembered answer gets to speak.
 */
export function addressSaysFilter(query: Record<string, string | string[] | undefined>): boolean {
  return query.who !== undefined || query.settled !== undefined || query.active !== undefined;
}

/**
 * Whether the address named a kind of player — the one answer worth keeping.
 *
 * Every link the filter bar writes names it (`filterBarHref`), so any press on
 * the bar is remembered. A hand-typed `?settled=1` is obeyed and says nothing
 * about the kind of player this reader likes, so it must not overwrite that.
 */
export function addressSaysWho(query: Record<string, string | string[] | undefined>): boolean {
  return query.who !== undefined;
}

/**
 * The filter a member's preferences open the page with: the kind of player
 * they last chose, and neither switch.
 */
export function rememberedFilter(preferences: Preferences): DirectoryFilter {
  return { ...NO_FILTER, who: preferences.playersWho };
}

/**
 * What to keep for a filter somebody asked for: who, and nothing else.
 *
 * Everyone is kept as a value rather than as nothing: asking for everyone has
 * to REPLACE a remembered People, which is what makes "show everybody again"
 * work.
 */
export function filterAsPreferences(filter: DirectoryFilter): PreferencePatch {
  return { playersWho: filter.who };
}

/**
 * The filter a page should use: what the address asked for, or failing that
 * the kind of player this reader last chose — which is everybody when they
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
 * The kind of player the page is narrowed to BECAUSE it was remembered, or
 * null. A narrowing the reader did not ask for on this visit is exactly the
 * one they may have forgotten, so it is the one the page has to name.
 */
export function whoFromMemory(
  query: Record<string, string | string[] | undefined>,
  preferences: Preferences,
): DirectoryWho | null {
  if (addressSaysFilter(query)) return null;
  const who = rememberedFilter(preferences).who;
  return who === NO_FILTER.who ? null : who;
}

/**
 * The address that shows everybody and forgets the kind of player.
 *
 * Not the bare page, and that is the trap this exists to avoid: once a bare
 * `/players` means "the kind I last chose", a clear link pointing there would
 * re-apply the very narrowing it claims to remove, and appear to do nothing.
 */
export const SHOW_EVERYBODY_HREF = `/players?who=${NO_FILTER.who}`;
