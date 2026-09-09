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

/**
 * Which kind of player. `people` is the default because it is what the page
 * did before there was a choice, and a filter should not change what somebody
 * sees until they ask it to.
 */
export const DIRECTORY_WHO = {
  people: "people",
  computers: "computers",
  everyone: "everyone",
} as const;

export type DirectoryWho = (typeof DIRECTORY_WHO)[keyof typeof DIRECTORY_WHO];

export const DIRECTORY_WHO_LIST: readonly DirectoryWho[] = [
  DIRECTORY_WHO.people,
  DIRECTORY_WHO.computers,
  DIRECTORY_WHO.everyone,
];

export type DirectoryFilter = {
  who: DirectoryWho;
  /** Only ratings that have settled: an established one, not a first few games. */
  settled: boolean;
  /** Only members seen inside AWAY_AFTER_DAYS. */
  active: boolean;
};

export const NO_FILTER: DirectoryFilter = {
  who: DIRECTORY_WHO.people,
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
    : DIRECTORY_WHO.people;
  return { who, settled: one(query.settled) === "1", active: one(query.active) === "1" };
}

/** The address a filter reads as, with the defaults left off it. */
export function directoryQuery(filter: DirectoryFilter): string {
  const params = new URLSearchParams();
  if (filter.who !== DIRECTORY_WHO.people) params.set("who", filter.who);
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
