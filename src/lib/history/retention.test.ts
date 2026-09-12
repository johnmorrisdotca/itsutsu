import { describe, expect, it } from "vitest";

import {
  KEEP_FINISHED_DAYS,
  KEEP_FINISHED_DEFAULT,
  KEEP_FINISHED_DISPLAY,
  isKeepFinishedDays,
  myListWindow,
  staysInMyList,
} from "./retention";

/**
 * How long a finished game stays in a member's own list.
 *
 * The thing to be careful about here is what it does *not* do. It hides a
 * finished game from one list; the record keeps everything, the ratings are
 * untouched, and every game is still at its own address. A test that let
 * this quietly become "delete old games" would be the expensive kind of
 * mistake, so the default is checked as hard as the behaviour.
 */
const NOW = new Date("2026-09-09T12:00:00.000Z");

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString();
}

describe("keeping a finished game in your own list", () => {
  it("keeps everything until somebody asks otherwise", () => {
    expect(KEEP_FINISHED_DEFAULT).toBe(0);
    expect(staysInMyList(daysAgo(4000), KEEP_FINISHED_DEFAULT, NOW)).toBe(true);
  });

  it("keeps a game inside the window", () => {
    expect(staysInMyList(daysAgo(1), 14, NOW)).toBe(true);
    expect(staysInMyList(daysAgo(13), 14, NOW)).toBe(true);
  });

  it("lets go of one past it", () => {
    expect(staysInMyList(daysAgo(15), 14, NOW)).toBe(false);
    expect(staysInMyList(daysAgo(400), 90, NOW)).toBe(false);
  });

  it("keeps a game on the very day the window ends", () => {
    // A fortnight means a fortnight, not thirteen days: the boundary belongs
    // to the player, since they are the one who chose the number.
    expect(staysInMyList(daysAgo(14), 14, NOW)).toBe(true);
  });

  it("keeps a game finished in the future rather than hiding it", () => {
    // Clocks disagree, and a row a second ahead of this server must not
    // vanish from somebody's list because of it.
    expect(staysInMyList(daysAgo(-1), 7, NOW)).toBe(true);
  });

  it("keeps everything when the stored number makes no sense", () => {
    // A hand-edited row, or a column read back as something unexpected. The
    // safe answer is always to show the game.
    expect(staysInMyList(daysAgo(999), Number.NaN, NOW)).toBe(true);
    expect(staysInMyList(daysAgo(999), -5, NOW)).toBe(true);
    expect(staysInMyList("not a date", 7, NOW)).toBe(true);
  });

  it("offers only windows it can name", () => {
    for (const days of KEEP_FINISHED_DAYS) {
      expect(KEEP_FINISHED_DISPLAY[days], `${days} has no words`).toBeDefined();
      expect(KEEP_FINISHED_DISPLAY[days].label.length).toBeGreaterThan(2);
      expect(KEEP_FINISHED_DISPLAY[days].kanji.length).toBeGreaterThan(0);
    }
  });

  it("refuses a window it never offered", () => {
    for (const days of KEEP_FINISHED_DAYS) expect(isKeepFinishedDays(days)).toBe(true);
    for (const days of [1, 13, 365, -7, 0.5]) expect(isKeepFinishedDays(days)).toBe(false);
  });

  it("offers keeping everything, so the setting can always be undone", () => {
    expect((KEEP_FINISHED_DAYS as readonly number[])).toContain(0);
  });
});

