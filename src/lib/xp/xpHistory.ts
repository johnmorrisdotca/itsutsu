import { BOT_MEMBERS } from "@/lib/bots/bots.constants";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

import { XP_EVENTS, XP_EVENT_SPECS } from "./xp.constants";
import { XP_SUBJECT_KINDS, type XpAbout, type XpLedgerRow, type XpSubjectKind } from "./xpHistory.types";
import type { XpEventType } from "./xp.types";

/**
 * READING A SUBJECT BACK.
 *
 * The writing half of the ledger is `awardXp.ts`; this is the only module that
 * reads a subject back and has to say what it referred to. Pure, and it imports
 * no database, so `xpHistory.test.ts` proves the mapping against the catalogue
 * itself rather than against a seeded row.
 *
 * **NAMING A LEVEL IS NO LONGER THIS MODULE'S JOB, and the removal is the
 * point.** `xpLevelLabel` lived here and answered `Level 42`, a placeholder
 * with the one-line swap to `xpLevelName` written in its own comment. The
 * hundred names landed, so it is gone rather than made into a one-line
 * forwarder: a second name for one lookup is how a join comes to have two
 * sites, and the next surface that wants a level would have had two functions
 * to choose between with nothing to choose on. `xpLevelName` in
 * `src/lib/xp/levelNames.ts` is the only door, and it keeps `Level 42` as its
 * floor for a rung the ladder does not have.
 *
 * The reason it is a table and not a switch is `XP_SUBJECTS`'s reason: getting
 * this wrong is invisible. A `gradeBeaten` read as a variant key links to
 * /games/meijin, which is not a game; a `gameFinished` read as a variant prints
 * a cuid where a name should be. Neither throws, neither is reported, and
 * neither is noticed by anybody who does not click.
 */

/**
 * What each kind of award's subject refers to.
 *
 * A `Record<XpEventType, …>`, so a new award cannot be added without deciding —
 * and `xpHistory.test.ts` cross-checks every row of it against the prose in
 * `XP_SUBJECTS`, which is the catalogue's own statement of the same fact. Two
 * tables saying one thing is a risk; two tables *checked against each other* is
 * the only way a reader of either can trust it.
 */
export const XP_SUBJECT_KIND_OF: Record<XpEventType, XpSubjectKind> = {
  // Arriving, and coming back. A day-keyed award's subject is its own date.
  joined: XP_SUBJECT_KINDS.nobody,
  dailyVisit: XP_SUBJECT_KINDS.when,
  dayStreak7: XP_SUBJECT_KINDS.when,
  dayStreak30: XP_SUBJECT_KINDS.when,
  dayStreak100: XP_SUBJECT_KINDS.when,
  dayStreak365: XP_SUBJECT_KINDS.when,
  weekendGame: XP_SUBJECT_KINDS.when,
  backFromAway: XP_SUBJECT_KINDS.when,
  // Playing. Every one of these is keyed by the game it happened in.
  firstGameEver: XP_SUBJECT_KINDS.nobody,
  gameFinished: XP_SUBJECT_KINDS.match,
  gameWon: XP_SUBJECT_KINDS.match,
  wonVsPerson: XP_SUBJECT_KINDS.match,
  wonVsBuddy: XP_SUBJECT_KINDS.match,
  revengeWin: XP_SUBJECT_KINDS.rivalry,
  longGame: XP_SUBJECT_KINDS.match,
  comeback: XP_SUBJECT_KINDS.match,
  winStreak3: XP_SUBJECT_KINDS.match,
  winStreak5: XP_SUBJECT_KINDS.match,
  winStreak10: XP_SUBJECT_KINDS.match,
  // The tour.
  firstOfVariant: XP_SUBJECT_KINDS.game,
  firstWinAtVariant: XP_SUBJECT_KINDS.game,
  firstOfFamily: XP_SUBJECT_KINDS.family,
  everyFamilyPlayed: XP_SUBJECT_KINDS.nobody,
  everyVariantPlayed: XP_SUBJECT_KINDS.nobody,
  // The computer ladder. A tier IS a member here — see BOT_MEMBERS.
  gradeBeaten: XP_SUBJECT_KINDS.person,
  everyGradeBeaten: XP_SUBJECT_KINDS.nobody,
  specialistBeaten: XP_SUBJECT_KINDS.person,
  // People.
  firstBuddy: XP_SUBJECT_KINDS.nobody,
  buddyAdded: XP_SUBJECT_KINDS.person,
  challengeSent: XP_SUBJECT_KINDS.match,
  challengeAnswered: XP_SUBJECT_KINDS.match,
  rematchPlayed: XP_SUBJECT_KINDS.match,
  forkPlayed: XP_SUBJECT_KINDS.match,
  timeGiven: XP_SUBJECT_KINDS.match,
  applauseGiven: XP_SUBJECT_KINDS.match,
  // Who you are.
  nameSet: XP_SUBJECT_KINDS.nobody,
  countrySet: XP_SUBJECT_KINDS.nobody,
  bioSet: XP_SUBJECT_KINDS.nobody,
  wordsSet: XP_SUBJECT_KINDS.nobody,
  seatClaimedElsewhere: XP_SUBJECT_KINDS.match,
};

