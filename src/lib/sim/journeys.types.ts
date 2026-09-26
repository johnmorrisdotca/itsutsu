import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";

/** One game this role plays, and how often relative to the rest of its mix. */
export type RoleGameMix = { variant: RuleVariant; weight: number };

/** One puzzle this role solves, and how often relative to the rest of its mix. */
export type RolePuzzleMix = { kind: PuzzleKind; level: PuzzleLevel; weight: number };

/**
 * One of the 15-18 kinds of player the projection populates the site with.
 * Every field here is a modelling knob, not a fact read from anywhere real —
 * `journeyRoles.constants.ts` says what each one means and why it was chosen.
 */
export type JourneyRole = {
  key: string;
  name: string;
  description: string;
  /** How many of the 1000 simulated players are this role. All roles' shares sum to 1000. */
  share: number;
  /** The role's ability, as a normal distribution of a latent, Elo-like true skill. */
  skill: { mean: number; spread: number };
  /** Days a month this role is active, on average, before streakiness reshapes it into a pattern. */
  activeDaysPerMonth: number;
  /** Only Saturdays and Sundays count as a possible active day. */
  weekendOnly?: boolean;
  /** Games played on an active day. */
  gamesPerActiveDay: number;
  /** Which games, and how often each relative to the others. Empty for a puzzles-only role. */
  gameMix: readonly RoleGameMix[];
  /** Puzzles solved on an active day. */
  puzzlesPerActiveDay: number;
  /** Which puzzles, and how often each relative to the others. Empty for a games-only role. */
  puzzleMix: readonly RolePuzzleMix[];
  /** Monthly rate of the acts that only earn XP: adding a buddy, applauding a game, offering or answering a challenge. */
  social: { buddiesPerMonth: number; applausePerMonth: number; challengesPerMonth: number };
  /** 0 (no streak habit at all) to 1 (plays every single day once started) — see `activeDaysThisMonth` for how it is used. */
  streakHabit: number;
  /** Chance this role's player leaves for good at the end of a month (stops being simulated from the next month on). */
  churnPerMonth: number;
  /** The month (1-12) this role's players first appear. Everyone else starts at month 1. */
  joinMonth?: number;
  /** True for a role modelling a member who brought a record from another site (Returning Veteran): a one-time, approximate `xpImported` credit is added at month 1. */
  importedRecordApprox?: boolean;
};

/** One simulated player: which role they were drawn from, and their own randomly drawn ability inside that role's spread. */
export type SimPlayer = {
  index: number;
  roleKey: string;
  /** Latent true skill: decides who wins a game, never shown to a reader. */
  trueSkill: number;
  /** The site's own displayed Elo rating and its games-rated count, starting at RATING_START like every real member. */
  displayRating: number;
  ratedGames: number;
  /** Month this player joined (1-12) and, if churned, the month after which they stopped playing. */
  joinMonth: number;
  churnedAfterMonth: number | null;

  /* ── Running totals and streak state, mutated day by day as the simulation plays out ── */
  xpTotal: number;
  ipTotal: number;
  /** Consecutive active days right now (resets to 0 the first inactive day). */
  activeDayStreak: number;
  /** Consecutive wins right now, across every game (resets on a loss or a draw). */
  winStreak: number;
  /** The ISO-week-like id (see `journeySimDay.ts`) `weekendGame` was last paid in, or null. */
  weekendPaidWeek: number | null;
  setupProfileDone: boolean;
  joinedPaid: boolean;
  firstBuddyPaid: boolean;
  variantsPlayed: Set<string>;
  variantsWon: Set<string>;
  familiesPlayed: Set<string>;
  everyFamilyPaid: boolean;
  everyVariantPaid: boolean;
  resultCounts: Map<string, { win: number; loss: number; draw: number }>;
};

/** One month's totals for one player, the unit the page and the tests read. */
export type PlayerMonth = {
  month: number;
  xpGained: number;
  ipGained: number;
  xpTotal: number;
  ipTotal: number;
  level: number;
};

/** A simulated player's whole year. */
export type PlayerJourney = {
  index: number;
  roleKey: string;
  months: readonly PlayerMonth[];
  xpAllTime: number;
  ipAllTime: number;
  levelAtEnd: number;
};

/** Percentiles of a distribution, read off a sorted array. */
export type Percentiles = { p10: number; p50: number; p90: number };

/** One role's story across the year, for the roles table and the small multiples. */
export type RoleSummary = {
  role: JourneyRole;
  players: number;
  atMonth: Record<1 | 3 | 6 | 12, { xp: Percentiles; ip: Percentiles }>;
  levelAt12: Percentiles;
  medianXpToIpRatio: number;
  medianMonthlyIpSeries: readonly number[];
  medianMonthlyXpSeries: readonly number[];
};

/** A ranked line on a projected top-10 board. */
export type BoardRow = { rank: number; index: number; roleKey: string; value: number };

export type JourneySimResult = {
  seed: number;
  players: readonly PlayerJourney[];
  roles: readonly RoleSummary[];
  /** The all-time IP top 10 and the all-time XP top 10, at month 12. */
  ipTop10: readonly BoardRow[];
  xpTop10: readonly BoardRow[];
  /** The same two boards, counting only the final month's gain — "this month" as the live boards would show it. */
  ipTop10ThisMonth: readonly BoardRow[];
  xpTop10ThisMonth: readonly BoardRow[];
};
