import { xpLevelFor } from "@/lib/xp/xpCurve";

import { JOURNEY_ROLES } from "./journeyRoles.constants";
import { buildGamePools, buildPopulation } from "./journeyPopulation";
import { median, percentiles, topN } from "./journeyStats";
import { decideActiveToday, resetDailyBooks, simulateActiveDay } from "./journeySimDay";
import type { BoardRow, JourneyRole, JourneySimResult, PlayerJourney, PlayerMonth, RoleSummary, SimPlayer } from "./journeys.types";
import { chance, mulberry32 } from "./prng";

/**
 * TWELVE 30-DAY MONTHS, NOT THE CALENDAR. A year of 360 days rather than 365
 * keeps every month's arithmetic identical (no day-count surprises at
 * month boundaries) and the difference — five days out of a year — changes
 * nothing this projection is trying to show. `dayOfWeek` and `weekId` are
 * both derived from a running day count, so weeks and weekends stay real
 * even though months are a fixed size.
 */
const DAYS_PER_MONTH = 30;
const MONTHS = 12;

/** The default seed the admin page renders with — change it and the whole projection changes with it, deterministically. */
export const DEFAULT_JOURNEY_SEED = 20260925;

function inPlay(player: SimPlayer, month: number): boolean {
  if (player.joinMonth > month) return false;
  if (player.churnedAfterMonth !== null && month > player.churnedAfterMonth) return false;
  return true;
}

/**
 * Runs the whole year for 1000 players and returns everything the admin page
 * and the tests read. Pure and deterministic: the same `seed` always plays
 * out the same population, the same games and the same totals — no
 * `Math.random`, no database, no wall-clock.
 */
export function runJourneySimulation(seed: number = DEFAULT_JOURNEY_SEED): JourneySimResult {
  const rng = mulberry32(seed);
  const players = buildPopulation(rng);
  const pools = buildGamePools(players);
  const roleByKey = new Map<string, JourneyRole>(JOURNEY_ROLES.map((role) => [role.key, role]));
  // Looked up once here rather than by string key inside the day loop, which runs 1000 × 360 times.
  const rolesByIndex = players.map((player) => roleByKey.get(player.roleKey)!);

  const monthsByPlayer: PlayerMonth[][] = players.map(() => []);
  const xpAtMonthStart = new Array(players.length).fill(0);
  const ipAtMonthStart = new Array(players.length).fill(0);
  const wasActiveYesterday = new Array<boolean>(players.length).fill(false);

  let dayCount = 0;
  for (let month = 1; month <= MONTHS; month += 1) {
    for (let day = 0; day < DAYS_PER_MONTH; day += 1) {
      resetDailyBooks();
      const dayOfWeek = dayCount % 7;
      const weekId = Math.floor(dayCount / 7);
      dayCount += 1;

      for (const player of players) {
        if (!inPlay(player, month)) continue;
        const role = rolesByIndex[player.index];
        const active = decideActiveToday(rng, role, wasActiveYesterday[player.index], dayOfWeek);
        if (active) {
          simulateActiveDay(rng, player, role, players, pools, dayOfWeek, weekId);
          wasActiveYesterday[player.index] = true;
        } else {
          player.activeDayStreak = 0;
          wasActiveYesterday[player.index] = false;
        }
      }
    }

    // Month end: snapshot every player, and decide who churns.
    for (const player of players) {
      const role = rolesByIndex[player.index];
      if (player.joinMonth > month) {
        monthsByPlayer[player.index].push({ month, xpGained: 0, ipGained: 0, xpTotal: 0, ipTotal: 0, level: 1 });
        continue;
      }
      if (player.churnedAfterMonth !== null && month > player.churnedAfterMonth) {
        monthsByPlayer[player.index].push({
          month,
          xpGained: 0,
          ipGained: 0,
          xpTotal: player.xpTotal,
          ipTotal: player.ipTotal,
          level: xpLevelFor(player.xpTotal),
        });
        continue;
      }
      const xpGained = player.xpTotal - xpAtMonthStart[player.index];
      const ipGained = player.ipTotal - ipAtMonthStart[player.index];
      monthsByPlayer[player.index].push({
        month,
        xpGained,
        ipGained,
        xpTotal: player.xpTotal,
        ipTotal: player.ipTotal,
        level: xpLevelFor(player.xpTotal),
      });
      xpAtMonthStart[player.index] = player.xpTotal;
      ipAtMonthStart[player.index] = player.ipTotal;
      if (player.churnedAfterMonth === null && chance(rng, role.churnPerMonth)) player.churnedAfterMonth = month;
    }
  }

  const journeys: PlayerJourney[] = players.map((player) => ({
    index: player.index,
    roleKey: player.roleKey,
    months: monthsByPlayer[player.index],
    xpAllTime: player.xpTotal,
    ipAllTime: player.ipTotal,
    levelAtEnd: xpLevelFor(player.xpTotal),
  }));

  return {
    seed,
    players: journeys,
    roles: summariseRoles(journeys),
    ipTop10: rankBoard(journeys, (j) => j.ipAllTime),
    xpTop10: rankBoard(journeys, (j) => j.xpAllTime),
    ipTop10ThisMonth: rankBoard(journeys, (j) => j.months[MONTHS - 1]?.ipGained ?? 0),
    xpTop10ThisMonth: rankBoard(journeys, (j) => j.months[MONTHS - 1]?.xpGained ?? 0),
  };
}

function rankBoard(journeys: readonly PlayerJourney[], value: (j: PlayerJourney) => number): BoardRow[] {
  const rows = journeys.map((j) => ({ index: j.index, roleKey: j.roleKey, value: value(j) }));
  return topN(rows, 10).map((row) => ({ rank: row.rank, index: row.index, roleKey: row.roleKey, value: row.value }));
}

const SNAPSHOT_MONTHS = [1, 3, 6, 12] as const;

function summariseRoles(journeys: readonly PlayerJourney[]): RoleSummary[] {
  const byRole = new Map<string, PlayerJourney[]>();
  for (const j of journeys) {
    const list = byRole.get(j.roleKey) ?? [];
    list.push(j);
    byRole.set(j.roleKey, list);
  }

  return JOURNEY_ROLES.map((role) => {
    const members = byRole.get(role.key) ?? [];
    const atMonth = Object.fromEntries(
      SNAPSHOT_MONTHS.map((m) => [
        m,
        {
          xp: percentiles(members.map((j) => j.months[m - 1]?.xpTotal ?? 0)),
          ip: percentiles(members.map((j) => j.months[m - 1]?.ipTotal ?? 0)),
        },
      ]),
    ) as RoleSummary["atMonth"];

    const ratios = members.map((j) => (j.ipAllTime > 0 ? j.xpAllTime / j.ipAllTime : j.xpAllTime > 0 ? Number.POSITIVE_INFINITY : 0));
    const finiteRatios = ratios.filter((r) => Number.isFinite(r));

    return {
      role,
      players: members.length,
      atMonth,
      levelAt12: percentiles(members.map((j) => j.levelAtEnd)),
      medianXpToIpRatio: finiteRatios.length > 0 ? median(finiteRatios) : 0,
      medianMonthlyIpSeries: SNAPSHOT_MONTHS_ALL.map((m) => median(members.map((j) => j.months[m - 1]?.ipTotal ?? 0))),
      medianMonthlyXpSeries: SNAPSHOT_MONTHS_ALL.map((m) => median(members.map((j) => j.months[m - 1]?.xpTotal ?? 0))),
    };
  });
}

const SNAPSHOT_MONTHS_ALL = Array.from({ length: MONTHS }, (_, i) => i + 1);
