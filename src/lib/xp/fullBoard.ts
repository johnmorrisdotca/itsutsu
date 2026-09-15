import {
  XP_EVENTS,
  XP_FULL_BOARD_GAMES,
  XP_FULL_BOARD_RUN_MAX,
  XP_KEPT_UP_HOURS,
  fullHouseComboFor,
} from "./xp.constants";
import type { XpAward } from "./xp.types";
import { dayZoneFor, type DayKey } from "./xpDay";
import { previousDayKey } from "./xpHabit";
import type { BoardDay, BoardGame, BoardStone } from "./fullBoard.types";

/**
 * A FULL BOARD, KEPT MOVING — DECIDED WITHOUT A DATABASE OR A CLOCK.
 *
 * John: "awards for playing 20 games at a time first time. award for clearing
 * out your 20 games in 1 day (since they're moving games along) having 20 games
 * for 1 week straight and making moves every day 15 day award. 30 day award 60
 * 120 250 500 1000 if a user is clearing out all possible games in a day when
 * maxxed out they deserve credit... of course, they could be waiting for
 * others, so gotta figure out a way to be fair, and also not a loophole."
 *
 * Every function here takes the games, the member, the day and the zone, so
 * each rule is checked against a table of cases rather than against a clock.
 * `fullBoardServer.ts` reads the rows and pays.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE THREE FACTS, AND WHY EACH IS FAIR
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **A FULL BOARD** is twenty games at one moment of the day in which an
 * opponent — not yourself, and not an empty seat — has made at least one move.
 * A game counts from that opponent's first move until it ends. So a pile of
 * posted seats nobody took is not a full board, nor is a hot-seat game or one
 * against yourself; a computer opponent counts (John: "probably full"). "At any
 * moment of the day" means a game finishing normally does not break a day, as
 * long as the board was full at some point in it.
 *
 * **KEPT UP** is judged on the member's own turns only, which is the fairness
 * John asked for: at the day's end, no game had been waiting on this member's
 * move for more than twenty-four hours. A slow opponent can never cost anybody
 * anything, because a game waiting on THEM is not looked at. And resigning or
 * abandoning a game is not a way to clear one: a game that ended during the day
 * without a move, after sitting on the member's turn for more than a day, breaks
 * the day exactly as if it were still waiting.
 *
 * **MOVED** is at least one move by the member that day in a game that counts,
 * so a day nobody played is never a day kept.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHOSE TURN IT WAS, FROM WHAT IS STORED
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The side on turn at an instant is the side that made the NEXT move — exact,
 * including a game where one side plays two stones or a turn is forfeited,
 * because a forfeit is written as a move. Where no move follows, a game still
 * being played answers with its stored turn (`toPlayNow`), and a game that
 * ended without a move answers with the side that did not make the last move.
 * That last is the one approximation here, named rather than hidden: in a game
 * whose turns are more than one stone, a game abandoned between a side's two
 * stones reads as the other side's turn. The wait began at the last move before
 * the instant, or when both seats were filled if there was none.
 */

const HOUR = 3_600_000;
const SAME_INSTANT_MS = 1_000;

/** The member's colour in a game, or null when they are not seated in it — or seated in both chairs. */
export function memberStone(game: BoardGame, memberId: string): BoardStone | null {
  const black = game.blackMemberId === memberId;
  const white = game.whiteMemberId === memberId;
  if (black === white) return null;
  return black ? "black" : "white";
}

/** Whether this game has a real opponent for the member: seated, not at one screen, not themselves, not an empty seat. */
export function hasOpponent(game: BoardGame, memberId: string): boolean {
  const mine = memberStone(game, memberId);
  if (mine === null || game.hotSeat) return false;
  const theirs = mine === "black" ? game.whiteMemberId : game.blackMemberId;
  return theirs !== null && theirs !== memberId;
}

const other = (stone: BoardStone): BoardStone => (stone === "black" ? "white" : "black");

/** When this game starts counting toward a full board: the opponent's first move. Null if it never does. */
export function countsFrom(game: BoardGame, memberId: string): Date | null {
  if (!hasOpponent(game, memberId)) return null;
  const theirs = other(memberStone(game, memberId)!);
  return game.moves.find((move) => move.stone === theirs)?.at ?? null;
}