/**
 * The day-keyed awards whose subject says nothing the row's own date does not.
 *
 * `dailyVisit`'s subject IS the day it was earned, so a column for it and a
 * column for `dayKey` would print the same string twice on every one of the
 * most numerous rows on the ledger. The weekend and the end of an absence are
 * different: an ISO week and an `awayUntil` date are facts the row's date does
 * not carry, and both are worth saying.
 */
const DATE_IS_THE_ROW: ReadonlySet<XpEventType> = new Set<XpEventType>([
  XP_EVENTS.dailyVisit,
  XP_EVENTS.dayStreak7,
  XP_EVENTS.dayStreak30,
  XP_EVENTS.dayStreak100,
  XP_EVENTS.dayStreak365,
]);

function asVariant(value: string): RuleVariant | null {
  return (RULE_VARIANTS as Record<string, RuleVariant | undefined>)[value] ?? null;
}

/** The computer player a tier names, or null for a tier this deploy has dropped. */
function asBot(value: string): { memberId: string; name: string } | null {
  const bot = (BOT_MEMBERS as Record<string, { id: string; name: string } | undefined>)[value];
  return bot === undefined ? null : { memberId: bot.id, name: bot.name };
}

/**
 * A game in the family with this title, which is how a family is addressed.
 *
 * `GAME_FAMILIES` is an array of anonymous objects identified by `title` and
 * `/games/<slug>/family` is reached through one of its games, so there is no
 * address for a family that holds no game we still have. Null for a family
 * whose title has changed since the award, which the design flags as the honest
 * cost of using a display string as an identity.
 */
function familyThrough(title: string): RuleVariant | null {
  return GAME_FAMILIES.find((family) => family.title === title)?.games[0] ?? null;
}

/**
 * WHAT ONE AWARD WAS ABOUT.
 *
 * The rule throughout is the one AGENTS.md states twice: a subject that cannot
 * be read is said in words, never resolved to a plausible value. A withdrawn
 * variant key does not become the first variant in the list, a renamed family
 * does not become the first family, and a `revengeWin` subject with no colon in
 * it does not become a rivalry with an empty opponent. Each of those would be a
 * link that goes somewhere real and means something false, which is worse than
 * the plain words and nothing reports it.
 */
