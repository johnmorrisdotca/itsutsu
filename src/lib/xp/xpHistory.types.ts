import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { XpEventType } from "./xp.types";

/**
 * The shapes of a member's own XP ledger.
 *
 * Kept apart from `xpHistoryPage.ts` for the reason UmaKuma learned the hard
 * way: its history table and its history query were one module until the table
 * became a client component and pulled Prisma into the browser bundle through a
 * `server-only` import. Typecheck passed and 3,560 unit tests passed; only
 * running the page caught it. The vocabulary is shared, the query is not.
 *
 * Nothing here imports Prisma, and the pure half in `xpHistory.ts` does not
 * either — so its tests need no database and cannot be told apart from a fact.
 */

/**
 * WHAT A SUBJECT IS, PER KIND OF AWARD.
 *
 * `XpEvent.subject` is one opaque string whose meaning is decided entirely by
 * the row's `type`: a game id for `gameFinished`, a variant key for
 * `firstOfVariant`, a day for `dailyVisit`, `""` for `joined`. The ledger is the
 * first surface that has to read it back rather than write it, and reading it
 * back wrongly is invisible — a game id shown as a variant links to a game that
 * does not exist, and nothing reports a 404 nobody clicked.
 *
 * So the mapping is a `Record<XpEventType, …>` and adding an award is a
 * decision the compiler demands, the same way `XP_SUBJECTS` demands the prose.
 */
export const XP_SUBJECT_KINDS = {
  /** A match played here. The id addresses it; only the database knows its game. */
  match: "match",
  /** One of the site's games, by its `RuleVariant` key. */
  game: "game",
  /** A family of games, by its title — `GAME_FAMILIES` has no other key. */
  family: "family",
  /** A person, by their member id. A buddy, or a computer player. */
  person: "person",
  /** A person at one game: `<memberId>:<variant>`. */
  rivalry: "rivalry",
  /** A day, a week, a date. True, and not a thing with an address. */
  when: "when",
  /** The member and nobody else. `subject` is `""`. */
  nobody: "nobody",
} as const;

export type XpSubjectKind = (typeof XP_SUBJECT_KINDS)[keyof typeof XP_SUBJECT_KINDS];

/**
 * WHAT ONE ROW IS ABOUT, AS THE PAGE HAS TO DRAW IT.
 *
 * A discriminated union rather than a pre-built href, because half of these
 * are links and half of them cannot be, and an `href: string | null` would make
 * "there is nothing to link to" and "nobody worked out the link" the same
 * value. The page asks what the row is about and draws each kind the way this
 * site draws that kind — a game through `GameName`, a person through
 * `PlayerName` — rather than being handed markup by a library module.
 */
export type XpAbout =
  /**
   * A match. `variant` is null until something reads it out of the games table,
   * and null means *this row cannot be linked* — never "freestyle".
   */
  | { of: "match"; gameId: string; variant: RuleVariant | null }
  | { of: "game"; variant: RuleVariant }
  /** `through` is a game in the family, which is how a family is addressed. */
  | { of: "family"; title: string; through: RuleVariant | null }
  | { of: "person"; memberId: string; name: string | null }
  | { of: "rivalry"; memberId: string; variant: RuleVariant }
  /**
   * A subject with no address: a day, an ISO week, the date an absence ended.
   *
   * `stale` is set where the subject SHOULD have addressed something and does
   * not — a variant that has been withdrawn, a family that was retitled since
   * the award. The words are still printed, because the member did earn it, and
   * the flag is what lets the page say so instead of pretending the row is
   * about a calendar.
   */
  | { of: "words"; said: string; stale?: true }
  | { of: "nobody" };

/** One award on a member's ledger, as the panel reads it. */
export type XpLedgerRow = {
  /** `XpEvent.id`. The cursor's tiebreaker, and React's key. */
  id: string;
  type: XpEventType;
  /** What was paid AT THE TIME, which is not what the type is worth now. */
  points: number;
  /** From the catalogue, so the browser never ships forty rows of copy. */
  label: string;
  kanji: string;
  /** The sentence saying what it was for. `XpEventSpec.blurb`. */
  blurb: string;
  /** What it was about, and whether that is something with an address. */
  about: XpAbout;
  /** The day it was earned, in the member's own zone. `XpEvent.dayKey`. */
  dayKey: string;
  /** When, to the second, as an ISO string. */
  earnedAt: string;
};

/**
 * A row the catalogue cannot explain is dropped rather than guessed at.
 *
 * `XpEvent.type` is a plain string on purpose, so a row written by a newer
 * deploy — or by one whose type has since been renamed rather than retired —
 * can reach a page that has never heard of it. `XP_EVENT_SPECS[type]` is then
 * `undefined`, and every field the panel wants is missing at once. Printing
 * "undefined +10" is worse than printing nothing, and a row is never the whole
 * page, so the one row goes and the rest of the ledger is still true.
 *
 * It is counted rather than swallowed, so a deploy that starts dropping rows
 * says so somewhere a person can see.
 */
export type XpLedgerSkips = { readonly unknownType: number };
