import type { GameKey } from "@/lib/catalogue/gameKeys";
import { gamePoints, type PricedResult } from "@/lib/points/gamePoints";
import { GAME_FAMILIES, familyKeyOf } from "@/lib/gomoku/families";
import { RULE_VARIANT_LIST, STONES, WIN_REASONS, defaultBoardFor } from "@/lib/gomoku/gomoku.constants";
import { expectedScore, rateGame } from "@/lib/rating/elo";
import { XP_EVENTS, XP_LONG_GAME_MOVES, dayStreakMilestoneFor, resultMilestoneFor, winStreakMilestoneFor } from "@/lib/xp/xp.constants";

import type { GamePool } from "./journeyPopulation";
import { approxPuzzleIp, approxSolveChance, isWordPuzzle } from "./journeyPuzzles";
import type { JourneyRole, SimPlayer } from "./journeys.types";
import { newXpDayBook, xpBatch } from "./journeyXp";
import { chance, uniformInt, type Rng } from "./prng";

/**
 * ONE SIMULATED DAY FOR ONE PLAYER: games, puzzles, and the XP-only social
 * acts. Everything a real member's day could touch that this projection
 * bothers to model. What it leaves out, and why, is listed beside each award
 * it does not pay in `xp.constants.ts`'s own terms:
 *
 * - No computer opponents, so `gradeBeaten`, `everyGradeBeaten`,
 *   `specialistBeaten` and the whole "full board kept moving" family
 *   (`fullHouse` and its combos) never fire — there is no bot ladder and no
 *   twenty-game cap in this model.
 * - `revengeWin`, `comeback` (which the real site does not pay either —
 *   `XP_UNWIRED`), `rematchPlayed`, `forkPlayed`, `timeGiven`,
 *   `wonVsBuddy`, `seatClaimedElsewhere`, `backFromAway` and the membership
 *   anniversaries (`yearHere` and its milestones) all depend on session
 *   detail — a specific rivalry, a specific position, a specific absence —
 *   this model has no notion of, so they are approximated as zero rather
 *   than guessed at (see AGENTS.md, "a rule that cannot measure must not
 *   fire").
 * - `everyVariantWonInFamily` (winning every game in a family) is not
 *   tracked; most roles play one to eight of the eight modelled variants, so
 *   this would rarely fire and add little.
 * - A game's `score` (for the closeLoss bonus), `headStartFor` and
 *   `handicapOn` are not modelled — every game is priced as a plain win,
 *   loss or draw. `earlierToday` (the same-opponent-again discount) is
 *   always 0: opponents are drawn fresh from the whole pool each game.
 */

const WEEKEND_DAYS = new Set([5, 6]);

export function isWeekendDay(dayOfWeek: number): boolean {
  return WEEKEND_DAYS.has(dayOfWeek);
}

/** Whether today is active, as a short Markov chain biased by the role's streak habit toward the target average. */
export function decideActiveToday(rng: Rng, role: JourneyRole, wasActiveYesterday: boolean, dayOfWeek: number): boolean {
  if (role.weekendOnly === true && !isWeekendDay(dayOfWeek)) return false;
  const daysAvailable = role.weekendOnly === true ? 8 : 30;
  const baseP = Math.min(1, role.activeDaysPerMonth / daysAvailable);
  const p = wasActiveYesterday ? Math.min(1, baseP + role.streakHabit * (1 - baseP)) : baseP * (1 - role.streakHabit * 0.5);
  return chance(rng, p);
}

/** How many games/puzzles to run today from a fractional per-day rate (e.g. 0.5 => half the days get one). */
function countFromRate(rng: Rng, rate: number): number {
  const whole = Math.floor(rate);
  const fraction = rate - whole;
  return whole + (chance(rng, fraction) ? 1 : 0);
}

