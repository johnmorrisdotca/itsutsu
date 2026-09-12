import type { Prisma } from "@prisma/client";

import { UNCLAIMABLE_REASONS } from "@/lib/auth/memberId";

import { AWAY_AFTER_DAYS, DIRECTORY_WHO, type DirectoryFilter } from "./directoryFilter";

/**
 * THE DIRECTORY'S NARROWING, AS A CONDITION THE DATABASE CAN ANSWER.
 *
 * `filterDirectory` is the same three rules over an array in memory, and it
 * stays: the computer players tab and the operator's lists still narrow lists
 * they already hold. What is new is that the DIRECTORY pages, and a narrowing
 * applied after a page is read is a different — wrong — thing from the same
 * narrowing applied to the query.
 *
 * A page of fifty rows filtered down to three still hands out a cursor saying
 * there is more. The reader sees three names, the line beside them says six
 * hundred, and nothing reports it: each page is separately correct and the list
 * as a whole is nonsense. That is the shape of the fault the whole paging
 * convention exists to remove, and the reason the filters had to move into the
 * read rather than being left where they were.
 *
 * SO THIS AND `filterDirectory` HAVE TO AGREE, EXACTLY, and are checked against
 * each other by `directoryWhere.test.ts` over the same rows. Two statements of
 * one rule is the standing hazard here; the test is what keeps them one rule
 * with two spellings rather than two rules.
 *
 * `settled` IS NOT HERE, and cannot be. It asks about a TIER, which is derived
 * from a column on `Player` — another table, no relation, reached by two
 * different keys with a precedence between them. It arrives as an id list
 * instead; see `directorySettled.ts` for how that list is built and why it is
 * affordable.
 */

/** Every member, whatever the reader asked for. */
export const EVERY_MEMBER: Prisma.MemberWhereInput = {};

/**
 * A computer player, or somebody remembered here: the rows that are never
 * "seen" and so sink to the bottom of a recency order for ever.
 *
 * Named because two things need exactly this set and for one reason. The
 * directory PINS them onto its first page under its own default order, the way
 * `alwaysListed` appended them past the old cap — and it lifts them out of the
 * paged read while it does, so that pinning them cannot also show them twice.
 * See `fetchDirectoryPage`.
 */
export const NEVER_SEEN: Prisma.MemberWhereInput = {
  OR: [
    { botTier: { not: null } },
    { unclaimableBecause: UNCLAIMABLE_REASONS.keptRecord },
  ],
};

/**
 * EVERYBODY ELSE — and it is written out rather than expressed as `NOT
 * NEVER_SEEN`, because that form does not work and does not fail either.
 *
 * `NOT (botTier IS NOT NULL OR unclaimableBecause = 'kept-record')` is correct
 * boolean logic and wrong SQL. An ordinary member has a NULL
 * `unclaimableBecause`, so `unclaimableBecause = 'kept-record'` is UNKNOWN
 * rather than false; `FALSE OR UNKNOWN` is UNKNOWN; and `NOT UNKNOWN` is
 * UNKNOWN, which a `WHERE` clause does not select. The directory came back with
 * nine rows — the seven programs and the two kept records, pinned — and not one
 * of the six hundred people, on a page that looked like a working page with a
 * short list on it.
 *
 * It got past a unit test, too, and that is the part worth remembering: the
 * test interpreted the clause with JavaScript's two-valued `!`, so it agreed
 * with the reasoning instead of with Postgres. `directoryWhere.test.ts` now
 * asserts the two halves PARTITION the rows — every member in exactly one —
 * which is a claim neither half can satisfy alone and which needs no opinion
 * about how NULL behaves.
 *
 * So: both halves positive, every NULL named outright.
 */
export const EVER_SEEN: Prisma.MemberWhereInput = {
  botTier: null,
  OR: [
    { unclaimableBecause: null },
    { unclaimableBecause: { notIn: [UNCLAIMABLE_REASONS.keptRecord] } },
  ],
};

/**
 * The condition one narrowing reads as.
 *
 * `settledIds` is the id list from `directorySettled.ts` when the reader asked
 * for settled ratings, and null when they did not — NULL AND NOT AN EMPTY
 * ARRAY, because the two mean opposite things: an empty list is "nobody has a
 * settled rating", which must narrow the directory to nothing, and null is
 * "nobody asked", which must not narrow it at all. A default of `[]` here
 * would have emptied the page for every reader.
 */
export function directoryWhere(
  filter: DirectoryFilter,
  settledIds: readonly string[] | null,
  now: number,
): Prisma.MemberWhereInput {
  const clauses: Prisma.MemberWhereInput[] = [];

  if (filter.who === DIRECTORY_WHO.people) clauses.push({ botTier: null });
  if (filter.who === DIRECTORY_WHO.computers) clauses.push({ botTier: { not: null } });

  /*
   * A computer player is never "seen", because it does not sign in, so the away
   * test would put every one of them away for ever — "seen lately" would have
   * emptied the computers list on any site older than a month.
   * `filterDirectory` exempts them by the same rule and in the same words, and
   * exempts nothing else: somebody remembered here never signs in either, and
   * IS correctly dropped by this filter, because a kept record is not somebody
   * you can get a game from this evening.
   */
  if (filter.active) {
    clauses.push({
      OR: [
        { lastSeenAt: { gte: new Date(now - AWAY_AFTER_DAYS * 86_400_000) } },
        { botTier: { not: null } },
      ],
    });
  }

  if (settledIds !== null) clauses.push({ id: { in: [...settledIds] } });

  if (clauses.length === 0) return EVERY_MEMBER;
  if (clauses.length === 1) return clauses[0];
  return { AND: clauses };
}

/** Whether a narrowing asks for anything at all, so a second count can be skipped. */
export function narrowsAnything(filter: DirectoryFilter): boolean {
  return filter.who !== DIRECTORY_WHO.everyone || filter.settled || filter.active;
}
