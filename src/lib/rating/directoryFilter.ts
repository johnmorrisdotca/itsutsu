import type { RatingTier } from "./elo";

/**
 * Narrowing the directory: who is in it, and which of them are worth showing.
 *
 * The elder sites all had this on their ranking pages — a list of everybody
 * who ever signed up is a list nobody reads twice, and the three questions
 * people actually ask of one are "who is a person", "who has a rating that
 * means anything yet", and "who is still about".
 *
 * Pure, so the answers can be checked without a database and without a page.
 * Every one of these is invisible on a small directory — with a dozen members
 * every filter shows everybody — which is exactly the condition under which a
 * filter that quietly does nothing goes unnoticed.
 */

/** How long since somebody was seen before the directory counts them away. */
export const AWAY_AFTER_DAYS = 30;

/** Which kind of player a reader is asking to see. */
export const DIRECTORY_WHO = {
  people: "people",
  computers: "computers",
  everyone: "everyone",
} as const;

export type DirectoryWho = (typeof DIRECTORY_WHO)[keyof typeof DIRECTORY_WHO];

export const DIRECTORY_WHO_LIST: readonly DirectoryWho[] = [
  DIRECTORY_WHO.everyone,
  DIRECTORY_WHO.people,
  DIRECTORY_WHO.computers,
];

export type DirectoryFilter = {
  who: DirectoryWho;
  /** Only ratings that have settled: an established one, not a first few games. */
  settled: boolean;
  /** Only members seen inside AWAY_AFTER_DAYS. */
  active: boolean;
};

/**
 * What the page shows before anybody touches anything.
 *
 * `everyone` reverses what this was, and the reversal is the point. The first
 * default was `people`, on the reasoning that a filter should not change what
 * the page did before there was a choice — the right instinct, the wrong
 * outcome. It put the computer players, five opponents that are always
 * available, behind a control nobody had reason to touch, on a site whose
 * whole difficulty is that nobody is about. A default that hides the one thing
 * a quiet evening needs is not a neutral default.
 *
 * John's call. `DIRECTORY_WHO_LIST` is ordered to match, so the bar reads as
 * what it now is: everybody, then the two narrowings.
 */
export const NO_FILTER: DirectoryFilter = {
  who: DIRECTORY_WHO.everyone,
  settled: false,
  active: false,
};

/**
 * The filter an address asks for. Anything unrecognised falls back to the
 * default rather than to an empty list — a mistyped address should show the
 * page, not an apparently deserted site.
 */
export function readDirectoryFilter(query: {
  who?: string | string[];
  settled?: string | string[];
  active?: string | string[];
}): DirectoryFilter {
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
  const asked = one(query.who);
  const who = (DIRECTORY_WHO_LIST as readonly string[]).includes(asked)
    ? (asked as DirectoryWho)
    : NO_FILTER.who;
  return { who, settled: one(query.settled) === "1", active: one(query.active) === "1" };
}

/**
 * The address the FILTER BAR writes, which always states who.
 *
 * Not `directoryQuery`, and the difference is a real bug rather than a
 * nicety. A bare `/players` means "however I last asked" — the preference is
 * remembered — so an address that leaves the default off does not say
 * "everybody", it says "whatever you had". Clicking Everyone while narrowed to
 * People therefore produced `/players`, which the cookie answered with People
 * again, and the button appeared to be dead.
 *
 * `SHOW_EVERYBODY_HREF` already existed for exactly this trap, with the reason
 * written beside it, and the filter bar's own buttons walked into it anyway.
 * So the bar states `who` outright, the way `rememberedValue` already does for
 * the cookie. Saying it is also enough for the rest: once the address says
 * anything about narrowing, the whole of it is read from the address, so an
 * absent `settled` or `active` correctly means off rather than remembered.
 */
export function filterBarHref(filter: DirectoryFilter): string {
  const params = new URLSearchParams({ who: filter.who });
  if (filter.settled) params.set("settled", "1");
  if (filter.active) params.set("active", "1");
  return `/players?${params.toString()}`;
}

/** The address a filter reads as, with the defaults left off it. */
export function directoryQuery(filter: DirectoryFilter): string {
  const params = new URLSearchParams();
  if (filter.who !== NO_FILTER.who) params.set("who", filter.who);
  if (filter.settled) params.set("settled", "1");
  if (filter.active) params.set("active", "1");
  return params.toString();
}

/** What the directory rows need to answer the three questions. */
export type FilterableEntry = {
  botTier: string | null;
  lastSeenAt: string;
  profile: { tier: RatingTier } | null;
};

/**
 * A computer player is never "seen" — it does not sign in — so the away test
 * would put all of them away for ever. They are here or they are not by the
 * `who` question alone; being about is not something a program stops doing.
 */
export function filterDirectory<T extends FilterableEntry>(
  entries: readonly T[],
  filter: DirectoryFilter,
  now: number = Date.now(),
): T[] {
  const awayBefore = now - AWAY_AFTER_DAYS * 86_400_000;
  return entries.filter((entry) => {
    const isComputer = entry.botTier !== null;
    if (filter.who === DIRECTORY_WHO.people && isComputer) return false;
    if (filter.who === DIRECTORY_WHO.computers && !isComputer) return false;
    if (filter.settled && entry.profile?.tier !== "established") return false;
    if (filter.active && !isComputer && new Date(entry.lastSeenAt).getTime() < awayBefore) return false;
    return true;
  });
}
