import type { XpEventType } from "./xp.types";

/**
 * What a chronological replay can honestly pay, and what it must not — one row
 * per award in the catalogue.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS IS A TABLE AND NOT A PARAGRAPH IN THE RUNNER
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `XP_DESIGN.md` says a *partial* backfill is the worst of the three options:
 * four people with totals that reflect some awards and not others, which
 * nothing can explain and nobody can check. The awards a replay CAN pay are
 * exactly the ones whose facts were written down at the time, and that is
 * fewer than the catalogue — so a partial backfill is the only kind there is.
 *
 * What makes it explainable rather than arbitrary is this table. It is
 * `Record<XpEventType, …>`, so a new award in the catalogue is a compile error
 * here until somebody has decided whether history can pay it; the runner
 * prints the whole thing every run, so the total a member ends up with can
 * always be read back against the list of what was and was not replayed.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THREE ANSWERS, NOT TWO
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `replayed: true` — the fact is on a row this replay reads, so the award is
 * paid at the moment history says it was earned.
 *
 * `replayed: false, recorded: false` — **nothing anywhere recorded it.** A run
 * of days cannot be rebuilt from a single `lastSeenAt`; no column links a
 * rematch to what it was a rematch of. These can never be backfilled, by this
 * runner or a later one, and saying so is the point of the row.
 *
 * `replayed: false, recorded: true` — **the fact IS written down, in a table
 * this runner does not read.** `Buddy`, `TimeGift` and `Applause` all carry a
 * `createdAt`. A later ticket could replay them with the same machinery; this
 * one replays the GAME history and `joined`, which is where the ordered facts
 * are and therefore where the difficulty was. The distinction matters because
 * the two refusals are not the same promise: one is "impossible", the other is
 * "not yet", and a reader deciding whether the ladder is finished needs to
 * know which they are looking at.
 */
export type XpBackfillCoverage =
  | {
      replayed: true;
      /** Which stored fact pays it, for a reader checking the total. */
      from: string;
    }
  | {
      replayed: false;
      /**
       * Whether the fact exists somewhere on the site, unread by this runner.
       * False means no history of it was ever kept.
       */
      recorded: boolean;
      why: string;
    };