/** Cumulative weights for a role's `gameMix` / `puzzleMix`, built once per role and reused for every pick of the year. */
const mixCumulativeCache = new WeakMap<readonly unknown[], number[]>();
function cumulativeOf(mix: readonly { weight: number }[]): number[] {
  const cached = mixCumulativeCache.get(mix);
  if (cached !== undefined) return cached;
  let running = 0;
  const cumulative = mix.map((entry) => {
    running += entry.weight;
    return running;
  });
  mixCumulativeCache.set(mix, cumulative);
  return cumulative;
}

/** Picks one entry of `mix` by its weight, via a precomputed cumulative table instead of rebuilding one every call. */
function pickFromMix<T extends { weight: number }>(rng: Rng, mix: readonly T[]): T {
  const cumulative = cumulativeOf(mix);
  const total = cumulative[cumulative.length - 1];
  const roll = rng() * total;
  let lo = 0;
  let hi = cumulative.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cumulative[mid] < roll) lo = mid + 1;
    else hi = mid;
  }
  return mix[lo];
}

export type GamePools = Map<string, GamePool>;

/** Picks an index from a precomputed cumulative-weight table by binary search — O(log n), reused for every game of the year. */
function pickWeighted(rng: Rng, pool: GamePool): number {
  const roll = rng() * pool.total;
  let lo = 0;
  let hi = pool.cumulative.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (pool.cumulative[mid] < roll) lo = mid + 1;
    else hi = mid;
  }
  return pool.indices[lo];
}

/** Picks an opponent for `variant` other than `selfIndex`, from the pool of players whose role plays it. Null if nobody else does. */
function pickOpponent(rng: Rng, pools: GamePools, variant: string, selfIndex: number): number | null {
  const pool = pools.get(variant);
  if (pool === undefined || pool.indices.length < 2) return null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const pick = pickWeighted(rng, pool);
    if (pick !== selfIndex) return pick;
  }
  return null;
}

/** One finished game between `a` and `b`, mutating both players' ratings, XP and IP totals. */
function playOneGame(rng: Rng, a: SimPlayer, b: SimPlayer, variant: string, size: number): void {
  const expectedA = expectedScore(a.trueSkill, b.trueSkill);
  const drawChance = 0.06;
  const roll = rng();
  const drawn = roll < drawChance;
  const aWon = !drawn && roll - drawChance < expectedA * (1 - drawChance);

  const before = {
    a: { rating: a.displayRating, ratedGames: a.ratedGames },
    b: { rating: b.displayRating, ratedGames: b.ratedGames },
  };
  const rated = rateGame(before.a, before.b, drawn ? 0.5 : aWon ? 1 : 0);
  a.displayRating = rated.first.rating;
  a.ratedGames = rated.first.ratedGames;
  b.displayRating = rated.second.rating;
  b.ratedGames = rated.second.ratedGames;

  const reasonRoll = rng();
  const reason = reasonRoll < 0.1 ? WIN_REASONS.resign : reasonRoll < 0.2 ? WIN_REASONS.time : WIN_REASONS.line;
  const moveCount = reason === WIN_REASONS.resign ? uniformInt(rng, 4, 40) : uniformInt(rng, 15, 150);

  const winnerExpected = drawn ? null : aWon ? expectedA : 1 - expectedA;
  const result: PricedResult = {
    variant: variant as PricedResult["variant"],
    size,
    winner: drawn ? null : aWon ? STONES.black : STONES.white,
    drawn,
    reason: drawn ? null : reason,
    score: null,
    moveCount,
    headStartFor: null,
    handicapOn: null,
    winnerExpected,
    earlierToday: 0,
    oneScreen: false,
  };
  const paid = gamePoints(result);
  a.ipTotal += paid.black;
  b.ipTotal += paid.white;

  awardGameXp(a, b, variant, !drawn && aWon, drawn, moveCount);
  awardGameXp(b, a, variant, !drawn && !aWon, drawn, moveCount);
}