/** Whether the game was being played at this instant. */
function runningAt(game: BoardGame, at: Date): boolean {
  return game.playedAt.getTime() <= at.getTime() && (game.finishedAt === null || game.finishedAt.getTime() > at.getTime());
}

/** Whether a finished game ended without a move — a resignation, a timeout, a cancellation. */
export function endedWithoutMove(game: BoardGame): boolean {
  if (game.finishedAt === null) return false;
  const last = game.moves.at(-1);
  return last === undefined || game.finishedAt.getTime() - last.at.getTime() > SAME_INSTANT_MS;
}

/** The side on turn at an instant, or null where it cannot be told. See the header. */
export function turnAt(game: BoardGame, at: Date): BoardStone | null {
  const next = game.moves.find((move) => move.at.getTime() > at.getTime());
  if (next !== undefined) return next.stone === "black" || next.stone === "white" ? next.stone : null;
  if (game.finishedAt === null) return game.toPlayNow;
  const last = game.moves.at(-1);
  if (last === undefined || (last.stone !== "black" && last.stone !== "white")) return null;
  return other(last.stone);
}

/** When the side on turn at this instant started waiting: the last move before it, or both seats filled. */
export function waitingSince(game: BoardGame, at: Date): Date {
  const before = game.moves.filter((move) => move.at.getTime() <= at.getTime()).at(-1);
  if (before !== undefined) return before.at;
  const filled = [game.playedAt, game.blackClaimedAt, game.whiteClaimedAt]
    .filter((one): one is Date => one !== null)
    .reduce((latest, one) => (one.getTime() > latest.getTime() ? one : latest));
  return filled;
}

/** Whether this game had been waiting on the member's move for more than a day at this instant. */
export function overdueAt(game: BoardGame, memberId: string, at: Date): boolean {
  if (!hasOpponent(game, memberId)) return false;
  if (turnAt(game, at) !== memberStone(game, memberId)) return false;
  return at.getTime() - waitingSince(game, at).getTime() > XP_KEPT_UP_HOURS * HOUR;
}

/** A calendar day's two ends, in the member's own zone — twenty-three or twenty-five hours apart across a clock change. */
export function dayBounds(day: DayKey, timeZone?: string | null): { start: Date; end: Date } {
  return { start: dayStart(day, timeZone), end: dayStart(nextDayKey(day), timeZone) };
}

/** The day after this one. */
export function nextDayKey(day: DayKey): DayKey {
  const at = new Date(`${day}T00:00:00Z`);
  at.setUTCDate(at.getUTCDate() + 1);
  return at.toISOString().slice(0, 10);
}

/** How far a zone's wall clock is ahead of UTC at an instant, in milliseconds. */
function zoneOffsetMs(at: Date, zone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const part = (type: string) => Number(parts.find((one) => one.type === type)?.value);
  const wall = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"), part("second"));
  return wall - Math.floor(at.getTime() / 1000) * 1000;
}

/** The instant a day begins in a zone. Asked twice, so a clock change on the day itself lands on the right side. */
function dayStart(day: DayKey, timeZone?: string | null): Date {
  const zone = dayZoneFor(timeZone).zone;
  const midnight = Date.parse(`${day}T00:00:00Z`);
  const first = midnight - zoneOffsetMs(new Date(midnight), zone);
  return new Date(midnight - zoneOffsetMs(new Date(first), zone));
}

/**
 * What one day came to for this member.
 *
 * The peak is a sweep over the counting games' spans across the day — one
 * ending and another beginning at the same instant are not both counted — and
 * kept-up is asked at the day's end, plus the resignation guard over the games
 * that ended during it.
 */