/** What the replay covers, per award. Printed in full by the runner. */
export const XP_BACKFILL_COVERAGE: Record<XpEventType, XpBackfillCoverage> = {
  /* ── Arriving ──────────────────────────────────────────────────────────── */

  joined: { replayed: true, from: "Member.createdAt" },

  dailyVisit: {
    replayed: false,
    recorded: false,
    why: "No visit history exists. `Member.lastSeenAt` is one date — the most recent — and the ledger held no visit rows before 0.162.0, so there is nothing to count days from. Paying the one date we have would invent a habit out of a single page load.",
  },
  dayStreak7: {
    replayed: false,
    recorded: false,
    why: "A run of days is a set of day keys, and there is no such set: see `dailyVisit`. A streak cannot be inferred from one date.",
  },
  dayStreak30: {
    replayed: false,
    recorded: false,
    why: "As `dayStreak7`: no set of days was ever recorded.",
  },
  dayStreak100: {
    replayed: false,
    recorded: false,
    why: "As `dayStreak7`: no set of days was ever recorded.",
  },
  dayStreak365: {
    replayed: false,
    recorded: false,
    why: "As `dayStreak7`: no set of days was ever recorded.",
  },
  backFromAway: {
    replayed: false,
    recorded: false,
    why: "It is keyed on the away spell that ended, and `Member.awayUntil` holds at most the CURRENT one. A spell that ended before today left no row behind.",
  },

  /* ── Playing ───────────────────────────────────────────────────────────── */

  weekendGame: {
    replayed: true,
    from: "Game.playedAt read in the member's own zone — and see `playedAt` in backfillXp.ts, which is the game's moment and not its finish",
  },
  firstGameEver: { replayed: true, from: "the first decided game with a bound seat" },
  gameFinished: { replayed: true, from: "Game, every decided game, both bound seats" },
  gameWon: { replayed: true, from: "Game.winner" },
  wonVsPerson: { replayed: true, from: "the other seat's member id, with `botTierFor` saying it is a person" },
  wonVsBuddy: {
    replayed: true,
    from: "Buddy, with `createdAt <= the game`, so a list is read as it stood then",
  },
  revengeWin: {
    replayed: true,
    from: "the replay's own history: a loss to that member at that game EARLIER in the order",
  },
  longGame: { replayed: true, from: "Game.moveCount" },
  winStreak3: { replayed: true, from: "the run rebuilt by `extendStreak` over the games so far" },
  winStreak5: { replayed: true, from: "the run rebuilt by `extendStreak` over the games so far" },
  winStreak10: { replayed: true, from: "the run rebuilt by `extendStreak` over the games so far" },

  comeback: {
    replayed: false,
    recorded: false,
    why: "In `XP_UNWIRED`: nothing pays it live either. A backfill that paid it would put points in the ledger the running site does not award, which is worse than the gap. `xpGame.ts` has the whole refusal.",
  },

  /* ── The tour ──────────────────────────────────────────────────────────── */

  firstOfVariant: { replayed: true, from: "Game.variant, at the earliest game of it" },
  firstWinAtVariant: { replayed: true, from: "Game.variant at the earliest WIN at it" },
  firstOfFamily: { replayed: true, from: "`familyKeyOf(variant)` at the earliest game in that family" },
  everyFamilyPlayed: { replayed: true, from: "the replay's count of `firstOfFamily`, ledger rows included" },
  everyVariantPlayed: { replayed: true, from: "the replay's count of `firstOfVariant`, ledger rows included" },

  /* ── The computer ladder ───────────────────────────────────────────────── */

  gradeBeaten: { replayed: true, from: "`botTierFor` on the beaten seat" },
  everyGradeBeaten: { replayed: true, from: "the replay's count of `gradeBeaten`, ledger rows included" },
  specialistBeaten: { replayed: true, from: "`botTierFor` on the beaten seat" },

  /* ── People ────────────────────────────────────────────────────────────── */

  firstBuddy: {
    replayed: false,
    recorded: true,
    why: "`Buddy.createdAt` records it, so a later ticket can. This runner replays the game history and `joined`; the buddy list is read only to answer `wonVsBuddy` as it stood at each game.",
  },
  buddyAdded: {
    replayed: false,
    recorded: true,
    why: "As `firstBuddy`: recorded in `Buddy`, out of this runner's scope.",
  },
  challengeSent: {
    replayed: false,
    recorded: false,
    why: "The ask was never written down. `createdGameKind` reads the REQUEST body, and no column on `Game` says a row was created as a challenge rather than posted or hot-seated.",
  },
  challengeAnswered: {
    replayed: false,
    recorded: false,
    why: "It rides the challenged side's first move of a game created as a challenge, and nothing on the row says a game WAS one. See `challengeSent`.",
  },
  rematchPlayed: {
    replayed: false,
    recorded: false,
    why: "There is no rematch link on `Game` — checked against the schema — so a rematch is indistinguishable from any other new game with the same two seats.",
  },
  forkPlayed: {
    replayed: false,
    recorded: false,
    why: "As `rematchPlayed`: no column records that a game was forked from another.",
  },
  timeGiven: {
    replayed: false,
    recorded: true,
    why: "`TimeGift` records the game, the giving COLOUR and a `createdAt`, so a later ticket can turn that into a member through the game's seats. Out of this runner's scope.",
  },
  applauseGiven: {
    replayed: false,
    recorded: true,
    why: "`Applause` records the member by address and a `createdAt`. Out of this runner's scope.",
  },

  /* ── Who you are ───────────────────────────────────────────────────────── */

  nameSet: {
    replayed: false,
    recorded: false,
    why: "The column says a name IS set; nothing says when, or whether the member typed it or Google supplied it at signup. An award with no moment cannot be placed in a chronological replay, and a made-up one is a date nobody can check.",
  },
  countrySet: {
    replayed: false,
    recorded: false,
    why: "As `nameSet`: the present column says what is set, never when it was set.",
  },
  bioSet: {
    replayed: false,
    recorded: false,
    why: "As `nameSet`: the present column says what is set, never when it was set.",
  },
  wordsSet: {
    replayed: false,
    recorded: true,
    why: "`Member.phraseSetAt` is the one profile award with a moment on it — the only one of the four that could be replayed. Out of this runner's scope, and listed here so the asymmetry is a decision rather than an oversight.",
  },
  seatClaimedElsewhere: {
    replayed: false,
    recorded: false,
    why: "`blackClaimedAt` / `whiteClaimedAt` say a seat was claimed, not that somebody sat as somebody else — which is the thing the award is for. Nothing distinguishes the two afterwards.",
  },
};

/** Every award this replay pays, for a report and for the coverage test. */
export const XP_BACKFILL_REPLAYED: readonly XpEventType[] = (
  Object.keys(XP_BACKFILL_COVERAGE) as XpEventType[]
).filter((type) => XP_BACKFILL_COVERAGE[type].replayed);

/** Every award it does not, whether or not the fact survives anywhere. */
export const XP_BACKFILL_SKIPPED: readonly XpEventType[] = (
  Object.keys(XP_BACKFILL_COVERAGE) as XpEventType[]
).filter((type) => !XP_BACKFILL_COVERAGE[type].replayed);