export function xpAboutFor(type: XpEventType, subject: string): XpAbout {
  const kind = XP_SUBJECT_KIND_OF[type];
  if (kind === XP_SUBJECT_KINDS.nobody || subject === "") return { of: "nobody" };

  if (kind === XP_SUBJECT_KINDS.when) {
    if (DATE_IS_THE_ROW.has(type)) return { of: "nobody" };
    return { of: "words", said: subject };
  }

  if (kind === XP_SUBJECT_KINDS.match) {
    // The variant is not in the subject and cannot be. A reader fills it in;
    // see `xpHistoryPage.ts`, and null stays null rather than becoming a game.
    return { of: "match", gameId: subject, variant: null };
  }

  if (kind === XP_SUBJECT_KINDS.game) {
    const variant = asVariant(subject);
    return variant === null ? { of: "words", said: subject, stale: true } : { of: "game", variant };
  }

  if (kind === XP_SUBJECT_KINDS.family) {
    return { of: "family", title: subject, through: familyThrough(subject) };
  }

  if (kind === XP_SUBJECT_KINDS.person) {
    /*
     * A tier first, because the computer players ARE members with fixed ids and
     * `gradeBeaten` carries the tier rather than the id. That gives their name
     * for nothing — `BOT_MEMBERS` is a constant — where a buddy's name would
     * cost a query, so the two kinds of person are not drawn the same way.
     */
    const bot = asBot(subject);
    if (bot !== null) return { of: "person", memberId: bot.memberId, name: bot.name };
    return { of: "person", memberId: subject, name: null };
  }

  // A rivalry: the opponent, at one game. Both halves, or it is not one.
  const at = subject.lastIndexOf(":");
  if (at <= 0 || at === subject.length - 1) return { of: "words", said: subject, stale: true };
  const variant = asVariant(subject.slice(at + 1));
  if (variant === null) return { of: "words", said: subject, stale: true };
  return { of: "rivalry", memberId: subject.slice(0, at), variant };
}

/** Whether this row's subject is a match whose game still has to be looked up. */
export function needsMatch(about: XpAbout): about is { of: "match"; gameId: string; variant: null } {
  return about.of === "match" && about.variant === null;
}

/**
 * One stored event as the panel reads it, or null for a type this deploy cannot
 * explain.
 *
 * Null rather than a row with the type string standing in for the label: see
 * `XpLedgerSkips`. The caller counts what it dropped.
 */
export function xpLedgerRowFor(event: {
  id: string;
  type: string;
  points: number;
  subject: string;
  dayKey: string;
  createdAt: Date;
}): XpLedgerRow | null {
  const type = event.type as XpEventType;
  const spec = XP_EVENT_SPECS[type];
  if (spec === undefined) return null;
  return {
    id: event.id,
    type,
    points: event.points,
    label: spec.label,
    kanji: spec.kanji,
    blurb: spec.blurb,
    about: xpAboutFor(type, event.subject),
    dayKey: event.dayKey,
    earnedAt: event.createdAt.toISOString(),
  };
}

/**
 * The address of the next page of a ledger.
 *
 * Every other parameter survives — the open tab above all, or "more" would
 * navigate away from the ledger it is under — and the cursor is replaced rather
 * than appended. `sortHref` in `src/lib/api/paging.ts` is the same idea for a
 * heading and DROPS the cursor, because a position in one order means nothing
 * in another; this is the opposite errand and keeps it.
 */
export function xpMoreHref(at: string, params: URLSearchParams, cursor: string): string {
  const next = new URLSearchParams(params.toString());
  next.set("cursor", cursor);
  return `${at}?${next.toString()}`;
}

/**
 * A page's search parameters as `URLSearchParams`.
 *
 * Next hands a render a plain record whose values may be arrays; the paging
 * convention reads `URLSearchParams`, because that is what a route handler
 * holds and the convention is deliberately one thing for both. A repeated
 * parameter keeps every value, so `parseSort` sees the first — the same answer
 * `activeTab` gives for a repeated `view`.
 */
export function xpParamsFrom(record: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) for (const one of value) params.append(key, one);
    else params.set(key, value);
  }
  return params;
}

/** The five graded computer players and the two specialists, for a test to pin. */
export const XP_BOT_TIERS: readonly BotTier[] = Object.keys(BOT_MEMBERS) as BotTier[];
