import { RATING_START } from "@/lib/rating/elo";

import { JOURNEY_ROLES } from "./journeyRoles.constants";
import type { SimPlayer } from "./journeys.types";
import { normal, type Rng } from "./prng";

/** Builds the 1000 simulated players from `JOURNEY_ROLES`, each with their own drawn skill. */
export function buildPopulation(rng: Rng): SimPlayer[] {
  const players: SimPlayer[] = [];
  let index = 0;
  for (const role of JOURNEY_ROLES) {
    for (let i = 0; i < role.share; i += 1) {
      players.push({
        index,
        roleKey: role.key,
        trueSkill: normal(rng, role.skill.mean, role.skill.spread),
        displayRating: RATING_START,
        ratedGames: 0,
        joinMonth: role.joinMonth ?? 1,
        churnedAfterMonth: null,
        xpTotal: 0,
        ipTotal: 0,
        activeDayStreak: 0,
        winStreak: 0,
        weekendPaidWeek: null,
        setupProfileDone: false,
        joinedPaid: false,
        firstBuddyPaid: false,
        variantsPlayed: new Set(),
        variantsWon: new Set(),
        familiesPlayed: new Set(),
        everyFamilyPaid: false,
        everyVariantPaid: false,
        resultCounts: new Map(),
      });
      index += 1;
    }
  }
  return players;
}

/**
 * One matchmaking pool per game variant, built once and reused for every
 * game of the year: the players whose role plays it, as a cumulative-weight
 * table so `pickOpponent` can choose one with a binary search rather than
 * rebuilding and scanning an array on every single game. With up to a few
 * hundred thousand games simulated across 1000 players and 12 months,
 * O(log n) per pick instead of O(n) is the difference between the page
 * rendering in tens of milliseconds and taking whole seconds.
 */
export type GamePool = { indices: readonly number[]; cumulative: readonly number[]; total: number };

export function buildGamePools(players: readonly SimPlayer[]): Map<string, GamePool> {
  const roleByKey = new Map(JOURNEY_ROLES.map((role) => [role.key, role]));
  const byVariant = new Map<string, { index: number; weight: number }[]>();
  for (const player of players) {
    const role = roleByKey.get(player.roleKey);
    if (role === undefined) continue;
    for (const entry of role.gameMix) {
      const list = byVariant.get(entry.variant) ?? [];
      list.push({ index: player.index, weight: entry.weight });
      byVariant.set(entry.variant, list);
    }
  }
  const pools = new Map<string, GamePool>();
  for (const [variant, entries] of byVariant) {
    const indices = entries.map((e) => e.index);
    let running = 0;
    const cumulative = entries.map((e) => {
      running += e.weight;
      return running;
    });
    pools.set(variant, { indices, cumulative, total: running });
  }
  return pools;
}
