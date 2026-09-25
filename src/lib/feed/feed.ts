import { STONES } from "@/lib/gomoku/gomoku.constants";
import { xpDayKey } from "@/lib/xp/xpDay";
import { xpLevelFor } from "@/lib/xp/xpCurve";

import { FEED_KINDS, FEED_OUTCOMES, type FeedOutcome } from "./feed.constants";
import type {
  FeedDay,
  FeedEntry,
  FeedGameRow,
  FeedPerson,
  FeedSeat,
  FeedSolve,
  FeedXpDay,
} from "./feed.types";

/**
 * THE FEED'S RULES, PURE: which rows become lines, what each line says it is,
 * and in what order. `feedRead.ts` reads the rows and calls in; nothing here
 * asks the database, so every rule is tested without one.
 */

/** Whether a stored game is still being played. */
const ACTIVE = "active";
/** The result a game called off (or never begun) is filed under. */
const ABANDONED = "abandoned";
const DRAW = "draw";

/** A seat's person, with the name it was played under. */
function personOf(seat: FeedSeat): FeedPerson {
  return { memberId: seat.memberId, name: seat.name };
}

/** Whether nobody is in a seat: no member and no name. */
function empty(seat: FeedSeat): boolean {
  return seat.memberId === null && seat.name.trim() === "";
}

/** How a finished game went for one colour. */
export function outcomeFor(result: string, stone: string): FeedOutcome {
  if (result === DRAW) return FEED_OUTCOMES.drawn;
  return result === stone ? FEED_OUTCOMES.won : FEED_OUTCOMES.lost;
}

/**
 * WHO A GAME'S LINE IS ABOUT, or null when it is nobody the reader follows.
 *
 * The reader first: their own game is told from their side. Otherwise a
 * followed member in a seat — the winner, where both are followed, so a game
 * between two buddies reads "Aki beat Ben" once rather than twice.
 *
 * A seat whose member hid a finished game from their own public list is not
 * followed into it: hiding is theirs to choose, and the feed is a public list
 * of theirs as far as the reader is concerned. The reader's own hidden games
 * are still in the reader's own feed, which nobody else reads.
 */
function subjectOf(row: FeedGameRow, followed: ReadonlySet<string>, readerId: string | null): (typeof STONES)[keyof typeof STONES] | null {
  const seats = [
    { stone: STONES.black, seat: row.black },
    { stone: STONES.white, seat: row.white },
  ];
  if (readerId !== null) {
    const own = seats.find((entry) => entry.seat.memberId === readerId);
    if (own !== undefined) return own.stone;
  }
  const finished = row.status !== ACTIVE;
  const candidates = seats.filter(
    (entry) => entry.seat.memberId !== null && followed.has(entry.seat.memberId) && !(finished && entry.seat.hidden),
  );
  if (candidates.length === 0) return null;
  const winner = candidates.find((entry) => entry.stone === row.result);
  return (winner ?? candidates[0]).stone;
}

/**
 * ONE GAME, AS ONE LINE, or null when it has no line.
 *
 * - Finished and decided or drawn: how it went for its subject, dated when it
 *   ended (its last move, or when it began if it never had one).
 * - Still being played: that it began, dated when it began. A game is never
 *   both: once it ends, its "began" line becomes its result.
 * - Abandoned — called off, or an offer nobody took up: no line. Nobody played.
 * - Both seats one member (a hot seat at one screen): no line. It is practice,
 *   not a game against anybody.
 */
export function gameEntry(row: FeedGameRow, followed: ReadonlySet<string>, readerId: string | null): FeedEntry | null {
  const finished = row.status !== ACTIVE;
  if (finished && row.result === ABANDONED) return null;
  if (row.black.memberId !== null && row.black.memberId === row.white.memberId) return null;
  const stone = subjectOf(row, followed, readerId);
  if (stone === null) return null;
  const mine = stone === STONES.black ? row.black : row.white;
  const theirs = stone === STONES.black ? row.white : row.black;
  const who = personOf(mine);
  const you = readerId !== null && mine.memberId === readerId;
  if (!finished) {
    return {
      kind: FEED_KINDS.started,
      id: `game:${row.id}`,
      at: row.playedAt.toISOString(),
      who,
      you,
      gameId: row.id,
      variant: row.variant,
      other: empty(theirs) ? null : personOf(theirs),
    };
  }
  return {
    kind: FEED_KINDS.game,
    id: `game:${row.id}`,
    at: (row.lastMoveAt ?? row.playedAt).toISOString(),
    who,
    you,
    gameId: row.id,
    variant: row.variant,
    other: personOf(theirs),
    outcome: outcomeFor(row.result, stone),
  };
}

/** A member the lines name, or a name-only stand-in when the read could not find them. */
function personFor(memberId: string, people: ReadonlyMap<string, FeedPerson>): FeedPerson {
  return people.get(memberId) ?? { memberId, name: "" };
}

