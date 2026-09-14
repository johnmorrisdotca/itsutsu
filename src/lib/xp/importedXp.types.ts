/**
 * The vocabulary of imported experience: XP credited for games played on
 * another site, from the records kept of them in `legacyPlayers.data.ts`.
 *
 * Kept apart from `xp.types.ts` on purpose, and the separation is the rule
 * rather than tidiness. John, 2026-09-14: people imported from other sites
 * "should get that XP! but of course, we will show filters, that show
 * worldwide XP ... and the Itsutsu only XP as well". So there are two totals,
 * and nothing may be able to confuse an award from one with an award from the
 * other. An imported type is never an `XpEventType`: `awardXp` cannot be asked
 * for one, `XP_EVENT_SPECS` has no row for one, and `Member.xp` — the Itsutsu
 * total — is never moved by one. `xp.coverage.test.ts` holds the two lists
 * apart.
 */

/**
 * Everything imported experience is paid for.
 *
 * AGGREGATES ONLY, because that is all a kept record holds: per site, per class
 * of game, a count of wins, losses and draws — with a by-game breakdown where
 * one was copied down — and the dates the person joined and was last seen
 * there. Nothing that needs a day (a streak, a weekend, a daily allowance) or an
 * opponent (an upset, a buddy, a turn-around) can be derived from that, so
 * nothing of the kind is here.
 */
export type ImportedXpType =
  /** Games finished in an ordinary class — regular, friendly, ladder. */
  | "importedGames"
  /** Games won in an ordinary class, on top of finishing them. */
  | "importedWins"
  /** Tournament games finished, which John asked to be worth more. */
  | "importedTournamentGames"
  /** Tournament games won. */
  | "importedTournamentWins"
  /** Whole years between joining a site and last being seen there: `yearHere`'s twin. */
  | "importedYears"
  /** Five years on one site: `yearsHere5`'s twin. */
  | "importedYears5"
  /** Ten years on one site: `yearsHere10`'s twin. */
  | "importedYears10"
  /* The milestones at one game, each the twin of the Itsutsu award of the same
     name, counted per game as the source site named it. */
  | "importedWins10"
  | "importedWins100"
  | "importedWins250"
  | "importedWins500"
  | "importedWins1000"
  | "importedLosses10"
  | "importedLosses50"
  | "importedLosses100"
  | "importedLosses250"
  | "importedLosses500"
  | "importedLosses1000"
  | "importedDraws10";

/**
 * How a source site's class of games is priced.
 *
 * Two kinds and no more: John's proposal separates tournaments from everything
 * else, and a site's Regular, Friendly and Ladder games are all ordinary play at
 * the site's own rates. A class name nothing recognises is neither — see
 * `classKindOf`, which answers null for it rather than guessing.
 */
export type ImportedClassKind = "ordinary" | "tournament";

/**
 * One whole setting of the imported-XP rule.
 *
 * THE AMOUNTS ARE THE SITE'S OWN. A game and a win are `gameFinished` and
 * `gameWon`; a year and its milestones are `yearHere`, `yearsHere5` and
 * `yearsHere10`; a milestone at one game is the Itsutsu milestone of the same
 * name — every one of them a row of `XP_EVENT_SPECS`, the site's one table of
 * prices. What a setting adds is only what is peculiar to importing: how much
 * more a tournament is worth, and which of the other awards apply.
 */
export type ImportedXpRules = {
  /** What an ordinary game pays. */
  game: number;
  /** What an ordinary win pays on top of the game. */
  win: number;
  /** Tournament games and wins at this multiple of the ordinary rate, rounded once per claim. */
  tournamentMultiple: number;
  /** Whether years on a site pay, at the prices of an anniversary here. */
  years: boolean;
  /** Whether the milestones at one game pay, from a record's by-game detail. */
  gameMilestones: boolean;
};

/**
 * What one person's record claims under a setting: a total for one type at one
 * stake, and the figure it was worked out from.
 *
 * The STAKE is what the claim is about: the site, for games, wins and years; the
 * game as the site named it, for a milestone at one game.
 *
 * A CLAIM IS A TARGET, NOT A PAYMENT. The ledger pays the difference between it
 * and what that type at that stake has already been paid — see
 * `planImportedPay` — so a record whose figures grow pays only the growth, and a
 * setting changed after a run pays only what the new one adds.
 */
export type ImportedClaim = {
  type: ImportedXpType;
  /** "ItsYourTurn.com", or "Backgammon" for a milestone at one game. */
  stake: string;
  /** Games, wins, years or a milestone's count: the number the points were worked out from. */
  figure: number;
  /** What this type at this stake comes to in total. */
  points: number;
};

/** Everything a person's kept records come to under one setting. */
export type ImportedXpReckoning = {
  claims: ImportedClaim[];
  /** The sum of the claims. */
  total: number;
  /**
   * Classes of game the rule does not know how to price, by site. Paid nothing,
   * and listed so a dry run says so rather than quietly paying less.
   */
  unknownClasses: { site: string; className: string }[];
};

/** A row already on the ledger, as the planner needs it. */
export type HeldImported = { type: string; subject: string; points: number };

/** One ledger row the planner would write. */
export type ImportedPayment = {
  type: ImportedXpType;
  stake: string;
  /** `stake@figure=points`, which is what makes the row idempotent. See `importedSubject`. */
  subject: string;
  /** The difference owed: the claim's points less what was already paid. */
  points: number;
};

/** Why a claim writes nothing. */
export const IMPORTED_SKIP_REASONS = {
  /** Everything this claim comes to has been paid already. */
  alreadyPaid: "already-paid",
  /**
   * The record now comes to LESS than was paid — a figure corrected downwards,
   * or a cheaper setting. XP is never taken back (John: "You can never lose XP
   * of course."), so nothing is written and the dry run says why.
   */
  neverTakenBack: "never-taken-back",
} as const;

export type ImportedSkipReason = (typeof IMPORTED_SKIP_REASONS)[keyof typeof IMPORTED_SKIP_REASONS];

export type ImportedSkip = {
  type: ImportedXpType;
  stake: string;
  reason: ImportedSkipReason;
  paid: number;
  target: number;
};

export type ImportedPlan = {
  paying: ImportedPayment[];
  skipped: ImportedSkip[];
  /** What `paying` comes to. */
  points: number;
};
