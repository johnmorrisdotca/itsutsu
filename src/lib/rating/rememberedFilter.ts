import { NO_FILTER, readDirectoryFilter, type DirectoryFilter } from "./directoryFilter";

/**
 * Remembering how somebody likes the players page narrowed.
 *
 * A filter that has to be set again on every visit is a filter most people set
 * once and never again. So the last narrowing somebody actually asked for is
 * kept, and a bare `/players` shows it.
 *
 * IN A COOKIE, WHICH IS PER DEVICE, and that is a known trade rather than an
 * oversight. The right home is a column on the member — it would follow them
 * between a phone and a laptop, the way the board's appearance already does —
 * and the two JSON columns that exist are documented for other jobs, so using
 * one would make its own comment false. John's call: the cookie now, a real
 * `preferences` column when a migration window opens. This module is the seam
 * for that: what is remembered and what it means live here, and only where it
 * is kept would change.
 *
 * Pure, so all of it can be checked without a browser or a database.
 */

export const DIRECTORY_FILTER_COOKIE = "players-filter";

/** A year. Long enough to be a preference; short enough to lapse if somebody stops coming. */
export const REMEMBER_FOR_SECONDS = 365 * 24 * 60 * 60;

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
 * What to keep for a filter somebody asked for.
 *
 * `who` is written even when it is the default, unlike the address, where the
 * default is left off to keep an ordinary page a bare address. Here the empty
 * string has to keep meaning "nothing remembered", so a remembered default
 * must still be something. It is also what makes "show everybody again" work:
 * that link asks for everyone explicitly, which is remembered as everyone, so
 * the next bare visit is not narrowed again by a stale preference.
 */
export function rememberedValue(filter: DirectoryFilter): string {
  const params = new URLSearchParams({ who: filter.who });
  if (filter.settled) params.set("settled", "1");
  if (filter.active) params.set("active", "1");
  return params.toString();
}

/**
 * The filter a kept value means, or null where it means nothing usable.
 *
 * Null rather than the default, because the caller has to be able to tell "no
 * preference" from "a preference that happens to match the default" — one is
 * a question to fall back on, the other is an answer.
 *
 * Read through the same reader the address uses, so a value written by a
 * version that offered something this one does not falls back the same way a
 * mistyped address does, instead of narrowing somebody's page to nothing.
 */
export function filterFromRemembered(stored: string | undefined): DirectoryFilter | null {
  if (stored === undefined || stored.trim() === "") return null;
  const asked = Object.fromEntries(new URLSearchParams(stored));
  if (!addressSaysFilter(asked)) return null;
  return readDirectoryFilter(asked);
}

/**
 * The filter a page should use: what the address asked for, or failing that
 * what this reader last asked for, or failing that the default.
 */
export function filterFor(
  query: Record<string, string | string[] | undefined>,
  stored: string | undefined,
): DirectoryFilter {
  if (addressSaysFilter(query)) return readDirectoryFilter(query);
  return filterFromRemembered(stored) ?? NO_FILTER;
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