/**
 * ───────────────────────────────────────────────────────────────────────────
 * THE SAME WINDOW, TWICE: THE `where` AND THE CHECK HAVE TO AGREE
 * ───────────────────────────────────────────────────────────────────────────
 *
 * `myListWindow` exists so the rows past the window are never READ, and
 * `staysInMyList` goes on being the check that decides what is SHOWN. Two
 * expressions of one rule is exactly the shape that drifts, and the drift is
 * silent in the dangerous direction: a `where` that is a shade too narrow
 * makes a game the check would have kept disappear from somebody's queue,
 * with nothing failing and nothing to see.
 *
 * So the property is stated rather than eyeballed. The rows below are every
 * combination of the two columns the window is made of, and for a finished
 * game the query's answer must be the CHECK's answer — not a superset of it,
 * the same set — because `since` is `lastMoveAt ?? playedAt` and both halves
 * of that are columns.
 *
 * THE INTERPRETER IS DELIBERATELY NARROW AND THROWS AT ANYTHING ELSE. A fake
 * that shrugged at a shape it did not know would answer "no match" and turn
 * this whole file green over a window nobody was running — the false pass
 * AGENTS.md warns is most convincing while you are proving a test works. It
 * knows `null`, a date, `gte`, `not`, `OR` and `AND`, and it refuses the rest
 * by name.
 *
 * ONE COMBINATION IS NOT HERE BECAUSE IT CANNOT EXIST: both columns null.
 * `playedAt` is NOT NULL with a default in the schema, and `GameSummary`
 * types `playedAt` as a plain string, so neither side of this rule can be
 * handed a row with no date at all. Enumerating it would be asserting
 * something about a row the database cannot hold.
 */
type WindowRow = {
  status: string;
  offeredAt: Date | null;
  declinedAt: Date | null;
  withdrawnAt: Date | null;
  lastMoveAt: Date | null;
  playedAt: Date | null;
};

const WINDOW_FIELDS = [
  "status",
  "offeredAt",
  "declinedAt",
  "withdrawnAt",
  "lastMoveAt",
  "playedAt",
] as const;

/** One comparison, in the few shapes `myListWindow` is allowed to use. */
function compares(held: unknown, test: unknown): boolean {
  if (test === null) return held === null;
  if (test instanceof Date) return held instanceof Date && held.getTime() === test.getTime();
  if (typeof test === "object") {
    const ops = test as Record<string, unknown>;
    if ("not" in ops) return !compares(held, ops.not);
    if ("gte" in ops) {
      const bound = ops.gte;
      if (!(bound instanceof Date)) throw new Error("gte was handed something that is not a date");
      return held instanceof Date && held.getTime() >= bound.getTime();
    }
    throw new Error(`the window used an operator this test cannot read: ${JSON.stringify(test)}`);
  }
  return held === test;
}

/** Whether Postgres would hand this row back for that `where`. */
function matches(row: WindowRow, where: Record<string, unknown>): boolean {
  const held = row as unknown as Record<string, unknown>;
  for (const [key, test] of Object.entries(where)) {
    const clauses = test as Record<string, unknown>[];
    if (key === "OR") {
      if (!clauses.some((one) => matches(row, one))) return false;
    } else if (key === "AND") {
      if (!clauses.every((one) => matches(row, one))) return false;
    } else if ((WINDOW_FIELDS as readonly string[]).includes(key)) {
      if (!compares(held[key], test)) return false;
    } else {
      throw new Error(`the window asked about "${key}", which this test does not model`);
    }
  }
  return true;
}

/** Whether the query would read this row, for a member keeping games `keepDays`. */
function read(row: WindowRow, keepDays: number): boolean {
  const where = myListWindow(keepDays, NOW);
  // No bound at all is "read everything", which is what keeping for ever means.
  if (where === null) return true;
  return matches(row, where as unknown as Record<string, unknown>);
}

/** An ordinary finished game, with the two date columns under test. */
function filed(lastMoveAt: Date | null, playedAt: Date | null): WindowRow {
  return {
    status: "finished",
    offeredAt: null,
    declinedAt: null,
    withdrawnAt: null,
    lastMoveAt,
    playedAt,
  };
}

/** What `fetchMyGames` hands the check: the row's last move, else when it was played. */
function since(row: WindowRow): string {
  const when = row.lastMoveAt ?? row.playedAt;
  if (when === null) throw new Error("a row with no date at all: see the note above");
  return when.toISOString();
}

const WINDOW = 14;
const WHENS: Record<string, Date | null> = {
  "no last move": null,
  "a month ago": new Date(NOW.getTime() - 30 * 86_400_000),
  "yesterday": new Date(NOW.getTime() - 86_400_000),
};