/**
 * EXPERIENCE, ONE LINE PER MEMBER PER DAY, and a line for each level reached.
 *
 * Earned here and credited from elsewhere are two lines, because they are two
 * different facts: one is what somebody did this week, the other is the site
 * giving credit for years on another site.
 *
 * THE LEVEL IS WALKED BACK FROM TODAY'S TOTAL. `totals` is each member's
 * total now (every award, earned or credited, as the badge counts it); taking
 * each day's points off it, newest day first, gives the total at the end of
 * every earlier day, and a day whose end is on a higher level than its start
 * reached that level. Every award since the oldest day read is in `days`, so
 * the walk is exact. If it ever goes below nought the ledger and the total
 * disagree, and a rule that cannot measure must not fire: the walk stops and
 * says nothing more about that member's levels.
 */
export function xpEntries(
  days: readonly FeedXpDay[],
  totals: ReadonlyMap<string, number>,
  people: ReadonlyMap<string, FeedPerson>,
  readerId: string | null,
): FeedEntry[] {
  const out: FeedEntry[] = [];
  const byMember = new Map<string, Map<string, { points: number; lastAt: Date }>>();
  for (const day of days) {
    if (day.points > 0) {
      out.push({
        kind: day.imported ? FEED_KINDS.credited : FEED_KINDS.xp,
        id: `${day.imported ? FEED_KINDS.credited : FEED_KINDS.xp}:${day.memberId}:${day.dayKey}`,
        at: day.lastAt.toISOString(),
        who: personFor(day.memberId, people),
        you: day.memberId === readerId,
        points: day.points,
      });
    }
    const member = byMember.get(day.memberId) ?? new Map<string, { points: number; lastAt: Date }>();
    const had = member.get(day.dayKey) ?? { points: 0, lastAt: day.lastAt };
    member.set(day.dayKey, {
      points: had.points + day.points,
      lastAt: had.lastAt > day.lastAt ? had.lastAt : day.lastAt,
    });
    byMember.set(day.memberId, member);
  }

  for (const [memberId, member] of byMember) {
    const total = totals.get(memberId);
    if (total === undefined) continue;
    let running: number = total;
    const newestFirst = [...member.entries()].sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0));
    for (const [dayKey, day] of newestFirst) {
      const before: number = running - day.points;
      if (before < 0) break;
      const reached = xpLevelFor(running);
      if (reached > xpLevelFor(before)) {
        out.push({
          kind: FEED_KINDS.level,
          id: `${FEED_KINDS.level}:${memberId}:${dayKey}`,
          at: day.lastAt.toISOString(),
          who: personFor(memberId, people),
          you: memberId === readerId,
          level: reached,
        });
      }
      running = before;
    }
  }
  return out;
}

/**
 * PUZZLES, ONE LINE PER MEMBER PER KIND PER DAY, in the reader's zone: "solved
 * three Number Place puzzles" rather than three lines of one each. Dated at the
 * last one finished.
 */
export function puzzleEntries(
  solves: readonly FeedSolve[],
  zone: string | null,
  people: ReadonlyMap<string, FeedPerson>,
  readerId: string | null,
): FeedEntry[] {
  const groups = new Map<string, { memberId: string; kind: string; day: string; count: number; lastAt: Date }>();
  for (const solve of solves) {
    const day = xpDayKey(solve.finishedAt, zone);
    const key = `${solve.memberId}:${solve.kind}:${day}`;
    const had = groups.get(key);
    if (had === undefined) {
      groups.set(key, { memberId: solve.memberId, kind: solve.kind, day, count: 1, lastAt: solve.finishedAt });
    } else {
      had.count += 1;
      if (solve.finishedAt > had.lastAt) had.lastAt = solve.finishedAt;
    }
  }
  return [...groups.values()].map((group) => ({
    kind: FEED_KINDS.puzzles,
    id: `${FEED_KINDS.puzzles}:${group.memberId}:${group.kind}:${group.day}`,
    at: group.lastAt.toISOString(),
    who: personFor(group.memberId, people),
    you: group.memberId === readerId,
    variant: group.kind,
    count: group.count,
  }));
}

/**
 * Newest first, at most `max` lines. Ties — a level reached by the same award
 * that ended a day — keep the order the kinds are declared in, then the id, so
 * two reads of the same rows draw the same page.
 */
export function orderFeed(entries: readonly FeedEntry[], max: number): FeedEntry[] {
  const rank = Object.values(FEED_KINDS);
  return [...entries]
    .sort((a, b) => {
      if (a.at !== b.at) return a.at < b.at ? 1 : -1;
      const kinds = rank.indexOf(a.kind) - rank.indexOf(b.kind);
      if (kinds !== 0) return kinds;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    })
    .slice(0, Math.max(0, max));
}

/** Lines already in order, gathered under the reader's days. */
export function feedDays(entries: readonly FeedEntry[], zone: string | null): FeedDay[] {
  const days: FeedDay[] = [];
  for (const entry of entries) {
    const day = xpDayKey(new Date(entry.at), zone);
    const last = days.at(-1);
    if (last !== undefined && last.day === day) last.entries.push(entry);
    else days.push({ day, entries: [entry] });
  }
  return days;
}