/** Everything a finished game pays one side in XP, plus the first-time and milestone tracking that has nothing to do with the allowance. */
function awardGameXp(player: SimPlayer, opponent: SimPlayer, variant: string, won: boolean, drawn: boolean, moveCount: number): void {
  const batch = bookFor(player.index);

  player.xpTotal += batch.award(XP_EVENTS.gameFinished);
  if (won) {
    player.xpTotal += batch.award(XP_EVENTS.gameWon);
    player.xpTotal += batch.award(XP_EVENTS.wonVsPerson);
    const gap = player.displayRating - opponent.displayRating;
    const opponentEstablished = opponent.ratedGames >= 20;
    if (opponentEstablished && gap <= -300) player.xpTotal += batch.award(XP_EVENTS.giantKilled);
    else if (opponentEstablished && gap <= -200) player.xpTotal += batch.award(XP_EVENTS.bigUpsetWin);
    else if (opponentEstablished && gap <= -100) player.xpTotal += batch.award(XP_EVENTS.upsetWin);
  }
  if (moveCount >= XP_LONG_GAME_MOVES) player.xpTotal += batch.award(XP_EVENTS.longGame);

  // Win streaks: exact milestones only, as the real site pays them.
  if (won) {
    player.winStreak += 1;
    const streakAward = winStreakMilestoneFor(player.winStreak);
    if (streakAward !== null) player.xpTotal += batch.awardUncapped(streakAward);
  } else {
    player.winStreak = 0;
  }

  // First game of this variant / this family, and the tour completion awards.
  const isFirstOfVariant = !player.variantsPlayed.has(variant);
  player.variantsPlayed.add(variant);
  if (isFirstOfVariant) {
    player.xpTotal += batch.awardUncapped(XP_EVENTS.firstOfVariant);
    if (!player.everyVariantPaid && player.variantsPlayed.size >= RULE_VARIANT_LIST.length) {
      player.everyVariantPaid = true;
      player.xpTotal += batch.awardUncapped(XP_EVENTS.everyVariantPlayed);
    }
  }
  const familyKey = familyKeyOf(variant as GameKey);
  if (familyKey !== null && !player.familiesPlayed.has(familyKey)) {
    player.familiesPlayed.add(familyKey);
    player.xpTotal += batch.awardUncapped(XP_EVENTS.firstOfFamily);
    if (!player.everyFamilyPaid && player.familiesPlayed.size >= GAME_FAMILIES.length) {
      player.everyFamilyPaid = true;
      player.xpTotal += batch.awardUncapped(XP_EVENTS.everyFamilyPlayed);
    }
  }
  if (won && !player.variantsWon.has(variant)) {
    player.variantsWon.add(variant);
    player.xpTotal += batch.awardUncapped(XP_EVENTS.firstWinAtVariant);
  }

  // Per-variant win/loss/draw milestones, off the real table.
  const counts = player.resultCounts.get(variant) ?? { win: 0, loss: 0, draw: 0 };
  const outcome = drawn ? "draw" : won ? "win" : "loss";
  counts[outcome] += 1;
  player.resultCounts.set(variant, counts);
  const milestone = resultMilestoneFor(outcome, counts[outcome]);
  if (milestone !== null) player.xpTotal += batch.awardUncapped(milestone);
}

/*
 * One persistent daily-allowance book per player, indexed by array position
 * rather than a `Map<number, …>` — grown once as players are first seen, then
 * CLEARED and reused every simulated day rather than replaced. Reusing a
 * thousand small `Map`s 360 times beats allocating 360,000 of them: this
 * dropped one full run from about 800ms to well under it.
 */
const playerBooks: ReturnType<typeof newXpDayBook>[] = [];

/** Resets every player's daily allowance book. Call once at the start of each simulated day. */
export function resetDailyBooks(): void {
  for (const book of playerBooks) book.clear();
}

function bookFor(index: number) {
  while (playerBooks.length <= index) playerBooks.push(newXpDayBook());
  return xpBatch(playerBooks[index]);
}