describe("the window as a query, against the window as a check", () => {
  for (const [lastWord, lastMoveAt] of Object.entries(WHENS)) {
    for (const [playedWord, playedAt] of Object.entries(WHENS)) {
      if (playedAt === null) continue; // `playedAt` is NOT NULL: see the note above.
      it(`reads a filed game exactly when the list keeps it — ${lastWord}, played ${playedWord}`, () => {
        const row = filed(lastMoveAt, playedAt);
        expect(read(row, WINDOW)).toBe(staysInMyList(since(row), WINDOW, NOW));
      });
    }
  }

  it("agrees on the very day the window ends, where an off-by-one would live", () => {
    const onIt = filed(new Date(NOW.getTime() - WINDOW * 86_400_000), new Date(NOW.getTime()));
    expect(staysInMyList(since(onIt), WINDOW, NOW)).toBe(true);
    expect(read(onIt, WINDOW)).toBe(true);

    const justPast = filed(new Date(NOW.getTime() - WINDOW * 86_400_000 - 1), new Date(NOW.getTime()));
    expect(staysInMyList(since(justPast), WINDOW, NOW)).toBe(false);
    expect(read(justPast, WINDOW)).toBe(false);
  });

  it("agrees on a row dated in the future, which clocks disagreeing produce", () => {
    const ahead = filed(new Date(NOW.getTime() + 60_000), new Date(NOW.getTime()));
    expect(staysInMyList(since(ahead), WINDOW, NOW)).toBe(true);
    expect(read(ahead, WINDOW)).toBe(true);
  });

  /*
   * AND THE ONE PLACE THE TWO ARE ALLOWED TO DIFFER, asserted rather than
   * left to be discovered. A game still being played is never hidden however
   * old it is, so the query must read it — and the check, which is told only a
   * date, says no. That asymmetry is the whole reason the check stays: it is
   * the half that knows what a row IS, and `fetchMyGames` only ever asks it
   * about games that are over.
   */
  it("reads an old game that is still being played, which the date alone would drop", () => {
    const running = { ...filed(new Date(NOW.getTime() - 400 * 86_400_000), new Date(NOW.getTime() - 400 * 86_400_000)), status: "active" };
    expect(read(running, WINDOW)).toBe(true);
    expect(staysInMyList(since(running), WINDOW, NOW)).toBe(false);
  });

  it("reads an offer nobody has answered, however long it has waited", () => {
    const long = new Date(NOW.getTime() - 400 * 86_400_000);
    // Filed finished — which nothing writes today — so the branch is doing the
    // work rather than riding on `status: "active"`.
    const asked = { ...filed(long, long), offeredAt: long };
    expect(read(asked, WINDOW)).toBe(true);
  });

  it("drops an offer that was refused, on the window a finished game leaves by", () => {
    const long = new Date(NOW.getTime() - 400 * 86_400_000);
    const declined = { ...filed(long, long), offeredAt: long, declinedAt: long };
    const withdrawn = { ...filed(long, long), offeredAt: long, withdrawnAt: long };
    expect(read(declined, WINDOW)).toBe(false);
    expect(read(withdrawn, WINDOW)).toBe(false);
  });

  it("bounds nothing when the member keeps everything, which is the default", () => {
    expect(myListWindow(KEEP_FINISHED_DEFAULT, NOW)).toBeNull();
    expect(myListWindow(0, NOW)).toBeNull();
  });

  it("bounds nothing when the stored number makes no sense, as the check keeps everything", () => {
    // The same answers `staysInMyList` gives these: a window nobody can read
    // must not be allowed to hide anybody's games.
    expect(myListWindow(Number.NaN, NOW)).toBeNull();
    expect(myListWindow(-5, NOW)).toBeNull();
    expect(staysInMyList(daysAgo(999), Number.NaN, NOW)).toBe(true);
  });

  it("bounds every window the profile offers", () => {
    for (const days of KEEP_FINISHED_DAYS) {
      const where = myListWindow(days, NOW);
      if (days === 0) {
        expect(where).toBeNull();
        continue;
      }
      const inside = filed(new Date(NOW.getTime() - (days - 1) * 86_400_000), new Date(NOW.getTime()));
      const outside = filed(new Date(NOW.getTime() - (days + 1) * 86_400_000), new Date(NOW.getTime()));
      expect(read(inside, days), `${days} days should read a game inside it`).toBe(true);
      expect(read(outside, days), `${days} days should leave a game past it`).toBe(false);
    }
  });
});
