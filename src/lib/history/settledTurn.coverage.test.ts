import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The gate on a stored value that can go stale.
 *
 * `Game.settledStatus` and `Game.settledToPlay` say whose turn it is without
 * replaying the game, which is worth doing and is dangerous in exactly one way:
 * a writer that changes the position and leaves the pair behind shows the wrong
 * player's name beside a board, silently, for as long as the game lasts. That
 * is worse than the expensive answer it replaced.
 *
 * Nothing about a stale value fails a test, so the shape of the mistake is
 * checked instead, and it is checked against the SOURCE rather than by calling
 * anything — the writer at risk is the one nobody has written yet. Two rules,
 * and between them the pair cannot be written wrongly or forgotten:
 *
 *  1. NOBODY NAMES THE COLUMNS BUT `settledTurn.ts`. Both come out of
 *     `settledTurn(state)` or `UNSETTLED`, so there is no path that stores
 *     "playing" with nobody to move, and no path that writes one column and
 *     forgets the other.
 *  2. A MODULE THAT WRITES A MOVE SETTLES THE TURN. Adding, striking out or
 *     amending a `Move` row changes whose turn it is by definition, so a module
 *     doing that and never mentioning `settledTurn` has forgotten it.
 *
 * The exceptions are named here with their reasons, rather than by loosening
 * the rule until they fit through it.
 */

const HISTORY = "src/lib/history";
const OWNER = "settledTurn.ts";

/** Every module under src/ that is not a test. */
function sources(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) sources(path, found);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) found.push(path);
  }
  return found;
}

const files = sources("src").map((path) => ({ path, text: readFileSync(path, "utf8") }));

/**
 * Files allowed to name the columns, and why.
 *
 * The reader is on the list because a `select` has to ask for a column by name;
 * it only ever READS them, and reads them through `settledPosition`.
 */
const MAY_NAME_THE_COLUMNS = new Map([
  [join(HISTORY, OWNER), "owns both columns and is the only thing that decides their values"],
  /*
   * The queue's projection, which was in `myGames.ts` until the finished group
   * learned to page and both halves of that read needed the same select. It is
   * the same reader on the same two columns, in a module of its own — so the
   * entry MOVED rather than a second one being added.
   */
  [join(HISTORY, "myGamesRows.ts"), "selects them to read; never assigns either"],
]);

/**
 * Modules that write a Move row and settle no turn, and why that is right.
 *
 * `gameRecord.ts` stores a game that is already over, in one transaction, with
 * its result decided before it is called: `status` is `finished` from the first
 * moment the row exists, and a reader stops at `status` before it ever asks
 * about a turn. A verdict written there would be one nothing had settled.
 */
const NEED_NOT_SETTLE = new Map([
  [join(HISTORY, "gameRecord.ts"), "files a game that was over before it was called"],
]);

/** A write to a Move row — anything that adds, amends or strikes out a move. */
const WRITES_A_MOVE = /prisma\.move\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\b/;

/**
 * The pair actually going into a write, rather than merely being imported.
 *
 * Spread into the `data` and nowhere else, so a call deleted from a write while
 * the import stayed behind does not read as the rule kept. Both halves have to
 * be there for a reader to be told anything.
 */
const SETTLES_A_TURN = /\.\.\.(settledTurn\(|UNSETTLED\b)/;

describe("nobody writes the stored turn by hand", () => {
  it("names settledStatus and settledToPlay only where it is allowed to", () => {
    const named = files
      .filter((file) => /\bsettled(Status|ToPlay)\b/.test(file.text))
      .map((file) => file.path)
      .filter((path) => !MAY_NAME_THE_COLUMNS.has(path));
    /*
     * A new name on this list is not necessarily wrong — it is a writer that
     * has to justify itself. Use `settledTurn(state)` if a settled position is
     * in hand and `UNSETTLED` if one is not, rather than assigning a column.
     */
    expect(named).toEqual([]);
  });

  it("keeps the owner as the only place either value is decided", () => {
    const owner = files.find((file) => file.path === join(HISTORY, OWNER));
    expect(owner).toBeDefined();
    expect(owner?.text).toContain("export function settledTurn");
    expect(owner?.text).toContain("export const UNSETTLED");
  });
});

describe("anything that writes a move settles the turn", () => {
  const writers = files.filter((file) => WRITES_A_MOVE.test(file.text));

  it("finds the writers at all, so this gate cannot pass by finding none", () => {
    // If a rename ever makes this list empty the gate is asleep, not satisfied.
    expect(writers.length).toBeGreaterThanOrEqual(3);
  });

  it("has each of them settle a turn, or say why it need not", () => {
    const forgotten = writers
      .filter((file) => !SETTLES_A_TURN.test(file.text))
      .map((file) => file.path)
      .filter((path) => !NEED_NOT_SETTLE.has(path));
    expect(forgotten).toEqual([]);
  });

  it("states a reason for every writer excused from it", () => {
    for (const [path, reason] of NEED_NOT_SETTLE) {
      expect(files.some((file) => file.path === path)).toBe(true);
      expect(reason.length).toBeGreaterThan(20);
    }
  });
});

describe("the four ways a stored turn can go stale are each answered", () => {
  /*
   * Named one by one rather than counted, because a count says nothing about
   * which one was missed — and each of these is a path that changes whose turn
   * it is, three of them without a stone being played.
   */
  const paths: { file: string; fn: string; how: string }[] = [
    { file: "liveGame.ts", fn: "appendMove", how: "a move applied" },
    { file: "hotSeat.ts", fn: "truncateMoves", how: "a takeback, which moves the turn backwards" },
    { file: "liveGame.ts", fn: "createLiveGame", how: "a fork, which copies move rows without replaying them" },
    { file: "liveGameSettings.ts", fn: "updateLiveGameSettings", how: "a rules change, which can re-decide who opens" },
    { file: "liveGameEndings.ts", fn: "claimTimeout", how: "a forfeited turn, passed without a move" },
    { file: "liveGameEndings.ts", fn: "settleEnded", how: "a position the engine ended and nothing wrote down" },
    { file: "liveGameEndings.ts", fn: "resignGame", how: "a game given up" },
  ];

  for (const { file, fn, how } of paths) {
    it(`${fn} (${how})`, () => {
      const source = files.find((one) => one.path === join(HISTORY, file));
      expect(source, `${file} has moved or gone`).toBeDefined();
      const text = source?.text ?? "";
      expect(text, `${file} no longer holds ${fn}`).toContain(`function ${fn}`);
      expect(text).toMatch(SETTLES_A_TURN);
    });
  }
});