export function boardDay(games: readonly BoardGame[], memberId: string, day: DayKey, timeZone?: string | null): BoardDay {
  const { start, end } = dayBounds(day, timeZone);
  const spans = games.flatMap((game) => {
    const from = countsFrom(game, memberId);
    if (from === null) return [];
    const until = game.finishedAt;
    if (from.getTime() >= end.getTime() || (until !== null && until.getTime() <= start.getTime())) return [];
    return [{ from: from.getTime(), until: until === null ? Number.POSITIVE_INFINITY : until.getTime() }];
  });

  let open = spans.filter((span) => span.from <= start.getTime() && span.until > start.getTime()).length;
  let peak = open;
  const events = spans.flatMap((span) => [
    ...(span.from > start.getTime() ? [{ at: span.from, delta: 1 }] : []),
    ...(span.until < end.getTime() && span.until > start.getTime() ? [{ at: span.until, delta: -1 }] : []),
  ]);
  events.sort((one, two) => one.at - two.at || one.delta - two.delta);
  for (const event of events) {
    open += event.delta;
    peak = Math.max(peak, open);
  }

  const overdue = games
    .filter((game) => {
      if (!hasOpponent(game, memberId)) return false;
      if (runningAt(game, end)) return overdueAt(game, memberId, end);
      /* The guard: a game ended during the day without a move, having sat on this member's turn for more than a day. */
      const ended = game.finishedAt;
      if (ended === null || !endedWithoutMove(game)) return false;
      if (ended.getTime() < start.getTime() || ended.getTime() >= end.getTime()) return false;
      return overdueAt(game, memberId, new Date(ended.getTime() - 1));
    })
    .map((game) => game.id);

  const moved = games.some((game) => {
    if (!hasOpponent(game, memberId)) return false;
    const mine = memberStone(game, memberId);
    return game.moves.some((move) => move.stone === mine && move.at.getTime() >= start.getTime() && move.at.getTime() < end.getTime());
  });

  return { day, peak, full: peak >= XP_FULL_BOARD_GAMES, keptUp: overdue.length === 0, moved, overdue };
}

/**
 * The days a member's first action of a new day should judge: from the day of
 * their last action up to yesterday, reaching back at most `lookback` days.
 * Nothing when the last action was today, and nothing for a member with none.
 */
export function daysToJudge(lastActionDay: DayKey | null, today: DayKey, lookback: number): DayKey[] {
  if (lastActionDay === null || lastActionDay >= today) return [];
  let earliest = today;
  for (let step = 0; step < lookback; step += 1) earliest = previousDayKey(earliest);
  const days: DayKey[] = [];
  for (let day = lastActionDay < earliest ? earliest : lastActionDay; day < today; day = nextDayKey(day)) days.push(day);
  return days;
}

/** The length of the run of consecutive days ending on `day`, among `days`, up to `max`. */
export function runEndingAt(days: ReadonlySet<DayKey>, day: DayKey, max = XP_FULL_BOARD_RUN_MAX): number {
  let run = 0;
  for (let at = day; days.has(at) && run < max; at = previousDayKey(at)) run += 1;
  return run;
}

/**
 * What the judged days pay, oldest first.
 *
 * - **Full House**, once ever, on the first full board.
 * - **Clean Sweep**, every day at a full board that was kept up with moves made,
 *   keyed on that day; and **First Clean Sweep** once, on top of the first.
 * - **A Full House combo** at exactly 7, 15, 30, 60, 120, 250, 500 and 1,000
 *   such days in a row, keyed on the day the run reached it.
 *
 * `heldSweepDays` is every day the ledger already holds a Clean Sweep for — the
 * calendar a run is counted on, the way `dailyVisit` rows are the calendar of a
 * day streak — so a re-judged day asks for rows the index already holds, and a
 * run that was broken by a day away is never paid: that day has no Clean Sweep.
 */
export function fullBoardAwards(days: readonly BoardDay[], heldSweepDays: readonly DayKey[]): XpAward[] {
  const awards: XpAward[] = [];
  const swept = new Set(heldSweepDays);
  let housed = false;
  let firstSweep = false;
  for (const judged of days) {
    if (!judged.full) continue;
    if (!housed) {
      awards.push({ type: XP_EVENTS.fullHouse });
      housed = true;
    }
    if (!judged.keptUp || !judged.moved) continue;
    awards.push({ type: XP_EVENTS.cleanSweep, subject: judged.day });
    if (!firstSweep) {
      awards.push({ type: XP_EVENTS.cleanSweepFirst });
      firstSweep = true;
    }
    swept.add(judged.day);
    const combo = fullHouseComboFor(runEndingAt(swept, judged.day));
    if (combo !== null) awards.push({ type: combo, subject: judged.day });
  }
  return awards;
}