/** Runs one active day's games, puzzles and social acts for one player. */
export function simulateActiveDay(
  rng: Rng,
  player: SimPlayer,
  role: JourneyRole,
  players: readonly SimPlayer[],
  pools: GamePools,
  dayOfWeek: number,
  weekId: number,
): void {
  const batch = bookFor(player.index);

  if (!player.joinedPaid) {
    player.joinedPaid = true;
    player.xpTotal += batch.awardUncapped(XP_EVENTS.joined);
    /*
     * APPROXIMATE, NOT THE REAL `importedXpPay.ts`: a Returning Veteran's
     * kept record from another site would be priced from real games and
     * years there (`docs/plans/points/README.md`'s neighbour, the imported-XP
     * plan), which this model has no data to reconstruct. A flat, clearly
     * illustrative credit stands in for it, so the role shows what a kept
     * record is *for* — starting well above zero — without claiming to be
     * the real pricing.
     */
    if (role.importedRecordApprox === true) player.xpTotal += 5000;
  }
  if (!player.setupProfileDone) {
    player.setupProfileDone = true;
    player.xpTotal +=
      batch.awardUncapped(XP_EVENTS.nameSet) +
      batch.awardUncapped(XP_EVENTS.countrySet) +
      batch.awardUncapped(XP_EVENTS.bioSet) +
      batch.awardUncapped(XP_EVENTS.wordsSet);
  }

  player.xpTotal += batch.award(XP_EVENTS.dailyVisit);
  player.activeDayStreak += 1;
  const dayMilestone = dayStreakMilestoneFor(player.activeDayStreak);
  if (dayMilestone !== null) player.xpTotal += batch.awardUncapped(dayMilestone);

  const gamesToday = countFromRate(rng, role.gamesPerActiveDay);
  let anyFinishedToday = false;
  for (let g = 0; g < gamesToday; g += 1) {
    if (role.gameMix.length === 0) break;
    const variant = pickFromMix(rng, role.gameMix).variant;
    const opponentIndex = pickOpponent(rng, pools, variant, player.index);
    if (opponentIndex === null) continue;
    const opponent = players[opponentIndex];
    playOneGame(rng, player, opponent, variant, defaultBoardFor(variant));
    anyFinishedToday = true;
  }

  if (anyFinishedToday && isWeekendDay(dayOfWeek) && player.weekendPaidWeek !== weekId) {
    player.weekendPaidWeek = weekId;
    player.xpTotal += batch.awardUncapped(XP_EVENTS.weekendGame);
  }

  const puzzlesToday = countFromRate(rng, role.puzzlesPerActiveDay);
  for (let p = 0; p < puzzlesToday; p += 1) {
    if (role.puzzleMix.length === 0) break;
    const pick = pickFromMix(rng, role.puzzleMix);
    const solved = chance(rng, approxSolveChance(pick.level));
    if (solved) {
      player.ipTotal += approxPuzzleIp(pick.kind, pick.level);
      player.xpTotal += batch.award(XP_EVENTS.puzzleSolved);
    } else if (isWordPuzzle(pick.kind)) {
      player.xpTotal += batch.award(XP_EVENTS.puzzleEnded);
    }
  }

  // Social acts, spread over the month's active days at the role's monthly rate.
  const social = role.social;
  const perDay = (monthly: number) => (role.activeDaysPerMonth > 0 ? monthly / role.activeDaysPerMonth : 0);
  const buddyCount = countFromRate(rng, perDay(social.buddiesPerMonth));
  for (let bd = 0; bd < buddyCount; bd += 1) {
    player.xpTotal += batch.award(XP_EVENTS.buddyAdded);
    if (!player.firstBuddyPaid) {
      player.firstBuddyPaid = true;
      player.xpTotal += batch.awardUncapped(XP_EVENTS.firstBuddy);
    }
  }
  const challengeCount = countFromRate(rng, perDay(social.challengesPerMonth));
  for (let c = 0; c < challengeCount; c += 1) {
    if (c % 2 === 0) player.xpTotal += batch.award(XP_EVENTS.challengeSent);
    else player.xpTotal += batch.award(XP_EVENTS.challengeAnswered);
  }
  const applauseCount = countFromRate(rng, perDay(social.applausePerMonth));
  for (let ap = 0; ap < applauseCount; ap += 1) player.xpTotal += batch.award(XP_EVENTS.applauseGiven);
}
